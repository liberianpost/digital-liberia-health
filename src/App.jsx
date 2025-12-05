import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ProfessionalVerificationModal from './ProfessionalVerificationModal';

// Configure axios for health system API
const healthApi = axios.create({
  baseURL: process.env.REACT_APP_HEALTH_API_URL || 'https://libpayapp.liberianpost.com:8081/api/health',
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Add request interceptor for health system token
healthApi.interceptors.request.use(
  config => {
    const token = localStorage.getItem('health_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => {
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
healthApi.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('health_token');
      localStorage.removeItem('health_user');
      window.location.reload();
    }
    return Promise.reject(error);
  }
);

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyA4NndmuQHTCKh7IyQYAz3DL_r8mttyRYg",
  authDomain: "digitalliberia-notification.firebaseapp.com",
  projectId: "digitalliberia-notification",
  storageBucket: "digitalliberia-notification.appspot.com",
  messagingSenderId: "537791418352",
  appId: "1:537791418352:web:378b48439b2c9bed6dd735"
};

function App() {
  const [user, setUser] = useState(null);
  const [scrolled, setScrolled] = useState(false);
  const [activeModule, setActiveModule] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [verificationData, setVerificationData] = useState(null);
  const [showMobileAuth, setShowMobileAuth] = useState(false);
  const [mobileChallengeId, setMobileChallengeId] = useState(null);
  const [polling, setPolling] = useState(false);
  const [pollInterval, setPollInterval] = useState(null);
  const [showProfessionalModal, setShowProfessionalModal] = useState(false);
  const [pendingLogin, setPendingLogin] = useState(null);
  const [fcmToken, setFcmToken] = useState(null);
  const [firebaseInitialized, setFirebaseInitialized] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };

    // Check for existing health system token
    const token = localStorage.getItem('health_token');
    const savedUser = localStorage.getItem('health_user');
    if (token && savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (err) {
        localStorage.removeItem('health_token');
        localStorage.removeItem('health_user');
      }
    }

    // Initialize Firebase (without requesting notification permission)
    initializeFirebase();

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, []);

  const initializeFirebase = async () => {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      try {
        const { initializeApp } = await import('firebase/app');
        const { getMessaging } = await import('firebase/messaging');
        
        const app = initializeApp(firebaseConfig);
        const messaging = getMessaging(app);
        
        console.log('Firebase initialized successfully');
        setFirebaseInitialized(true);
        
        // Check if we already have an FCM token
        const existingToken = localStorage.getItem('fcmToken');
        if (existingToken) {
          setFcmToken(existingToken);
        }
      } catch (error) {
        console.log('Firebase initialization error:', error);
      }
    }
  };

  // Function to request notification permission (called by user action)
  const requestNotificationPermission = async () => {
    try {
      if (!firebaseInitialized) {
        await initializeFirebase();
      }
      
      const { getMessaging, getToken } = await import('firebase/messaging');
      const messaging = getMessaging();
      
      // Request notification permission (this is the user gesture)
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        const vapidKey = "BEICu1bx8LKW5j7cag5tU9B2qfcejWi7QPm8a95jFODSIUNRiellygLGroK9NyWt-3WsTiUZscmS311gGXiXV7Q";
        const currentToken = await getToken(messaging, { vapidKey });
        if (currentToken) {
          setFcmToken(currentToken);
          localStorage.setItem('fcmToken', currentToken);
          console.log('FCM Token obtained:', currentToken);
          setSuccess({ message: '✅ Notifications enabled successfully!' });
        }
      } else if (permission === 'denied') {
        setError({ message: '❌ Notification permission denied. Please enable in browser settings.', type: 'error' });
      }
    } catch (error) {
      console.log('Notification permission error:', error);
      setError({ message: 'Failed to enable notifications. Please try again.', type: 'error' });
    }
  };

  const handleLoginSuccess = (userData, token) => {
    setUser(userData);
    setActiveModule(null);
    localStorage.setItem('health_token', token);
    localStorage.setItem('health_user', JSON.stringify(userData));
    setSuccess({ message: 'Login successful!' });
    setError(null);
    setPolling(false);
    if (pollInterval) {
      clearInterval(pollInterval);
      setPollInterval(null);
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('health_token');
    localStorage.removeItem('health_user');
    setSuccess({ message: 'Logged out successfully' });
    setError(null);
  };

  const handleCardClick = (module) => {
    setActiveModule(module);
    setError(null);
    setSuccess(null);
    setVerificationData(null);
    setShowMobileAuth(false);
    setPolling(false);
  };

  const handleBackToHome = () => {
    setActiveModule(null);
    setError(null);
    setSuccess(null);
    setVerificationData(null);
    setShowMobileAuth(false);
    setPolling(false);
  };

  const handleDSSNVerify = async (dssn, moduleType) => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const endpoint = moduleType === 'patient-records' 
        ? '/verify-dssn/patient' 
        : '/verify-dssn/pharmacy';

      const response = await healthApi.post(endpoint, { dssn });

      if (response.data.success) {
        setSuccess({
          message: response.data.message,
          type: 'success'
        });
        setVerificationData(response.data);

        // Auto-fill login fields after successful verification
        setTimeout(() => {
          const loginInput = document.getElementById(
            moduleType === 'patient-records' ? 'dssn-login' : 'dssn-pharmacy-login'
          );
          if (loginInput) {
            loginInput.value = dssn;
            loginInput.focus();
          }
        }, 300);
      }
    } catch (err) {
      setError({
        message: err.response?.data?.message || 'DSSN verification failed. Please try again.',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (credentials, moduleType) => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const endpoint = moduleType === 'patient-records' 
        ? '/login/patient' 
        : '/login/pharmacy';

      const response = await healthApi.post(endpoint, credentials);

      if (response.data.success) {
        handleLoginSuccess(response.data.user, response.data.token);
      }
    } catch (err) {
      setError({
        message: err.response?.data?.message || 'Login failed. Please check your credentials.',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  // Enhanced Mobile Notification Authentication for Healthcare Professionals
  const handleMobileAuth = async (dssn, moduleType) => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    setShowMobileAuth(true);

    try {
      // Check if user has FCM token
      const userFcmToken = fcmToken || localStorage.getItem('fcmToken');
      if (!userFcmToken) {
        setError({
          message: 'Please enable notifications first to use mobile authentication.',
          type: 'error'
        });
        setShowMobileAuth(false);
        setLoading(false);
        return;
      }

      // Request mobile authentication
      const response = await healthApi.post('/mobile-auth/request', {
        dssn,
        moduleType: moduleType === 'patient-records' ? 'patient_records' : 'pharmacy_management',
        fcmToken: userFcmToken
      });

      if (response.data.success) {
        setMobileChallengeId(response.data.challengeId);
        setSuccess({
          message: '✅ Authentication request sent to your mobile app!',
          type: 'success'
        });

        // Start polling for status
        const interval = setInterval(async () => {
          try {
            const statusResponse = await healthApi.get(`/mobile-auth/status/${response.data.challengeId}`);
            
            if (statusResponse.data.status === 'approved') {
              clearInterval(interval);
              setPolling(false);
              handleLoginSuccess(statusResponse.data.user, statusResponse.data.token);
              setShowMobileAuth(false);
            } else if (statusResponse.data.status === 'denied') {
              clearInterval(interval);
              setPolling(false);
              setError({
                message: 'Healthcare access was denied on your mobile device',
                type: 'error'
              });
              setShowMobileAuth(false);
            } else if (statusResponse.data.status === 'expired') {
              clearInterval(interval);
              setPolling(false);
              setError({
                message: 'Authentication request expired. Please try again.',
                type: 'error'
              });
              setShowMobileAuth(false);
            }
          } catch (error) {
            console.error('Error polling mobile auth status:', error);
          }
        }, 3000);

        setPollInterval(interval);
        setPolling(true);

        // Auto timeout after 5 minutes
        setTimeout(() => {
          if (polling) {
            clearInterval(interval);
            setPolling(false);
            setShowMobileAuth(false);
            setError({
              message: 'Authentication request timed out. Please try again.',
              type: 'error'
            });
          }
        }, 5 * 60 * 1000);

      } else {
        // Check if professional registration is required
        if (response.data.requiresProfessionalRegistration) {
          setShowProfessionalModal(true);
          setPendingLogin({ dssn, moduleType });
        } else {
          throw new Error(response.data.message || 'Failed to send authentication request');
        }
      }

    } catch (err) {
      setError({
        message: err.response?.data?.message || 'Failed to send authentication request to mobile app.',
        type: 'error'
      });
      setShowMobileAuth(false);
    } finally {
      setLoading(false);
    }
  };

  const handleProfessionalRegistrationSuccess = () => {
    setShowProfessionalModal(false);
    if (pendingLogin) {
      // Retry mobile auth after registration
      setTimeout(() => {
        handleMobileAuth(pendingLogin.dssn, pendingLogin.moduleType);
      }, 1000);
    }
  };

  const renderModuleContent = () => {
    switch(activeModule) {
      case 'patient-records':
        return (
          <div className="module-container">
            <button className="back-button" onClick={handleBackToHome}>
              ← Back to Home
            </button>
            <div className="module-content">
              <h2 className="module-title">Patient Records System</h2>
              <p className="module-description">
                Access and manage comprehensive patient health records and medical history
                <br />
                <small style={{ color: '#ef476f', fontWeight: 'bold' }}>
                  🔒 Authorized Healthcare Professionals Only
                </small>
              </p>
              
              {/* Messages Section */}
              {error && (
                <div className={`message ${error.type}-message`}>
                  <div className="message-icon">
                    {error.type === 'error' ? '⚠️' : '✅'}
                  </div>
                  <div className="message-content">
                    {error.message}
                    {error.type === 'error' && verificationData?.requiresProfessionalVerification && (
                      <button 
                        className="btn btn-health btn-small"
                        onClick={() => setShowProfessionalModal(true)}
                        style={{ marginTop: '10px' }}
                      >
                        Register as Healthcare Professional
                      </button>
                    )}
                  </div>
                </div>
              )}
              
              {success && (
                <div className="success-message">
                  <div className="message-icon">✅</div>
                  <div className="message-content">
                    {success.message}
                    {verificationData && (
                      <div className="verification-details">
                        {verificationData.isHealthcareProfessional ? (
                          <>
                            <p>✅ Verified Healthcare Professional</p>
                            <p className="verification-status">
                              Type: {verificationData.professionalInfo?.type}
                              {verificationData.professionalInfo?.specialization && 
                                ` | ${verificationData.professionalInfo.specialization}`}
                            </p>
                            <p className="verification-email">
                              License: {verificationData.professionalInfo?.licenseNumber}
                            </p>
                          </>
                        ) : (
                          <p className="warning-text">
                            ⚠️ Professional verification required to access patient records
                            <button 
                              className="btn btn-health btn-small"
                              onClick={() => setShowProfessionalModal(true)}
                              style={{ marginLeft: '10px' }}
                            >
                              Register Now
                            </button>
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Mobile Authentication Section */}
              {showMobileAuth && (
                <div className="mobile-auth-section">
                  <div className="mobile-auth-icon">📱</div>
                  <h3>Healthcare Professional Verification</h3>
                  <p>Please check your Digital Liberia mobile app to approve this healthcare access request.</p>
                  <div className="challenge-id">
                    Healthcare Challenge ID: <span className="challenge-code">{mobileChallengeId}</span>
                  </div>
                  {polling && (
                    <div className="polling-status">
                      <div className="spinner-small"></div>
                      <span>Waiting for approval...</span>
                    </div>
                  )}
                  <div className="timeout-notice">
                    This healthcare access request will timeout in 5 minutes...
                  </div>
                </div>
              )}
              
              <div className="auth-tabs">
                <div className="auth-section">
                  <h3>Verify DSSN & Professional Status</h3>
                  <p className="auth-description">
                    Enter your 15-digit DSSN to verify your healthcare professional status
                  </p>
                  <div className="form-group">
                    <label htmlFor="dssn-signup">DSSN Number</label>
                    <input
                      type="text"
                      id="dssn-signup"
                      placeholder="Enter 15-digit alphanumeric DSSN"
                      maxLength={15}
                      pattern="[A-Za-z0-9]{15}"
                      disabled={loading}
                      className={loading ? 'disabled-input' : ''}
                    />
                    <p className="input-help">15 characters, letters and numbers only (e.g., ABC123DEF456GHI7)</p>
                    <button 
                      className={`btn btn-health verify-btn ${loading ? 'loading' : ''}`}
                      onClick={() => {
                        const dssn = document.getElementById('dssn-signup').value.trim();
                        if(dssn.length === 15 && /^[A-Za-z0-9]{15}$/.test(dssn)) {
                          handleDSSNVerify(dssn, 'patient-records');
                        } else {
                          setError({
                            message: 'Please enter a valid 15-digit alphanumeric DSSN',
                            type: 'error'
                          });
                        }
                      }}
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <span className="spinner-small"></span>
                          Verifying...
                        </>
                      ) : (
                        'Verify Healthcare Professional Status'
                      )}
                    </button>
                  </div>
                </div>
                
                <div className="divider">OR</div>
                
                <div className="auth-section">
                  <h3>Healthcare Professional Login</h3>
                  <p className="auth-description">
                    Choose your preferred login method as healthcare professional
                  </p>
                  
                  <div className="login-options">
                    <div className="form-group">
                      <label htmlFor="dssn-login">DSSN Number</label>
                      <input
                        type="text"
                        id="dssn-login"
                        placeholder="Enter your DSSN"
                        disabled={loading}
                        className={loading ? 'disabled-input' : ''}
                      />
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="password">Password</label>
                      <input
                        type="password"
                        id="password"
                        placeholder="Enter your password"
                        disabled={loading}
                        className={loading ? 'disabled-input' : ''}
                      />
                    </div>
                    
                    <div className="login-buttons-grid">
                      <button 
                        className={`btn btn-health login-btn ${loading ? 'loading' : ''}`}
                        onClick={() => {
                          const dssn = document.getElementById('dssn-login').value.trim();
                          const password = document.getElementById('password').value.trim();
                          if(dssn && password) {
                            handleLogin({ dssn, password }, 'patient-records');
                          } else {
                            setError({
                              message: 'Please enter both DSSN and password',
                              type: 'error'
                            });
                          }
                        }}
                        disabled={loading}
                      >
                        {loading ? (
                          <>
                            <span className="spinner-small"></span>
                            Logging in...
                          </>
                        ) : (
                          'Login with Password'
                        )}
                      </button>
                      
                      <button 
                        className="btn btn-mobile"
                        onClick={() => {
                          const dssn = document.getElementById('dssn-login').value.trim();
                          if(dssn.length === 15 && /^[A-Za-z0-9]{15}$/.test(dssn)) {
                            handleMobileAuth(dssn, 'patient-records');
                          } else {
                            setError({
                              message: 'Please enter a valid DSSN first',
                              type: 'error'
                            });
                          }
                        }}
                        disabled={loading || showMobileAuth || polling}
                      >
                        {polling ? (
                          <>
                            <span className="spinner-small"></span>
                            Waiting for Approval...
                          </>
                        ) : (
                          '📱 Login with Mobile App'
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="module-footer">
                <p className="footer-text">
                  <strong>Note:</strong> Access to patient records is restricted to verified healthcare professionals only.
                  You must be a registered doctor, nurse, or authorized medical staff.
                  Mobile app authentication requires the Digital Liberia Healthcare app.
                </p>
              </div>
            </div>
          </div>
        );

      case 'pharmacy-management':
        return (
          <div className="module-container">
            <button className="back-button" onClick={handleBackToHome}>
              ← Back to Home
            </button>
            <div className="module-content">
              <h2 className="module-title">Pharmacy Management System</h2>
              <p className="module-description">
                Real-time medication tracking and prescription management system
                <br />
                <small style={{ color: '#7209b7', fontWeight: 'bold' }}>
                  🔒 Authorized Pharmacists Only
                </small>
              </p>
              
              {/* Messages Section */}
              {error && (
                <div className={`message ${error.type}-message`}>
                  <div className="message-icon">
                    {error.type === 'error' ? '⚠️' : '✅'}
                  </div>
                  <div className="message-content">
                    {error.message}
                    {error.type === 'error' && verificationData?.requiresPharmacistVerification && (
                      <button 
                        className="btn btn-medical btn-small"
                        onClick={() => setShowProfessionalModal(true)}
                        style={{ marginTop: '10px' }}
                      >
                        Register as Pharmacist
                      </button>
                    )}
                  </div>
                </div>
              )}
              
              {success && (
                <div className="success-message">
                  <div className="message-icon">✅</div>
                  <div className="message-content">
                    {success.message}
                    {verificationData && (
                      <div className="verification-details">
                        {verificationData.isAuthorizedPharmacist ? (
                          <>
                            <p>✅ Verified Pharmacist</p>
                            <p className="verification-status">
                              License: {verificationData.professionalInfo?.licenseNumber}
                            </p>
                            <p className="verification-email">
                              Facility: {verificationData.professionalInfo?.facilityName}
                            </p>
                          </>
                        ) : (
                          <p className="warning-text">
                            ⚠️ Pharmacist verification required to access pharmacy management
                            <button 
                              className="btn btn-medical btn-small"
                              onClick={() => setShowProfessionalModal(true)}
                              style={{ marginLeft: '10px' }}
                            >
                              Register as Pharmacist
                            </button>
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Mobile Authentication Section */}
              {showMobileAuth && (
                <div className="mobile-auth-section">
                  <div className="mobile-auth-icon">💊</div>
                  <h3>Pharmacist Verification</h3>
                  <p>Please check your Digital Liberia mobile app to approve this pharmacy access request.</p>
                  <div className="challenge-id">
                    Pharmacy Challenge ID: <span className="challenge-code">{mobileChallengeId}</span>
                  </div>
                  {polling && (
                    <div className="polling-status">
                      <div className="spinner-small"></div>
                      <span>Waiting for approval...</span>
                    </div>
                  )}
                  <div className="timeout-notice">
                    This pharmacy access request will timeout in 5 minutes...
                  </div>
                </div>
              )}
              
              <div className="auth-tabs">
                <div className="auth-section">
                  <h3>Verify DSSN & Pharmacist Status</h3>
                  <p className="auth-description">
                    Enter your 15-digit DSSN to verify your pharmacist credentials
                  </p>
                  <div className="form-group">
                    <label htmlFor="dssn-pharmacy-signup">DSSN Number</label>
                    <input
                      type="text"
                      id="dssn-pharmacy-signup"
                      placeholder="Enter 15-digit alphanumeric DSSN"
                      maxLength={15}
                      pattern="[A-Za-z0-9]{15}"
                      disabled={loading}
                      className={loading ? 'disabled-input' : ''}
                    />
                    <p className="input-help">15 characters, letters and numbers only (e.g., ABC123DEF456GHI7)</p>
                    <button 
                      className={`btn btn-medical verify-btn ${loading ? 'loading' : ''}`}
                      onClick={() => {
                        const dssn = document.getElementById('dssn-pharmacy-signup').value.trim();
                        if(dssn.length === 15 && /^[A-Za-z0-9]{15}$/.test(dssn)) {
                          handleDSSNVerify(dssn, 'pharmacy-management');
                        } else {
                          setError({
                            message: 'Please enter a valid 15-digit alphanumeric DSSN',
                            type: 'error'
                          });
                        }
                      }}
                      disabled={loading}
                    >
                      {loading ? (
                        <>
                          <span className="spinner-small"></span>
                          Verifying...
                        </>
                      ) : (
                        'Verify Pharmacist Status'
                      )}
                    </button>
                  </div>
                </div>
                
                <div className="divider">OR</div>
                
                <div className="auth-section">
                  <h3>Pharmacist Login</h3>
                  <p className="auth-description">
                    Choose your preferred login method as pharmacist
                  </p>
                  
                  <div className="login-options">
                    <div className="form-group">
                      <label htmlFor="dssn-pharmacy-login">DSSN Number</label>
                      <input
                        type="text"
                        id="dssn-pharmacy-login"
                        placeholder="Enter your DSSN"
                        disabled={loading}
                        className={loading ? 'disabled-input' : ''}
                      />
                    </div>
                    
                    <div className="form-group">
                      <label htmlFor="pharmacy-password">Password</label>
                      <input
                        type="password"
                        id="pharmacy-password"
                        placeholder="Enter your password"
                        disabled={loading}
                        className={loading ? 'disabled-input' : ''}
                      />
                    </div>
                    
                    <div className="login-buttons-grid">
                      <button 
                        className={`btn btn-medical login-btn ${loading ? 'loading' : ''}`}
                        onClick={() => {
                          const dssn = document.getElementById('dssn-pharmacy-login').value.trim();
                          const password = document.getElementById('pharmacy-password').value.trim();
                          if(dssn && password) {
                            handleLogin({ dssn, password }, 'pharmacy-management');
                          } else {
                            setError({
                              message: 'Please enter both DSSN and password',
                              type: 'error'
                            });
                          }
                        }}
                        disabled={loading}
                      >
                        {loading ? (
                          <>
                            <span className="spinner-small"></span>
                            Logging in...
                          </>
                        ) : (
                          'Login with Password'
                        )}
                      </button>
                      
                      <button 
                        className="btn btn-mobile"
                        onClick={() => {
                          const dssn = document.getElementById('dssn-pharmacy-login').value.trim();
                          if(dssn.length === 15 && /^[A-Za-z0-9]{15}$/.test(dssn)) {
                            handleMobileAuth(dssn, 'pharmacy-management');
                          } else {
                            setError({
                              message: 'Please enter a valid DSSN first',
                              type: 'error'
                            });
                          }
                        }}
                        disabled={loading || showMobileAuth || polling}
                      >
                        {polling ? (
                          <>
                            <span className="spinner-small"></span>
                            Waiting for Approval...
                          </>
                        ) : (
                          '📱 Login with Mobile App'
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="module-footer">
                <p className="footer-text">
                  <strong>Note:</strong> Access to pharmacy management is restricted to verified pharmacists only.
                  You must be a registered pharmacist with valid license.
                  Mobile app authentication requires the Digital Liberia Pharmacy app.
                </p>
              </div>
            </div>
          </div>
        );

      default:
        return (
          <div className="hero-section">
            <div className="hero-text">
              <h1>
                Advanced Healthcare
                <br />
                <span style={{ 
                  background: 'var(--health-gradient)', 
                  WebkitBackgroundClip: 'text', 
                  WebkitTextFillColor: 'transparent', 
                  backgroundClip: 'text' 
                }}>
                  Professional System
                </span>
              </h1>
              <p>
                Secure healthcare management system for authorized medical professionals in Liberia.
                Access patient records and pharmacy management with professional verification.
              </p>

              {/* Enhanced Health Features Grid with Professional Access */}
              <div className="health-features-grid">
                {/* Patient Records Card */}
                <div 
                  className="health-feature-item floating clickable-card patient-records-card"
                  onClick={() => handleCardClick('patient-records')}
                  style={{
                    animationDelay: '0s',
                    cursor: 'pointer'
                  }}
                >
                  <div className="health-feature-icon" style={{
                    background: 'linear-gradient(135deg, #00d4aa, #118ab2)',
                    boxShadow: '0 8px 25px rgba(0, 212, 170, 0.4)'
                  }}>📊</div>
                  <div className="health-feature-content">
                    <h4>Patient Records</h4>
                    <p>Secure digital health records with instant access for authorized medical professionals</p>
                    <div className="access-badge">
                      <span className="badge-icon">🔒</span>
                      <span className="badge-text">Healthcare Professionals Only</span>
                    </div>
                    <span className="card-click-hint">Click to access →</span>
                  </div>
                </div>

                {/* Pharmacy Management Card */}
                <div 
                  className="health-feature-item floating clickable-card pharmacy-card"
                  onClick={() => handleCardClick('pharmacy-management')}
                  style={{
                    animationDelay: '0.2s',
                    cursor: 'pointer'
                  }}
                >
                  <div className="health-feature-icon" style={{
                    background: 'linear-gradient(135deg, #7209b7, #3a86ff)',
                    boxShadow: '0 8px 25px rgba(114, 9, 183, 0.4)'
                  }}>💊</div>
                  <div className="health-feature-content">
                    <h4>Pharmacy Management</h4>
                    <p>Real-time medication tracking and prescription management system</p>
                    <div className="access-badge">
                      <span className="badge-icon">🔒</span>
                      <span className="badge-text">Pharmacists Only</span>
                    </div>
                    <span className="card-click-hint">Click to access →</span>
                  </div>
                </div>

                {/* Professional Registration Card */}
                <div 
                  className="health-feature-item floating clickable-card registration-card"
                  onClick={() => setShowProfessionalModal(true)}
                  style={{
                    animationDelay: '0.4s',
                    cursor: 'pointer'
                  }}
                >
                  <div className="health-feature-icon" style={{
                    background: 'linear-gradient(135deg, #ef476f, #ffd166)',
                    boxShadow: '0 8px 25px rgba(239, 71, 111, 0.4)'
                  }}>🩺</div>
                  <div className="health-feature-content">
                    <h4>Professional Registration</h4>
                    <p>Register as healthcare professional to access medical systems</p>
                    <div className="access-badge">
                      <span className="badge-icon">📝</span>
                      <span className="badge-text">Register Now</span>
                    </div>
                    <span className="card-click-hint">Click to register →</span>
                  </div>
                </div>

                {/* Mobile App Card */}
                <div 
                  className="health-feature-item floating clickable-card mobile-card"
                  onClick={() => window.open('https://digitalliberia.app', '_blank')}
                  style={{
                    animationDelay: '0.6s',
                    cursor: 'pointer'
                  }}
                >
                  <div className="health-feature-icon" style={{
                    background: 'linear-gradient(135deg, #2ebf91, #8360c3)',
                    boxShadow: '0 8px 25px rgba(46, 191, 145, 0.4)'
                  }}>📱</div>
                  <div className="health-feature-content">
                    <h4>Mobile App</h4>
                    <p>Download Digital Liberia app for mobile authentication</p>
                    <div className="access-badge">
                      <span className="badge-icon">⬇️</span>
                      <span className="badge-text">Download App</span>
                    </div>
                    <span className="card-click-hint">Get the app →</span>
                  </div>
                </div>
              </div>

              <div className="hero-actions">
                <button 
                  onClick={() => setShowProfessionalModal(true)}
                  className="btn btn-health"
                >
                  🩺 Register as Professional
                </button>
                <button 
                  onClick={() => handleCardClick('patient-records')}
                  className="btn btn-emergency"
                >
                  📊 Access Patient Records
                </button>
                <button 
                  onClick={() => handleCardClick('pharmacy-management')}
                  className="btn btn-medical"
                >
                  💊 Pharmacy Management
                </button>
                <button 
                  onClick={requestNotificationPermission}
                  className="btn btn-mobile"
                >
                  🔔 Enable Notifications
                </button>
              </div>
            </div>

            <div className="hero-visual" style={{ position: 'relative' }}>
              <div 
                className="floating"
                style={{
                  background: 'var(--card-bg)',
                  padding: '3rem',
                  borderRadius: 'var(--border-radius-lg)',
                  boxShadow: 'var(--shadow-xl)',
                  border: '1px solid rgba(255, 255, 255, 0.3)',
                  backdropFilter: 'blur(20px)',
                  textAlign: 'center',
                  position: 'relative',
                  overflow: 'hidden'
                }}
              >
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: `linear-gradient(45deg, 
                    rgba(0, 212, 170, 0.08) 0%, 
                    rgba(114, 9, 183, 0.08) 50%, 
                    rgba(239, 71, 111, 0.08) 100%)`,
                  zIndex: 0
                }}></div>
                
                <div 
                  style={{
                    fontSize: '6rem',
                    marginBottom: '2rem',
                    color: '#00d4aa',
                    filter: 'drop-shadow(0 4px 12px rgba(0, 212, 170, 0.4))',
                    position: 'relative',
                    zIndex: 1,
                    animation: 'pulse 2s ease-in-out infinite'
                  }}
                >
                  🏥
                </div>
                <h3 style={{ 
                  color: '#00d4aa', 
                  marginBottom: '1rem',
                  fontSize: '1.5rem',
                  fontWeight: '700',
                  position: 'relative',
                  zIndex: 1,
                  textShadow: '0 2px 4px rgba(0, 212, 170, 0.2)'
                }}>
                  Authorized Healthcare Access
                </h3>
                <p style={{ 
                  color: 'var(--text-light)', 
                  lineHeight: '1.6',
                  position: 'relative',
                  zIndex: 1
                }}>
                  Secure professional access for doctors, nurses, pharmacists, and medical staff
                </p>
                
                <div style={{
                  position: 'absolute',
                  top: '1rem',
                  right: '1rem',
                  background: 'rgba(0, 212, 170, 0.1)',
                  border: '1px solid rgba(0, 212, 170, 0.3)',
                  borderRadius: '8px',
                  padding: '0.5rem 0.8rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  zIndex: 1
                }}>
                  <span style={{ fontSize: '1.2rem' }}>🇱🇷</span>
                  <span style={{ 
                    fontSize: '0.8rem', 
                    color: '#00d4aa',
                    fontWeight: '600'
                  }}>
                    HEALTHCARE ACCESS
                  </span>
                </div>
              </div>
            </div>
          </div>
        );
    }
  };

  const Dashboard = () => {
    const [dashboardData, setDashboardData] = useState(null);
    const [dashboardLoading, setDashboardLoading] = useState(true);

    useEffect(() => {
      // Fetch dashboard data based on user type
      const fetchDashboardData = async () => {
        try {
          setDashboardLoading(true);
          
          if (user.isHealthcareProfessional) {
            if (user.hasPatientRecordAccess) {
              // Fetch patient dashboard data
              const response = await healthApi.get('/patient/dashboard');
              setDashboardData(response.data.data);
            } else if (user.hasPharmacyAccess) {
              // Fetch pharmacy dashboard data
              const response = await healthApi.get('/pharmacy/dashboard');
              setDashboardData(response.data.data);
            }
          }
        } catch (error) {
          console.error('Error fetching dashboard data:', error);
        } finally {
          setDashboardLoading(false);
        }
      };

      fetchDashboardData();
    }, [user]);

    if (dashboardLoading) {
      return (
        <div className="loading-container">
          <div className="spinner-large"></div>
          <p>Loading your professional dashboard...</p>
        </div>
      );
    }

    return (
      <div 
        style={{
          background: 'var(--card-bg)',
          padding: '4rem',
          borderRadius: 'var(--border-radius-lg)',
          boxShadow: 'var(--shadow-xl)',
          border: '1px solid rgba(255, 255, 255, 0.3)',
          backdropFilter: 'blur(20px)',
          marginBottom: '3rem',
          position: 'relative',
          overflow: 'hidden'
        }}
      >
        <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: `linear-gradient(135deg, 
            rgba(0, 212, 170, 0.03) 0%, 
            rgba(17, 138, 178, 0.03) 50%, 
            rgba(114, 9, 183, 0.03) 100%)`,
          zIndex: 0
        }}></div>
        
        <div 
          style={{
            fontSize: '4rem',
            marginBottom: '1.5rem',
            background: 'var(--health-gradient)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
            position: 'relative',
            zIndex: 1
          }}
        >
          {user.hasPatientRecordAccess ? '👨‍⚕️' : '💊'}
        </div>
        <h1 style={{ 
          color: 'var(--text-dark)', 
          marginBottom: '1rem',
          fontSize: '2.5rem',
          fontWeight: '800',
          position: 'relative',
          zIndex: 1
        }}>
          Welcome to Healthcare Portal
        </h1>
        <p style={{ 
          color: 'var(--text-light)', 
          fontSize: '1.2rem',
          marginBottom: '2rem',
          position: 'relative',
          zIndex: 1
        }}>
          {user.hasPatientRecordAccess 
            ? 'Access patient records and medical management tools' 
            : 'Manage pharmacy inventory and prescriptions'}
        </p>
        
        {/* Professional Info Badge */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.8rem',
          background: user.hasPatientRecordAccess 
            ? 'rgba(0, 212, 170, 0.1)' 
            : 'rgba(114, 9, 183, 0.1)',
          border: user.hasPatientRecordAccess 
            ? '1px solid rgba(0, 212, 170, 0.3)' 
            : '1px solid rgba(114, 9, 183, 0.3)',
          borderRadius: '12px',
          padding: '0.8rem 1.2rem',
          marginBottom: '2rem',
          position: 'relative',
          zIndex: 1
        }}>
          <span style={{ fontSize: '1.5rem' }}>
            {user.hasPatientRecordAccess ? '👨‍⚕️' : '💊'}
          </span>
          <div>
            <div style={{ 
              fontSize: '0.9rem', 
              color: user.hasPatientRecordAccess 
                ? 'var(--success-color)' 
                : 'var(--medical-color)',
              fontWeight: '600'
            }}>
              {user.professionalType ? user.professionalType.charAt(0).toUpperCase() + user.professionalType.slice(1) : 'Professional'}
              {user.specialization && ` - ${user.specialization}`}
            </div>
            <div style={{ 
              fontSize: '0.8rem', 
              color: 'var(--text-light)',
              marginTop: '0.2rem'
            }}>
              DSSN: {user.dssn} | Access Level: {user.accessLevel}
            </div>
          </div>
        </div>
        
        {/* Professional Action Grid */}
        <div className="health-action-grid">
          {user.hasPatientRecordAccess && (
            <>
              <div className="health-action-card floating" style={{
                background: 'linear-gradient(135deg, rgba(0, 212, 170, 0.15), rgba(17, 138, 178, 0.1))',
                border: '1px solid rgba(0, 212, 170, 0.3)',
                backdropFilter: 'blur(20px)',
                animationDelay: '0s'
              }}>
                <div className="health-card-icon" style={{
                  background: 'linear-gradient(135deg, #00d4aa, #118ab2)',
                  boxShadow: '0 15px 30px rgba(0, 212, 170, 0.4)'
                }}>📋</div>
                <h3 className="health-card-title">View Patient Records</h3>
                <p className="health-card-description">
                  Access and review patient medical histories and records
                </p>
                <button className="btn btn-health">
                  Access Records
                </button>
              </div>
              
              <div className="health-action-card floating" style={{
                background: 'linear-gradient(135deg, rgba(239, 71, 111, 0.15), rgba(255, 209, 102, 0.1))',
                border: '1px solid rgba(239, 71, 111, 0.3)',
                backdropFilter: 'blur(20px)',
                animationDelay: '0.2s'
              }}>
                <div className="health-card-icon" style={{
                  background: 'linear-gradient(135deg, #ef476f, #ffd166)',
                  boxShadow: '0 15px 30px rgba(239, 71, 111, 0.4)'
                }}>🩺</div>
                <h3 className="health-card-title">Update Medical Records</h3>
                <p className="health-card-description">
                  Add notes, diagnoses, and update patient information
                </p>
                <button className="btn btn-emergency">
                  Update Records
                </button>
              </div>
            </>
          )}
          
          {user.hasPharmacyAccess && (
            <>
              <div className="health-action-card floating" style={{
                background: 'linear-gradient(135deg, rgba(114, 9, 183, 0.15), rgba(58, 134, 255, 0.1))',
                border: '1px solid rgba(114, 9, 183, 0.3)',
                backdropFilter: 'blur(20px)',
                animationDelay: '0s'
              }}>
                <div className="health-card-icon" style={{
                  background: 'linear-gradient(135deg, #7209b7, #3a86ff)',
                  boxShadow: '0 15px 30px rgba(114, 9, 183, 0.4)'
                }}>💊</div>
                <h3 className="health-card-title">Manage Inventory</h3>
                <p className="health-card-description">
                  Track medication stock and update pharmacy inventory
                </p>
                <button className="btn btn-medical">
                  Manage Pharmacy
                </button>
              </div>
              
              <div className="health-action-card floating" style={{
                background: 'linear-gradient(135deg, rgba(46, 191, 145, 0.15), rgba(131, 96, 195, 0.1))',
                border: '1px solid rgba(46, 191, 145, 0.3)',
                backdropFilter: 'blur(20px)',
                animationDelay: '0.2s'
              }}>
                <div className="health-card-icon" style={{
                  background: 'linear-gradient(135deg, #2ebf91, #8360c3)',
                  boxShadow: '0 15px 30px rgba(46, 191, 145, 0.4)'
                }}>📋</div>
                <h3 className="health-card-title">Process Prescriptions</h3>
                <p className="health-card-description">
                  Fill and manage patient medication prescriptions
                </p>
                <button className="btn btn-health">
                  View Prescriptions
                </button>
              </div>
            </>
          )}
        </div>
        
        {/* Professional Information Section */}
        <div style={{ 
          marginTop: '3rem',
          padding: '2rem',
          background: 'rgba(255, 255, 255, 0.05)',
          borderRadius: 'var(--border-radius)',
          border: '1px solid rgba(255, 255, 255, 0.1)'
        }}>
          <h3 style={{ 
            color: 'var(--text-dark)', 
            marginBottom: '1rem',
            fontSize: '1.5rem'
          }}>
            Professional Information
          </h3>
          <div style={{ 
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '1.5rem',
            color: 'var(--text-light)'
          }}>
            <div>
              <strong>Name:</strong> {user.firstName} {user.lastName}
            </div>
            <div>
              <strong>Professional Type:</strong> {user.professionalType}
            </div>
            <div>
              <strong>Specialization:</strong> {user.specialization || 'N/A'}
            </div>
            <div>
              <strong>DSSN:</strong> {user.dssn}
            </div>
            <div>
              <strong>Facility:</strong> {user.facilityName || 'N/A'}
            </div>
            <div>
              <strong>Access Level:</strong> {user.accessLevel}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="app">
      {/* Global Loading Overlay */}
      {loading && (
        <div className="global-loading-overlay">
          <div className="global-spinner"></div>
        </div>
      )}
      
      {/* Header */}
      <header className={`header ${scrolled ? 'scrolled' : ''}`}>
        <div className="header-content">
          <div className="logo">
            <span className="logo-icon">🏥</span>
            <span>Digital Liberia Health Professional</span>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            {/* Liberia Flag */}
            <div 
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                background: 'rgba(255, 255, 255, 0.1)',
                padding: '0.5rem 1rem',
                borderRadius: '12px',
                border: '1px solid rgba(255, 255, 255, 0.2)',
                backdropFilter: 'blur(10px)'
              }}
            >
              <div style={{ 
                fontSize: '1.5rem',
                filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.3))'
              }}>
                🇱🇷
              </div>
              <span style={{ 
                color: 'var(--white)', 
                fontSize: '0.9rem',
                fontWeight: '600',
                textShadow: '0 1px 2px rgba(0,0,0,0.3)'
              }}>
                Republic of Liberia
              </span>
            </div>

            {user ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
                <div style={{ 
                  background: 'rgba(255, 255, 255, 0.1)',
                  padding: '0.5rem 1rem',
                  borderRadius: '10px',
                  border: '1px solid rgba(255, 255, 255, 0.2)'
                }}>
                  <span style={{ 
                    color: 'var(--white)', 
                    fontWeight: '600',
                    fontSize: '0.85rem'
                  }}>
                    {user.hasPatientRecordAccess ? '👨‍⚕️' : '💊'} 
                    {user.firstName} {user.lastName}
                  </span>
                </div>
                <button 
                  onClick={handleLogout}
                  className="btn btn-glass"
                  style={{ 
                    padding: '0.7rem 1.2rem', 
                    fontSize: '0.85rem',
                    border: '1px solid rgba(255, 255, 255, 0.3)'
                  }}
                >
                  Logout
                </button>
              </div>
            ) : (
              !activeModule && (
                <button 
                  onClick={() => handleCardClick('patient-records')}
                  className="btn btn-health"
                  style={{ 
                    padding: '0.7rem 1.5rem', 
                    fontSize: '0.9rem',
                    boxShadow: '0 4px 15px rgba(0, 212, 170, 0.4)'
                  }}
                >
                  🏥 Healthcare Professional Login
                </button>
              )
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="main-content">
        {!user ? (
          renderModuleContent()
        ) : (
          <div style={{ 
            width: '100%', 
            maxWidth: '1200px',
            textAlign: 'center'
          }}>
            <Dashboard />
          </div>
        )}
      </main>

      {/* Professional Verification Modal */}
      {showProfessionalModal && (
        <ProfessionalVerificationModal
          isOpen={showProfessionalModal}
          onClose={() => setShowProfessionalModal(false)}
          onSuccess={handleProfessionalRegistrationSuccess}
          userDssn={verificationData?.user?.dssn || pendingLogin?.dssn}
        />
      )}
    </div>
  );
}

export default App;
