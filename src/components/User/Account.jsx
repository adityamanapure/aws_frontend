import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import '../../styles/account.css';
import { User, Shield, Mail, Phone, MapPin, Lock } from 'lucide-react';

const Account = () => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [message, setMessage] = useState({ text: '', type: '' });
  const [activeSection, setActiveSection] = useState('profile');

  // Fetch user data on component mount
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        setLoading(true);
        const userResponse = await api.get('/api/users/profile/');
        setUser(userResponse.data);
        setFormData({
          name: userResponse.data.full_name || '',
          email: userResponse.data.email || '',
          phone: userResponse.data.phone || '',
          address: userResponse.data.address || '',
          currentPassword: '',
          newPassword: '',
          confirmPassword: ''
        });
      } catch (error) {
        console.error('Error fetching user data:', error);
        setMessage({ text: 'Failed to load user data', type: 'error' });
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const updateProfile = async (e) => {
    e.preventDefault();
    try {
      setLoading(true);
      const { currentPassword, newPassword, confirmPassword, ...profileData } = formData;
      
      const response = await api.post('/api/users/profile/', {
        full_name: profileData.name,
        email: profileData.email,
        phone: profileData.phone,
        address: profileData.address
      });
      
      setUser(response.data);
      setMessage({ text: 'Profile updated successfully!', type: 'success' });
    } catch (error) {
      console.error('Error updating profile:', error);
      setMessage({ text: 'Failed to update profile', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const updatePassword = async (e) => {
    e.preventDefault();
    
    if (formData.newPassword !== formData.confirmPassword) {
      setMessage({ text: 'New passwords do not match', type: 'error' });
      return;
    }

    try {
      setLoading(true);
      await api.put('/api/users/password', {
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword
      });
      setFormData({
        ...formData,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setMessage({ text: 'Password updated successfully!', type: 'success' });
    } catch (error) {
      console.error('Error updating password:', error);
      setMessage({ text: error.response?.data?.message || 'Failed to update password', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  if (loading && !user) {
    return (
      <div className="account-container">
        <div className="loading-container">
          <div className="loading-text">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="account-container">
      <h1 className="account-title">My Account</h1>
      
      {message.text && (
        <div className={`message-alert ${message.type === 'success' ? 'message-success' : 'message-error'}`}>
          {message.text}
        </div>
      )}

      <div className="account-panel">
        {/* Section Navigation */}
        <div className="account-tabs">
          <button 
            className={`account-tab ${activeSection === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveSection('profile')}
          >
            <User className="tab-icon" size={18} />
            Profile Information
          </button>
          <button 
            className={`account-tab ${activeSection === 'security' ? 'active' : ''}`}
            onClick={() => setActiveSection('security')}
          >
            <Shield className="tab-icon" size={18} />
            Security Settings
          </button>
        </div>

        {/* Profile Section */}
        {activeSection === 'profile' && (
          <div className="tab-content">
            <div className="section-header">
              <h2 className="section-title">
                <span className="title-icon">
                  <User size={20} />
                </span>
                Personal Information
              </h2>
              <p className="section-subtitle">
                Update your personal details and contact information to keep your account current.
              </p>
            </div>
            
            <form onSubmit={updateProfile}>
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">
                    <User className="label-icon" size={16} />
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="form-input"
                    required
                    placeholder="Enter your full name"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">
                    <Mail className="label-icon" size={16} />
                    Email Address
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="form-input"
                    required
                    placeholder="Enter your email"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">
                    <Phone className="label-icon" size={16} />
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="form-input"
                    placeholder="Enter your phone number"
                  />
                </div>
                <div className="form-group form-full-width">
                  <label className="form-label">
                    <MapPin className="label-icon" size={16} />
                    Address
                  </label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    className="form-textarea"
                    rows="4"
                    placeholder="Enter your full address"
                  ></textarea>
                </div>
              </div>
              <div className="form-actions">
                <button type="submit" className="submit-button" disabled={loading}>
                  <User className="button-icon" size={16} />
                  {loading ? 'Saving Changes...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Security Section */}
        {activeSection === 'security' && (
          <div className="tab-content">
            <div className="section-header">
              <h2 className="section-title">
                <span className="title-icon">
                  <Shield size={20} />
                </span>
                Security Settings
              </h2>
              <p className="section-subtitle">
                Keep your account secure by updating your password regularly. Use a strong password with at least 8 characters.
              </p>
            </div>
            
            <form onSubmit={updatePassword}>
              <div className="form-grid">
                <div className="form-group form-full-width">
                  <label className="form-label">
                    <Lock className="label-icon" size={16} />
                    Current Password
                  </label>
                  <input
                    type="password"
                    name="currentPassword"
                    value={formData.currentPassword}
                    onChange={handleInputChange}
                    className="form-input"
                    required
                    placeholder="Enter your current password"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">
                    <Lock className="label-icon" size={16} />
                    New Password
                  </label>
                  <input
                    type="password"
                    name="newPassword"
                    value={formData.newPassword}
                    onChange={handleInputChange}
                    className="form-input"
                    required
                    minLength="8"
                    placeholder="Enter new password (min. 8 characters)"
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">
                    <Lock className="label-icon" size={16} />
                    Confirm New Password
                  </label>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className="form-input"
                    required
                    minLength="8"
                    placeholder="Confirm your new password"
                  />
                </div>
              </div>
              <div className="form-actions">
                <button type="submit" className="submit-button" disabled={loading}>
                  <Shield className="button-icon" size={16} />
                  {loading ? 'Updating Password...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default Account;