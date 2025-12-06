import { useState, useEffect, useCallback } from 'react';
import { 
  verifyDSSN, 
  loginProfessional, 
  enhancedProfessionalLogin, 
  requestMobileAuth, 
  checkMobileAuthStatus,
  verifyProfessional,
  getProfessionalProfile,
  validateSession,
  logoutProfessional,
  refreshToken
} from '../services/healthApi';

export const useHealthAuth = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [sessionId, setSessionId] = useState(null);

  // Initialize from localStorage
  useEffect(() => {
    const token = localStorage.getItem('health_token');
    const savedUser = localStorage.getItem('health_user');
    const savedSession = localStorage.getItem('health_session');
    
    if (token && savedUser && savedSession) {
      try {
        setUser(JSON.parse(savedUser));
        setSessionId(savedSession);
      } catch (err) {
        clearAuth();
      }
    }
  }, []);

  const clearAuth = () => {
    localStorage.removeItem('health_token');
    localStorage.removeItem('health_user');
    localStorage.removeItem('health_session');
    setUser(null);
    setSessionId(null);
  };

  const verifyUserDSSN = useCallback(async (dssn, type) => {
    setLoading(true);
    setError(null);
    try {
      const response = await verifyDSSN(dssn, type);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Verification failed');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (dssn, password, moduleType, enhanced = true) => {
    setLoading(true);
    setError(null);
    try {
      let response;
      if (enhanced) {
        response = await enhancedProfessionalLogin(dssn, password, moduleType);
      } else {
        response = await loginProfessional(dssn, password, moduleType);
      }

      if (response.data.success) {
        const userData = enhanced ? response.data.user : response.data.user;
        const token = enhanced ? response.data.tokens?.accessToken : response.data.token;
        const session = enhanced ? response.data.session : null;

        setUser(userData);
        setSessionId(session?.sessionId);

        localStorage.setItem('health_token', token);
        localStorage.setItem('health_user', JSON.stringify(userData));
        if (session?.sessionId) {
          localStorage.setItem('health_session', session.sessionId);
        }

        return { user: userData, token, session };
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const mobileAuth = useCallback(async (dssn, moduleType, fcmToken) => {
    setLoading(true);
    setError(null);
    try {
      const response = await requestMobileAuth(dssn, moduleType, fcmToken);
      if (response.data.success) {
        return response.data.authentication;
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Mobile auth failed');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const checkMobileAuth = useCallback(async (challengeId) => {
    try {
      const response = await checkMobileAuthStatus(challengeId);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Status check failed');
      throw err;
    }
  }, []);

  const verifyProfessionalStatus = useCallback(async (dssn, moduleType) => {
    setLoading(true);
    setError(null);
    try {
      const response = await verifyProfessional(dssn, moduleType);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || 'Professional verification failed');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getProfile = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getProfessionalProfile();
      if (response.data.success) {
        setUser(response.data.professional);
        return response.data.professional;
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch profile');
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      if (sessionId) {
        await logoutProfessional(sessionId);
      }
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      clearAuth();
    }
  }, [sessionId]);

  const validateUserSession = useCallback(async () => {
    if (!sessionId) return false;
    
    try {
      const response = await validateSession(sessionId);
      return response.data.success;
    } catch (err) {
      clearAuth();
      return false;
    }
  }, [sessionId]);

  const refreshAuthToken = useCallback(async () => {
    const refreshTokenValue = localStorage.getItem('health_refresh_token');
    if (!refreshTokenValue) return null;

    try {
      const response = await refreshToken(refreshTokenValue);
      if (response.data.success) {
        localStorage.setItem('health_token', response.data.tokens.accessToken);
        return response.data.tokens.accessToken;
      }
    } catch (err) {
      clearAuth();
      return null;
    }
  }, []);

  return {
    user,
    loading,
    error,
    sessionId,
    verifyUserDSSN,
    login,
    mobileAuth,
    checkMobileAuth,
    verifyProfessionalStatus,
    getProfile,
    logout,
    validateUserSession,
    refreshAuthToken,
    clearAuth
  };
};
