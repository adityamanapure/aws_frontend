import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getProductById, getProductsByCategory } from '../../services/productService';
import { addToCart, createCheckout } from '../../services/cartService';
import { useCart } from '../../context/CartContext';
import '../../styles/productDetail.css';

// Add this helper function to safely get the price with discount
const getDiscountedPrice = (product) => {
  // Ensure price is a number
  const price = typeof product.price === 'number' ? product.price : parseFloat(product.price || 0);
  
  // Calculate discount if available
  if (product.discount_percentage && parseFloat(product.discount_percentage) > 0) {
    const discountPercent = parseFloat(product.discount_percentage) / 100;
    return (price - (price * discountPercent)).toFixed(2);
  }
  
  return price.toFixed(2);
};

// Login Modal Component
const LoginModal = ({ onLogin, onCancel, message }) => {
  return (
    <div className="modal-overlay">
      <div className="login-modal">
        <h3 className="login-modal-title">Please Login!</h3>
        <p className="login-modal-message">{message}</p>
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

const ProductDetail = () => {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isAdding, setIsAdding] = useState(false);
  const [isBuying, setIsBuying] = useState(false);
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const [similarProducts, setSimilarProducts] = useState([]);
  const [loadingSimilar, setLoadingSimilar] = useState(false);
  const [activeTab, setActiveTab] = useState('description');
  const navigate = useNavigate();
  const { updateCartCount } = useCart();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [loginModalMessage, setLoginModalMessage] = useState("");
  const [loginAction, setLoginAction] = useState(null);
  const [showSuccessToast, setShowSuccessToast] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [isZoomed, setIsZoomed] = useState(false);

  // Fetch product details
  useEffect(() => {
    const fetchProductDetails = async () => {
      try {
        setLoading(true);
        const productData = await getProductById(id);
        setProduct(productData);
        
        // After getting the product, fetch similar products from the same category
        if (productData.category || productData.categories?.length > 0) {
          fetchSimilarProducts(
            productData.category || productData.categories[0]?.id, 
            productData.id
          );
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching product details:', err);
        setError('Failed to load product details. Please try again.');
        setLoading(false);
      }
    };

    fetchProductDetails();
  }, [id]);
  
  // Update the fetchSimilarProducts function to limit results
  const fetchSimilarProducts = async (categoryId, productId) => {
    try {
      setLoadingSimilar(true);
      // Set limit to 4 in the API call
      const products = await getProductsByCategory(categoryId, 4, productId);
      
      // Just in case the API returns more than 4, slice the result
      setSimilarProducts(products.slice(0, 4));
    } catch (err) {
      console.error('Error fetching similar products:', err);
      setSimilarProducts([]);
    } finally {
      setLoadingSimilar(false);
    }
  };

  // Handle quantity change
  const handleQuantityChange = (e) => {
    const value = parseInt(e.target.value);
    if (value > 0) {
      setQuantity(value);
    }
  };

  // Increment/decrement quantity
  const updateQuantity = (amount) => {
    setQuantity(prev => Math.max(1, prev + amount));
  };

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
  const handleAddToCart = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      showLoginPrompt("Please log in to add items to your cart.", "cart");
      return;
    }
    
    try {
      setIsAdding(true);
      
      if (!product.id) {
        throw new Error('Product ID is required');
      }
      
      // API call
      await addToCart(product.id, quantity);
      
      if (updateCartCount) {
        updateCartCount();
      }
      
      // Show success toast
      setSuccessMessage(`${product.title} added to cart!`);
      setShowSuccessToast(true);
      
      // Hide toast after 2 seconds
      setTimeout(() => {
        setShowSuccessToast(false);
      }, 2000);
      
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
  const handleBuyNow = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      showLoginPrompt("Please log in to proceed with the purchase.", "buy");
      return;
    }
    
    try {
      setIsBuying(true);
      
      const price = product.discount_price || product.price;
      
      const checkoutId = await createCheckout([{
        product_id: product.id,
        quantity: quantity,
        price: price
      }]);
      
      navigate(`/checkout/${checkoutId}`);
    } catch (error) {
      console.error('Error proceeding to checkout:', error);
      setIsBuying(false);
      
      // Show error toast
      setSuccessMessage("Failed to proceed to checkout");
      setShowSuccessToast(true);
      
      // Hide toast after 2 seconds
      setTimeout(() => {
        setShowSuccessToast(false);
      }, 2000);
    }
  };

  // Image navigation
  const navigateImage = (direction) => {
    if (!product?.images?.length) return;
    
    setCurrentImageIndex(prev => {
      if (direction === 'next') {
        return prev === product.images.length - 1 ? 0 : prev + 1;
      } else {
        return prev === 0 ? product.images.length - 1 : prev - 1;
      }
    });
  };

  // Get image URL
  const getImageUrl = (imageObj) => {
    if (typeof imageObj === 'string') return imageObj;
    if (imageObj?.image) return imageObj.image;
    if (imageObj?.url) return imageObj.url;
    return '/images/placeholder.jpg';
  };

  // Toggle image zoom
  const toggleZoom = () => {
    setIsZoomed(prev => !prev);
  };

  // Loading state
  if (loading) {
    return (
      <div className="product-detail-skeleton">
        <div className="skeleton-navigation"></div>
        <div className="skeleton-content">
          <div className="skeleton-gallery">
            <div className="skeleton-main-image"></div>
            <div className="skeleton-thumbnails">
              <div className="skeleton-thumbnail"></div>
              <div className="skeleton-thumbnail"></div>
              <div className="skeleton-thumbnail"></div>
            </div>
          </div>
          <div className="skeleton-info">
            <div className="skeleton-title"></div>
            <div className="skeleton-price"></div>
            <div className="skeleton-description"></div>
            <div className="skeleton-actions"></div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error || !product) {
    return (
      <div className="product-error-container">
        <div className="error-content">
          <h2>{!product ? "Product Not Found" : "Something Went Wrong"}</h2>
          <p>{error || "The product you're looking for doesn't exist or has been removed."}</p>
          <Link to="/products" className="back-link">Browse Products</Link>
        </div>
      </div>
    );
  }

  // Calculate price and discount
  const hasDiscount = product.discount_percentage && parseFloat(product.discount_percentage) > 0;
  const price = typeof product.price === 'number' ? product.price : parseFloat(product.price || 0);
  const discountedPrice = hasDiscount 
    ? price - (price * (parseFloat(product.discount_percentage) / 100)) 
    : null;

  return (
    <div className="modern-product-container">
      {/* Breadcrumb navigation */}
      <div className="product-breadcrumb">
        <div className="container">
          <Link to="/">Home</Link> / 
          <Link to="/products"> Products</Link> / 
          <span>{product?.title}</span>
        </div>
      </div>
      
      <div className="product-main-content container">
        <div className="product-gallery-section">
          {/* Side thumbnails */}
          {product?.images && product.images.length > 1 && (
            <div className="product-thumbnails">
              {product.images.map((image, index) => (
                <div 
                  key={index} 
                  className={`product-thumbnail ${index === currentImageIndex ? 'active' : ''}`}
                  onClick={() => setCurrentImageIndex(index)}
                >
                  <img 
                    src={getImageUrl(image)} 
                    alt={`${product.title} thumbnail ${index + 1}`}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = '/images/placeholder-thumb.jpg';
                    }}
                  />
                </div>
              ))}
            </div>
          )}
          
          {/* Main image display with zoom feature */}
          <div className={`product-main-image ${isZoomed ? 'zoomed' : ''}`}>
            <button 
              className="image-nav prev" 
              onClick={() => navigateImage('prev')}
              aria-label="Previous image"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
            </button>
            
            <div className="image-container" onClick={toggleZoom}>
              <img 
                src={product?.images && product.images.length > 0 
                  ? getImageUrl(product.images[currentImageIndex]) 
                  : '/images/placeholder.jpg'
                } 
                alt={product?.title}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = '/images/placeholder.jpg';
                }}
                className={isZoomed ? 'zoomed' : ''}
              />
              
              {!isZoomed && (
                <div className="zoom-hint">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    <line x1="11" y1="8" x2="11" y2="14"></line>
                    <line x1="8" y1="11" x2="14" y2="11"></line>
                  </svg>
                  <span>Click to zoom</span>
                </div>
              )}
            </div>
            
            <button 
              className="image-nav next" 
              onClick={() => navigateImage('next')}
              aria-label="Next image"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </button>
          </div>
        </div>
        
        <div className="product-info-section">
          {/* Brand & Category */}
          <div className="product-meta">
            <span className="product-brand">{product?.brand || 'FashionKesang'}</span>
            <span className="product-category">
              {product?.category_name || 
                (product?.categories && product?.categories[0]?.name) || 
                'Fashion'}
            </span>
          </div>
          
          {/* Title */}
          <h1 className="product-title">{product?.title}</h1>
          
          {/* Product rating if available */}
          {product?.rating && (
            <div className="product-rating">
              {[1, 2, 3, 4, 5].map(star => (
                <span key={star} className={`star ${star <= Math.round(product.rating) ? 'filled' : ''}`}>
                  ★
                </span>
              ))}
              <span className="rating-count">({product.rating_count || 0} reviews)</span>
            </div>
          )}
          
          {/* Price */}
          <div className="product-price">
            {hasDiscount ? (
              <>
                <span className="price current">₹{discountedPrice.toFixed(2)}</span>
                <span className="price original">₹{price.toFixed(2)}</span>
                <span className="discount-percent">-{parseFloat(product.discount_percentage).toFixed(0)}%</span>
              </>
            ) : (
              <span className="price current">₹{price.toFixed(2)}</span>
            )}
          </div>
          
          {/* Short description */}
          <div className="product-short-desc">
            <p>{product?.short_description || product?.description?.substring(0, 120) + '...' || 'Premium quality jewelry piece.'}</p>
          </div>
          
          {/* Quantity selector */}
          <div className="product-quantity">
            <h3>Quantity</h3>
            <div className="quantity-selector">
              <button 
                className="quantity-btn decrease"
                onClick={() => updateQuantity(-1)}
                disabled={quantity <= 1}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
              </button>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={handleQuantityChange}
                className="quantity-input"
              />
              <button 
                className="quantity-btn increase"
                onClick={() => updateQuantity(1)}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="5" x2="12" y2="19"></line>
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                </svg>
              </button>
            </div>
          </div>
          
          {/* NEW STYLED ACTION BUTTONS - Matching ProductCard */}
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
          
          {/* Wishlist & Share buttons */}
          <div className="secondary-actions">
            <button className="wishlist-btn">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78L12 21.23l8.84-8.84a5.5 5.5 0 0 0 0-7.78z"></path>
              </svg>
              Add to Wishlist
            </button>
            
            <button className="share-btn">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="18" cy="5" r="3"></circle>
                <circle cx="6" cy="12" r="3"></circle>
                <circle cx="18" cy="19" r="3"></circle>
                <line x1="8.59" y1="13.51" x2="15.42" y2="17.49"></line>
                <line x1="15.41" y1="6.51" x2="8.59" y2="10.49"></line>
              </svg>
              Share
            </button>
          </div>
          
          {/* Delivery info */}
          <div className="delivery-info">
            <div className="delivery-option">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="2" y="7" width="20" height="14" rx="2" ry="2"></rect>
                <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"></path>
              </svg>
              <div>
                <h4>Free Shipping</h4>
                <p>On orders over ₹999</p>
              </div>
            </div>
            
            <div className="delivery-option">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
              </svg>
              <div>
                <h4>30-Day Returns</h4>
                <p>Money back guarantee</p>
              </div>
            </div>
            
            <div className="delivery-option">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
              <div>
                <h4>Secure Checkout</h4>
                <p>Safe & protected payment</p>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Product details tabs - MODERNIZED */}
      <div className="product-details-tabs container">
        <div className="tabs-header">
          <button 
            className={`tab-btn ${activeTab === 'description' ? 'active' : ''}`}
            onClick={() => setActiveTab('description')}
          >
            Description
          </button>
          <button 
            className={`tab-btn ${activeTab === 'specifications' ? 'active' : ''}`}
            onClick={() => setActiveTab('specifications')}
          >
            Specifications
          </button>
          <button 
            className={`tab-btn ${activeTab === 'shipping' ? 'active' : ''}`}
            onClick={() => setActiveTab('shipping')}
          >
            Shipping & Returns
          </button>
        </div>
        
        <div className="tabs-content">
          <div className={`tab-pane ${activeTab === 'description' ? 'active' : ''}`}>
            <div className="product-description">
              <h3>Product Description</h3>
              <div className="description-content">
                <p>{product.description || "No description available for this product."}</p>
                
                {/* Feature highlights */}
                {product.features && (
                  <div className="feature-highlights">
                    <h4>Features</h4>
                    <ul>
                      {product.features.map((feature, idx) => (
                        <li key={idx}>{feature}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          <div className={`tab-pane ${activeTab === 'specifications' ? 'active' : ''}`}>
            <div className="product-specifications">
              <h3>Product Specifications</h3>
              <div className="specifications-table">
                <div className="spec-row">
                  <div className="spec-name">Brand</div>
                  <div className="spec-value">{product.brand || 'FashionKesang'}</div>
                </div>
                <div className="spec-row">
                  <div className="spec-name">Material</div>
                  <div className="spec-value">{product.material || 'Premium Quality'}</div>
                </div>
                <div className="spec-row">
                  <div className="spec-name">Weight</div>
                  <div className="spec-value">{product.weight || 'Varies by size'}</div>
                </div>
                <div className="spec-row">
                  <div className="spec-name">Dimensions</div>
                  <div className="spec-value">{product.dimensions || 'Standard Size'}</div>
                </div>
                <div className="spec-row">
                  <div className="spec-name">Origin</div>
                  <div className="spec-value">{product.origin || 'India'}</div>
                </div>
              </div>
            </div>
          </div>
          
          <div className={`tab-pane ${activeTab === 'shipping' ? 'active' : ''}`}>
            <div className="shipping-returns">
              <h3>Shipping Information</h3>
              <p>We offer free shipping on all orders over ₹999 within India. Standard shipping typically takes 3-5 business days.</p>
              
              <h3>Returns & Exchanges</h3>
              <p>We accept returns within 30 days of delivery. Items must be unused, unworn, and in original packaging with all tags attached.</p>
              
              <h3>International Orders</h3>
              <p>We currently ship to select international destinations. International shipping rates and delivery times vary by location.</p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Product recommendations - Updated with modern card design */}
      <div className="product-recommendations container">
        <h2>You May Also Like</h2>
        
        {loadingSimilar ? (
          <div className="recommendations-grid">
            {[1, 2, 3, 4].map(item => (
              <div key={item} className="recommendation-card skeleton">
                <div className="recommendation-image"></div>
                <div className="recommendation-title"></div>
                <div className="recommendation-price"></div>
              </div>
            ))}
          </div>
        ) : similarProducts.length > 0 ? (
          <div className="recommendations-grid">
            {similarProducts.map(product => (
              <Link 
                to={`/product/${product.id}`} 
                key={product.id} 
                className="recommendation-card modern"
              >
                <div className="recommendation-image">
                  <img 
                    src={product.images && product.images.length > 0 
                      ? getImageUrl(product.images[0]) 
                      : '/images/placeholder.jpg'
                    } 
                    alt={product.title}
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = '/images/placeholder.jpg';
                    }}
                  />
                  
                  {product.discount_percentage && parseFloat(product.discount_percentage) > 0 && (
                    <div className="recommendation-badge">
                      {parseFloat(product.discount_percentage).toFixed(0)}% OFF
                    </div>
                  )}
                </div>
                <div className="recommendation-info">
                  <h4>{product.title}</h4>
                  <div className="recommendation-price">
                    {product.discount_percentage && parseFloat(product.discount_percentage) > 0 ? (
                      <>
                        <span className="price-current">
                          ₹{((typeof product.price === 'number' ? product.price : parseFloat(product.price || 0)) - 
                            ((typeof product.price === 'number' ? product.price : parseFloat(product.price || 0)) * 
                            (parseFloat(product.discount_percentage) / 100))).toFixed(2)}
                        </span>
                        <span className="price-original">
                          ₹{(typeof product.price === 'number' ? product.price : parseFloat(product.price || 0)).toFixed(2)}
                        </span>
                      </>
                    ) : (
                      <span className="price-current">
                        ₹{(typeof product.price === 'number' ? product.price : parseFloat(product.price || 0)).toFixed(2)}
                      </span>
                    )}
                  </div>
                  <div className="quick-add">Quick Add</div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="no-recommendations">
            <p>No similar products found</p>
          </div>
        )}
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
        <SuccessToast message={successMessage} />
      )}
      
      {/* Image zoom overlay */}
      {isZoomed && (
        <div className="zoom-overlay" onClick={toggleZoom}>
          <div className="zoom-close">×</div>
          <img 
            src={product?.images && product.images.length > 0 
              ? getImageUrl(product.images[currentImageIndex]) 
              : '/images/placeholder.jpg'
            } 
            alt={product?.title} 
          />
        </div>
      )}
    </div>
  );
};

export default ProductDetail;