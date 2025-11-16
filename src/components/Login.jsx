import React, { useState, useEffect } from 'react';

// Firebase configuration for health system
const firebaseConfig = {
  apiKey: "AIzaSyA4NndmuQHTCKh7IyQYAz3DL_r8mttyRYg",
  authDomain: "digitalliberia-health.firebaseapp.com",
  projectId: "digitalliberia-health",
  storageBucket: "digitalliberia-health.appspot.com",
  messagingSenderId: "537791418352",
  appId: "1:537791418352:web:378b48439b2c9bed6dd735"
};

// Initialize Firebase
let messaging = null;
if (typeof window !== 'undefined') {
  try {
    const { initializeApp } = require('firebase/app');
    const { getMessaging, getToken, onMessage } = require('firebase/messaging');
    
    const app = initializeApp(firebaseConfig);
    messaging = getMessaging(app);
  } catch (error) {
    console.log('Firebase initialization skipped in non-browser environment');
  }
}

// Web Push VAPID public key
const vapidKey = "BEICu1bx8LKW5j7cag5tU9B2qfcejWi7QPm8a95jFODSIUNRiellygLGroK9NyWt-3WsTiUZscmS311gGXiXV7Q";

// Enhanced notification permission request for health system
const requestNotificationPermission = async () => {
  try {
    if (!messaging) return null;
    
    const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js');
    console.log('Service Worker registered:', registration);

    const permission = await Notification.requestPermission();
    if (permission === 'granted') {
      console.log('Notification permission granted.');
      
      const currentToken = await getToken(messaging, { 
        vapidKey: vapidKey,
        serviceWorkerRegistration: registration
      });
      
      if (currentToken) {
        console.log('FCM Token:', currentToken);
        localStorage.setItem('fcmToken', currentToken);
        return currentToken;
      }
    }
    return null;
  } catch (error) {
    console.error('Error retrieving token:', error);
    return null;
  }
};

// API configuration for health system
const API_BASE = 'https://health.digitalliberia.com:8081';

const api = {
  post: async (url, data) => {
    const response = await fetch(`${API_BASE}${url}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
      credentials: 'include',
    });
    
    if (!response.ok) {
      throw new Error(`Server returned ${response.status}`);
    }
    
    return response.json();
  },
  
  get: async (url) => {
    const response = await fetch(`${API_BASE}${url}`, {
      credentials: 'include',
    });
    
    if (!response.ok) {
      throw new Error(`Server returned ${response.status}`);
    }
    
    return response.json();
  }
};

// Function to check if user has healthcare role-based access
const checkHealthRoleAccess = async (dssn) => {
  try {
    const response = await api.post('/health/check-role-access', { dssn });
    
    if (response.success && response.data) {
      console.log('Healthcare role access verified:', response.data);
      return response.data;
    } else {
      throw new Error(response.error || 'Healthcare access denied. No medical permissions found.');
    }
  } catch (error) {
    console.error('Error checking healthcare role access:', error);
    throw new Error('Failed to verify healthcare access permissions: ' + error.message);
  }
};

// Function to fetch healthcare professional profile
const fetchHealthProfessionalProfile = async (dssn) => {
  try {
    const response = await api.get(`/health/profile-by-dssn?dssn=${dssn}`);
    
    if (response.success && response.data) {
      console.log('Healthcare professional profile fetched:', response.data);
      return response.data;
    } else {
      throw new Error(response.message || 'Failed to fetch healthcare professional profile');
    }
  } catch (error) {
    console.error('Error fetching health professional profile:', error);
    throw new Error('Failed to fetch healthcare profile: ' + error.message);
  }
};

function Login({ onLoginSuccess, onBack }) {
  const [dssn, setDssn] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [challengeId, setChallengeId] = useState(null);
  const [polling, setPolling] = useState(false);
  const [pollInterval, setPollInterval] = useState(null);
  const [pushNotificationStatus, setPushNotificationStatus] = useState(null);

  useEffect(() => {
    return () => {
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, [pollInterval]);

  const requestHealthDSSNChallenge = async (dssn) => {
    try {
      const fcmToken = localStorage.getItem('fcmToken') || await requestNotificationPermission();
      
      const response = await api.post('/health/gov-services/request', { 
        dssn, 
        service: "Digital Liberia Health System",
        fcmToken,
        requestData: {
          timestamp: new Date().toISOString(),
          service: "Digital Liberia Health System - Medical Professional Access",
          origin: window.location.origin,
          requiresHealthRole: true,
          accessLevel: "MEDICAL_PROFESSIONAL"
        }
      });
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to initiate healthcare verification');
      }
      
      return response;
    } catch (error) {
      console.error('Error requesting health DSSN challenge:', error);
      throw new Error(error.message || "Failed to initiate healthcare verification");
    }
  };

  const pollHealthChallengeStatus = async (challengeId) => {
    try {
      const response = await api.get(`/health/gov-services/status/${challengeId}`);
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to check healthcare verification status');
      }
      
      return response;
    } catch (error) {
      console.error('Error polling health challenge status:', error);
      throw new Error(error.message || "Failed to check healthcare approval status");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    setPushNotificationStatus(null);

    if (!dssn.trim()) {
      setError("Please enter your DSSN");
      setLoading(false);
      return;
    }

    try {
      // Check if user has healthcare role-based access
      console.log('Checking healthcare role access for DSSN:', dssn);
      const healthRoleAccess = await checkHealthRoleAccess(dssn);
      
      if (!healthRoleAccess.hasAccess) {
        throw new Error('Healthcare access denied. You do not have medical professional permissions for this system.');
      }

      console.log('Healthcare role access verified, proceeding with DSSN challenge...');
      
      const response = await requestHealthDSSNChallenge(dssn);
      setChallengeId(response.challengeId);
      setPolling(true);
      setLoading(false);
      
      if (response.pushNotification) {
        setPushNotificationStatus({
          sent: response.pushNotification.sent,
          hasToken: response.pushNotification.hasToken,
          error: response.pushNotification.error
        });
      }
      
      const interval = setInterval(async () => {
        try {
          const statusResponse = await pollHealthChallengeStatus(response.challengeId);
          
          if (statusResponse.status === 'approved') {
            clearInterval(interval);
            setPolling(false);
            console.log('Healthcare login approved with token:', statusResponse.govToken);
            
            // Fetch healthcare professional profile
            try {
              const healthProfile = await fetchHealthProfessionalProfile(dssn);
              console.log('Healthcare professional profile fetched:', healthProfile);
              
              // Call the success callback with complete healthcare user data
              onLoginSuccess({
                dssn: dssn,
                govToken: statusResponse.govToken,
                challengeId: response.challengeId,
                profile: {
                  firstName: healthProfile.first_name,
                  lastName: healthProfile.last_name,
                  email: healthProfile.email,
                  phone: healthProfile.phone,
                  photo: healthProfile.image,
                  medicalLicense: healthProfile.medical_license,
                  specialization: healthProfile.specialization,
                  hospital: healthProfile.hospital,
                  department: healthProfile.department,
                  role: healthProfile.role,
                  rawData: healthProfile
                },
                healthRoleAccess: healthRoleAccess,
                timestamp: new Date().toISOString(),
                accessLevel: "MEDICAL_PROFESSIONAL"
              });
              
            } catch (profileError) {
              console.error('Error fetching health profile, proceeding with basic data:', profileError);
              onLoginSuccess({
                dssn: dssn,
                govToken: statusResponse.govToken,
                challengeId: response.challengeId,
                profile: null,
                healthRoleAccess: healthRoleAccess,
                timestamp: new Date().toISOString(),
                accessLevel: "MEDICAL_PROFESSIONAL"
              });
            }
            
          } else if (statusResponse.status === 'denied') {
            clearInterval(interval);
            setPolling(false);
            setError("Healthcare access was denied on your mobile device");
          }
        } catch (error) {
          console.error('Error polling health challenge status:', error);
          clearInterval(interval);
          setPolling(false);
          setError(error.message);
        }
      }, 3000);

      setPollInterval(interval);

      setTimeout(() => {
        if (polling) {
          clearInterval(interval);
          setPolling(false);
          setError("Healthcare verification timed out. Please try again.");
        }
      }, 5 * 60 * 1000);

    } catch (error) {
      setError(error.message);
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-content">
        {/* Back Button */}
        <button 
          onClick={onBack}
          className="back-button"
        >
          ← Back to Health Portal
        </button>

        <div className="login-header">
          <div className="login-logo">🏥</div>
          <h2>Healthcare Professional Verification</h2>
          <p>
            Secure access to Digital Liberia Health System for medical professionals
          </p>
          <div className="success-message" style={{ marginTop: '1.5rem' }}>
            🔐 Medical Professional Access Required - Role-based verification
          </div>
        </div>
        
        <div className="login-form">
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}
          
          {pushNotificationStatus && !pushNotificationStatus.sent && (
            <div className="warning-message">
              {!pushNotificationStatus.hasToken ? (
                "Please install the Digital Liberia Health mobile app to receive verification requests"
              ) : (
                `Notification error: ${pushNotificationStatus.error || 'Unknown error'}`
              )}
            </div>
          )}
          
          {polling ? (
            <div className="verification-pending">
              <div className="spinner" style={{
                border: '4px solid rgba(0, 212, 170, 0.3)',
                borderTop: '4px solid var(--success-color)',
                borderRadius: '50%',
                width: '60px',
                height: '60px',
                animation: 'spin 1s linear infinite',
                margin: '0 auto 2rem',
                boxShadow: '0 0 25px rgba(0, 212, 170, 0.4)'
              }}></div>
              <h3 style={{ margin: '1.5rem 0', color: 'var(--text-dark)', fontSize: '1.5rem' }}>
                Verifying Medical Professional Access
              </h3>
              <p style={{ color: 'var(--text-light)', marginBottom: '1.5rem', fontSize: '1.1rem' }}>
                Please check your mobile health app to approve this medical access request.
              </p>
              {pushNotificationStatus?.sent && (
                <p className="notification-sent">
                  ✅ Push notification sent to your registered health device
                </p>
              )}
              <p className="challenge-id">
                Medical Verification ID: {challengeId}
              </p>
              <p className="timeout-notice">
                This medical access request will timeout in 5 minutes
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="dssn">
                  Digital Social Security Number (DSSN)
                </label>
                <input 
                  type="text" 
                  id="dssn" 
                  value={dssn}
                  onChange={(e) => setDssn(e.target.value)}
                  placeholder="Enter your medical DSSN" 
                  required
                  autoFocus
                  disabled={loading}
                />
                <p className="input-help">
                  Enter your DSSN and approve the healthcare access request on your mobile app
                </p>
              </div>
              
              <button 
                type="submit" 
                className="login-submit-btn"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner-small"></span>
                    Verifying Medical Access...
                  </>
                ) : 'Verify Healthcare Access'}
              </button>
            </form>
          )}

          <div className="login-footer">
            <p className="mobile-app-info">
              Don't have the health mobile app?{' '}
              <a 
                href="#" 
                onClick={(e) => {
                  e.preventDefault();
                  alert("The Digital Liberia Health mobile app is available on the App Store and Google Play Store");
                }}
              >
                Download Health App
              </a>
            </p>
            <p className="access-info" style={{ 
              background: 'rgba(0, 212, 170, 0.1)',
              border: '1px solid rgba(0, 212, 170, 0.2)',
              borderRadius: '12px',
              padding: '1rem',
              marginTop: '1.5rem',
              fontSize: '0.9rem',
              color: 'var(--success-color)'
            }}>
              🏥 This system requires verified medical professional permissions and role-based healthcare access.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
