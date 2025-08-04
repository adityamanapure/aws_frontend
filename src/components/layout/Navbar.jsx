import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import CartIcon from '../cart/CartIcon';
import '../../styles/navbar.css'; 
import CartDrawer from '../cart/CartDrawer';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';


const Navbar = ({ isAdmin = false }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isAccountDropdownOpen, setIsAccountDropdownOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { cartItems } = useCart();
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const accountDropdownRef = useRef(null);
  
  const toggleCart = (e) => {
    if (e) e.stopPropagation();
    setIsCartOpen(prevState => !prevState);
  };

  const toggleAccountDropdown = (e) => {
    if (e) e.stopPropagation();
    setIsAccountDropdownOpen(prevState => !prevState);
  };
  
  const handleLogout = () => {
    logout();
    navigate('/');
    setIsMenuOpen(false);
    setIsAccountDropdownOpen(false);
    window.location.reload();
  };

  const handleNavigateToAccount = () => {
    navigate('/account');
    setIsAccountDropdownOpen(false);
  };

  const handleNavigateToOrders = () => {
    navigate('/orders');
    setIsAccountDropdownOpen(false);
  };

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);
  
  useEffect(() => {
    const handleClickOutside = (event) => {
      const cart = document.querySelector('.cart-drawer');
      if (cart && !cart.contains(event.target) && isCartOpen) {
        setIsCartOpen(false);
      }

      // Close account dropdown when clicking outside
      if (accountDropdownRef.current && !accountDropdownRef.current.contains(event.target)) {
        setIsAccountDropdownOpen(false);
      }
    };

    if (isCartOpen || isAccountDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isCartOpen, isAccountDropdownOpen]);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMenuOpen(false);
    setIsAccountDropdownOpen(false);
  }, [location]);
  
  return (
    <>
      <nav className={`navbar ${scrolled ? 'scrolled' : ''}`}>
        <div className="navbar-container">
          <div className="navbar-content">
            {/* Logo Section - Only text, no icon */}
            <div className="navbar-logo-container">
              <Link to="/" className="navbar-logo">
                <span className="logo-text">FashionKeSang</span>
              </Link>
            </div>
            
            {/* Desktop Navigation */}
            <div className="navbar-center">
              <div className="desktop-menu">
                <Link to="/" className={`nav-link ${location.pathname === '/' ? 'active' : ''}`}>
                  Home
                </Link>
                <Link to="/products" className={`nav-link ${location.pathname === '/products' ? 'active' : ''}`}>
                  Collections
                </Link>
                <Link to="/about" className={`nav-link ${location.pathname === '/about' ? 'active' : ''}`}>
                  About
                </Link>
                <Link to="/contact" className={`nav-link ${location.pathname === '/contact' ? 'active' : ''}`}>
                  Contact
                </Link>
                <Link to="/reels" className={`nav-link ${location.pathname === '/reels' ? 'active' : ''}`}>
                  Reels
                </Link>
              </div>
            </div>
            
            {/* Right Section */}
            <div className="navbar-right">
              <div className="nav-icons">
                {/* Cart Icon - Moved to left of account */}
                <div 
                  onClick={toggleCart} 
                  className="cart-icon-wrapper"
                  role="button"
                  tabIndex={0}
                  title="Shopping Cart"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                  {cartItems?.length > 0 && (
                    <span className="cart-badge">{cartItems.length}</span>
                  )}
                </div>

                {/* Authentication & Account */}
                {isAuthenticated ? (
                  <div className="user-menu" ref={accountDropdownRef}>
                    <button 
                      onClick={toggleAccountDropdown}
                      className={`nav-icon account-btn ${isAccountDropdownOpen ? 'active' : ''}`}
                      title="My Account"
                    >
                      <div className="account-avatar">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                          <circle cx="12" cy="7" r="4"></circle>
                        </svg>
                      </div>
                      <svg 
                        width="12" 
                        height="12" 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth="2"
                        className={`dropdown-arrow ${isAccountDropdownOpen ? 'rotated' : ''}`}
                      >
                        <polyline points="6 9 12 15 18 9"></polyline>
                      </svg>
                    </button>

                    {/* Account Dropdown */}
                    <div className={`account-dropdown ${isAccountDropdownOpen ? 'show' : ''}`}>
                      <div className="dropdown-header">
                        <div className="user-info">
                          <div className="user-avatar">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                              <circle cx="12" cy="7" r="4"></circle>
                            </svg>
                          </div>
                          <div className="user-details">
                            <span className="user-name">{user?.full_name || user?.first_name || 'User'}</span>
                            <span className="user-email">{user?.email}</span>
                          </div>
                        </div>
                      </div>
                      
                      <div className="dropdown-divider"></div>
                      
                      <div className="dropdown-menu">
                        <button onClick={handleNavigateToAccount} className="dropdown-item">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                            <circle cx="12" cy="7" r="4"></circle>
                          </svg>
                          <span>Account & Security</span>
                        </button>
                        
                        <button onClick={handleNavigateToOrders} className="dropdown-item">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                            <circle cx="12" cy="7" r="4"></circle>
                            <path d="M22 12h-6l-2-3h-4"></path>
                            <path d="M16 6l2 6-8 4-4-7 9-3z"></path>
                          </svg>
                          <span>My Orders</span>
                        </button>
                      </div>
                      
                      <div className="dropdown-divider"></div>
                      
                      <button onClick={handleLogout} className="dropdown-item logout-item">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
                          <polyline points="16 17 21 12 16 7"></polyline>
                          <line x1="21" y1="12" x2="9" y2="12"></line>
                        </svg>
                        <span>Logout</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="auth-buttons">
                    <Link to="/login" className="auth-btn login-btn">
                      Login
                    </Link>
                    <Link to="/signup" className="auth-btn signup-btn">
                      Sign Up
                    </Link>
                  </div>
                )}
              </div>
              
              {/* Mobile Menu Button */}
              <div className="mobile-controls">
                <button 
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="mobile-menu-btn"
                  aria-label="Menu"
                >
                  <div className={`hamburger ${isMenuOpen ? 'active' : ''}`}>
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Mobile Menu */}
        <div className={`mobile-menu ${isMenuOpen ? 'open' : ''}`}>
          <div className="mobile-menu-content">
            <div className="mobile-menu-links">
              <Link to="/" className="mobile-nav-link">
                <span className="mobile-link-icon">🏠</span>
                Home
              </Link>
              <Link to="/products" className="mobile-nav-link">
                <span className="mobile-link-icon">💎</span>
                Collections
              </Link>
              <Link to="/about" className="mobile-nav-link">
                <span className="mobile-link-icon">ℹ️</span>
                About
              </Link>
              <Link to="/contact" className="mobile-nav-link">
                <span className="mobile-link-icon">📞</span>
                Contact
              </Link>
              <Link to="/reels" className="mobile-nav-link">
                <span className="mobile-link-icon">🎬</span>
                Reels
              </Link>
              
              <div className="mobile-menu-divider"></div>
              
              {isAuthenticated ? (
                <>
                  <Link to="/account" className="mobile-nav-link">
                    <span className="mobile-link-icon">👤</span>
                    Account & Security
                  </Link>
                  <Link to="/orders" className="mobile-nav-link">
                    <span className="mobile-link-icon">📦</span>
                    My Orders
                  </Link>
                  <button className="mobile-nav-link logout-mobile" onClick={handleLogout}>
                    <span className="mobile-link-icon">🚪</span>
                    Logout
                  </button>
                </>
              ) : (
                <>
                  <Link to="/login" className="mobile-nav-link">
                    <span className="mobile-link-icon">🔐</span>
                    Login
                  </Link>
                  <Link to="/signup" className="mobile-nav-link">
                    <span className="mobile-link-icon">📝</span>
                    Sign Up
                  </Link>
                </>
              )}
              
              <button 
                className="mobile-nav-link cart-mobile" 
                onClick={(e) => {
                  e.preventDefault();
                  toggleCart(e);
                  setIsMenuOpen(false);
                }}
              >
                <span className="mobile-link-icon">🛒</span>
                Cart
                {cartItems?.length > 0 && (
                  <span className="mobile-cart-count">{cartItems.length}</span>
                )}
              </button>
            </div>
          </div>
        </div>
      </nav>
      
      <CartDrawer 
        isOpen={isCartOpen} 
        onClose={() => setIsCartOpen(false)} 
      />
    </>
  );
};

export default Navbar;