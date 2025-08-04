// File: src/services/cartService.js
import axios from 'axios';

// Use the working AWS EC2 API endpoint directly
const API_URL = 'http://ec2-51-20-79-41.eu-north-1.compute.amazonaws.com/api';

// Add item to cart
export const addToCart = async (productId, quantity = 1, variant = null) => {
  try {
    console.log(`Adding product ${productId} to cart, quantity: ${quantity}`);
    
    const token = localStorage.getItem('token');
    
    // For authenticated users, call the backend API
    if (token) {
      const response = await axios.post(
        `${API_URL}/cart/add_item/`, 
        { product_id: productId, quantity, variant },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );
      return response.data;
    } 
    
    // For guest users, use localStorage
    else {
      // Get current cart from localStorage
      const cartItems = JSON.parse(localStorage.getItem('cart') || '[]');
      
      // Check if item already exists in cart
      const existingItemIndex = cartItems.findIndex(item => 
        item.product_id === productId && 
        (variant ? item.variant === variant : !item.variant)
      );
      
      if (existingItemIndex >= 0) {
        // Update quantity of existing item
        cartItems[existingItemIndex].quantity += quantity;
      } else {
        // Add new item to cart
        cartItems.push({
          product_id: productId,
          quantity,
          variant,
          added_at: new Date().toISOString()
        });
      }
      
      // Save updated cart to localStorage
      localStorage.setItem('cart', JSON.stringify(cartItems));
      
      // Return success response
      return {
        success: true,
        message: 'Item added to cart',
        cart_count: cartItems.reduce((total, item) => total + item.quantity, 0)
      };
    }
  } catch (error) {
    console.error('Error adding to cart:', error);
    throw error;
  }
};

// Get cart items
export const getCartItems = async () => {
  try {
    const token = localStorage.getItem('token');
    
    // For authenticated users
    if (token) {
      const response = await axios.get(`${API_URL}/cart/`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return response.data;
    } 
    
    // For guest users, use localStorage
    else {
      const cartItems = JSON.parse(localStorage.getItem('cart') || '[]');
      
      // If cart is empty, return empty array
      if (cartItems.length === 0) {
        return { items: [] };
      }
      
      // Fetch product details for cart items
      // In a real app, you would need to fetch product details from the API
      // For now, we'll just return the cart items
      return {
        items: cartItems
      };
    }
  } catch (error) {
    console.error('Error getting cart items:', error);
    throw error;
  }
};

// Update cart item quantity
export const updateCartItem = async (itemId, quantity) => {
  try {
    const token = localStorage.getItem('token');
    
    // For authenticated users
    if (token) {
      const response = await axios.put(
        `${API_URL}/cart/update/${itemId}/`, 
        { quantity },
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        }
      );
      return response.data;
    } 
    
    // For guest users, use localStorage
    else {
      const cartItems = JSON.parse(localStorage.getItem('cart') || '[]');
      
      // Find the item by product_id (for guest cart)
      const existingItemIndex = cartItems.findIndex(item => item.product_id === itemId);
      
      if (existingItemIndex >= 0) {
        if (quantity <= 0) {
          // Remove item if quantity is 0 or less
          cartItems.splice(existingItemIndex, 1);
        } else {
          // Update quantity
          cartItems[existingItemIndex].quantity = quantity;
        }
        
        // Save updated cart to localStorage
        localStorage.setItem('cart', JSON.stringify(cartItems));
        
        return {
          success: true,
          message: 'Cart updated successfully'
        };
      }
      
      throw new Error('Item not found in cart');
    }
  } catch (error) {
    console.error('Error updating cart item:', error);
    throw error;
  }
};

// Remove item from cart
export const removeCartItem = async (itemId) => {
  try {
    const token = localStorage.getItem('token');
    
    // For authenticated users
    if (token) {
      const response = await axios.delete(`${API_URL}/cart/remove/${itemId}/`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return response.data;
    } 
    
    // For guest users, use localStorage
    else {
      const cartItems = JSON.parse(localStorage.getItem('cart') || '[]');
      
      // Filter out the item with matching product_id
      const updatedCart = cartItems.filter(item => item.product_id !== itemId);
      
      // Save updated cart to localStorage
      localStorage.setItem('cart', JSON.stringify(updatedCart));
      
      return {
        success: true,
        message: 'Item removed from cart'
      };
    }
  } catch (error) {
    console.error('Error removing cart item:', error);
    throw error;
  }
};

// Clear cart
export const clearCart = async () => {
  try {
    const token = localStorage.getItem('token');
    
    // For authenticated users
    if (token) {
      const response = await axios.delete(`${API_URL}/cart/clear/`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return response.data;
    } 
    
    // For guest users, use localStorage
    else {
      localStorage.removeItem('cart');
      
      return {
        success: true,
        message: 'Cart cleared successfully'
      };
    }
  } catch (error) {
    console.error('Error clearing cart:', error);
    throw error;
  }
};

// Create checkout from cart
export const createCheckout = async (items) => {
  try {
    const token = localStorage.getItem('token');
    const headers = {
      'Content-Type': 'application/json'
    };
    
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    // Enhanced items with product details if needed
    const enhancedItems = await Promise.all(
      items.map(async (item) => {
        // If item already has image data, use it
        if (item.product_image || (item.images && item.images.length > 0)) {
          return item;
        }
        
        // If no image data, fetch product details
        if (item.product_id) {
          try {
            const response = await axios.get(`${API_URL}/products/${item.product_id}/`);
            const product = response.data;
            
            return {
              ...item,
              images: product.images || [],
              product_image: product.images?.[0] || null
            };
          } catch (err) {
            console.error(`Error fetching product details for ${item.product_id}:`, err);
            return item; // Return original item if fetch fails
          }
        }
        
        return item;
      })
    );

    console.log('Creating checkout with enhanced items:', enhancedItems);

    const response = await axios.post(
      `${API_URL}/checkout/create/`, 
      { items: enhancedItems },
      { headers }
    );
    
    return response.data.checkout_id;
  } catch (error) {
    console.error('Error creating checkout:', error);
    throw error;
  }
};

// Get cart count
export const getCartCount = async () => {
  try {
    const token = localStorage.getItem('token');
    
    // For authenticated users
    if (token) {
      const response = await axios.get(`${API_URL}/cart/count/`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      return response.data.count;
    } 
    
    // For guest users, use localStorage
    else {
      const cartItems = JSON.parse(localStorage.getItem('cart') || '[]');
      return cartItems.reduce((total, item) => total + item.quantity, 0);
    }
  } catch (error) {
    console.error('Error getting cart count:', error);
    return 0; // Return 0 if there's an error
  }
};