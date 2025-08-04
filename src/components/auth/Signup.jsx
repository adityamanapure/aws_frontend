import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import authService from '../../services/authService';
import api from '../../services/api'; // Import the configured api service
import '../../styles/Auth/Signup.css'; 
import { Phone } from 'lucide-react';
import axios from 'axios';

export default function Signup() {
  // State to track which registration method is active
  const [registerMethod, setRegisterMethod] = useState('email'); // 'email', 'phone', 'google'

  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState({});
  const [error, setError] = useState(''); // Add this line - the missing state setter
  const [isLoading, setIsLoading] = useState(false);
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [phoneForOtp, setPhoneForOtp] = useState('');
  
  const { verifyUserOtp, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error when user types
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };
  
  const validateForm = () => {
    const newErrors = {};
    
    if (registerMethod === 'email') {
      if (!formData.firstName.trim()) {
        newErrors.firstName = 'First name is required';
      }
      
      if (!formData.lastName.trim()) {
        newErrors.lastName = 'Last name is required';
      }
      
      if (!formData.email.trim()) {
        newErrors.email = 'Email is required';
      } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
        newErrors.email = 'Email is invalid';
      }
      
      if (!formData.phone.trim()) {
        newErrors.phone = 'Phone number is required';
      } else if (!/^\d{10}$/.test(formData.phone.replace(/\D/g, ''))) {
        newErrors.phone = 'Phone number is invalid';
      }
      
      if (!formData.password) {
        newErrors.password = 'Password is required';
      } else if (formData.password.length < 8) {
        newErrors.password = 'Password must be at least 8 characters';
      }
      
      if (formData.password !== formData.confirmPassword) {
        newErrors.confirmPassword = 'Passwords do not match';
      }
    } else if (registerMethod === 'phone') {
      if (!phoneForOtp.trim()) {
        newErrors.phoneForOtp = 'Phone number is required';
      } else if (!/^\d{10}$/.test(phoneForOtp.replace(/\D/g, ''))) {
        newErrors.phoneForOtp = 'Phone number is invalid';
      }
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Run all validation checks
    if (!validateForm()) {
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    
    try {
      if (registerMethod === 'email') {
        // Validate passwords match
        if (formData.password !== formData.confirmPassword) {
          setError('Passwords do not match');
          setIsLoading(false);
          return;
        }
        
        const { confirmPassword, ...userData } = formData;
        
        // Create a new object with the correct field names for the backend
        const submissionData = {
          email: userData.email,
          first_name: userData.firstName,
          last_name: userData.lastName,
          phone: userData.phone,
          password: userData.password
        };
        
        // Use the configured api service instead of hardcoded localhost
        const response = await api.post('/api/users/register/', submissionData);
        
        // Handle successful registration
        if (response.data.tokens) {
          localStorage.setItem('token', response.data.tokens.access);
          navigate('/');
        }
      } else if (registerMethod === 'phone') {
        // Request OTP for phone-based registration
        await requestOtp();
      }
    } catch (error) {
      console.error('Registration error:', error.response?.data || error);
      
      // Better error handling
      let errorMessage = 'Registration failed. Please try again.';
      
      if (error.response?.data) {
        if (error.response.data.email) {
          errorMessage = `Email: ${error.response.data.email[0]}`;
        } else if (error.response.data.password) {
          errorMessage = `Password: ${error.response.data.password[0]}`;
        } else if (error.response.data.first_name) {
          errorMessage = `First name: ${error.response.data.first_name[0]}`;
        } else if (error.response.data.last_name) {
          errorMessage = `Last name: ${error.response.data.last_name[0]}`;
        } else if (error.response.data.detail) {
          errorMessage = error.response.data.detail;
        }
      }
      
      setErrors({
        form: errorMessage
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Function to request OTP
  const requestOtp = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      // Use the configured api service instead of hardcoded localhost
      const response = await api.post('/api/users/send-otp/', {
        phone: formData.phone
      });
      
      if (response.data.success) {
        setIsOtpSent(true);
        setErrors({});
      } else {
        setErrors({
          form: response.data.message || 'Failed to send OTP. Please try again.'
        });
      }
    } catch (error) {
      console.error('OTP request error:', error);
      setErrors({
        form: error.response?.data?.message || 'Failed to send OTP. Please try again.'
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleOtpVerify = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!otp.trim()) {
      setError('Please enter the OTP');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Use the configured api service instead of hardcoded localhost
      const response = await api.post('/api/users/verify-otp/', {
        phone: formData.phone,
        otp: otp,
        registration_data: {
          first_name: formData.firstName,
          last_name: formData.lastName,
          email: formData.email,
          password: formData.password
        }
      });
      
      if (response.data.tokens) {
        localStorage.setItem('token', response.data.tokens.access);
        
        // If this is a new user, we might need to collect additional info
        if (response.data.is_new_user) {
          navigate('/complete-profile', { 
            state: { phone: phoneForOtp } 
          });
        } else {
          navigate('/');
        }
      } else {
        setErrors({
          otp: 'OTP verification failed. Please try again.'
        });
      }
    } catch (err) {
      setErrors(prev => ({
        ...prev,
        otp: err.response?.data?.message || 'OTP verification failed. Please try again.'
      }));
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleGoogleSignup = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      // Use the signInWithGoogle from AuthContext
      const result = await signInWithGoogle();
      const user = result.user;
      
      const userData = {
        email: user.email,
        first_name: user.displayName?.split(' ')[0] || '',
        last_name: user.displayName?.split(' ').slice(1).join(' ') || '',
        google_uid: user.uid
      };
      
      // Use the configured api service instead of hardcoded localhost
      const response = await api.post('/api/users/register-with-google/', userData);
      
      if (response.data.tokens) {
        localStorage.setItem('token', response.data.tokens.access);
        navigate('/');
      }
    } catch (err) {
      console.error('Google sign-in error:', err);
      setErrors(prev => ({
        ...prev,
        form: err.message || 'Google sign-in failed. Please try again.'
      }));
    } finally {
      setIsLoading(false);
    }
  };
  
  // OTP Verification UI
  if (isOtpSent) {
    return (
      <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-md">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold gold-text">Verify Your Phone</h2>
            <p className="mt-2 text-sm text-gray-600">
              We've sent a verification code to {phoneForOtp}
            </p>
          </div>
          
          <form className="mt-8 space-y-6" onSubmit={handleOtpVerify}>
            {errors.otp && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md text-sm">
                {errors.otp}
              </div>
            )}
            
            <div>
              <label htmlFor="otp" className="block text-sm font-medium text-gray-700">
                Verification Code
              </label>
              <input
                id="otp"
                name="otp"
                type="text"
                required
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent"
                placeholder="Enter verification code"
              />
            </div>
            
            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 gold-button flex justify-center"
              >
                {isLoading ? 'Verifying...' : 'Verify Code'}
              </button>
            </div>
            
            <div className="text-center">
              <button
                type="button"
                className="text-sm gold-text hover:underline"
                onClick={requestOtp}
                disabled={isLoading}
              >
                Didn't receive the code? Resend OTP
              </button>
            </div>
            
            <div className="text-center mt-2">
              <button
                type="button"
                className="text-sm gold-text hover:underline"
                onClick={() => {
                  setIsOtpSent(false);
                  setOtp('');
                }}
              >
                Use a different number
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-md">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold gold-text">Create Your Account</h2>
          <p className="mt-2 text-sm text-gray-600">
            Join FashionKeSang for exclusive fashion collections
          </p>
        </div>
        
        {/* Tab navigation similar to Login.jsx */}
        <div className="flex border-b border-gray-200">
          <button
            className={`flex-1 py-2 text-center ${registerMethod === 'email' ? 'border-b-2 border-[#D4AF37] font-medium text-gray-900' : 'text-gray-500'}`}
            onClick={() => setRegisterMethod('email')}
          >
            Email
          </button>
          {/* <button
            className={`flex-1 py-2 text-center ${registerMethod === 'phone' ? 'border-b-2 border-[#D4AF37] font-medium text-gray-900' : 'text-gray-500'}`}
            onClick={() => setRegisterMethod('phone')}
          >
            Phone
          </button> */}
          <button
            className={`flex-1 py-2 text-center ${registerMethod === 'google' ? 'border-b-2 border-[#D4AF37] font-medium text-gray-900' : 'text-gray-500'}`}
            onClick={() => setRegisterMethod('google')}
          >
            Google
          </button>
        </div>
        
        {/* Error message */}
        {errors.form && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md text-sm mt-4">
            {errors.form}
          </div>
        )}
        
        {/* Email Registration Form */}
        {registerMethod === 'email' && (
          <form className="mt-6 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                    First Name
                  </label>
                  <input
                    id="firstName"
                    name="firstName"
                    type="text"
                    autoComplete="given-name"
                    required
                    value={formData.firstName}
                    onChange={handleChange}
                    className={`mt-1 w-full px-3 py-2 border ${
                      errors.firstName ? 'border-red-300' : 'border-gray-300'
                    } rounded-md focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent`}
                    placeholder="First name"
                  />
                  {errors.firstName && (
                    <p className="mt-1 text-sm text-red-600">{errors.firstName}</p>
                  )}
                </div>
                
                <div>
                  <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                    Last Name
                  </label>
                  <input
                    id="lastName"
                    name="lastName"
                    type="text"
                    autoComplete="family-name"
                    required
                    value={formData.lastName}
                    onChange={handleChange}
                    className={`mt-1 w-full px-3 py-2 border ${
                      errors.lastName ? 'border-red-300' : 'border-gray-300'
                    } rounded-md focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent`}
                    placeholder="Last name"
                  />
                  {errors.lastName && (
                    <p className="mt-1 text-sm text-red-600">{errors.lastName}</p>
                  )}
                </div>
              </div>
              
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  Email address
                </label>
                <input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  value={formData.email}
                  onChange={handleChange}
                  className={`mt-1 w-full px-3 py-2 border ${
                    errors.email ? 'border-red-300' : 'border-gray-300'
                  } rounded-md focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent`}
                  placeholder="Enter your email"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                  Phone Number
                </label>
                <div className="mt-1 flex rounded-md shadow-sm">
                  <span className="inline-flex items-center px-3 py-2 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500">
                    <Phone size={16} className="mr-1" />+91
                  </span>
                  <input
                    id="phone"
                    name="phone"
                    type="tel"
                    autoComplete="tel"
                    required
                    value={formData.phone}
                    onChange={handleChange}
                    className={`flex-1 w-full px-3 py-2 border ${
                      errors.phone ? 'border-red-300' : 'border-gray-300'
                    } rounded-r-md focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent`}
                    placeholder="Enter your phone number"
                  />
                </div>
                {errors.phone && (
                  <p className="mt-1 text-sm text-red-600">{errors.phone}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className={`mt-1 w-full px-3 py-2 border ${
                    errors.password ? 'border-red-300' : 'border-gray-300'
                  } rounded-md focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent`}
                  placeholder="Create a password"
                />
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                )}
              </div>
              
              <div>
                <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type="password"
                  autoComplete="new-password"
                  required
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`mt-1 w-full px-3 py-2 border ${
                    errors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                  } rounded-md focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent`}
                  placeholder="Confirm your password"
                />
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
                )}
              </div>
            </div>
            
            <div className="flex items-center">
              <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  style={{ accentColor: '#D4AF37' }}
                  className="h-5 w-5 border-gray-300 rounded cursor-pointer"
              />
              <label htmlFor="terms" className="ml-2 block text-sm text-gray-700 cursor-pointer">
                I agree to the{' '}
                <a href="#" className="gold-text hover:underline">
                  Terms and Conditions
                </a>
                {' '}and{' '}
                <a href="#" className="gold-text hover:underline">
                  Privacy Policy
                </a>
              </label>
            </div>
            
            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 gold-button flex justify-center"
              >
                {isLoading ? 'Creating Account...' : 'Create Account'}
              </button>
            </div>
          </form>
        )}
        
        {/* Phone Registration Form */}
        {registerMethod === 'phone' && (
          <form className="mt-6 space-y-6" onSubmit={handleSubmit}>
            <div>
              <label htmlFor="phoneForOtp" className="block text-sm font-medium text-gray-700">
                Phone Number
              </label>
              <div className="mt-1 flex rounded-md shadow-sm">
                <span className="inline-flex items-center px-3 py-2 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500">
                  <Phone size={16} className="mr-1" />+91
                </span>
                <input
                  id="phoneForOtp"
                  name="phoneForOtp"
                  type="tel"
                  autoComplete="tel"
                  required
                  value={phoneForOtp}
                  onChange={(e) => {
                    setPhoneForOtp(e.target.value);
                    if (errors.phoneForOtp) {
                      setErrors(prev => ({ ...prev, phoneForOtp: '' }));
                    }
                  }}
                  className={`flex-1 w-full px-3 py-2 border ${
                    errors.phoneForOtp ? 'border-red-300' : 'border-gray-300'
                  } rounded-r-md focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent`}
                  placeholder="Enter your phone number"
                />
              </div>
              {errors.phoneForOtp && (
                <p className="mt-1 text-sm text-red-600">{errors.phoneForOtp}</p>
              )}
              <p className="mt-2 text-xs text-gray-500">
                We will send a verification code to this number
              </p>
            </div>
            
            <div className="flex items-center">
              <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  style={{ accentColor: '#D4AF37' }}
                  className="h-5 w-5 border-gray-300 rounded cursor-pointer"
              />
              <label htmlFor="terms-phone" className="ml-2 block text-sm text-gray-700 cursor-pointer">
                I agree to the{' '}
                <a href="#" className="gold-text hover:underline">
                  Terms and Conditions
                </a>
                {' '}and{' '}
                <a href="#" className="gold-text hover:underline">
                  Privacy Policy
                </a>
              </label>
            </div>
            
            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 gold-button flex justify-center"
              >
                {isLoading ? 'Sending OTP...' : 'Get OTP'}
              </button>
            </div>
          </form>
        )}
        
        {/* Google Registration */}
        {registerMethod === 'google' && (
          <div className="mt-6 space-y-6">
            <div className="bg-white p-4 text-center">
              <p className="text-sm text-gray-600 mb-4">
                Sign up with your Google account for quick and secure access.
              </p>
              
              <button
                type="button"
                onClick={handleGoogleSignup}
                disabled={isLoading}
                className="w-full py-3 px-4 border border-gray-300 rounded-md shadow-sm bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center justify-center"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  className="mr-2"
                >
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                {isLoading ? 'Creating Account...' : 'Continue with Google'}
              </button>
            </div>
          </div>
        )}
        
        <div className="text-center mt-4">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <Link to="/login" className="font-medium gold-text hover:underline">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}