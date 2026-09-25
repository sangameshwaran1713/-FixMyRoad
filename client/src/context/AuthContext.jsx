import React, { createContext, useContext, useState, useEffect } from 'react';
import { registerApi, loginApi, verifyOTPApi, resendOTPApi, logoutApi, getMeApi } from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Restore authenticated session on mount
  const checkAuthStatus = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) {
        setUser(null);
        return;
      }
      const response = await getMeApi();
      if (response.success && response.data?.user) {
        setUser(response.data.user);
      } else {
        setUser(null);
        localStorage.removeItem('token');
      }
    } catch (err) {
      setUser(null);
      localStorage.removeItem('token');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkAuthStatus();
  }, []);

  // Login handler — accepts identifier (email or username) & password
  const login = async (identifierOrEmail, password) => {
    setError(null);
    try {
      const credentials = typeof identifierOrEmail === 'object'
        ? identifierOrEmail
        : { identifier: identifierOrEmail, password };
        
      const response = await loginApi(credentials);
      if (response.success && response.data?.user) {
        if (response.token) {
          localStorage.setItem('token', response.token);
        }
        setUser(response.data.user);
        return { success: true, user: response.data.user };
      }
      throw new Error(response.message || 'Login failed');
    } catch (err) {
      if (err.requiresVerification) {
        return { success: false, requiresVerification: true, email: err.email, error: err.message };
      }
      const message = err.message || 'Invalid username/email or password';
      setError(message);
      return { success: false, error: message };
    }
  };

  // Register handler — returns verification status and devOTP snippet
  const register = async (name, email, password, confirmPassword, phone) => {
    setError(null);
    try {
      const response = await registerApi({ name, email, password, confirmPassword, phone });
      if (response.success) {
        return { 
          success: true, 
          requiresVerification: response.requiresVerification, 
          email: response.email,
          devOTP: response.devOTP
        };
      }
      throw new Error(response.message || 'Registration failed');
    } catch (err) {
      const message = err.message || 'Registration failed. Please try again.';
      setError(message);
      return { success: false, error: message };
    }
  };

  // OTP Verification handler
  const verifyOTP = async (email, otp) => {
    setError(null);
    try {
      const response = await verifyOTPApi({ email, otp });
      if (response.success && response.data?.user) {
        if (response.token) {
          localStorage.setItem('token', response.token);
        }
        setUser(response.data.user);
        return { success: true, user: response.data.user };
      }
      throw new Error(response.message || 'OTP verification failed');
    } catch (err) {
      const message = err.message || 'Invalid OTP code. Please try again.';
      setError(message);
      return { success: false, error: message };
    }
  };

  // Resend OTP handler
  const resendOTP = async (email) => {
    try {
      const response = await resendOTPApi({ email });
      return { success: response.success, message: response.message, devOTP: response.devOTP };
    } catch (err) {
      return { success: false, error: err.message || 'Failed to resend OTP' };
    }
  };

  // Logout handler
  const logout = async () => {
    try {
      await logoutApi();
    } catch (err) {
      console.error('Logout error:', err);
    } finally {
      localStorage.removeItem('token');
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        loading,
        error,
        login,
        register,
        verifyOTP,
        resendOTP,
        logout,
        checkAuthStatus,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;
