// File: src/components/product/ProductCard.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { addToCart, createCheckout } from '../../services/cartService';
import '../../styles/product.css';
import { useCart } from '../../context/CartContext';
import S3Image from '../common/S3Image';
import AutoS3Image from '../common/AutoS3Image';
import CloudMedia from '../common/CloudMedia';



// Login Modal Component
const LoginModal = ({ onLogin, onCancel, message }) => {
  return (
    <div className="modal-overlay">
      <div className="login-modal">
        <h3 className="login-modal-title">Please Login!</h3>
        <p className="login-modal-message">{message}</p>
        <div className="login-modal-buttons">
          <button className="Login-button" onClick={onLogin}>
            Login Now
          </button>
          <button className="cancel-button" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

// Success Toast Component
const SuccessToast = ({ message, onClose }) => {
  return (
    <div className="success-toast">
      <span className="success-icon">✓</span>
      <span className="success-message">{message}</span>
    </div>
  );
};

// Simple emoji icons instead of react-icons
const ProductCard = ({ product }) => {
  const [isAdding, setIsAdding] = useState(false);
  const [isBuying, setIsBuying] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginModalMessage, setLoginModalMessage] = useState("");
  const [loginAction, setLoginAction] = useState(null);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const navigate = useNavigate();
  const { updateCartCount } = useCart(); 
  
  // Check if product is valid
  if (!product) {
    return null;
  }

  // Get the primary image or first image from the product
  const getProductImage = () => {
    if (!product.images || product.images.length === 0) {
      return null; // S3Image component will use placeholder
    }
    
    // If images is an array, find primary image or use first
    if (Array.isArray(product.images)) {
      // Try to find an image marked as primary first
      const primaryImage = product.images.find(img => 
        (typeof img === 'object' && img.is_primary === true)
      );
      
      if (primaryImage) {
        return primaryImage;
      }
      
      // Otherwise use the first image
      return product.images[0];
    }
    
    // If images is a string, use it directly
    return product.images;
  };

  const productImage = getProductImage();
  
  // Format the price
  const formatPrice = (price) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(price);
  };
  
  const price = typeof product.price === 'number' ? product.price : parseFloat(product.price || 0);
  
  // Safely handle discount
  const hasDiscount = product.discount_percentage && parseFloat(product.discount_percentage) > 0;
  const discountedPrice = hasDiscount 
    ? price - (price * (parseFloat(product.discount_percentage) / 100)) 
    : null;
  
  // Get category name
  const categoryName = product.category_name || 
                      (product.categories && product.categories[0]?.name) || 
                      'Uncategorized';
  
  // Handle login modal
  const showLoginPrompt = (message, action) => {
    setLoginModalMessage(message);
    setLoginAction(action);
    setShowLoginModal(true);
  };

  const handleLoginClick = () => {
    setShowLoginModal(false);
    navigate('/login');
  };

  const handleCancelLogin = () => {
    setShowLoginModal(false);
  };
  
  // Handle add to cart
  const handleAddToCart = async (e) => {
    e.preventDefault(); // Prevent navigation
    e.stopPropagation(); // Stop event bubbling
    const token = localStorage.getItem('token');
    if (!token) {
      showLoginPrompt("Please log in to add items to your cart.", "cart");
      return;
    }
    try {
      setIsAdding(true);
      console.log('Adding product to cart:', product.id); // Debugging
      
      // Check if product has an id
      if (!product.id) {
        console.error('Product ID is missing', product);
        throw new Error('Product ID is required');
      }
      
      // Call add to cart service
      const result = await addToCart(product.id, 1);
      console.log('Add to cart result:', result);
      
      // Update cart count in context if available
      if (updateCartCount) {
        updateCartCount();
      }
      
      // Show success toast
      setSuccessMessage("Product added to cart!");
      setShowSuccessToast(true);
      
      // Hide toast after 2 seconds
      setTimeout(() => {
        setShowSuccessToast(false);
      }, 2000);
      
      // Reset loading state
      setIsAdding(false);
      
    } catch (error) {
      console.error('Error adding to cart:', error);
      setIsAdding(false);
      
      // Show error toast
      setSuccessMessage("Failed to add product to cart");
      setShowSuccessToast(true);
      
      // Hide toast after 2 seconds
      setTimeout(() => {
        setShowSuccessToast(false);
      }, 2000);
    }
  };
  
  // Handle buy now
  const handleBuyNow = async (e) => {
    e.preventDefault(); // Prevent navigation
    e.stopPropagation(); // Stop event bubbling
    const token = localStorage.getItem('token');
    if (!token) {
      showLoginPrompt("Please log in to proceed with the purchase.", "buy");
      return;
    }
    try {
      setIsBuying(true);
      
      // Create a checkout with just this product
      const checkoutId = await createCheckout([{
        product_id: product.id,
        quantity: 1,
        price: hasDiscount ? discountedPrice : price
      }]);
      
      // Navigate to checkout page
      navigate(`/checkout/${checkoutId}`);
    } catch (error) {
      console.error('Error proceeding to checkout:', error);
      setIsBuying(false);
    }
  };
  
  return (
    <div className="modern-product-card">
      {/* Product Image Section - Full Viewport Height */}
      <div className="product-image-section">
        <S3Image 
          src={productImage}
          alt={product.title}
          className="product-full-image"
          placeholder="/images/placeholder.jpg"
        />
        
        {/* Permanent Category Badge */}
        <div className="category-badge">
          {categoryName}
        </div>
        
        {/* Discount Badge - Show if applicable */}
        {hasDiscount && (
          <div className="discount-badge">
            {parseFloat(product.discount_percentage).toFixed(0)}% OFF
          </div>
        )}
        
        {/* Top navigation and actions bar */}
        <div className="top-nav-bar">
          <button className="back-button" onClick={() => navigate(-1)}>
            ← Back
          </button>
          
          <button className="share-button" onClick={(e) => e.preventDefault()}>
            Share ↗
          </button>
        </div>
      </div>
      
      {/* Product Info Section - Fixed at Bottom */}
      <div className="product-info-section">
        <Link to={`/product/${product.id}`} className="product-title-link">
          <h2 className="product-title">{product.title}</h2>
        </Link>
        
        {/* Price Display */}
        <div className="product-price-display">
          {hasDiscount ? (
            <>
              <span className="original-price">₹{isNaN(price) ? '0.00' : price.toFixed(2)}</span>
              <span className="current-price discount">₹{isNaN(discountedPrice) ? '0.00' : discountedPrice.toFixed(2)}</span>
            </>
          ) : (
            <span className="current-price">₹{isNaN(price) ? '0.00' : price.toFixed(2)}</span>
          )}
          <Link to={`/product/${product.id}`} className="view-details-link">
          View full details
        </Link>
        </div>
        
        {/* Action Buttons - Always Visible */}
        <div className="product-action-buttons">
          <button 
            className={`cart-button ${isAdding ? 'loading' : ''}`}
            onClick={handleAddToCart}
            disabled={isAdding || isBuying}
          >
            {isAdding ? (
              <span className="button-loader"></span>
            ) : (
              <>
                <span className="button-icon">🛒</span>
                <span>Add to Cart</span>
              </>
            )}
          </button>
          
          <button 
            className={`buy-button ${isBuying ? 'loading' : ''}`}
            onClick={handleBuyNow}
            disabled={isBuying || isAdding}
          >
            {isBuying ? (
              <span className="button-loader"></span>
            ) : (
              <>
                <span className="button-icon">⚡</span>
                <span>Buy Now</span>
              </>
            )}
          </button>
        </div>
      </div>
      
      {/* Login Modal */}
      {showLoginModal && (
        <LoginModal 
          onLogin={handleLoginClick} 
          onCancel={handleCancelLogin}
          message={loginModalMessage}
        />
      )}
      
      {/* Success Toast */}
      {showSuccessToast && (
        <SuccessToast 
          message={successMessage} 
          onClose={() => setShowSuccessToast(false)}
        />
      )}
    </div>
  );
};

export default ProductCard;