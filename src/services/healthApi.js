import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_HEALTH_API_URL || 'https://libpayapp.liberianpost.com:8081/api/health';

const healthApi = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor
healthApi.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('health_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
healthApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Handle specific error codes
      switch (error.response.status) {
        case 401:
          localStorage.removeItem('health_token');
          localStorage.removeItem('health_user');
          localStorage.removeItem('health_session');
          window.location.reload();
          break;
        case 403:
          console.error('Access forbidden:', error.response.data);
          break;
        case 404:
          console.error('Resource not found:', error.response.data);
          break;
        case 500:
          console.error('Server error:', error.response.data);
          break;
        default:
          console.error('API error:', error.response.data);
      }
    } else if (error.request) {
      console.error('Network error:', error.request);
    } else {
      console.error('Request error:', error.message);
    }
    return Promise.reject(error);
  }
);

// Professional verification endpoints
export const verifyDSSN = async (dssn, type) => {
  const endpoint = type === 'patient' ? '/verify-dssn/patient' : '/verify-dssn/pharmacy';
  return healthApi.post(endpoint, { dssn });
};

export const registerProfessional = async (data) => {
  return healthApi.post('/register-professional', data);
};

export const loginProfessional = async (dssn, password, moduleType) => {
  const endpoint = moduleType === 'patient_records' ? '/login/patient' : '/login/pharmacy';
  return healthApi.post(endpoint, { dssn, password });
};

export const enhancedProfessionalLogin = async (dssn, password, moduleType, rememberMe = false) => {
  return healthApi.post('/professional/login', {
    dssn,
    password,
    moduleType: moduleType === 'patient-records' ? 'patient_records' : 'pharmacy_management',
    rememberMe
  });
};

export const requestMobileAuth = async (dssn, moduleType, fcmToken) => {
  return healthApi.post('/professional/mobile-auth', {
    dssn,
    moduleType: moduleType === 'patient-records' ? 'patient_records' : 'pharmacy_management',
    fcmToken
  });
};

export const checkMobileAuthStatus = async (challengeId) => {
  return healthApi.get(`/mobile-auth/status/${challengeId}`);
};

export const verifyProfessional = async (dssn, moduleType) => {
  return healthApi.post('/professional/verify', { dssn, moduleType });
};

export const getProfessionalProfile = async () => {
  return healthApi.get('/professional/profile');
};

export const validateSession = async (sessionId) => {
  return healthApi.post('/professional/validate-session', { sessionId });
};

export const logoutProfessional = async (sessionId) => {
  return healthApi.post('/professional/logout', { sessionId });
};

export const refreshToken = async (refreshToken) => {
  return healthApi.post('/professional/refresh-token', { refreshToken });
};

export const getDashboardData = async () => {
  return healthApi.get('/professional/dashboard');
};

export const getAccessLogs = async (limit = 50) => {
  return healthApi.get(`/access-logs?limit=${limit}`);
};

export const getActivityLogs = async (limit = 50, offset = 0) => {
  return healthApi.get(`/professional/activity-logs?limit=${limit}&offset=${offset}`);
};

export const getPendingProfessionals = async () => {
  return healthApi.get('/admin/pending-professionals');
};

export const verifyProfessionalAdmin = async (professionalId, status, permissions) => {
  return healthApi.post('/admin/verify-professional', { professionalId, status, permissions });
};

export const testNotification = async (dssn, fcmToken) => {
  return healthApi.post('/test-notification', { dssn, fcmToken });
};

export default healthApi;
