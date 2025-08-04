import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { auth } from '../firebase';
import { GoogleAuthProvider, signInWithPopup } from 'firebase/auth';

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    // Check for saved token in localStorage
    const token = localStorage.getItem('token');
    if (token) {
      try {
        // In a real app, you'd validate the token with your backend
        setUser({ token }); // Simple representation for now
      } catch (err) {
        console.error("Error validating token:", err);
      }
    }
    setLoading(false);
  }, []);
  
  const loginUser = async (email, password) => {
    setError(null);
    try {
      const response = await api.post('/api/users/login/', {
        email,
        password
      });
      
      if (response.data.access) {
        // Store the token
        localStorage.setItem('token', response.data.access);
        
        // Create user object from response
        const userData = {
          email: response.data.email,
          first_name: response.data.first_name,
          last_name: response.data.last_name,
          full_name: response.data.full_name
        };
        
        setUser(userData);
        return userData;
      }
      
      throw new Error('Login failed');
    } catch (err) {
      setError('Login failed');
      throw err;
    }
  };
  
  const registerUser = async (userData) => {
    try {
      // Make sure to use the correct endpoint with trailing slash
      const response = await api.post('/api/users/register/', {
        // Map frontend field names to what the backend expects
        email: userData.email,
        first_name: userData.firstName,  // Changed from full_name to first_name
        last_name: userData.lastName,    // Added last_name
        phone: userData.phone,
        password: userData.password
      });
      
      // Handle the response
      if (response.data.tokens) {
        // Store the token
        localStorage.setItem('token', response.data.tokens.access);
        // Update user context
        setUser(response.data.user);
        return { success: true };
      }
      
      return response.data;
    } catch (error) {
      console.error('Registration error:', error);
      throw new Error(
        error.response?.data?.message || 
        error.response?.data?.email?.[0] ||  // Handle field-specific errors
        error.response?.data?.first_name?.[0] ||  // Handle first_name errors
        error.response?.data?.last_name?.[0] ||   // Handle last_name errors
        'Registration failed. Please try again.'
      );
    }
  };
  
  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      
      // Return the result for handling in the component
      return {
        user: result.user,
        credential: GoogleAuthProvider.credentialFromResult(result)
      };
      
    } catch (error) {
      console.error('Google sign in error:', error);
      throw new Error(error.message || 'Failed to sign in with Google');
    }
  };
  
  const verifyUserOtp = async (phone, otp) => {
    try {
      const response = await api.post('/api/users/verify-otp/', { phone, otp });
      
      if (response.data.tokens) {
        localStorage.setItem('token', response.data.tokens.access);
        setUser(response.data.user);
      }
      
      return response.data;
    } catch (error) {
      console.error('OTP verification error:', error);
      throw new Error(
        error.response?.data?.message || 
        'OTP verification failed. Please try again.'
      );
    }
  };
  
  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };
  
  const value = {
    user,
    loading,
    error,
    loginUser,
    registerUser,
    verifyUserOtp,
    signInWithGoogle, // Add the new function to the context value
    logout,
    isAuthenticated: !!user
  };
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}