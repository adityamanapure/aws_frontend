import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getCheckout, updateCheckout, processPayment } from '../../services/checkoutService';
import { useAuth } from '../../context/AuthContext';
import { getImageUrl, handleImageError } from '../../utils/imageUtils';
import api from '../../services/api';
import '../../styles/checkout.css';

const CheckoutForm = () => {
  const { checkoutId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [checkoutData, setCheckoutData] = useState(null);
  const [error, setError] = useState(null);
  const [step, setStep] = useState(1);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [paymentCompleted, setPaymentCompleted] = useState(false);
  const [orderId, setOrderId] = useState(null);
  const [imagesLoaded, setImagesLoaded] = useState(false);

  // Helper function to extract first name from user data
  const getUserFirstName = () => {
    if (user?.first_name) return user.first_name;
    if (user?.full_name) {
      const nameParts = user.full_name.split(' ');
      return nameParts[0] || '';
    }
    if (user?.email) {
      return user.email.split('@')[0] || '';
    }
    return '';
  };

  // Helper function to extract last name from user data
  const getUserLastName = () => {
    if (user?.last_name) return user.last_name;
    if (user?.full_name) {
      const nameParts = user.full_name.split(' ');
      return nameParts.slice(1).join(' ') || '';
    }
    return '';
  };

  // Form state
  const [formData, setFormData] = useState({
    // Customer information - Fixed to use helper functions
    firstName: getUserFirstName(),
    lastName: getUserLastName(),
    email: user?.email || '',
    phone: user?.phone || '',

    // Shipping address
    address: '',
    apartment: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'IN',

    // Shipping method
    shippingMethod: 'standard',

    // Billing address
    sameAsShipping: true,
    billingAddress: '',
    billingApartment: '',
    billingCity: '',
    billingState: '',
    billingZipCode: '',
    billingCountry: 'IN',

    // Order notes
    orderNotes: ''
  });

  // Validation state
  const [errors, setErrors] = useState({});

  // Update form data when user changes
  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        firstName: getUserFirstName(),
        lastName: getUserLastName(),
        email: user?.email || prev.email,
        phone: user?.phone || prev.phone,
      }));
    }
  }, [user]);

  // Fetch checkout data
  useEffect(() => {
    const fetchCheckoutData = async () => {
      try {
        setIsLoading(true);
        const data = await getCheckout(checkoutId);
        console.log('Fetched checkout data:', data);
        setCheckoutData(data);

        // Pre-fill form with user data if available
        if (data.customer) {
          setFormData(prev => ({
            ...prev,
            firstName: data.customer.first_name || prev.firstName,
            lastName: data.customer.last_name || prev.lastName,
            email: data.customer.email || prev.email,
            phone: data.customer.phone || prev.phone,
            address: data.shipping_address?.address_line1 || prev.address,
            apartment: data.shipping_address?.address_line2 || prev.apartment,
            city: data.shipping_address?.city || prev.city,
            state: data.shipping_address?.state || prev.state,
            zipCode: data.shipping_address?.pin_code || prev.zipCode,
            country: data.shipping_address?.country || prev.country
          }));
        }

        setIsLoading(false);
      } catch (err) {
        console.error('Error fetching checkout:', err);
        setError('Unable to load checkout information. Please try again.');
        setIsLoading(false);
      }
    };

    if (checkoutId) {
      fetchCheckoutData();
    }
  }, [checkoutId]);

  // Fetch product images
  useEffect(() => {
    const fetchProductImages = async () => {
      if (!checkoutData?.items || imagesLoaded) return;
      
      console.log('Fetching product images for checkout items...');
      
      try {
        let hasChanges = false;
        const itemsWithImages = await Promise.all(
          checkoutData.items.map(async (item) => {
            if (item.images && item.images.length > 0) {
              return item;
            }
            
            if (item.product_image) {
              return {
                ...item,
                images: [item.product_image]
              };
            }
            
            if (item.product_id && !item.imagesFetched) {
              try {
                console.log(`Fetching details for product ID: ${item.product_id}`);
                const response = await api.get(`/api/products/${item.product_id}/`);
                console.log('Product details response:', response.data);
                
                hasChanges = true;
                return {
                  ...item,
                  images: response.data.images || [],
                  product_image: response.data.images?.[0] || null,
                  imagesFetched: true
                };
              } catch (err) {
                console.error(`Error fetching product details for ID ${item.product_id}:`, err);
                return {
                  ...item,
                  imagesFetched: true
                };
              }
            }
            return item;
          })
        );
        
        if (hasChanges) {
          console.log('Updating checkout data with fetched images');
          setCheckoutData(prev => ({
            ...prev,
            items: itemsWithImages
          }));
        }
        
        setImagesLoaded(true);
      } catch (err) {
        console.error('Error fetching product images:', err);
        setImagesLoaded(true);
      }
    };
    
    fetchProductImages();
  }, [checkoutData?.items?.length, imagesLoaded]);

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (type === 'checkbox') {
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }

    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  // Validate current step
  const validateStep = () => {
    const newErrors = {};

    if (step === 1) {
      if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
      if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
      if (!formData.email.trim()) {
        newErrors.email = 'Email is required';
      } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
        newErrors.email = 'Please enter a valid email';
      }
      if (!formData.phone.trim()) newErrors.phone = 'Phone number is required';
    } else if (step === 2) {
      if (!formData.address.trim()) newErrors.address = 'Address is required';
      if (!formData.city.trim()) newErrors.city = 'City is required';
      if (!formData.state.trim()) newErrors.state = 'State is required';
      if (!formData.zipCode.trim()) newErrors.zipCode = 'ZIP code is required';

      if (!formData.sameAsShipping) {
        if (!formData.billingAddress.trim()) newErrors.billingAddress = 'Billing address is required';
        if (!formData.billingCity.trim()) newErrors.billingCity = 'Billing city is required';
        if (!formData.billingState.trim()) newErrors.billingState = 'Billing state is required';
        if (!formData.billingZipCode.trim()) newErrors.billingZipCode = 'Billing ZIP code is required';
      }
    } else if (step === 3) {
      if (formData.paymentMethod === 'credit-card') {
        if (!formData.cardNumber.trim()) newErrors.cardNumber = 'Card number is required';
        if (!formData.cardName.trim()) newErrors.cardName = 'Name on card is required';
        if (!formData.expiryMonth) newErrors.expiryMonth = 'Expiry month is required';
        if (!formData.expiryYear) newErrors.expiryYear = 'Expiry year is required';
        if (!formData.cvv.trim()) newErrors.cvv = 'CVV is required';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Move to next step
  const nextStep = () => {
    if (validateStep()) {
      if (step === 2) {
        updateCheckoutInfo();
      }
      setStep(prev => prev + 1);
      window.scrollTo(0, 0);
    }
  };

  // Move to previous step
  const prevStep = () => {
    setStep(prev => prev - 1);
    window.scrollTo(0, 0);
  };

  // Update checkout info in backend
  const updateCheckoutInfo = async () => {
    try {
      const fullAddress = [
        formData.address,
        formData.city,
        formData.state,
        `PIN: ${formData.zipCode}`
      ].filter(Boolean).join(', ');

      console.log('Generated address string:', fullAddress);

      const shippingAddress = {
        address_line1: formData.address,
        address_line2: formData.apartment,
        city: formData.city,
        state: formData.state,
        pin_code: formData.zipCode
      };

      const checkoutData = {
        customer_info: {
          first_name: formData.firstName,
          last_name: formData.lastName,
          email: formData.email,
          phone: formData.phone
        },
        shipping_address: shippingAddress,
        shipping_method: formData.shippingMethod,
        order_notes: formData.orderNotes,
        address: fullAddress
      };

      console.log('Sending checkout data:', checkoutData);
      const response = await updateCheckout(checkoutId, checkoutData);
      console.log('Update checkout response:', response);

    } catch (err) {
      console.error('Error updating checkout:', err);
      if (err.response) {
        console.error('Error response:', err.response.data);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setProcessingPayment(true);

    try {
      await updateCheckoutInfo();
      navigate(`/payment/${checkoutId}`);
    } catch (err) {
      console.error('Error preparing for payment:', err);
      setError('Failed to prepare payment information. Please try again.');
      setProcessingPayment(false);
    }
  };

  // Submit function to move from step 2 to step 3
  const submit = () => {
    if (validateStep()) {
      updateCheckoutInfo()
        .then(() => {
          setStep(3);
          window.scrollTo(0, 0);
        })
        .catch((err) => {
          console.error('Error updating checkout information:', err);
          setError('Failed to update checkout information. Please try again.');
        });
    }
  };

  // Calculate totals
  const calculateTotals = () => {
    if (!checkoutData) return { subtotal: 0, tax: 0, total: 0 };

    const subtotal = checkoutData.items.reduce(
      (sum, item) => sum + (item.price * item.quantity), 0
    );

    const tax = subtotal * 0.18;
    const total = subtotal + tax;

    return {
      subtotal: subtotal.toFixed(2),
      tax: tax.toFixed(2),
      total: total.toFixed(2)
    };
  };

  // Get totals
  const totals = calculateTotals();

  // Loading state
  if (isLoading) {
    return (
      <div className="checkout-loading">
        <div className="loader"></div>
        <p>Loading your checkout information...</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="checkout-error">
        <h2>There was a problem</h2>
        <p>{error}</p>
        <button
          className="primary-button"
          onClick={() => window.location.reload()}
        >
          Try Again
        </button>
      </div>
    );
  }

  // Empty cart state
  if (!checkoutData || !checkoutData.items || checkoutData.items.length === 0) {
    return (
      <div className="empty-checkout">
        <h2>Your cart is empty</h2>
        <p>Add some products to your cart before proceeding to checkout.</p>
        <button
          className="primary-button"
          onClick={() => navigate('/products')}
        >
          Continue Shopping
        </button>
      </div>
    );
  }

  // Payment confirmation state
  if (paymentCompleted) {
    return (
      <div className="checkout-container">
        <div className="payment-success">
          <div className="success-icon">
            <svg xmlns="http://www.w3.org/2000/svg" width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="#4CAF50" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
              <polyline points="22 4 12 14.01 9 11.01"></polyline>
            </svg>
          </div>
          <h2>Payment Successful!</h2>
          <p>Thank you for your purchase. Your order has been confirmed.</p>
          <p>Order ID: {orderId}</p>
          <div className="success-actions">
            <button
              className="primary-button"
              onClick={() => navigate(`/orders/${orderId}`)}
            >
              View Order Details
            </button>
            <button
              className="secondary-button"
              onClick={() => navigate('/products')}
            >
              Continue Shopping
            </button>
          </div>
        </div>
      </div>
    );
  }

  const getCheckoutItemImageUrl = (item) => {
    console.log('Getting image URL for item:', {
        product_name: item.product_name,
        images: item.images,
        product_image: item.product_image,
        image_url: item.image_url,
        image: item.image
      });
      
      // First priority: images array
      if (item.images && Array.isArray(item.images) && item.images.length > 0) {
        const firstImage = item.images[0];
        console.log('Using images array, first image:', firstImage);
        
        // Handle object format
        if (typeof firstImage === 'object' && firstImage.url) {
          return getImageUrl(firstImage.url);
        }
        
        // Handle string format
        if (typeof firstImage === 'string') {
          return getImageUrl(firstImage);
        }
      }
      
      // Second priority: product_image field
      if (item.product_image) {
        console.log('Using product_image field:', item.product_image);
        return getImageUrl(item.product_image);
      }
      
      // Third priority: other image fields
      const fallbackImage = item.image_url || item.image;
      if (fallbackImage) {
        console.log('Using fallback image field:', fallbackImage);
        return getImageUrl(fallbackImage);
      }
      
      // Final fallback: placeholder
      console.log('No image found, using placeholder');
      return '/images/placeholder-product.webp';
    };

  return (
    <div className="checkout-container">
      <div className="checkout-header">
        <h1>Checkout</h1>
        <div className="checkout-steps">
          <div className={`step ${step >= 1 ? 'active' : ''}`}>
            <div className="step-number">1</div>
            <span>Customer Info</span>
          </div>
          <div className="step-divider"></div>
          <div className={`step ${step >= 2 ? 'active' : ''}`}>
            <div className="step-number">2</div>
            <span>Shipping</span>
          </div>
          <div className="step-divider"></div>
          <div className={`step ${step >= 3 ? 'active' : ''}`}>
            <div className="step-number">3</div>
            <span>Payment</span>
          </div>
        </div>
      </div>

      <div className="checkout-content">
        <div className="checkout-form-container">
          <form onSubmit={handleSubmit}>
            {/* Step 1: Customer Information */}
            {step === 1 && (
              <div className="checkout-step">
                <h2>Customer Information</h2>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="firstName">First Name *</label>
                    <input
                      type="text"
                      id="firstName"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      className={errors.firstName ? 'error' : ''}
                    />
                    {errors.firstName && <div className="error-message">{errors.firstName}</div>}
                  </div>
                  <div className="form-group">
                    <label htmlFor="lastName">Last Name *</label>
                    <input
                      type="text"
                      id="lastName"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      className={errors.lastName ? 'error' : ''}
                    />
                    {errors.lastName && <div className="error-message">{errors.lastName}</div>}
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="email">Email Address *</label>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      className={errors.email ? 'error' : ''}
                    />
                    {errors.email && <div className="error-message">{errors.email}</div>}
                  </div>
                  <div className="form-group">
                    <label htmlFor="phone">Phone Number *</label>
                    <input
                      type="tel"
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      className={errors.phone ? 'error' : ''}
                    />
                    {errors.phone && <div className="error-message">{errors.phone}</div>}
                  </div>
                </div>

                <div className="form-actions">
                  <button
                    type="button"
                    className="primary-button"
                    onClick={nextStep}
                  >
                    Continue to Shipping
                  </button>
                </div>
              </div>
            )}

            {/* Step 2: Shipping Information */}
            {step === 2 && (
              <div className="checkout-step">
                <h2>Shipping Information</h2>
                
                <div className="form-group">
                  <label htmlFor="address">Complete Address *</label>
                  <input
                    type="text"
                    id="address"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    className={errors.address ? 'error' : ''}
                    placeholder="House/Flat No., Building Name, Street"
                  />
                  {errors.address && <div className="error-message">{errors.address}</div>}
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="city">City/Town *</label>
                    <input
                      type="text"
                      id="city"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      className={errors.city ? 'error' : ''}
                    />
                    {errors.city && <div className="error-message">{errors.city}</div>}
                  </div>
                  <div className="form-group">
                    <label htmlFor="state">State *</label>
                    <select
                      id="state"
                      name="state"
                      value={formData.state}
                      onChange={handleChange}
                      className={errors.state ? 'error' : ''}
                    >
                      <option value="">Select State</option>
                      <option value="Andhra Pradesh">Andhra Pradesh</option>
                      <option value="Arunachal Pradesh">Arunachal Pradesh</option>
                      <option value="Assam">Assam</option>
                      <option value="Bihar">Bihar</option>
                      <option value="Chhattisgarh">Chhattisgarh</option>
                      <option value="Goa">Goa</option>
                      <option value="Gujarat">Gujarat</option>
                      <option value="Haryana">Haryana</option>
                      <option value="Himachal Pradesh">Himachal Pradesh</option>
                      <option value="Jharkhand">Jharkhand</option>
                      <option value="Karnataka">Karnataka</option>
                      <option value="Kerala">Kerala</option>
                      <option value="Madhya Pradesh">Madhya Pradesh</option>
                      <option value="Maharashtra">Maharashtra</option>
                      <option value="Manipur">Manipur</option>
                      <option value="Meghalaya">Meghalaya</option>
                      <option value="Mizoram">Mizoram</option>
                      <option value="Nagaland">Nagaland</option>
                      <option value="Odisha">Odisha</option>
                      <option value="Punjab">Punjab</option>
                      <option value="Rajasthan">Rajasthan</option>
                      <option value="Sikkim">Sikkim</option>
                      <option value="Tamil Nadu">Tamil Nadu</option>
                      <option value="Telangana">Telangana</option>
                      <option value="Tripura">Tripura</option>
                      <option value="Uttar Pradesh">Uttar Pradesh</option>
                      <option value="Uttarakhand">Uttarakhand</option>
                      <option value="West Bengal">West Bengal</option>
                      <option value="Delhi">Delhi</option>
                    </select>
                    {errors.state && <div className="error-message">{errors.state}</div>}
                  </div>
                </div>

                <div className="form-group">
                  <label htmlFor="zipCode">PIN Code *</label>
                  <input
                    type="text"
                    id="zipCode"
                    name="zipCode"
                    value={formData.zipCode}
                    onChange={handleChange}
                    className={errors.zipCode ? 'error' : ''}
                    placeholder="6-digit PIN Code"
                    maxLength="6"
                  />
                  {errors.zipCode && <div className="error-message">{errors.zipCode}</div>}
                  <small className="form-text">Delivery availability depends on your PIN code</small>
                </div>

                <div className="form-actions">
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={prevStep}
                  >
                    Back
                  </button>
                  <button
                    type="button"
                    className="primary-button"
                    onClick={nextStep}
                  >
                    Continue to Payment
                  </button>
                </div>
              </div>
            )}

            {/* Step 3: Payment Information */}
            {step === 3 && (
              <div className="checkout-step">
                <h2>Payment Method</h2>
                <div className="payment-info">
                  <div className="razorpay-container">
                    <div className="razorpay-logo">
                      <img
                        src="/images/razorpay-logo.png"
                        alt="RazorPay"
                        onError={(e) => {
                          e.target.style.display = "none";
                        }}
                      />
                      <span className="payment-label">Secure Payment via RazorPay</span>
                    </div>
                    <p className="payment-description">
                      You'll be redirected to RazorPay's secure payment gateway to complete your transaction.
                      Your payment information is encrypted and protected.
                    </p>
                    <div className="payment-security-info">
                      <div className="security-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                          <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
                        </svg>
                      </div>
                      <p>All transactions are secure and encrypted</p>
                    </div>
                  </div>
                </div>

                <div className="order-review">
                  <h3>Order Review</h3>
                  <p>Please review your order details before proceeding to payment.</p>

                  <div className="order-summary-compact">
                    <div className="summary-row">
                      <span>Items ({checkoutData.items.length}):</span>
                      <span>₹{totals.subtotal}</span>
                    </div>
                   
                    <div className="summary-row">
                      <span>GST (18%):</span>
                      <span>₹{totals.tax}</span>
                    </div>
                    <div className="summary-row total">
                      <span>Total:</span>
                      <span>₹{totals.total}</span>
                    </div>
                  </div>
                </div>

                <div className="form-actions">
                  <button
                    type="button"
                    className="secondary-button"
                    onClick={prevStep}
                    disabled={processingPayment}
                  >
                    Back to Shipping
                  </button>
                  <button
                    type="button"
                    className={`primary-button ${processingPayment ? 'loading' : ''}`}
                    onClick={handleSubmit}
                    disabled={processingPayment}
                  >
                    {processingPayment ? (
                      <>
                        <span className="loader-small"></span>
                        Processing...
                      </>
                    ) : (
                      `Proceed to Pay ₹${totals.total}`
                    )}
                  </button>
                </div>
              </div>
            )}
          </form>
        </div>

        <div className="checkout-summary">
          <div className="summary-header">
            <h2>Order Summary</h2>
            <span className="item-count">{checkoutData.items.length} item{checkoutData.items.length !== 1 ? 's' : ''}</span>
          </div>

          <div className="order-items">
            {checkoutData.items.map((item, index) => {
              return (
                <div key={index} className="order-item">
                  <div className="item-image">
                    <img 
                      src={getCheckoutItemImageUrl(item)} 
                      alt={item.product_name || item.name} 
                      className="product-image"
                      onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = '/images/placeholder-product.webp';
                      }}
                    />
                    <span className="item-quantity">{item.quantity}</span>
                  </div>
                  <div className="item-details">
                    <h4>{item.product_name || item.name}</h4>
                    {item.variant && <p className="item-variant">{item.variant}</p>}
                  </div>
                  <div className="item-price">₹{(item.price * item.quantity).toFixed(2)}</div>
                </div>
              );
            })}
          </div>

          <div className="price-breakdown">
            <div className="price-row">
              <span>Subtotal</span>
              <span>₹{totals.subtotal}</span>
            </div>
            
            <div className="price-row">
              <span>GST (18%)</span>
              <span>₹{totals.tax}</span>
            </div>
            <div className="price-row total">
              <span>Total</span>
              <span>₹{totals.total}</span>
            </div>
          </div>

          <div className="secure-checkout">
            <div className="secure-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
            </div>
            <p>Secure checkout - Your data is protected</p>
          </div>

          <div className="payment-icons">
            <span>We accept:</span>
            <div className="icons">
              <span className="payment-icon">💳</span>
              <span className="payment-icon">
                <svg width="28" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M20.067 7.301C20.067 9.444 19.013 11.098 17.153 11.907C18.551 12.753 19.432 14.205 19.432 15.868C19.432 18.534 17.301 20.665 14.635 20.665H10.279C9.904 20.665 9.6 20.36 9.6 19.985V18.647H7.699C7.324 18.647 7.02 18.343 7.02 17.969V15.336C7.02 14.962 7.324 14.657 7.699 14.657H9.6V13.319H7.699C7.324 13.319 7.02 13.014 7.02 12.64V10.006C7.02 9.632 7.324 9.328 7.699 9.328H9.6V3.991C9.6 3.617 9.904 3.312 10.279 3.312H15.302C17.968 3.312 20.067 5.443 20.067 8.109V7.301ZM14.635 14.657C13.11 14.657 11.868 15.899 11.868 17.424C11.868 18.95 13.11 20.191 14.635 20.191C16.16 20.191 17.402 18.95 17.402 17.424C17.402 15.899 16.16 14.657 14.635 14.657ZM15.302 3.786C13.776 3.786 12.535 5.028 12.535 6.553C12.535 8.079 13.776 9.32 15.302 9.32C16.827 9.32 18.068 8.079 18.068 6.553C18.068 5.028 16.827 3.786 15.302 3.786Z" fill="#0079C1"/>
                </svg>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutForm;