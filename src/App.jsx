import React, { useState, useEffect } from 'react';
import Login from './components/Login';

// Firebase configuration for health system
const firebaseConfig = {
  apiKey: "AIzaSyA4NndmuQHTCKh7IyQYAz3DL_r8mttyRYg",
  authDomain: "digitalliberia-health.firebaseapp.com",
  projectId: "digitalliberia-health",
  storageBucket: "digitalliberia-health.appspot.com",
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
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
              <span style={{ color: 'var(--white)', fontWeight: '600' }}>
                Welcome, Dr. {user.profile?.firstName} {user.profile?.lastName}
              </span>
              <button 
                onClick={handleLogout}
                className="btn btn-glass"
                style={{ padding: '0.8rem 1.5rem', fontSize: '0.9rem' }}
              >
                Logout
              </button>
            </div>
          ) : (
            <button 
              onClick={() => setShowLogin(true)}
              className="btn btn-health"
              style={{ padding: '0.8rem 1.5rem', fontSize: '0.9rem' }}
            >
              Healthcare Login
            </button>
          )}
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
                <span style={{ background: 'var(--health-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
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
                <button className="btn btn-glass">
                  📱 Download Health App
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
                  textAlign: 'center'
                }}
              >
                <div 
                  style={{
                    fontSize: '6rem',
                    marginBottom: '2rem',
                    background: 'var(--health-gradient)',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    backgroundClip: 'text'
                  }}
                >
                  ❤️
                </div>
                <h3 style={{ 
                  color: 'var(--text-dark)', 
                  marginBottom: '1rem',
                  fontSize: '1.5rem',
                  fontWeight: '700'
                }}>
                  Your Health, Our Priority
                </h3>
                <p style={{ color: 'var(--text-light)', lineHeight: '1.6' }}>
                  Secure, efficient, and modern healthcare solutions for all Liberians
                </p>
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
                marginBottom: '3rem'
              }}
            >
              <div 
                style={{
                  fontSize: '4rem',
                  marginBottom: '1.5rem',
                  background: 'var(--health-gradient)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text'
                }}
              >
                🎉
              </div>
              <h1 style={{ 
                color: 'var(--text-dark)', 
                marginBottom: '1rem',
                fontSize: '2.5rem',
                fontWeight: '800'
              }}>
                Welcome to Health Portal
              </h1>
              <p style={{ 
                color: 'var(--text-light)', 
                fontSize: '1.2rem',
                marginBottom: '2rem'
              }}>
                Access advanced healthcare tools and patient management systems
              </p>
              
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
