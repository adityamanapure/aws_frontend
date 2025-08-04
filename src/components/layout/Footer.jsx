import React from 'react';
import { Link } from 'react-router-dom';
import '../../styles/footer.css';

const Footer = () => {
  return (
    <footer className="modern-footer">
      <div className="footer-container">
        {/* Main Footer Content */}
        <div className="footer-main">
          <div className="footer-grid">
            {/* Brand Section */}
            <div className="footer-brand">
              <h3 className="brand-name">FashionKeSang</h3>
              <p className="brand-description">
                Elegant gold jewelry for the modern woman. Handcrafted with precision and passion to create timeless pieces that celebrate your unique style.
              </p>
              <div className="social-links">
                <a href="https://facebook.com/fashionkesang" target="_blank" rel="noopener noreferrer" className="social-link facebook">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
                  </svg>
                </a>
                <a href="https://instagram.com/fashionkesang" target="_blank" rel="noopener noreferrer" className="social-link instagram">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 6.62 5.367 11.987 11.988 11.987 6.62 0 11.987-5.367 11.987-11.987C24.014 5.367 18.637.001 12.017.001zM8.449 16.988c-1.297 0-2.448-.49-3.328-1.297L6.24 14.553c.78.597 1.747.949 2.787.949 2.447 0 4.438-1.991 4.438-4.438 0-2.447-1.991-4.438-4.438-4.438-2.447 0-4.438 1.991-4.438 4.438 0 1.04.352 2.007.949 2.787l-1.138 1.119C3.613 13.172 3.123 12.021 3.123 10.724c0-2.952 2.374-5.326 5.326-5.326s5.326 2.374 5.326 5.326c0 2.952-2.374 5.326-5.326 5.326zm7.718-2.098c-1.297.78-2.817 1.237-4.438 1.237v-1.687c1.297 0 2.447-.352 3.4-.949l1.038 1.399z"/>
                  </svg>
                </a>
                <a href="https://wa.me/917770089767" target="_blank" rel="noopener noreferrer" className="social-link whatsapp">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893A11.821 11.821 0 0020.89 3.488"/>
                  </svg>
                </a>
                <a href="https://youtube.com/@fashionkesang" target="_blank" rel="noopener noreferrer" className="social-link youtube">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                </a>
              </div>
            </div>
            
            {/* Quick Links */}
            <div className="footer-links">
              <h4>Quick Links</h4>
              <ul>
                <li><Link to="/products">All Products</Link></li>
                <li><Link to="/products?category=rings">Rings</Link></li>
                <li><Link to="/products?category=necklaces">Necklaces</Link></li>
                <li><Link to="/products?category=bangles">Bangles</Link></li>
                <li><Link to="/products?category=earrings">Earrings</Link></li>
                <li><Link to="/products?sort=newest">New Arrivals</Link></li>
              </ul>
            </div>
            
            {/* Customer Service */}
            <div className="footer-links">
              <h4>Customer Service</h4>
              <ul>
                <li><Link to="/contact">Contact Us</Link></li>
                <li><Link to="/contact#faq">FAQ</Link></li>
                <li><Link to="/contact#contact-info">Get in Touch</Link></li>
                <li><Link to="/shipping">Shipping Info</Link></li>
                <li><Link to="/returns">Returns & Exchanges</Link></li>
                <li><Link to="/sizing">Size Guide</Link></li>
              </ul>
            </div>
            
            {/* Company Info */}
            <div className="footer-links">
              <h4>About Us</h4>
              <ul>
                <li><Link to="/about">Our Story</Link></li>
                <li><Link to="/about#story">Our Journey</Link></li>
                <li><Link to="/about#values">Our Values</Link></li>
                <li><Link to="/about#craftsmanship">Craftsmanship</Link></li>
                <li><Link to="/about#testimonials">Customer Reviews</Link></li>
                <li><Link to="/contact#contact-form">Contact Form</Link></li>
              </ul>
            </div>
          </div>
        </div>
        
        {/* Footer Bottom */}
        <div className="footer-bottom">
          <div className="footer-bottom-content">
            <p className="copyright">
              &copy; {new Date().getFullYear()} FashionKeSang. All rights reserved.
            </p>
            <div className="legal-links">
              <Link to="/privacy">Privacy Policy</Link>
              <Link to="/terms">Terms of Service</Link>
              <Link to="/returns">Refund Policy</Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;