import React, { useState, useEffect } from 'react';

// Firebase configuration - USING EXACT SAME CONFIG AS WORKING PROJECT
const firebaseConfig = {
  apiKey: "AIzaSyA4NndmuQHTCKh7IyQYAz3DL_r8mttyRYg",
  authDomain: "digitalliberia-notification.firebaseapp.com",
  projectId: "digitalliberia-notification",
  storageBucket: "digitalliberia-notification.appspot.com",
  messagingSenderId: "537791418352",
  appId: "1:537791418352:web:378b48439b2c9bed6dd735"
};

// Initialize Firebase - EXACT SAME INITIALIZATION
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

// Web Push VAPID public key - EXACT SAME KEY
const vapidKey = "BEICu1bx8LKW5j7cag5tU9B2qfcejWi7QPm8a95jFODSIUNRiellygLGroK9NyWt-3WsTiUZscmS311gGXiXV7Q";

// Enhanced notification permission request - EXACT SAME FUNCTION
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

// API configuration - USING EXACT SAME API BASE AND ENDPOINTS
const API_BASE = 'https://libpayapp.liberianpost.com:8081';

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

// Function to check if user has role-based access - EXACT SAME FUNCTION
const checkRoleBaseAccess = async (dssn) => {
  try {
    const response = await api.post('/check-role-access', { dssn });
    
    if (response.success && response.data) {
      console.log('Role-based access verified:', response.data);
      return response.data;
    } else {
      throw new Error(response.error || 'Access denied. No role-based permissions found.');
    }
  } catch (error) {
    console.error('Error checking role access:', error);
    throw new Error('Failed to verify access permissions: ' + error.message);
  }
};

