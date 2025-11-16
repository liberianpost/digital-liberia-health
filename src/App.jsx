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
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="main-content">
        {!user ? (
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

              {/* Health Features Grid */}
              <div className="health-features-grid">
                <div className="health-feature-item">
                  <div className="health-feature-icon">📊</div>
                  <div className="health-feature-content">
                    <h4>Patient Records</h4>
                    <p>Secure digital health records with instant access for authorized medical professionals</p>
                  </div>
                </div>
                <div className="health-feature-item">
                  <div className="health-feature-icon">💊</div>
                  <div className="health-feature-content">
                    <h4>Pharmacy Management</h4>
                    <p>Real-time medication tracking and prescription management system</p>
                  </div>
                </div>
                <div className="health-feature-item">
                  <div className="health-feature-icon">🩺</div>
                  <div className="health-feature-content">
                    <h4>Telemedicine</h4>
                    <p>Virtual consultations and remote patient monitoring capabilities</p>
                  </div>
                </div>
                <div className="health-feature-item">
                  <div className="health-feature-icon">🚑</div>
                  <div className="health-feature-content">
                    <h4>Emergency Response</h4>
                    <p>Rapid emergency services coordination and ambulance dispatch</p>
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
                    rgba(0, 212, 170, 0.05) 0%, 
                    rgba(17, 138, 178, 0.05) 50%, 
                    rgba(114, 9, 183, 0.05) 100%)`,
                  zIndex: 0
                }}></div>
                
                <div 
                  style={{
                    fontSize: '6rem',
                    marginBottom: '2rem',
                    background: 'var(--health-gradient)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text',
                    position: 'relative',
                    zIndex: 1
                  }}
                >
                  ❤️
                </div>
                <h3 style={{ 
                  color: 'var(--text-dark)', 
                  marginBottom: '1rem',
                  fontSize: '1.5rem',
                  fontWeight: '700',
                  position: 'relative',
                  zIndex: 1
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
                    color: 'var(--success-color)',
                    fontWeight: '600'
                  }}>
                    LIBERIA
                  </span>
                </div>
              </div>
            </div>
          </div>
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
              
              {/* Health Action Grid for Logged-in Users */}
              <div className="health-action-grid">
                <div className="health-action-card">
                  <div className="health-card-icon">📋</div>
                  <h3 className="health-card-title">Patient Records</h3>
                  <p className="health-card-description">
                    Access and manage comprehensive patient health records and medical history
                  </p>
                  <button className="btn btn-health">
                    View Records
                  </button>
                </div>
                
                <div className="health-action-card">
                  <div className="health-card-icon">💉</div>
                  <h3 className="health-card-title">Medical Services</h3>
                  <p className="health-card-description">
                    Schedule appointments, manage treatments, and coordinate care services
                  </p>
                  <button className="btn btn-medical">
                    Manage Services
                  </button>
                </div>
                
                <div className="health-action-card">
                  <div className="health-card-icon">📊</div>
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
