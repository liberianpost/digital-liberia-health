import React, { useState, useEffect } from 'react';
import axios from 'axios';
import ProfessionalVerificationModal from './ProfessionalVerificationModal';

// Enhanced Health API Configuration
const healthApi = axios.create({
  baseURL: process.env.REACT_APP_HEALTH_API_URL || 'https://libpayapp.liberianpost.com:8081/api/health',
  timeout: 20000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor for health token
healthApi.interceptors.request.use(
  config => {
    const token = localStorage.getItem('health_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  error => Promise.reject(error)
);

// Response interceptor for error handling
healthApi.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      localStorage.removeItem('health_token');
      localStorage.removeItem('health_user');
      localStorage.removeItem('health_session');
      window.location.reload();
    }
    return Promise.reject(error);
  }
);

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
  const [sessionId, setSessionId] = useState(null);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };

    // Load saved session
    const token = localStorage.getItem('health_token');
    const savedUser = localStorage.getItem('health_user');
    const savedSession = localStorage.getItem('health_session');
    
    if (token && savedUser && savedSession) {
      try {
        setUser(JSON.parse(savedUser));
        setSessionId(savedSession);
        validateSession(savedSession);
      } catch (err) {
        clearSession();
      }
    }

    // Initialize Firebase
    if (typeof window !== 'undefined') {
      initializeFirebase();
    }

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, []);

  const initializeFirebase = async () => {
    try {
      // Dynamic import for Firebase
      const { initializeApp } = await import('firebase/app');
      const { getMessaging, getToken } = await import('firebase/messaging');
      
      const firebaseConfig = {
        apiKey: "AIzaSyA4NndmuQHTCKh7IyQYAz3DL_r8mttyRYg",
        authDomain: "digitalliberia-notification.firebaseapp.com",
        projectId: "digitalliberia-notification",
        storageBucket: "digitalliberia-notification.appspot.com",
        messagingSenderId: "537791418352",
        appId: "1:537791418352:web:378b48439b2c9bed6dd735"
      };

      const app = initializeApp(firebaseConfig);
      const messaging = getMessaging(app);
      
      // Check existing token
      const existingToken = localStorage.getItem('fcmToken');
      if (existingToken) {
        setFcmToken(existingToken);
      }
      
      setFirebaseInitialized(true);
      console.log('Firebase initialized');
    } catch (error) {
      console.log('Firebase initialization skipped:', error);
    }
  };

  const requestNotificationPermission = async () => {
    try {
      if (!firebaseInitialized) {
        await initializeFirebase();
      }
      
      const { getMessaging, getToken } = await import('firebase/messaging');
      const messaging = getMessaging();
      
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        const vapidKey = "BEICu1bx8LKW5j7cag5tU9B2qfcejWi7QPm8a95jFODSIUNRiellygLGroK9NyWt-3WsTiUZscmS311gGXiXV7Q";
        const currentToken = await getToken(messaging, { vapidKey });
        if (currentToken) {
          setFcmToken(currentToken);
          localStorage.setItem('fcmToken', currentToken);
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

  const validateSession = async (sessionId) => {
    try {
      const response = await healthApi.post('/professional/validate-session', { sessionId });
      if (response.data.success) {
        return true;
      }
    } catch (error) {
      console.log('Session validation failed:', error);
      clearSession();
      return false;
    }
  };

  const clearSession = () => {
    localStorage.removeItem('health_token');
    localStorage.removeItem('health_user');
    localStorage.removeItem('health_session');
    setUser(null);
    setSessionId(null);
  };

  const handleLoginSuccess = (userData, token, session) => {
    setUser(userData);
    setActiveModule(null);
    setSessionId(session?.sessionId);
    
    localStorage.setItem('health_token', token);
    localStorage.setItem('health_user', JSON.stringify(userData));
    if (session?.sessionId) {
      localStorage.setItem('health_session', session.sessionId);
    }
    
    setSuccess({ message: 'Login successful!' });
    setError(null);
    setPolling(false);
    if (pollInterval) {
      clearInterval(pollInterval);
      setPollInterval(null);
    }
  };

  const handleLogout = async () => {
    try {
      if (sessionId) {
        await healthApi.post('/professional/logout', { sessionId });
      }
    } catch (error) {
      console.log('Logout error:', error);
    } finally {
      clearSession();
      setSuccess({ message: 'Logged out successfully' });
      setError(null);
    }
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

        // Auto-fill login fields
        setTimeout(() => {
          const loginInput = document.getElementById(
            moduleType === 'patient-records' ? 'dssn-login' : 'dssn-pharmacy-login'
          );
          if (loginInput) {
            loginInput.value = dssn;
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

  const handleProfessionalLogin = async (dssn, password, moduleType) => {
    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await healthApi.post('/professional/login', {
        dssn,
        password,
        moduleType: moduleType === 'patient-records' ? 'patient_records' : 'pharmacy_management',
        rememberMe: true
      });

      if (response.data.success) {
        handleLoginSuccess(
          response.data.user,
          response.data.tokens.accessToken,
          response.data.session
        );
      }
    } catch (err) {
      setError({
        message: err.response?.data?.message || 'Professional login failed.',
        type: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMobileAuth = async (dssn, moduleType) => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    setShowMobileAuth(true);

    try {
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

      const response = await healthApi.post('/professional/mobile-auth', {
        dssn,
        moduleType: moduleType === 'patient-records' ? 'patient_records' : 'pharmacy_management',
        fcmToken: userFcmToken
      });

      if (response.data.success) {
        setMobileChallengeId(response.data.authentication.challengeId);
        setSuccess({
          message: '✅ Authentication request sent to your mobile app!',
          type: 'success'
        });

        // Start polling
        const interval = setInterval(async () => {
          try {
            const statusResponse = await healthApi.get(`/mobile-auth/status/${response.data.authentication.challengeId}`);
            
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

        // Auto timeout after 10 minutes
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
        }, 10 * 60 * 1000);

      } else {
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
                <small className="access-restriction">
                  🔒 Authorized Healthcare Professionals Only
                </small>
              </p>
              
              {/* Messages */}
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
                            <p className="verification-license">
                              License: {verificationData.professionalInfo?.licenseNumber}
                            </p>
                          </>
                        ) : (
                          <p className="warning-text">
                            ⚠️ Professional verification required
                            <button 
                              className="btn btn-health btn-small"
                              onClick={() => setShowProfessionalModal(true)}
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
              
              {/* Mobile Auth Section */}
              {showMobileAuth && (
                <div className="mobile-auth-section">
                  <div className="mobile-auth-icon">📱</div>
                  <h3>Healthcare Professional Verification</h3>
                  <p>Please check your Digital Liberia mobile app to approve this healthcare access request.</p>
                  <div className="challenge-id">
                    Challenge ID: <span className="challenge-code">{mobileChallengeId}</span>
                  </div>
                  {polling && (
                    <div className="polling-status">
                      <div className="spinner-small"></div>
                      <span>Waiting for approval...</span>
                    </div>
                  )}
                  <div className="timeout-notice">
                    This request will timeout in 10 minutes...
                  </div>
                </div>
              )}
              
              <div className="auth-tabs">
                {/* DSSN Verification */}
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
                    <p className="input-help">15 characters, letters and numbers only</p>
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
                
                {/* Professional Login */}
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
                            handleProfessionalLogin(dssn, password, 'patient-records');
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
                <small className="access-restriction">
                  🔒 Authorized Pharmacists Only
                </small>
              </p>
              
              {/* Messages */}
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
                            <p className="verification-facility">
                              Facility: {verificationData.professionalInfo?.facilityName}
                            </p>
                          </>
                        ) : (
                          <p className="warning-text">
                            ⚠️ Pharmacist verification required
                            <button 
                              className="btn btn-medical btn-small"
                              onClick={() => setShowProfessionalModal(true)}
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
              
              {/* Mobile Auth Section */}
              {showMobileAuth && (
                <div className="mobile-auth-section">
                  <div className="mobile-auth-icon">💊</div>
                  <h3>Pharmacist Verification</h3>
                  <p>Please check your Digital Liberia mobile app to approve this pharmacy access request.</p>
                  <div className="challenge-id">
                    Challenge ID: <span className="challenge-code">{mobileChallengeId}</span>
                  </div>
                  {polling && (
                    <div className="polling-status">
                      <div className="spinner-small"></div>
                      <span>Waiting for approval...</span>
                    </div>
                  )}
                  <div className="timeout-notice">
                    This request will timeout in 10 minutes...
                  </div>
                </div>
              )}
              
              <div className="auth-tabs">
                {/* DSSN Verification */}
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
                    <p className="input-help">15 characters, letters and numbers only</p>
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
                
                {/* Pharmacist Login */}
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
                            handleProfessionalLogin(dssn, password, 'pharmacy-management');
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
                <span className="gradient-text">
                  Professional System
                </span>
              </h1>
              <p>
                Secure healthcare management system for authorized medical professionals in Liberia.
                Access patient records and pharmacy management with professional verification.
              </p>

              {/* Health Features Grid */}
              <div className="health-features-grid">
                <div 
                  className="health-feature-item floating clickable-card patient-records-card"
                  onClick={() => handleCardClick('patient-records')}
                >
                  <div className="health-feature-icon">📊</div>
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

                <div 
                  className="health-feature-item floating clickable-card pharmacy-card"
                  onClick={() => handleCardClick('pharmacy-management')}
                >
                  <div className="health-feature-icon">💊</div>
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

                <div 
                  className="health-feature-item floating clickable-card registration-card"
                  onClick={() => setShowProfessionalModal(true)}
                >
                  <div className="health-feature-icon">🩺</div>
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

                <div 
                  className="health-feature-item floating clickable-card mobile-card"
                  onClick={() => window.open('https://digitalliberia.app', '_blank')}
                >
                  <div className="health-feature-icon">📱</div>
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

            <div className="hero-visual">
              <div className="hero-visual-card floating">
                <div className="visual-icon">🏥</div>
                <h3>Authorized Healthcare Access</h3>
                <p>
                  Secure professional access for doctors, nurses, pharmacists, and medical staff
                </p>
                <div className="liberia-badge">
                  <span>🇱🇷</span>
                  <span>HEALTHCARE ACCESS</span>
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
      fetchDashboardData();
    }, [user]);

    const fetchDashboardData = async () => {
      try {
        setDashboardLoading(true);
        let response;
        
        if (user.hasPatientRecordAccess) {
          response = await healthApi.get('/professional/dashboard');
        } else if (user.hasPharmacyAccess) {
          response = await healthApi.get('/professional/dashboard');
        }
        
        if (response?.data.success) {
          setDashboardData(response.data);
        }
      } catch (error) {
        console.error('Dashboard error:', error);
      } finally {
        setDashboardLoading(false);
      }
    };

    if (dashboardLoading) {
      return (
        <div className="loading-container">
          <div className="spinner-large"></div>
          <p>Loading your professional dashboard...</p>
        </div>
      );
    }

    return (
      <div className="dashboard-container">
        <div className="dashboard-header">
          <div className="dashboard-icon">
            {user.hasPatientRecordAccess ? '👨‍⚕️' : '💊'}
          </div>
          <h1>Welcome to Healthcare Portal</h1>
          <p>
            {user.hasPatientRecordAccess 
              ? 'Access patient records and medical management tools' 
              : 'Manage pharmacy inventory and prescriptions'}
          </p>
        </div>
        
        {/* Professional Info Badge */}
        <div className="professional-badge">
          <span className="badge-icon">
            {user.hasPatientRecordAccess ? '👨‍⚕️' : '💊'}
          </span>
          <div className="badge-content">
            <div className="professional-type">
              {user.professionalType} 
              {user.specialization && ` - ${user.specialization}`}
            </div>
            <div className="professional-details">
              DSSN: {user.dssn} | Access Level: {user.accessLevel}
            </div>
          </div>
        </div>
        
        {/* Dashboard Statistics */}
        {dashboardData?.statistics && (
          <div className="dashboard-stats">
            <h3>Today's Overview</h3>
            <div className="stats-grid">
              {Object.entries(dashboardData.statistics).map(([key, value]) => (
                <div key={key} className="stat-card">
                  <div className="stat-value">{value}</div>
                  <div className="stat-label">{key.replace(/_/g, ' ')}</div>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Action Grid */}
        <div className="health-action-grid">
          {user.hasPatientRecordAccess ? (
            <>
              <div className="health-action-card floating">
                <div className="health-card-icon">📋</div>
                <h3 className="health-card-title">View Patient Records</h3>
                <p className="health-card-description">
                  Access and review patient medical histories and records
                </p>
                <button className="btn btn-health">
                  Access Records
                </button>
              </div>
              
              <div className="health-action-card floating">
                <div className="health-card-icon">🩺</div>
                <h3 className="health-card-title">Update Medical Records</h3>
                <p className="health-card-description">
                  Add notes, diagnoses, and update patient information
                </p>
                <button className="btn btn-emergency">
                  Update Records
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="health-action-card floating">
                <div className="health-card-icon">💊</div>
                <h3 className="health-card-title">Manage Inventory</h3>
                <p className="health-card-description">
                  Track medication stock and update pharmacy inventory
                </p>
                <button className="btn btn-medical">
                  Manage Pharmacy
                </button>
              </div>
              
              <div className="health-action-card floating">
                <div className="health-card-icon">📋</div>
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
        
        {/* Recent Activity */}
        {dashboardData?.recentActivity && (
          <div className="recent-activity">
            <h3>Recent Activity</h3>
            <div className="activity-list">
              {dashboardData.recentActivity.slice(0, 5).map((activity, index) => (
                <div key={index} className="activity-item">
                  <div className="activity-icon">
                    {activity.action_type === 'login' ? '🔓' : '👁️'}
                  </div>
                  <div className="activity-content">
                    <div className="activity-title">
                      {activity.first_name} {activity.last_name}
                    </div>
                    <div className="activity-description">
                      {activity.action_type} - {activity.module}
                    </div>
                  </div>
                  <div className="activity-time">
                    {new Date(activity.accessed_at).toLocaleTimeString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
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
          
          <div className="header-right">
            <div className="liberia-flag">
              <span>🇱🇷</span>
              <span>Republic of Liberia</span>
            </div>

            {user ? (
              <div className="user-info">
                <div className="user-badge">
                  <span className="user-icon">
                    {user.hasPatientRecordAccess ? '👨‍⚕️' : '💊'}
                  </span>
                  <span className="user-name">
                    {user.firstName} {user.lastName}
                  </span>
                </div>
                <button 
                  onClick={handleLogout}
                  className="btn btn-glass"
                >
                  Logout
                </button>
              </div>
            ) : (
              !activeModule && (
                <button 
                  onClick={() => handleCardClick('patient-records')}
                  className="btn btn-health"
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
          <div className="dashboard-wrapper">
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
