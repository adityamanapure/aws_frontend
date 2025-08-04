import axios from 'axios';

// Use the working AWS EC2 API endpoint directly
const API_URL = 'http://ec2-51-20-79-41.eu-north-1.compute.amazonaws.com/api';

// Correctly structured service with exported functions
const getCheckout = async (checkoutId) => {
  try {
    // For guest checkout, we can use the checkout ID and session ID
    const sessionId = localStorage.getItem('sessionId') || sessionStorage.getItem('sessionId');
    
    // Build URL with query parameter if we have a session ID
    let url = `${API_URL}/checkout/${checkoutId}/`;
    if (sessionId) {
      url += `?session_id=${sessionId}`;
    }
    
    console.log("Making request to:", url);
    
    // Make the request without authentication headers for public access
    const response = await axios.get(url);
    
    return response.data;
  } catch (error) {
    console.error("Error fetching checkout:", error);
    if (error.response) {
      console.error("Response status:", error.response.status);
      console.error("Response data:", error.response.data);
    }
    throw error;
  }
};

export const updateCheckout = async (checkoutId, checkoutData) => {
  try {
    console.log('Updating checkout with data:', checkoutData);
    
    // Log the address specifically for debugging
    if (checkoutData.address) {
      console.log('Sending address:', checkoutData.address);
    }
    
    const response = await axios.put(`${API_URL}/checkout/${checkoutId}/`, checkoutData);
    return response.data;
  } catch (error) {
    console.error('Error updating checkout:', error);
    console.error('Response data:', error.response?.data);
    throw error;
  }
};

const processPayment = async (checkoutId, paymentDetails) => {
  try {
    const token = localStorage.getItem('token');
    if (token) {
      const response = await axios.post(
        `${API_URL}/checkout/${checkoutId}/pay/`, 
        { paymentDetails },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      return response.data;
    }
    
    // For guest users, simulate payment processing
    // In a real application, you would integrate with a payment gateway
    // and handle guest checkout separately
    
    // Simulate successful order creation
    const orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    
    // Clear the temporary checkout after successful payment
    localStorage.removeItem('temp_checkout');
    
    return { 
      success: true, 
      order_id: orderNumber,
      message: 'Payment processed successfully'
    };
  } catch (error) {
    console.error('Error processing payment:', error);
    throw error;
  }
};

// Create a checkout from cart items
const createCheckout = async (items) => {
  try {
    const token = localStorage.getItem('token');
    if (token) {
      const response = await axios.post(
        `${API_URL}/checkout/`, 
        { items },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      return response.data.checkout_id;
    }
    
    // For guest users, create a temporary checkout in localStorage
    const checkoutId = `temp-${Date.now()}`;
    localStorage.setItem('temp_checkout', JSON.stringify({ 
      items,
      created_at: new Date().toISOString()
    }));
    
    return checkoutId;
  } catch (error) {
    console.error('Error creating checkout:', error);
    throw error;
  }
};

// Apply a coupon code to the checkout
const applyCoupon = async (checkoutId, couponCode) => {
  try {
    const token = localStorage.getItem('token');
    if (token) {
      const response = await axios.post(
        `${API_URL}/checkout/${checkoutId}/coupon/`, 
        { code: couponCode },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      return response.data;
    }
    
    // For guest users, we would need backend validation of coupons
    // This is a placeholder for demonstration purposes
    return { 
      success: false, 
      message: 'Please log in to apply coupon codes'
    };
  } catch (error) {
    console.error('Error applying coupon:', error);
    throw error;
  }
};

// Get available shipping methods
const getShippingMethods = async (checkoutId) => {
  try {
    const token = localStorage.getItem('token');
    if (token) {
      const response = await axios.get(
        `${API_URL}/checkout/${checkoutId}/shipping-methods/`, 
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );
      return response.data;
    }
    
    // Default shipping methods for guest users
    return [
      { 
        id: 'standard', 
        name: 'Standard Shipping', 
        price: 5.99,
        free_threshold: 50,
        estimated_days: '5-7 business days'
      },
      { 
        id: 'express', 
        name: 'Express Shipping', 
        price: 15.00,
        free_threshold: null,
        estimated_days: '1-3 business days'
      }
    ];
  } catch (error) {
    console.error('Error getting shipping methods:', error);
    throw error;
  }
};

export {
  getCheckout,
  // updateCheckout,
  processPayment,
  createCheckout,
  applyCoupon,
  getShippingMethods
};