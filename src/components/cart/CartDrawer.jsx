import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { createCheckout } from '../../services/cartService';
import '../../styles/cart.css';
import api from '../../services/api';
import CartItem from './CartItem';

export default function CartDrawer({ isOpen, onClose }) {
  const { cartItems, cartTotal, setCartItems, setCartTotal } = useCart();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [updatingItems, setUpdatingItems] = useState(new Set());
  const navigate = useNavigate();
  
  // Handle navigation to product details
  const handleProductClick = (productId) => {
    onClose(); // Close cart drawer
    navigate(`/product/${productId}`); // Navigate to product details
  };

  // Handle quantity update - FIXED to use correct backend API
  const updateQuantity = async (itemId, newQuantity) => {
    if (newQuantity <= 0) {
      removeItem(itemId);
      return;
    }

    try {
      setUpdatingItems(prev => new Set(prev).add(itemId));
      
      // Use the correct backend API endpoint
      await api.post('/api/cart/update_item/', {
        item_id: itemId,
        quantity: newQuantity
      });
      
      // Refresh cart data to get updated state
      await fetchCartData();
      
    } catch (error) {
      console.error('Error updating quantity:', error);
      alert('Failed to update quantity. Please try again.');
    } finally {
      setUpdatingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(itemId);
        return newSet;
      });
    }
  };

  // Handle item removal - FIXED to use correct backend API
  const removeItem = async (itemId) => {
    try {
      setUpdatingItems(prev => new Set(prev).add(itemId));
      
      // Use the correct backend API endpoint
      await api.post('/api/cart/remove_item/', {
        item_id: itemId
      });
      
      // Refresh cart data to get updated state
      await fetchCartData();
      
    } catch (error) {
      console.error('Error removing item:', error);
      alert('Failed to remove item. Please try again.');
    } finally {
      setUpdatingItems(prev => {
        const newSet = new Set(prev);
        newSet.delete(itemId);
        return newSet;
      });
    }
  };

  // Handle increase quantity
  const increaseQuantity = (item) => {
    const newQuantity = item.quantity + 1;
    if (newQuantity <= item.available_stock) {
      updateQuantity(item.id, newQuantity);
    } else {
      alert('Not enough stock available');
    }
  };

  // Handle decrease quantity
  const decreaseQuantity = (item) => {
    const newQuantity = item.quantity - 1;
    updateQuantity(item.id, newQuantity);
  };
  
  // Update the handleCheckout function
  const handleCheckout = async () => {
    try {
      setIsCheckingOut(true);
      
      // Enhanced format cart items for checkout API with product details
      const checkoutItems = await Promise.all(
        cartItems.map(async (item) => {
          const baseItem = {
            product_id: item.product_id,
            quantity: item.quantity,
            price: item.price - (item.price * (item.discount / 100))
          };

          // If cart item already has images, include them
          if (item.images && item.images.length > 0) {
            baseItem.images = item.images;
            baseItem.product_image = item.images[0];
          }

          return baseItem;
        })
      );
      
      console.log('Creating checkout with items:', checkoutItems);
      
      // Create checkout
      const checkoutId = await createCheckout(checkoutItems);
      
      // Close cart drawer
      onClose();
      
      // Navigate to checkout page
      navigate(`/checkout/${checkoutId}`);
    } catch (error) {
      console.error('Error creating checkout:', error);
      alert('Failed to create checkout. Please try again.');
    } finally {
      setIsCheckingOut(false);
    }
  };

  // Debug log when props change
  useEffect(() => {
    console.log("CartDrawer isOpen:", isOpen);
    
    // Fetch cart data when drawer opens
    if (isOpen) {
      fetchCartData();
    }
  }, [isOpen]);
  
  // Modify the fetchCartData function to handle guest users:
  const fetchCartData = async () => {
    // Only fetch if user is logged in
    const token = localStorage.getItem('token');
    if (!token) {
      console.log('No token found, user not logged in');
      // Show empty cart for guest users, don't leave in previous state
      setLoading(false);
      setError(null);
      setCartItems([]);
      setCartTotal(0);
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      console.log('Fetching cart data from API...');
      const response = await api.get('/api/cart/my_cart/');
      console.log('Cart data from API:', response.data);
      
      // Always reset the error state on success
      setError(null);
      
      // Check if the response has items array
      if (response.data && Array.isArray(response.data.items)) {
        // The cart exists but may be empty
        console.log(`Found ${response.data.items.length} items in cart`);
        
        if (response.data.items.length > 0) {
          // Cart has items - process them
          const transformedItems = response.data.items.map(item => ({
            id: item.id,
            title: item.product.title,
            price: parseFloat(item.product.price),
            discount: item.product.discount_percentage || 0,
            quantity: item.quantity,
            images: item.product.images || [],
            available_stock: item.product.stock || 0,
            product_id: item.product.id
          }));
          
          console.log('Transformed items:', transformedItems);
          setCartItems(transformedItems);
          setCartTotal(parseFloat(response.data.total_price) || 0);
        } else {
          // Cart exists but is empty
          console.log('Cart is empty');
          setCartItems([]);
          setCartTotal(0);
        }
      } else {
        // Unexpected response format - set empty cart
        console.log('No items array in response, setting empty cart');
        setCartItems([]);
        setCartTotal(0);
      }
    } catch (err) {
      console.error('Error fetching cart:', err);
      console.error('Error details:', err.response || err.message);
      setError('Could not load your cart. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
          onClick={onClose}
        />
      )}
      
      {/* Cart Drawer */}
      <div className={`cart-drawer ${isOpen ? 'open' : ''}`}>
        <div className="cart-drawer-header">
          <h2 className="cart-drawer-title">Shopping Cart</h2>
          <button 
            onClick={onClose}
            className="close-drawer-btn"
            aria-label="Close cart"
          >
            ✕
          </button>
        </div>
        
        <div className="cart-items-container">
          {loading ? (
            <div className="cart-loading">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#D4AF37]"></div>
            </div>
          ) : error ? (
            <div className="cart-error">
              <p>{error}</p>
              <button 
                onClick={fetchCartData}
                className="gold-button mt-3"
              >
                Try Again
              </button>
            </div>
          ) : cartItems.length === 0 ? (
            <div className="empty-cart">
              <div className="empty-cart-icon">🛒</div>
              <p className="empty-cart-text">Your cart is empty</p>
              <button 
                onClick={onClose}
                className="gold-button"
              >
                Continue Shopping
              </button>
            </div>
          ) : (
            <div className="cart-items">
              {cartItems.map(item => {
                const isUpdating = updatingItems.has(item.id);
                
                return (
                  <div key={item.id} className={`cart-item ${isUpdating ? 'updating' : ''}`}>
                    <div className="cart-item-details">
                      <h3 
                        className="cart-item-title"
                        onClick={() => handleProductClick(item.product_id)}
                      >
                        {item.title}
                      </h3>
                      
                      <div className="cart-item-price">
                        <span className="cart-current-price">
                          ₹{(item.price - (item.price * (item.discount / 100))).toLocaleString()}
                        </span>
                        {item.discount > 0 && (
                          <span className="cart-original-price">
                            ₹{item.price.toLocaleString()}
                          </span>
                        )}
                      </div>
                      
                      <div className="cart-item-controls">
                        <div className="cart-item-quantity">
                          <button 
                            className="cart-quantity-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              decreaseQuantity(item);
                            }}
                            disabled={isUpdating || item.quantity <= 1}
                          >
                            −
                          </button>
                          <input 
                            type="number" 
                            value={item.quantity} 
                            className="cart-quantity-input"
                            readOnly
                          />
                          <button 
                            className="cart-quantity-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              increaseQuantity(item);
                            }}
                            disabled={isUpdating || item.quantity >= item.available_stock}
                          >
                            +
                          </button>
                        </div>
                        
                        <button 
                          className="remove-cart-item"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeItem(item.id);
                          }}
                          disabled={isUpdating}
                        >
                          {isUpdating ? 'Updating...' : 'Remove'}
                        </button>
                      </div>
                    </div>
                    
                    {/* Image on the right */}
                    <img 
                      src={item.images && item.images.length > 0 ? item.images[0] : '/images/placeholder-product.webp'}
                      alt={item.title}
                      className="cart-item-image"
                      onClick={() => handleProductClick(item.product_id)}
                    />
                    
                    {/* Loading overlay for updating items */}
                    {isUpdating && (
                      <div className="absolute inset-0 bg-white bg-opacity-70 flex items-center justify-center rounded-12">
                        <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-[#D4AF37]"></div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
        
        {cartItems.length > 0 && (
          <div className="cart-drawer-footer">
            <div className="cart-total">
              <span>Subtotal:</span>
              <span>₹{cartTotal.toLocaleString()}</span>
            </div>

            <button 
              onClick={handleCheckout}
              disabled={isCheckingOut || updatingItems.size > 0}
              className="checkout-btn"
            >
              {isCheckingOut ? 'Creating Checkout...' : 'Proceed to Checkout'}
            </button>
          </div>
        )}
      </div>
    </>
  );
}
