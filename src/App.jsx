import React, { useState, useEffect } from 'react';
import Login from './components/Login';

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

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    setShowLogin(false);
    console.log('Health system login successful:', userData);
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('healthUser');
  };

  const handleCardClick = (module) => {
    setActiveModule(module);
  };

  const handleBackToHome = () => {
    setActiveModule(null);
  };

  const handleDSSNVerify = (dssn) => {
    // Backend verification will be implemented later
    console.log('Verifying DSSN:', dssn);
    alert(`DSSN ${dssn} verification logic will be implemented in backend`);
  };

  const handleLogin = (credentials) => {
    // Backend login will be implemented later
    console.log('Login attempt with:', credentials);
    alert('Login functionality will be implemented in backend');
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
              
              <div className="auth-tabs">
                <div className="auth-section">
                  <h3>Sign Up</h3>
                  <p className="auth-description">
                    Enter your DSSN (Digital Social Security Number) to verify your identity
                  </p>
                  <div className="form-group">
                    <label htmlFor="dssn-signup">DSSN Number</label>
                    <input
                      type="text"
                      id="dssn-signup"
                      placeholder="Enter 15-digit alphanumeric DSSN"
                      maxLength={15}
                      pattern="[A-Za-z0-9]{15}"
                    />
                    <p className="input-help">15 characters, letters and numbers only</p>
                    <button 
                      className="btn btn-health verify-btn"
                      onClick={() => {
                        const dssn = document.getElementById('dssn-signup').value;
                        if(dssn.length === 15 && /^[A-Za-z0-9]+$/.test(dssn)) {
                          handleDSSNVerify(dssn);
                        } else {
                          alert('Please enter a valid 15-digit alphanumeric DSSN');
                        }
                      }}
                    >
                      Verify DSSN
                    </button>
                  </div>
                </div>
                
                <div className="divider">OR</div>
                
                <div className="auth-section">
                  <h3>Login</h3>
                  <p className="auth-description">
                    Access your account with DSSN and password
                  </p>
                  <div className="form-group">
                    <label htmlFor="dssn-login">DSSN Number</label>
                    <input
                      type="text"
                      id="dssn-login"
                      placeholder="Enter your DSSN"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="password">Password</label>
                    <input
                      type="password"
                      id="password"
                      placeholder="Enter your password"
                    />
                  </div>
                  <button 
                    className="btn btn-health login-btn"
                    onClick={() => {
                      const dssn = document.getElementById('dssn-login').value;
                      const password = document.getElementById('password').value;
                      if(dssn && password) {
                        handleLogin({ dssn, password });
                      } else {
                        alert('Please enter both DSSN and password');
                      }
                    }}
                  >
                    Login to Patient Records
                  </button>
                </div>
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
              
              <div className="auth-tabs">
                <div className="auth-section">
                  <h3>Sign Up</h3>
                  <p className="auth-description">
                    Enter your DSSN (Digital Social Security Number) to verify your identity
                  </p>
                  <div className="form-group">
                    <label htmlFor="dssn-pharmacy-signup">DSSN Number</label>
                    <input
                      type="text"
                      id="dssn-pharmacy-signup"
                      placeholder="Enter 15-digit alphanumeric DSSN"
                      maxLength={15}
                      pattern="[A-Za-z0-9]{15}"
                    />
                    <p className="input-help">15 characters, letters and numbers only</p>
                    <button 
                      className="btn btn-medical verify-btn"
                      onClick={() => {
                        const dssn = document.getElementById('dssn-pharmacy-signup').value;
                        if(dssn.length === 15 && /^[A-Za-z0-9]+$/.test(dssn)) {
                          handleDSSNVerify(dssn);
                        } else {
                          alert('Please enter a valid 15-digit alphanumeric DSSN');
                        }
                      }}
                    >
                      Verify DSSN
                    </button>
                  </div>
                </div>
                
                <div className="divider">OR</div>
                
                <div className="auth-section">
                  <h3>Login</h3>
                  <p className="auth-description">
                    Access your pharmacy account with DSSN and password
                  </p>
                  <div className="form-group">
                    <label htmlFor="dssn-pharmacy-login">DSSN Number</label>
                    <input
                      type="text"
                      id="dssn-pharmacy-login"
                      placeholder="Enter your DSSN"
                    />
                  </div>
                  <div className="form-group">
                    <label htmlFor="pharmacy-password">Password</label>
                    <input
                      type="password"
                      id="pharmacy-password"
                      placeholder="Enter your password"
                    />
                  </div>
                  <button 
                    className="btn btn-medical login-btn"
                    onClick={() => {
                      const dssn = document.getElementById('dssn-pharmacy-login').value;
                      const password = document.getElementById('pharmacy-password').value;
                      if(dssn && password) {
                        handleLogin({ dssn, password });
                      } else {
                        alert('Please enter both DSSN and password');
                      }
                    }}
                  >
                    Login to Pharmacy System
                  </button>
                </div>
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

  return (
    <div className="app">
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
                <span style={{ 
                  color: 'var(--white)', 
                  fontWeight: '600',
                  fontSize: '0.95rem'
                }}>
                  Welcome, Dr. {user.profile?.firstName} {user.profile?.lastName}
                </span>
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
              
              {/* Liberia Flag Welcome Badge */}
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.8rem',
                background: 'rgba(0, 212, 170, 0.1)',
                border: '1px solid rgba(0, 212, 170, 0.3)',
                borderRadius: '12px',
                padding: '0.8rem 1.2rem',
                marginBottom: '2rem',
                position: 'relative',
                zIndex: 1
              }}>
                <span style={{ fontSize: '1.5rem' }}>🇱🇷</span>
                <span style={{ 
                  fontSize: '0.9rem', 
                  color: 'var(--success-color)',
                  fontWeight: '600'
                }}>
                  Ministry of Health - Republic of Liberia
                </span>
              </div>
              
              {/* Enhanced Health Action Grid for Logged-in Users */}
              <div className="health-action-grid">
                {/* Patient Records Card */}
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
                  <h3 className="health-card-title">Patient Records</h3>
                  <p className="health-card-description">
                    Access and manage comprehensive patient health records and medical history
                  </p>
                  <button className="btn btn-health">
                    View Records
                  </button>
                </div>
                
                {/* Medical Services Card */}
                <div className="health-action-card floating" style={{
                  background: 'linear-gradient(135deg, rgba(114, 9, 183, 0.15), rgba(58, 134, 255, 0.1))',
                  border: '1px solid rgba(114, 9, 183, 0.3)',
                  backdropFilter: 'blur(20px)',
                  animationDelay: '0.2s'
                }}>
                  <div className="health-card-icon" style={{
                    background: 'linear-gradient(135deg, #7209b7, #3a86ff)',
                    boxShadow: '0 15px 30px rgba(114, 9, 183, 0.4)'
                  }}>💉</div>
                  <h3 className="health-card-title">Medical Services</h3>
                  <p className="health-card-description">
                    Schedule appointments, manage treatments, and coordinate care services
                  </p>
                  <button className="btn btn-medical">
                    Manage Services
                  </button>
                </div>
                
                {/* Health Analytics Card */}
                <div className="health-action-card floating" style={{
                  background: 'linear-gradient(135deg, rgba(46, 191, 145, 0.15), rgba(131, 96, 195, 0.1))',
                  border: '1px solid rgba(46, 191, 145, 0.3)',
                  backdropFilter: 'blur(20px)',
                  animationDelay: '0.4s'
                }}>
                  <div className="health-card-icon" style={{
                    background: 'linear-gradient(135deg, #2ebf91, #8360c3)',
                    boxShadow: '0 15px 30px rgba(46, 191, 145, 0.4)'
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
            </div>
          </div>
        )}
      </main>

      {/* Login Modal */}
      {showLogin && (
        <Login 
          onLoginSuccess={handleLoginSuccess}
          onBack={() => setShowLogin(false)}
        />
      )}
    </div>
  );
}

export default App;
