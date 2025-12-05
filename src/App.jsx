import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Configure axios for health system API
const healthApi = axios.create({
  baseURL: process.env.REACT_APP_HEALTH_API_URL || 'http://localhost:8081/api/health',
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

// Firebase configuration - USING EXACT SAME CONFIG AS WORKING PROJECT
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
  const [showLogin, setShowLogin] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeModule, setActiveModule] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [verificationData, setVerificationData] = useState(null);
  const [showMobileAuth, setShowMobileAuth] = useState(false);
  const [mobileChallengeId, setMobileChallengeId] = useState(null);

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

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLoginSuccess = (userData, token) => {
    setUser(userData);
    setShowLogin(false);
    setActiveModule(null);
    localStorage.setItem('health_token', token);
    localStorage.setItem('health_user', JSON.stringify(userData));
    setSuccess({ message: 'Login successful!' });
    setError(null);
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
  };

  const handleBackToHome = () => {
    setActiveModule(null);
    setError(null);
    setSuccess(null);
    setVerificationData(null);
    setShowMobileAuth(false);
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

  // Mobile App Notification Authentication
  const handleMobileAuth = async (dssn, moduleType) => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    setShowMobileAuth(true);

    try {
      // Here you would integrate with your Firebase notification system
      // For now, we'll simulate sending a notification
      const challengeId = `CHALLENGE_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      setMobileChallengeId(challengeId);

      // Simulate notification sent to mobile app
      setTimeout(() => {
        setSuccess({
          message: '✅ Authentication request sent to your mobile app!',
          type: 'success'
        });
        
        // Simulate mobile app approval after 3 seconds
        setTimeout(() => {
          // This is where you would verify the challenge with your backend
          const mockUserData = {
            userId: 123,
            firstName: 'John',
            lastName: 'Doe',
            email: 'john.doe@example.com',
            dssn: dssn,
            isVerified: true,
            hasPatientRecord: moduleType === 'patient-records',
            pharmacyId: moduleType === 'pharmacy-management' ? 456 : null,
            pharmacyVerified: moduleType === 'pharmacy-management'
          };

          const mockToken = 'mock_jwt_token_for_mobile_auth_' + Date.now();
          handleLoginSuccess(mockUserData, mockToken);
          setShowMobileAuth(false);
        }, 3000);
      }, 1000);

    } catch (err) {
      setError({
        message: 'Failed to send authentication request to mobile app.',
        type: 'error'
      });
      setShowMobileAuth(false);
    } finally {
      setLoading(false);
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
              </p>
              
              {/* Messages Section */}
              {error && (
                <div className={`message ${error.type}-message`}>
                  <div className="message-icon">
                    {error.type === 'error' ? '⚠️' : '✅'}
                  </div>
                  <div className="message-content">
                    {error.message}
                  </div>
                </div>
              )}
              
              {success && (
                <div className="success-message">
                  <div className="message-icon">✅</div>
                  <div className="message-content">
                    {success.message}
                    {verificationData?.hasRecord && (
                      <div className="verification-details">
                        <p>Welcome, {verificationData.user?.firstName} {verificationData.user?.lastName}</p>
                        <p className="verification-email">{verificationData.user?.email}</p>
                        <p className="verification-status">
                          {verificationData.hasRecord ? '✓ Patient record found' : '✓ New record created'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Mobile Authentication Section */}
              {showMobileAuth && (
                <div className="mobile-auth-section">
                  <div className="mobile-auth-icon">📱</div>
                  <h3>Mobile Authentication Requested</h3>
                  <p>Please check your Digital Liberia mobile app to approve this login attempt.</p>
                  <div className="challenge-id">
                    Challenge ID: <span className="challenge-code">{mobileChallengeId}</span>
                  </div>
                  <div className="timeout-notice">
                    This request will timeout in 60 seconds...
                  </div>
                </div>
              )}
              
              <div className="auth-tabs">
                <div className="auth-section">
                  <h3>Sign Up / Verify DSSN</h3>
                  <p className="auth-description">
                    Enter your 15-digit DSSN (Digital Social Security Number) to verify your identity
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
                        'Verify DSSN'
                      )}
                    </button>
                  </div>
                </div>
                
                <div className="divider">OR</div>
                
                <div className="auth-section">
                  <h3>Login Options</h3>
                  <p className="auth-description">
                    Choose your preferred login method
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
                        disabled={loading || showMobileAuth}
                      >
                        📱 Login with Mobile App
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="module-footer">
                <p className="footer-text">
                  <strong>Note:</strong> Your DSSN is linked to your national identification.
                  Mobile app authentication requires the Digital Liberia app installed on your phone.
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
              </p>
              
              {/* Messages Section */}
              {error && (
                <div className={`message ${error.type}-message`}>
                  <div className="message-icon">
                    {error.type === 'error' ? '⚠️' : '✅'}
                  </div>
                  <div className="message-content">
                    {error.message}
                  </div>
                </div>
              )}
              
              {success && (
                <div className="success-message">
                  <div className="message-icon">✅</div>
                  <div className="message-content">
                    {success.message}
                    {verificationData?.hasPharmacy && (
                      <div className="verification-details">
                        <p>Welcome, {verificationData.user?.firstName} {verificationData.user?.lastName}</p>
                        <p className="verification-email">{verificationData.user?.email}</p>
                        <p className="verification-status">
                          {verificationData.hasPharmacy ? '✓ Pharmacy profile found' : '✗ Pharmacy registration required'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}
              
              {/* Mobile Authentication Section */}
              {showMobileAuth && (
                <div className="mobile-auth-section">
                  <div className="mobile-auth-icon">📱</div>
                  <h3>Mobile Authentication Requested</h3>
                  <p>Please check your Digital Liberia mobile app to approve this login attempt.</p>
                  <div className="challenge-id">
                    Challenge ID: <span className="challenge-code">{mobileChallengeId}</span>
                  </div>
                  <div className="timeout-notice">
                    This request will timeout in 60 seconds...
                  </div>
                </div>
              )}
              
              <div className="auth-tabs">
                <div className="auth-section">
                  <h3>Sign Up / Verify DSSN</h3>
                  <p className="auth-description">
                    Enter your 15-digit DSSN to verify your pharmacy credentials
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
                        'Verify DSSN'
                      )}
                    </button>
                  </div>
                </div>
                
                <div className="divider">OR</div>
                
                <div className="auth-section">
                  <h3>Login Options</h3>
                  <p className="auth-description">
                    Choose your preferred login method
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
                        disabled={loading || showMobileAuth}
                      >
                        📱 Login with Mobile App
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="module-footer">
                <p className="footer-text">
                  <strong>Note:</strong> Only registered pharmacies with valid licenses can access the management system.
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
                  Management System
                </span>
              </h1>
              <p>
                Revolutionizing healthcare delivery in Liberia with cutting-edge technology, 
                secure patient records, and real-time medical services.
              </p>

              {/* Enhanced Health Features Grid with Floating Animations */}
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
                    <span className="card-click-hint">Click to access →</span>
                  </div>
                </div>

                {/* Telemedicine Card */}
                <div 
                  className="health-feature-item floating clickable-card telemedicine-card"
                  onClick={() => handleCardClick('telemedicine')}
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
                    <h4>Telemedicine</h4>
                    <p>Virtual consultations and remote patient monitoring capabilities</p>
                    <span className="card-click-hint">Coming Soon</span>
                  </div>
                </div>

                {/* Emergency Response Card */}
                <div 
                  className="health-feature-item floating clickable-card emergency-card"
                  onClick={() => handleCardClick('emergency')}
                  style={{
                    animationDelay: '0.6s',
                    cursor: 'pointer'
                  }}
                >
                  <div className="health-feature-icon" style={{
                    background: 'linear-gradient(135deg, #ff4d4d, #ff7a00)',
                    boxShadow: '0 8px 25px rgba(255, 77, 77, 0.4)'
                  }}>🚑</div>
                  <div className="health-feature-content">
                    <h4>Emergency Response</h4>
                    <p>Rapid emergency services coordination and ambulance dispatch</p>
                    <span className="card-click-hint">Coming Soon</span>
                  </div>
                </div>
              </div>

              <div className="hero-actions">
                <button 
                  onClick={() => setShowLogin(true)}
                  className="btn btn-health"
                >
                  🏥 Access Health Portal
                </button>
                <button className="btn btn-emergency">
                  🚑 Emergency Services
                </button>
                <button className="btn btn-medical">
                  💊 Pharmacy Services
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
                {/* Subtle background pattern */}
                <div style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  background: `linear-gradient(45deg, 
                    rgba(239, 71, 111, 0.08) 0%, 
                    rgba(255, 77, 77, 0.08) 50%, 
                    rgba(255, 122, 0, 0.08) 100%)`,
                  zIndex: 0
                }}></div>
                
                {/* Red Love Sign */}
                <div 
                  style={{
                    fontSize: '6rem',
                    marginBottom: '2rem',
                    color: '#ef476f',
                    filter: 'drop-shadow(0 4px 12px rgba(239, 71, 111, 0.4))',
                    position: 'relative',
                    zIndex: 1,
                    animation: 'pulse 2s ease-in-out infinite'
                  }}
                >
                  ❤️
                </div>
                <h3 style={{ 
                  color: '#ef476f', 
                  marginBottom: '1rem',
                  fontSize: '1.5rem',
                  fontWeight: '700',
                  position: 'relative',
                  zIndex: 1,
                  textShadow: '0 2px 4px rgba(239, 71, 111, 0.2)'
                }}>
                  Your Health, Our Priority
                </h3>
                <p style={{ 
                  color: 'var(--text-light)', 
                  lineHeight: '1.6',
                  position: 'relative',
                  zIndex: 1
                }}>
                  Secure, efficient, and modern healthcare solutions for all Liberians
                </p>
                
                {/* Liberia Flag Badge */}
                <div style={{
                  position: 'absolute',
                  top: '1rem',
                  right: '1rem',
                  background: 'rgba(239, 71, 111, 0.1)',
                  border: '1px solid rgba(239, 71, 111, 0.3)',
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
                    color: '#ef476f',
                    fontWeight: '600'
                  }}>
                    LIBERIA
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
          
          // Based on user type, fetch relevant data
          if (user.hasPatientRecord) {
            // Fetch patient dashboard data
            const response = await healthApi.get('/patient/record');
            setDashboardData(response.data.data);
          } else if (user.pharmacyId) {
            // Fetch pharmacy dashboard data
            const response = await healthApi.get('/pharmacy/profile');
            setDashboardData(response.data.data);
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
          <p>Loading your dashboard...</p>
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
        {/* Background pattern */}
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
          🎉
        </div>
        <h1 style={{ 
          color: 'var(--text-dark)', 
          marginBottom: '1rem',
          fontSize: '2.5rem',
          fontWeight: '800',
          position: 'relative',
          zIndex: 1
        }}>
          Welcome to Health Portal
        </h1>
        <p style={{ 
          color: 'var(--text-light)', 
          fontSize: '1.2rem',
          marginBottom: '2rem',
          position: 'relative',
          zIndex: 1
        }}>
          Access advanced healthcare tools and patient management systems
        </p>
        
        {/* User Info Badge */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '0.8rem',
          background: user.hasPatientRecord ? 'rgba(0, 212, 170, 0.1)' : 'rgba(114, 9, 183, 0.1)',
          border: user.hasPatientRecord ? '1px solid rgba(0, 212, 170, 0.3)' : '1px solid rgba(114, 9, 183, 0.3)',
          borderRadius: '12px',
          padding: '0.8rem 1.2rem',
          marginBottom: '2rem',
          position: 'relative',
          zIndex: 1
        }}>
          <span style={{ fontSize: '1.5rem' }}>
            {user.hasPatientRecord ? '👤' : '💊'}
          </span>
          <div>
            <div style={{ 
              fontSize: '0.9rem', 
              color: user.hasPatientRecord ? 'var(--success-color)' : 'var(--medical-color)',
              fontWeight: '600'
            }}>
              {user.hasPatientRecord ? 'Patient Portal' : 'Pharmacy Portal'}
            </div>
            <div style={{ 
              fontSize: '0.8rem', 
              color: 'var(--text-light)',
              marginTop: '0.2rem'
            }}>
              DSSN: {user.dssn}
            </div>
          </div>
        </div>
        
        {/* Enhanced Health Action Grid for Logged-in Users */}
        <div className="health-action-grid">
          {user.hasPatientRecord && (
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
                <h3 className="health-card-title">View Medical Records</h3>
                <p className="health-card-description">
                  Access your complete medical history, lab results, and prescriptions
                </p>
                <button className="btn btn-health" onClick={() => alert('Patient records view will open')}>
                  View Records
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
                <h3 className="health-card-title">Book Appointment</h3>
                <p className="health-card-description">
                  Schedule appointments with doctors and healthcare providers
                </p>
                <button className="btn btn-emergency">
                  Book Now
                </button>
              </div>
            </>
          )}
          
          {user.pharmacyId && (
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
                  Track medication stock, manage prescriptions, and update inventory
                </p>
                <button className="btn btn-medical" onClick={() => alert('Pharmacy management will open')}>
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
                  Fill prescriptions, manage refills, and track patient medications
                </p>
                <button className="btn btn-health">
                  View Prescriptions
                </button>
              </div>
            </>
          )}
          
          <div className="health-action-card floating" style={{
            background: 'linear-gradient(135deg, rgba(17, 138, 178, 0.15), rgba(46, 191, 145, 0.1))',
            border: '1px solid rgba(17, 138, 178, 0.3)',
            backdropFilter: 'blur(20px)',
            animationDelay: '0.4s'
          }}>
            <div className="health-card-icon" style={{
              background: 'linear-gradient(135deg, #118ab2, #2ebf91)',
              boxShadow: '0 15px 30px rgba(17, 138, 178, 0.4)'
            }}>📊</div>
            <h3 className="health-card-title">Health Analytics</h3>
            <p className="health-card-description">
              Advanced analytics and reporting for healthcare insights and trends
            </p>
            <button className="btn btn-health">
              View Analytics
            </button>
          </div>
        </div>
        
        {/* User Information Section */}
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
            Account Information
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
              <strong>Email:</strong> {user.email}
            </div>
            <div>
              <strong>DSSN:</strong> {user.dssn}
            </div>
            <div>
              <strong>Account Type:</strong> {user.hasPatientRecord ? 'Patient' : user.pharmacyId ? 'Pharmacy' : 'User'}
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
            <span>Digital Liberia Health</span>
          </div>
          
          {/* Liberia Flag and Login Section */}
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
                    👤 {user.firstName} {user.lastName}
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
                  onClick={() => setShowLogin(true)}
                  className="btn btn-health"
                  style={{ 
                    padding: '0.7rem 1.5rem', 
                    fontSize: '0.9rem',
                    boxShadow: '0 4px 15px rgba(0, 212, 170, 0.4)'
                  }}
                >
                  🏥 Healthcare Login
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
    </div>
  );
}

export default App;
