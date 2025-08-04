import api from './api';

const authService = {
  // Login user
  login: async (email, password) => {
    const response = await api.post('/api/auth/login/', { email, password });
    return response.data;
  },
  
  // Register user
  register: async (userData) => {
    const response = await api.post('/api/auth/register/', userData);
    return response.data;
  },
  
  // Get current user info
  getCurrentUser: async () => {
    const response = await api.get('/api/auth/me/');
    return response.data;
  },
  
  // Verify OTP
  verifyOtp: async (email, otp) => {
    const response = await api.post('/auth/verify-otp/', { email, otp });
    return response.data;
  },
  
  // Request password reset
  requestPasswordReset: async (email) => {
    const response = await api.post('/auth/request-reset-password/', { email });
    return response.data;
  },
  
  // Reset password
  resetPassword: async (token, password) => {
    const response = await api.post('/auth/reset-password/', { token, password });
    return response.data;
  }
};

export default authService;