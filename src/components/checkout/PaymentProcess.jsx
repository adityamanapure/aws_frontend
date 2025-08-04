import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import axios from 'axios';
import { getCheckout } from '../../services/checkoutService';
import { getImageUrl, handleImageError } from '../../utils/imageUtils';
import '../../styles/payment.css';

// Use the working AWS EC2 API endpoint directly (already correctly set to HTTP)
const API_BASE_URL = 'http://ec2-51-20-79-41.eu-north-1.compute.amazonaws.com';
const API_URL = `${API_BASE_URL}/api`;

const PaymentProcess = () => {
  const { checkoutId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [checkoutData, setCheckoutData] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);
  const [orderId, setOrderId] = useState(null);
  const [totals, setTotals] = useState({
    subtotal: "0.00",
    shipping: "0.00",
    tax: "0.00",
    total: "0.00"
  });

  useEffect(() => {
    const fetchCheckoutDetails = async () => {
      try {
        setLoading(true);
        
        const token = localStorage.getItem('token');
        if (!token) {
          setError('Authentication required. Please log in again.');
          setLoading(false);
          return;
        }
        
        console.log(`Fetching checkout details for ID: ${checkoutId}`);
        const data = await getCheckout(checkoutId, token);
        
        if (!data || !data.items || !Array.isArray(data.items)) {
          console.error('Invalid checkout data received:', data);
          setError('Invalid checkout data received. Please try again.');
          setLoading(false);
          return;
        }
        
        console.log("Checkout data retrieved successfully:", data);
        setCheckoutData(data);
        
        // OPTION 1: Use backend calculated totals if available
        if (data.total && data.subtotal && data.tax) {
          console.log('Using backend calculated totals:', {
            subtotal: data.subtotal,
            tax: data.tax,
            total: data.total
          });
          
          setTotals({
            subtotal: parseFloat(data.subtotal).toFixed(2),
            shipping: "0.00",
            tax: parseFloat(data.tax).toFixed(2),
            total: parseFloat(data.total).toFixed(2)
          });
        } else {
          // OPTION 2: Calculate frontend totals (fallback)
          const subtotal = data.items.reduce(
            (sum, item) => sum + (parseFloat(item.price) * item.quantity), 0
          );
          
          const shipping = 0; // Always 0 - no shipping charges
          const tax = subtotal * 0.18; // 18% GST
          const total = subtotal + tax; // No shipping added
          
          console.log('Using frontend calculated totals:', {
            subtotal: subtotal.toFixed(2),
            shipping: shipping.toFixed(2),
            tax: tax.toFixed(2),
            total: total.toFixed(2)
          });
          
          setTotals({
            subtotal: subtotal.toFixed(2),
            shipping: shipping.toFixed(2),
            tax: tax.toFixed(2),
            total: total.toFixed(2)
          });
        }
        
        setLoading(false);
      } catch (err) {
        console.error('Error fetching checkout details:', err);
        
        if (err.response) {
          console.error('Error response:', err.response.data);
          console.error('Error status:', err.response.status);
        }
        
        setError('Failed to load checkout information. Please try again.');
        setLoading(false);
      }
    };

    fetchCheckoutDetails();
  }, [checkoutId]);

  const initializeRazorpay = () => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      
      const timeoutId = setTimeout(() => {
        console.error('Razorpay script load timed out');
        resolve(false);
        setError('Payment gateway timed out. Please refresh and try again.');
      }, 5000);
      
      script.onload = () => {
        clearTimeout(timeoutId);
        console.log("Razorpay SDK loaded successfully");
        resolve(true);
      };
      
      script.onerror = () => {
        clearTimeout(timeoutId);
        console.error("Razorpay SDK failed to load");
        resolve(false);
        setError('Payment gateway failed to load. Please check your internet connection.');
      };
      
      document.body.appendChild(script);
    });
  };

  const makePayment = async () => {
    try {
      setProcessing(true);
      setError(null);
      
      const res = await initializeRazorpay();
      
      if (!res) {
        setError('Payment gateway could not be initialized. Please try again later.');
        setProcessing(false);
        return;
      }

      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('You must be logged in to make a payment. Please log in and try again.');
        setProcessing(false);
        return;
      }

      console.log('Creating RazorPay order for checkout:', checkoutId);
      console.log('Total amount being sent:', totals.total);
      
      try {
        // Create Razorpay order
        const response = await axios.post(
          `${API_URL}/checkout/${checkoutId}/create-razorpay-order/`,
          {},
          {
            headers: { 
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            }
          }
        );

        console.log('RazorPay order created:', response.data);
        
        const { key_id, order_id, amount, currency, name, email, contact } = response.data;
        
        if (!order_id) {
          throw new Error('Invalid order response from server');
        }
        
        // VERIFY: Log the amount received from backend vs our calculated total
        const backendAmountInRupees = (amount / 100);
        const frontendTotal = parseFloat(totals.total);
        
        console.log('Amount verification:', {
          backendAmount: backendAmountInRupees,
          frontendTotal: frontendTotal,
          difference: Math.abs(backendAmountInRupees - frontendTotal)
        });
        
        // Warn if there's a significant difference
        if (Math.abs(backendAmountInRupees - frontendTotal) > 0.01) {
          console.warn('Amount mismatch between frontend and backend!');
        }
        
        let customerName = name || "Valued Customer";
        
        // Configuration options for Razorpay
        const options = {
          key: key_id,
          amount: amount, // Use the amount from backend (in paisa)
          currency: currency || "INR",
          name: "Fashion Ke Sang",
          description: `Order #${checkoutId}`,
          image: "/images/logo.png",
          order_id: order_id,
          handler: async function (response) {
            try {
              const paymentData = {
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_signature: response.razorpay_signature
              };
              
              console.log('Verifying payment:', paymentData);
              
              const verifyResponse = await axios.post(
                `${API_URL}/checkout/${checkoutId}/verify-payment/`,
                paymentData,
                {
                  headers: { 
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json'
                  }
                }
              );
              
              console.log('Payment verification response:', verifyResponse.data);
              
              if (verifyResponse.data.success) {
                setPaymentSuccess(true);
                setOrderId(verifyResponse.data.order_id);
                
                setTimeout(() => {
                  navigate('/orders');
                }, 2000);
              } else {
                setError('Payment verification failed. Please contact customer service.');
              }
            } catch (err) {
              console.error('Payment verification error:', err);
              const errorMessage = err.response?.data?.detail || 
                                  err.response?.data?.error || 
                                  'Payment verification failed. Please try again.';
              setError(errorMessage);
            } finally {
              setProcessing(false);
            }
          },
          prefill: {
            name: customerName,
            email: email || "",
            contact: contact || ""
          },
          notes: {
            checkout_id: checkoutId
          },
          theme: {
            color: "#D4AF37"
          },
          modal: {
            ondismiss: function() {
              console.log("Payment modal dismissed");
              setProcessing(false);
            },
            escape: false,
            backdropclose: false
          }
        };

        const paymentObject = new window.Razorpay(options);
        
        paymentObject.on('payment.failed', function (response) {
          console.error('Payment failed:', response.error);
          setError(`Payment failed: ${response.error.description}`);
          setProcessing(false);
        });
        
        paymentObject.open();
      } catch (orderError) {
        console.error('Error creating RazorPay order:', orderError);
        console.error('Response data:', orderError.response?.data);
        console.error('Response status:', orderError.response?.status);
        
        let errorMessage = 'Failed to create payment order. Please try again.';
        
        if (orderError.response?.status === 400) {
          errorMessage = orderError.response.data.detail || 'Invalid checkout data. Please check your information.';
        } else if (orderError.response?.status === 500) {
          errorMessage = 'Server error while processing payment. Please try again later or contact support.';
        } else if (orderError.message) {
          errorMessage = orderError.message;
        }
        
        setError(errorMessage);
        setProcessing(false);
      }
    } catch (err) {
      console.error('General payment error:', err);
      setError('Failed to initialize payment. Please try again.');
      setProcessing(false);
    }
  };

  // Format price consistently
  const formatPrice = (price) => {
    if (price === undefined || price === null) return '0.00';
    return parseFloat(price).toFixed(2);
  };
  
  // Improved image URL function using getImageUrl utility
  const getCheckoutItemImageUrl = (item) => {
    console.log('Processing payment item for image:', {
      product_name: item.product_name,
      product_image: item.product_image,
      image_url: item.image_url,
      image: item.image
    });
    
    // First priority: product_image field (likely from backend)
    if (item.product_image) {
      console.log('Using product_image field:', item.product_image);
      return getImageUrl(item.product_image);
    }
    
    // Second priority: other image fields
    const fallbackImage = item.image_url || item.image;
    if (fallbackImage) {
      console.log('Using fallback image field:', fallbackImage);
      return getImageUrl(fallbackImage);
    }
    
    // Final fallback: placeholder
    console.log('No image source found, using placeholder');
    return '/images/placeholder-product.webp';
  };

  if (loading) {
    return (
      <div className="payment-container">
        <div className="payment-loading">
          <div className="payment-spinner"></div>
          <p>Loading payment details...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="payment-container">
        <div className="payment-error">
          <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="12" y1="8" x2="12" y2="12"></line>
            <line x1="12" y1="16" x2="12.01" y2="16"></line>
          </svg>
          <h2>Payment Error</h2>
          <p>{error}</p>
          <div className="payment-actions">
            <button 
              className="secondary-button"
              onClick={() => navigate(`/checkout/${checkoutId}`)}
            >
              Back to Checkout
            </button>
            <button 
              className="primary-button"
              onClick={() => window.location.reload()}
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (paymentSuccess) {
    return (
      <div className="payment-container">
        <div className="payment-success">
          <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#4CAF50" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
            <polyline points="22 4 12 14.01 9 11.01"></polyline>
          </svg>
          <h2>Payment Successful!</h2>
          <p>Your order #{orderId} has been confirmed.</p>
          <p>Redirecting to your order details...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="payment-container">
      <div className="payment-header">
        <h1>Complete Your Payment</h1>
        <p>Your order is almost ready to be processed.</p>
      </div>

      <div className="payment-details">
        <div className="payment-summary">
          <h2>Order Summary</h2>
          <div className="payment-items">
            {checkoutData?.items && checkoutData.items.map((item, index) => (
              <div key={index} className="payment-item">
                <div className="item-image">
                  <img 
                    src={getCheckoutItemImageUrl(item)} 
                    alt={item.product_name || item.name} 
                    onError={(e) => {
                      console.error(`Payment image failed to load for ${item.product_name || item.name}:`, e.target.src);
                      if (!e.target.src.includes('placeholder')) {
                        e.target.src = '/images/placeholder-product.webp';
                      }
                    }}
                    onLoad={() => console.log(`✅ Payment image loaded for ${item.product_name || item.name}`)}
                  />
                  <span className="item-quantity">{item.quantity}</span>
                </div>
                <div className="item-details">
                  <h4>{item.product_name || item.name}</h4>
                  {item.variant && <p className="item-variant">{item.variant}</p>}
                </div>
                <div className="item-price">₹{formatPrice(item.price * item.quantity)}</div>
              </div>
            ))}
          </div>

          {/* UPDATED: Clear display showing no shipping charges */}
          <div className="payment-totals">
            <div className="total-row">
              <span>Subtotal</span>
              <span>₹{totals.subtotal}</span>
            </div>
            <div className="total-row">
              <span>Shipping</span>
              <span className="free-shipping">FREE</span>
            </div>
            <div className="total-row">
              <span>GST (18%)</span>
              <span>₹{totals.tax}</span>
            </div>
            <div className="total-row grand-total">
              <span>Total (Subtotal + GST)</span>
              <span>₹{totals.total}</span>
            </div>
          </div>
        </div>

        <div className="payment-methods">
          <h2>Payment Method</h2>
          <div className="razorpay-method">
            <div className="razorpay-logo">
              <svg viewBox="0 0 80 18" height="26" width="115" className="razorpay-logo-svg">
                <path d="M76.96 17.93h-2.558c-.29 0-.485-.097-.584-.29-.1-.195-.103-.392-.01-.593l4.42-9.692-1.16-2.55c-.118-.258-.122-.516-.01-.774.11-.258.333-.387.667-.387h2.559c.387 0 .645.193.774.58l1.257 2.744c.043.097.09.153.14.167.048.15.097-.03.147-.135L87.79 3.67c.172-.34.43-.51.774-.51h2.558c.334 0 .559.123.667.367.11.245.107.495-.01.753l-7.138 14.139c-.162.323-.419.484-.77.484h-2.558c-.323 0-.537-.118-.645-.354-.108-.237-.108-.477 0-.72l1.195-2.615c.043-.096.043-.183 0-.258-.042-.075-.1-.113-.172-.113-.073 0-.142.038-.205.113l-3.706 8.136c-.162.342-.419.512-.77.512z" fill="#072654"></path>
              </svg>
            </div>
            <p className="payment-info">You will be redirected to Razorpay's secure payment gateway to complete your purchase.</p>
            
            <button 
              className={`primary-button pay-button ${processing ? 'processing' : ''}`}
              onClick={makePayment}
              disabled={processing}
            >
              {processing ? (
                <>
                  <span className="payment-spinner-small"></span>
                  Processing...
                </>
              ) : (
                <>Pay ₹{totals.total} (No Shipping Charges)</>
              )}
            </button>
          </div>
          
          <div className="payment-security">
            <div className="security-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
            </div>
            <p>We use bank-grade security and SSL encryption to ensure your payment data is secure.</p>
          </div>
          
          <div className="payment-badges">
            <div className="badge">
              <span className="badge-icon">🔒</span>
              <span>Secure Payment</span>
            </div>
            <div className="badge">
              <span className="badge-icon">✓</span>
              <span>Verified by Visa</span>
            </div>
            <div className="badge">
              <span className="badge-icon">🛡️</span>
              <span>PCI Compliant</span>
            </div>
          </div>
        </div>
      </div>

      <div className="payment-footer">
        <button 
          className="secondary-button back-button"
          onClick={() => navigate(`/checkout/${checkoutId}`)}
          disabled={processing}
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          Back to Checkout
        </button>
        
        <div className="payment-support">
          Need help? <a href="/contact">Contact Support</a>
        </div>
      </div>
    </div>
  );
};

export default PaymentProcess;