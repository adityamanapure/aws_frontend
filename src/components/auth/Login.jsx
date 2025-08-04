import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import api from '../../services/api'; // Import the configured api service
import { Phone } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

import '../../styles/Auth/Login.css';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [loginMethod, setLoginMethod] = useState('password'); // 'password', 'otp', 'google'
  const [phoneForOtp, setPhoneForOtp] = useState('');
  
  const { verifyUserOtp, signInWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  
  // Get the redirect path from location state or default to '/'
  const from = location.state?.from?.pathname || '/';
  
  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
        const response = await api.post('/api/users/login/', {
            email: email,
            password: password
        });
        
        // Store the token
        localStorage.setItem('token', response.data.access);
        
        // Navigate to the redirect path
        navigate(from, { replace: true });
        window.location.reload();
    } catch (err) {
        console.error('Login error:', err);
        
        let errorMessage = 'Login failed. Please check your credentials.';
        if (err.response?.data?.detail) {
            errorMessage = err.response.data.detail;
        }
        
        setError(errorMessage);
    } finally {
        setIsLoading(false);
    }
  };
  
  const handleOtpRequest = async (e) => {
    e.preventDefault();
    setError('');
    
    // Validate phone number
    if (!phoneForOtp.trim()) {
      setError('Please enter your phone number');
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Use the configured api service instead of hardcoded localhost
      const response = await api.post('/api/users/send-otp/', {
        phone: phoneForOtp
      });
      
      if (response.data.success) {
        setIsOtpSent(true);
        setError('');
      } else {
        setError(response.data.message || 'Failed to send OTP. Please try again.');
      }
    } catch (err) {
      console.error('OTP request error:', err);
      setError(err.response?.data?.message || 'Failed to send OTP. Please try again.');
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
        phone: phoneForOtp,
        otp: otp
      });
      
      if (response.data.success && response.data.tokens) {
        // Store the token
        localStorage.setItem('token', response.data.tokens.access);
        
        // If this is a new user, we might need to collect additional info
        if (response.data.is_new_user) {
          navigate('/complete-profile', { 
            state: { phone: phoneForOtp } 
          });
        } else {
          // Navigate to the redirect path
          navigate(from, { replace: true });
          window.location.reload();
        }
      } else {
        setError('OTP verification failed. Please try again.');
      }
    } catch (err) {
      console.error('OTP verification error:', err);
      setError(err.response?.data?.message || 'OTP verification failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      const googleResponse = await signInWithGoogle();
      
      if (googleResponse?.user) {
        // Extract user information from Google response
        const { displayName, email, phoneNumber, uid } = googleResponse.user;
        
        // If we don't have a phone number, we might need to collect it
        if (!phoneNumber) {
          // Save Google account info and redirect to a page to collect phone number
          localStorage.setItem('googleLoginData', JSON.stringify({
            name: displayName,
            email: email,
            googleUid: uid
          }));
          navigate('/complete-google-login');
          return;
        }
        
        // If we have all the data, register/login with Google data
        try {
          const userData = {
            full_name: displayName,
            email: email,
            phone: phoneNumber,
            google_uid: uid
          };
          
          // Register with Google data
          const response = await api.post('/api/users/register-with-google/', userData);
          
          if (response.data.tokens) {
            localStorage.setItem('token', response.data.tokens.access);
            navigate(from, { replace: true });
            window.location.reload();
          }
        } catch (apiError) {
          console.error('API error:', apiError);
          setError(apiError.response?.data?.message || 'Failed to authenticate with Google. Please try again.');
        }
      }
    } catch (err) {
      console.error('Google sign-in error:', err);
      setError(err.message || 'Google sign-in failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-lg shadow-md">
        <div className="text-center">
          <h2 className="text-3xl font-extrabold gold-text">Welcome Back</h2>
          <p className="mt-2 text-sm text-gray-600">
            Sign in to your GoldElegance account
          </p>
        </div>
        
        <div className="flex border-b border-gray-200">
          <button
            className={`flex-1 py-2 text-center ${loginMethod === 'password' ? 'border-b-2 border-[#D4AF37] font-medium text-gray-900' : 'text-gray-500'}`}
            onClick={() => setLoginMethod('password')}
          >
            Password
          </button>
          {/* <button
            className={`flex-1 py-2 text-center ${loginMethod === 'otp' ? 'border-b-2 border-[#D4AF37] font-medium text-gray-900' : 'text-gray-500'}`}
            onClick={() => setLoginMethod('otp')}
          >
            OTP
          </button> */}
          <button
            className={`flex-1 py-2 text-center ${loginMethod === 'google' ? 'border-b-2 border-[#D4AF37] font-medium text-gray-900' : 'text-gray-500'}`}
            onClick={() => setLoginMethod('google')}
          >
            Google
          </button>
        </div>
        
        {loginMethod === 'password' && (
          <form className="mt-8 space-y-6" onSubmit={handlePasswordLogin}>
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}
            
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
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent"
                placeholder="Enter your email"
              />
            </div>
            
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent"
                placeholder="Enter your password"
              />
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  name="remember-me"
                  type="checkbox"
                  style={{ accentColor: '#D4AF37' }}
                  className="h-5 w-5 border-gray-300 rounded cursor-pointer"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700 cursor-pointer">
                  Remember me
                </label>
              </div>
              
              <div className="text-sm">
                <a href="#" className="font-medium gold-text hover:underline">
                  Forgot your password?
                </a>
              </div>
            </div>
            
            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 gold-button flex justify-center"
              >
                {isLoading ? 'Signing in...' : 'Sign in'}
              </button>
            </div>
          </form>
        )}
        
        {loginMethod === 'otp' && !isOtpSent && (
          <form className="mt-8 space-y-6" onSubmit={handleOtpRequest}>
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}
            
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
                  onChange={(e) => setPhoneForOtp(e.target.value)}
                  className="mt-0 w-full px-3 py-2 border border-gray-300 rounded-r-md focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:border-transparent"
                  placeholder="Enter your phone number"
                />
              </div>
            </div>
            
            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 gold-button flex justify-center"
              >
                {isLoading ? 'Sending OTP...' : 'Send OTP'}
              </button>
            </div>
          </form>
        )}
        
        {loginMethod === 'otp' && isOtpSent && (
          <form className="mt-8 space-y-6" onSubmit={handleOtpVerify}>
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}
            
            <div>
              <p className="text-sm text-gray-600 mb-4">
                We've sent a verification code to <strong>{phoneForOtp}</strong>
              </p>
              
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
                {isLoading ? 'Verifying...' : 'Verify OTP'}
              </button>
            </div>
            
            <div className="text-center">
              <button
                type="button"
                onClick={handleOtpRequest}
                className="text-sm gold-text hover:underline"
                disabled={isLoading}
              >
                Didn't receive OTP? Resend
              </button>
            </div>
            
            <div className="text-center mt-2">
              <button
                type="button"
                onClick={() => {
                  setIsOtpSent(false);
                  setOtp('');
                }}
                className="text-sm gold-text hover:underline"
              >
                Use a different number
              </button>
            </div>
          </form>
        )}
        
        {loginMethod === 'google' && (
          <div className="mt-8 space-y-6">
            {error && (
              <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md text-sm">
                {error}
              </div>
            )}
            
            <div className="bg-white p-4 text-center">
              <p className="text-sm text-gray-600 mb-4">
                Sign in with your Google account for quick and secure access.
              </p>
              
              <button
                type="button"
                onClick={handleGoogleLogin}
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
                {isLoading ? 'Signing in...' : 'Sign in with Google'}
              </button>
            </div>
          </div>
        )}
        
        <div className="text-center mt-4">
          <p className="text-sm text-gray-600">
            Don't have an account?{' '}
            <Link to="/signup" className="font-medium gold-text hover:underline">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}