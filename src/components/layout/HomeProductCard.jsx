import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { addToCart, createCheckout } from '../../services/cartService';
import '../../styles/home.css';

// Login Modal Component
const LoginModal = ({ onLogin, onCancel, message }) => {
  return (
    <div className="modal-overlay">
      <div className="login-modal">
        <h3 className="login-modal-title">Please Login!</h3>
        <p className="login-modal-message">{message || "You need to login to perform this action."}</p>
        <div className="login-modal-buttons">
          <button className="login-button" onClick={onLogin}>
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
const SuccessToast = ({ message }) => {
  return (
    <div className="success-toast">
      <span className="success-icon">✓</span>
      <span className="success-message">{message}</span>
    </div>
  );
};

const HomeProductCard = ({ product }) => {
  const navigate = useNavigate();
  const { updateCart } = useCart();
  const [isAdding, setIsAdding] = useState(false);
  const [isBuying, setIsBuying] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginModalMessage, setLoginModalMessage] = useState("");
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  
  // Get the primary image for the product
  const displayImage = product.images && product.images.length > 0 
    ? product.images[0] 
    : '/images/placeholder-product.webp';
  
  // Calculate sale price if applicable
  const price = typeof product.price === 'number' ? product.price : parseFloat(product.price || 0);
  const hasDiscount = product.discount_percentage && parseFloat(product.discount_percentage) > 0;
  const discountedPrice = hasDiscount 
    ? price - (price * (parseFloat(product.discount_percentage) / 100)) 
    : null;

  // Handle login modal
  const showLoginPrompt = (message) => {
    setLoginModalMessage(message);
    setShowLoginModal(true);
  };

  const handleLoginRedirect = () => {
    setShowLoginModal(false);
    navigate('/login', { state: { from: window.location.pathname } });
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
      showLoginPrompt("Please log in to add items to your cart.");
      return;
    }
    
    try {
      setIsAdding(true);
      console.log('Adding product to cart:', product.id);
      
      if (!product.id) {
        console.error('Product ID is missing', product);
        throw new Error('Product ID is required');
      }
      
      const result = await addToCart(product.id, 1);
      console.log('Add to cart result:', result);
      
      if (updateCart) {
        updateCart();
      }
      
      setSuccessMessage("Product added to cart!");
      setShowSuccessToast(true);
      
      setTimeout(() => {
        setShowSuccessToast(false);
      }, 2000);
      
    } catch (error) {
      console.error('Failed to add to cart:', error);
      setSuccessMessage("Failed to add product to cart");
      setShowSuccessToast(true);
      
      setTimeout(() => {
        setShowSuccessToast(false);
      }, 2000);
    } finally {
      setIsAdding(false);
    }
  };
  
  // Handle buy now
  const handleBuyNow = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    const token = localStorage.getItem('token');
    if (!token) {
      showLoginPrompt("Please log in to proceed with the purchase.");
      return;
    }
    
    try {
      setIsBuying(true);
      
      // Get the product image URL using the same logic as the component
      const productImageUrl = displayImage;
      
      // Create a checkout with just this product, including complete image data
      const checkoutId = await createCheckout([{
        product_id: product.id,
        quantity: 1,
        price: hasDiscount ? discountedPrice : price,
        images: product.images || [],
        product_image: productImageUrl // Use the properly formatted image URL
      }]);
      
      // Navigate to checkout page
      navigate(`/checkout/${checkoutId}`);
    } catch (error) {
      console.error('Error proceeding to checkout:', error);
      setIsBuying(false);
      
      setSuccessMessage("Failed to proceed to checkout");
      setShowSuccessToast(true);
      
      setTimeout(() => {
        setShowSuccessToast(false);
      }, 2000);
    }
  };

  return (
    <div className="home-product-card modern">
      {/* Main card container */}
      <div className="card-inner">
        {/* Product image - clickable to go to detail */}
        <Link to={`/product/${product.id}`} className="product-image-link">
          <div className="product-image-wrapper">
            <img 
              src={displayImage} 
              alt={product.title} 
              className="product-image"
              onError={(e) => {
                e.target.onerror = null;
                e.target.src = '/images/placeholder-product.webp';
              }}
            />
            
            {/* Discount badge */}
            {hasDiscount && (
              <div className="discount-badge">-{parseFloat(product.discount_percentage).toFixed(0)}%</div>
            )}
          </div>
        </Link>
        
        {/* Product info */}
        <div className="product-info">
          <Link to={`/product/${product.id}`} className="product-title-link">
            <h3 className="product-title">{product.title}</h3>
          </Link>
          
          <div className="product-price">
            {hasDiscount ? (
              <>
                <span className="original-price">₹{isNaN(price) ? '0.00' : price.toFixed(2)}</span>
                <span className="sale-price">₹{isNaN(discountedPrice) ? '0.00' : discountedPrice.toFixed(2)}</span>
              </>
            ) : (
              <span>₹{isNaN(price) ? '0.00' : price.toFixed(2)}</span>
            )}
          </div>
        </div>
        
        {/* Action buttons at bottom - Updated to match ProductCard */}
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
                <span>Addto Cart</span>
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
          onLogin={handleLoginRedirect} 
          onCancel={handleCancelLogin}
          message={loginModalMessage}
        />
      )}
      
      {/* Success Toast */}
      {showSuccessToast && (
        <SuccessToast message={successMessage} />
      )}
    </div>
  );
};

export default HomeProductCard;