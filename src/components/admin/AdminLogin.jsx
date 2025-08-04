import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import '../../styles/admin/AdminLogin.css';
import { Eye, EyeOff, Lock, Mail, AlertCircle } from 'lucide-react';

const AdminLogin = () => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    // Simple validation
    if (!formData.email || !formData.password) {
      setError('Please enter both email and password');
      return;
    }

    try {
      setIsLoading(true);
      
      // Use the correct endpoint for admin login
      const response = await api.post('/api/admin/login/', {
        email: formData.email,
        password: formData.password
      });
      
      // Check if the response contains tokens in the correct format
      if (response.data.access) {
        // Store access token with the correct key
        localStorage.setItem('adminToken', response.data.access);
        
        // Store refresh token if available
        if (response.data.refresh) {
          localStorage.setItem('adminRefreshToken', response.data.refresh);
        }
        
        // Store admin user data if provided
        if (response.data.email || response.data.full_name) {
          localStorage.setItem('adminUser', JSON.stringify({
            email: response.data.email,
            full_name: response.data.full_name,
            is_admin: response.data.is_admin || true
          }));
        }
        
        // Redirect to admin dashboard
        navigate('/admin/dashboard');
      } else {
        // Handle unexpected response format
        setError('Invalid response from server. Please try again.');
      }
    } catch (err) {
      console.error('Login error:', err);
      
      if (err.response && err.response.status === 401) {
        setError('Invalid email or password');
      } else if (err.response && err.response.status === 403) {
        setError('You do not have admin privileges');
      } else if (err.response && err.response.data && err.response.data.detail) {
        setError(err.response.data.detail);
      } else if (err.response && err.response.data && err.response.data.message) {
        setError(err.response.data.message);
      } else {
        setError('Failed to login. Please try again later.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="admin-login-container">
      <div className="admin-login-card">
        <div className="admin-login-header">
          <h1 className="admin-login-title">Admin Portal</h1>
          <p className="admin-login-subtitle">Enter your admin credentials to access the dashboard</p>
        </div>

        {error && (
          <div className="admin-login-error">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="admin-login-form">
          <div className="admin-form-group">
            <label htmlFor="email" className="admin-form-label">Admin Email Address</label>
            <div className="admin-input-container">
              <Mail className="admin-input-icon" size={18} />
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter admin email address"
                className="admin-form-input"
                required
              />
            </div>
            <small className="admin-form-hint">
              You can modify the admin email if needed
            </small>
          </div>

          <div className="admin-form-group">
            <label htmlFor="password" className="admin-form-label">Admin Password</label>
            <div className="admin-input-container">
              <Lock className="admin-input-icon" size={18} />
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter admin password"
                className="admin-form-input"
                required
              />
              <button 
                type="button"
                onClick={togglePasswordVisibility}
                className="admin-password-toggle"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <small className="admin-form-hint">
              Default credentials are set in the backend environment configuration
            </small>
          </div>

          <div className="admin-form-actions">
            <div className="admin-remember-me">
              <input 
                type="checkbox" 
                id="remember" 
                className="admin-checkbox"
              />
              <label htmlFor="remember" className="admin-checkbox-label">Remember me</label>
            </div>
          </div>

          <button 
            type="submit" 
            className="admin-login-button"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <span className="admin-button-spinner"></span>
                Signing in...
              </>
            ) : 'Sign In'}
          </button>
        </form>

        <div className="admin-login-footer">
          
          <p>Protected admin area. Unauthorized access is prohibited.</p>
          <p>© {new Date().getFullYear()} FashionKesang. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;