// Function to fetch user profile - EXACT SAME FUNCTION
const fetchUserProfile = async (dssn) => {
  try {
    const response = await api.get(`/profile-by-dssn?dssn=${dssn}`);
    
    // Check if the response is successful and has data
    if (response.success && response.data) {
      console.log('User profile fetched successfully:', response.data);
      return response.data; // Return the data object directly
    } else {
      throw new Error(response.message || 'Failed to fetch user profile');
    }
  } catch (error) {
    console.error('Error fetching user profile:', error);
    throw new Error('Failed to fetch user profile: ' + error.message);
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

  // EXACT SAME DSSN CHALLENGE FUNCTION - Only changed service name
  const requestDSSNChallenge = async (dssn) => {
    try {
      const fcmToken = localStorage.getItem('fcmToken') || await requestNotificationPermission();
      
      const response = await api.post('/gov-services/request', { 
        dssn, 
        service: "Digital Liberia Health System", // Only changed service name
        fcmToken,
        requestData: {
          timestamp: new Date().toISOString(),
          service: "Digital Liberia Health System - Medical Access", // Updated service name
          origin: window.location.origin,
          requiresRoleBase: true
        }
      });
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to initiate challenge');
      }
      
      return response;
    } catch (error) {
      console.error('Error requesting DSSN challenge:', error);
      throw new Error(error.message || "Failed to initiate DSSN challenge");
    }
  };

  // EXACT SAME POLLING FUNCTION
  const pollChallengeStatus = async (challengeId) => {
    try {
      const response = await api.get(`/gov-services/status/${challengeId}`);
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to check challenge status');
      }
      
      return response;
    } catch (error) {
      console.error('Error polling challenge status:', error);
      throw new Error(error.message || "Failed to check approval status");
    }
  };

  // EXACT SAME HANDLE SUBMIT LOGIC - Only updated messages for health context
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
      // EXACT SAME ROLE ACCESS CHECK
      console.log('Checking role-based access for DSSN:', dssn);
      const roleAccess = await checkRoleBaseAccess(dssn);
      
      if (!roleAccess.hasAccess) {
        throw new Error('Healthcare access denied. You do not have medical permissions for this system.');
      }

      console.log('Role access verified, proceeding with DSSN challenge...');
      
      const response = await requestDSSNChallenge(dssn);
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
          const statusResponse = await pollChallengeStatus(response.challengeId);
          
          if (statusResponse.status === 'approved') {
            clearInterval(interval);
            setPolling(false);
            console.log('Health system login approved with token:', statusResponse.govToken);
            
            // Fetch user profile after successful login - EXACT SAME PROFILE FETCH
            try {
              const userProfile = await fetchUserProfile(dssn);
              console.log('User profile fetched successfully:', userProfile);
              
              // Call the success callback with complete user data - UPDATED structure for health context
              onLoginSuccess({
                dssn: dssn,
                govToken: statusResponse.govToken,
                challengeId: response.challengeId,
                profile: {
                  // Map backend fields to frontend expected structure
                  firstName: userProfile.first_name,
                  lastName: userProfile.last_name,
                  email: userProfile.email,
                  phone: userProfile.phone,
                  photo: userProfile.image,
                  address: userProfile.address,
                  postalAddress: userProfile.postal_address,
                  userId: userProfile.user_id,
                  dssn: userProfile.DSSN,
                  institution_of_work: userProfile.institution_of_work,
                  position: userProfile.position,
                  role_base: userProfile.role_base,
                  // Include all original data for debugging
                  rawData: userProfile
                },
                roleAccess: roleAccess, // Include role access information
                timestamp: new Date().toISOString()
              });
              
            } catch (profileError) {
              console.error('Error fetching profile, proceeding with basic user data:', profileError);
              // Still proceed with login even if profile fetch fails
              onLoginSuccess({
                dssn: dssn,
                govToken: statusResponse.govToken,
                challengeId: response.challengeId,
                profile: null,
                roleAccess: roleAccess, // Include role access information
                timestamp: new Date().toISOString()
              });
            }
            
          } else if (statusResponse.status === 'denied') {
            clearInterval(interval);
            setPolling(false);
            setError("Healthcare access was denied on your mobile device");
          }
        } catch (error) {
          console.error('Error polling challenge status:', error);
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
            Enter your DSSN to access Digital Liberia Health System
          </p>
          <div style={{
            background: 'rgba(0, 212, 170, 0.1)',
            border: '1px solid rgba(0, 212, 170, 0.3)',
            borderRadius: '12px',
            padding: '1rem',
            marginTop: '1.5rem',
            fontSize: '0.9rem',
            color: 'var(--success-color)'
          }}>
            🔒 Role-based healthcare access required. Only authorized medical professionals can login.
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
                "Please install the Digital Liberia mobile app to receive verification requests"
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
                Verifying Healthcare Access
              </h3>
              <p style={{ color: 'var(--text-light)', marginBottom: '1.5rem', fontSize: '1.1rem' }}>
                Please check your mobile app to approve this healthcare access request.
              </p>
              {pushNotificationStatus?.sent && (
                <p className="notification-sent">
                  ✅ Push notification sent to your mobile device
                </p>
              )}
              <p className="challenge-id">
                Healthcare Verification ID: {challengeId}
              </p>
              <p className="timeout-notice">
                This healthcare access request will timeout in 5 minutes
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
                  placeholder="Enter your DSSN" 
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
                    Verifying Healthcare Access...
                  </>
                ) : 'Verify Healthcare Access'}
              </button>
            </form>
          )}

          <div className="login-footer">
            <p className="mobile-app-info">
              Don't have the mobile app?{' '}
              <a 
                href="#" 
                onClick={(e) => {
                  e.preventDefault();
                  alert("The Digital Liberia mobile app is available on the App Store and Google Play Store");
                }}
              >
                Download it here
              </a>
            </p>
            <p className="access-info" style={{ 
              color: 'var(--text-light)', 
              fontSize: '0.8rem',
              marginTop: '1.5rem',
              background: 'rgba(0,0,0,0.05)',
              padding: '0.8rem',
              borderRadius: '8px'
            }}>
              🔐 This healthcare system requires role-based medical professional permissions.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;
