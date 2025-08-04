import React from 'react';
import { Link } from 'react-router-dom';
import useHashNavigation from '../../hooks/useHashNavigation';
import '../../styles/about.css';

const About = () => {
  // Enable hash navigation
  useHashNavigation();

  return (
    <div className="about-page">
      {/* Hero Section with Background Image */}
      <section id="about-hero" className="about-hero">
        <div 
          className="hero-background-image"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1573408301185-9146fe634ad0?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80')`
          }}
        >
          <div className="hero-overlay"></div>
          <div className="container">
            <div className="hero-content">
              <h1 className="hero-title">About Us</h1>
              <p className="hero-subtitle">Crafting Excellence in Every Piece</p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Brand Story */}
      <section id="story" className="about-section">
        <div className="container">
          <div className="about-grid">
            <div className="about-content">
              <div className="content-header">
                <h2>The FashionKeSang Journey</h2>
                <div className="accent-line"></div>
              </div>
              <p className="lead-text">
                Founded in 2010 by jewelry artisan Kesang Tashi in the heart of 
                Delhi, FashionKeSang began with a simple vision: to create jewelry that 
                combines traditional craftsmanship with contemporary design sensibilities.
              </p>
              <p>
                What started as a small workshop has grown into a beloved brand, 
                known for our dedication to quality and our unique aesthetic that 
                blends traditional Indian motifs with modern minimalism.
              </p>
              <p>
                Each FashionKeSang piece tells a story – of skilled artisans, 
                ancient techniques, and the rich cultural heritage that inspires our designs.
              </p>
              <div className="stats-grid">
                <div className="stat-item">
                  <div className="stat-number">13+</div>
                  <div className="stat-label">Years of Excellence</div>
                </div>
                <div className="stat-item">
                  <div className="stat-number">10K+</div>
                  <div className="stat-label">Happy Customers</div>
                </div>
                <div className="stat-item">
                  <div className="stat-number">500+</div>
                  <div className="stat-label">Unique Designs</div>
                </div>
              </div>
            </div>
            <div className="about-image">
              <div className="image-container">
                <img src="https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80" alt="Artisan workshop" />
                <div className="image-overlay"></div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Our Values */}
      <section id="values" className="values-section">
        <div className="container">
          <div className="section-header">
            <h2>Our Values</h2>
            <p>The principles that guide everything we do</p>
          </div>
          
          <div className="values-grid">
            <div className="value-card">
              <div className="value-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                </svg>
              </div>
              <h3>Craftsmanship</h3>
              <p>We honor traditional techniques passed down through generations, with each piece meticulously handcrafted by skilled artisans.</p>
            </div>
            
            <div className="value-card">
              <div className="value-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path>
                </svg>
              </div>
              <h3>Quality</h3>
              <p>We use only the finest materials, ensuring each piece not only looks beautiful but stands the test of time.</p>
            </div>
            
            <div className="value-card">
              <div className="value-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"></path>
                </svg>
              </div>
              <h3>Sustainability</h3>
              <p>We're committed to ethical sourcing and responsible practices, minimizing our environmental footprint at every stage.</p>
            </div>
            
            <div className="value-card">
              <div className="value-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="10"></circle>
                  <line x1="2" y1="12" x2="22" y2="12"></line>
                  <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
                </svg>
              </div>
              <h3>Heritage</h3>
              <p>Our designs celebrate the rich cultural heritage of Indian jewelry traditions while embracing contemporary aesthetics.</p>
            </div>
          </div>
        </div>
      </section>
      
      {/* Craftsmanship */}
      <section id="craftsmanship" className="craftsmanship-section">
        <div className="container">
          <div className="about-grid reverse">
            <div className="about-image">
              <div className="image-container">
                <img src="https://images.unsplash.com/photo-1611652022419-a9419f74343d?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2070&q=80" alt="Jewelry craftsmanship" />
                <div className="image-overlay"></div>
              </div>
            </div>
            <div className="about-content">
              <div className="content-header">
                <h2>Our Craftsmanship</h2>
                <div className="accent-line"></div>
              </div>
              <p className="lead-text">
                At FashionKeSang, craftsmanship is at the heart of everything we do. 
                Our artisans combine time-honored techniques with innovative approaches 
                to create pieces that are both timeless and contemporary.
              </p>
              <p>
                Each creation begins with a hand-drawn design, inspired by nature, 
                architecture, or traditional motifs. Our master craftsmen then bring 
                these designs to life through meticulous processes including hand-setting 
                of gemstones, intricate metalwork, and traditional polishing techniques.
              </p>
              <p>
                We take pride in the fact that no two pieces are exactly alike – each 
                carries the unique signature of the artisan who crafted it.
              </p>
              
              <div className="process-steps">
                <div className="process-step">
                  <div className="step-number">01</div>
                  <div className="step-content">
                    <h4>Design</h4>
                    <p>Hand-drawn sketches inspired by tradition and nature</p>
                  </div>
                </div>
                <div className="process-step">
                  <div className="step-number">02</div>
                  <div className="step-content">
                    <h4>Craft</h4>
                    <p>Skilled artisans bring designs to life with precision</p>
                  </div>
                </div>
                <div className="process-step">
                  <div className="step-number">03</div>
                  <div className="step-content">
                    <h4>Perfect</h4>
                    <p>Final finishing touches ensure lasting beauty</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* Testimonials */}
      <section id="testimonials" className="testimonials-section">
        <div className="container">
          <div className="section-header">
            <h2>What Our Customers Say</h2>
            <p>Real stories from our valued customers</p>
          </div>
          
          <div className="testimonials-grid">
            <div className="testimonial">
              <div className="testimonial-content">
                <div className="quote-mark">
                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"></path>
                    <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z"></path>
                  </svg>
                </div>
                <p className="testimonial-text">
                  The craftsmanship of my FashionKeSang necklace is exceptional. 
                  I receive compliments every time I wear it, and it's become my signature piece.
                </p>
                <div className="testimonial-author">
                  <div className="author-info">
                    <h4>Priya Malhotra</h4>
                    <p>Verified Customer</p>
                  </div>
                  <div className="rating">
                    <span>★★★★★</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="testimonial">
              <div className="testimonial-content">
                <div className="quote-mark">
                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"></path>
                    <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z"></path>
                  </svg>
                </div>
                <p className="testimonial-text">
                  I purchased earrings for my wife's anniversary gift, and the attention to 
                  detail is remarkable. Their customer service was equally impressive.
                </p>
                <div className="testimonial-author">
                  <div className="author-info">
                    <h4>Aditya Sharma</h4>
                    <p>Verified Customer</p>
                  </div>
                  <div className="rating">
                    <span>★★★★★</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="testimonial">
              <div className="testimonial-content">
                <div className="quote-mark">
                  <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 21c3 0 7-1 7-8V5c0-1.25-.756-2.017-2-2H4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2 1 0 1 0 1 1v1c0 1-1 2-2 2s-1 .008-1 1.031V20c0 1 0 1 1 1z"></path>
                    <path d="M15 21c3 0 7-1 7-8V5c0-1.25-.757-2.017-2-2h-4c-1.25 0-2 .75-2 1.972V11c0 1.25.75 2 2 2h.75c0 2.25.25 4-2.75 4v3c0 1 0 1 1 1z"></path>
                  </svg>
                </div>
                <p className="testimonial-text">
                  FashionKeSang pieces are investment-worthy. I've collected several over the years, 
                  and they've maintained their beauty and quality perfectly.
                </p>
                <div className="testimonial-author">
                  <div className="author-info">
                    <h4>Meera Patel</h4>
                    <p>Verified Customer</p>
                  </div>
                  <div className="rating">
                    <span>★★★★★</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section id="cta" className="cta-section">
        <div className="container">
          <div className="cta-content">
            <h2>Experience FashionKeSang</h2>
            <p>Discover our collection and find your perfect piece</p>
            <div className="cta-buttons">
              <Link to="/products" className="primary-button">
                Explore Our Collection
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                  <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
              </Link>
              <Link to="/contact" className="secondary-button">
                Contact Us
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default About;