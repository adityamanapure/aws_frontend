import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import api from '../../services/api';
import { X } from 'lucide-react';
import { getImageUrl } from '../../utils/imageUtils';
import '../../styles/account.css';

const Orders = () => {
  const location = useLocation();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [orderDetails, setOrderDetails] = useState(null);
  const [orderLoading, setOrderLoading] = useState(false);

  // Fetch orders on component mount
  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const ordersResponse = await api.get('/api/orders/myorders/');
        
        const ordersData = Array.isArray(ordersResponse.data) 
          ? ordersResponse.data 
          : ordersResponse.data.results || [];
          
        setOrders(ordersData);
      } catch (error) {
        console.error('Error fetching orders:', error);
        setMessage({ text: 'Failed to load orders', type: 'error' });
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  // Show success message if coming from successful payment
  useEffect(() => {
    if (location.state?.fromPayment) {
      setMessage({ 
        text: 'Your payment was successful! Your order has been placed.', 
        type: 'success' 
      });
      // Clear the state to prevent showing message on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  // Get image URL for order items
  const getOrderItemImageUrl = (item) => {
    // Priority 1: product_image field (stored when order was created)
    if (item.product_image) {
      return getImageUrl(item.product_image);
    }
    
    // Priority 2: fetched product images (from our enhanced fetch)
    if (item.fetched_images && item.fetched_images.length > 0) {
      return getImageUrl(item.fetched_images[0]);
    }
    
    // Priority 3: any other image fields
    const fallbackImage = item.image_url || item.image;
    if (fallbackImage) {
      return getImageUrl(fallbackImage);
    }
    
    // Final fallback: placeholder
    return '/images/placeholder-product.webp';
  };

  // Fetch order details function
  const fetchOrderDetails = async (orderId) => {
    setOrderLoading(true);
    try {
      const response = await api.get(`/api/orders/${orderId}/`);
      let orderData = response.data;
      
      // For each order item, try to fetch the product image if not already present
      if (orderData.items && orderData.items.length > 0) {
        const itemsWithImages = await Promise.all(
          orderData.items.map(async (item) => {
            // If item already has product_image, use it
            if (item.product_image) {
              return item;
            }
            
            // Try to fetch product details using product_id
            if (item.product_id) {
              try {
                const productResponse = await api.get(`/api/products/${item.product_id}/`);
                const product = productResponse.data;
                
                // Add fetched images to the item
                return {
                  ...item,
                  fetched_images: product.images || [],
                  product_details: product
                };
              } catch (productError) {
                return item;
              }
            } else {
              return item;
            }
          })
        );
        
        orderData = {
          ...orderData,
          items: itemsWithImages
        };
      }
      
      setOrderDetails(orderData);
    } catch (error) {
      console.error('Error fetching order details:', error);
      setMessage({ text: 'Failed to load order details', type: 'error' });
    } finally {
      setOrderLoading(false);
    }
  };

  const handleViewDetails = (order) => {
    setSelectedOrder(order);
    fetchOrderDetails(order.id);
  };

  const closeOrderDetails = () => {
    setSelectedOrder(null);
    setOrderDetails(null);
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending': return 'status-processing';
      case 'confirmed': return 'status-processing';
      case 'shipped': return 'status-shipped';
      case 'delivered': return 'status-delivered';
      case 'cancelled': return 'status-cancelled';
      default: return 'status-processing';
    }
  };

  if (loading) {
    return (
      <div className="account-container">
        <div className="loading-container">
          <div className="loading-text">Loading your orders...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="account-container">
      <h1 className="account-title">My Orders</h1>
      
      {message.text && (
        <div className={`message-alert ${message.type === 'success' ? 'message-success' : 'message-error'}`}>
          {message.text}
        </div>
      )}

      <div className="account-panel">
        <div className="tab-content">
          {orders.length === 0 ? (
            <div className="empty-orders-state">
              <div className="empty-orders-icon">📦</div>
              <h3>No Orders Yet</h3>
              <p>You haven't placed any orders yet. Start shopping to see your orders here!</p>
              <a href="/products" className="submit-button">
                Start Shopping
              </a>
            </div>
          ) : (
            <>
              <div className="orders-header">
                <h2 className="section-title">Order History</h2>
                <p className="orders-count">
                  {orders.length} order{orders.length !== 1 ? 's' : ''} found
                </p>
              </div>

              <div className="orders-table-container">
                <table className="orders-table">
                  <thead>
                    <tr>
                      <th>Order ID</th>
                      <th>Date</th>
                      <th>Items</th>
                      <th>Total</th>
                      <th>Status</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orders.map((order) => (
                      <tr key={order.id}>
                        <td>
                          <span className="order-id">#{order.id}</span>
                        </td>
                        <td>
                          <span className="order-date">
                            {new Date(order.created_at || order.createdAt).toLocaleDateString('en-US', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric'
                            })}
                          </span>
                        </td>
                        <td>
                          <span className="order-items-count">
                            {order.items?.length || 0} item{(order.items?.length || 0) !== 1 ? 's' : ''}
                          </span>
                        </td>
                        <td>
                          <span className="order-total">
                            ₹{parseFloat(order.total_amount || order.totalAmount || 0).toFixed(2)}
                          </span>
                        </td>
                        <td>
                          <span className={`status-badge ${getStatusColor(order.status)}`}>
                            {order.status || 'Pending'}
                          </span>
                        </td>
                        <td>
                          <button 
                            className="action-link"
                            onClick={() => handleViewDetails(order)}
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Order Details Modal */}
              {selectedOrder && (
                <div className="order-details-overlay">
                  <div className="order-details-modal">
                    <div className="order-details-header">
                      <h3>Order Details #{selectedOrder.id}</h3>
                      <button 
                        className="close-btn"
                        onClick={closeOrderDetails}
                      >
                        <X size={20} />
                      </button>
                    </div>

                    {orderLoading ? (
                      <div className="loading-details">Loading order details...</div>
                    ) : orderDetails ? (
                      <div className="order-details-content">
                        {/* Order Status */}
                        <div className="order-status-section">
                          <h4>Order Status</h4>
                          <div className="status-timeline">
                            <div className={`status-step ${['pending', 'confirmed', 'shipped', 'delivered'].includes(orderDetails.status?.toLowerCase()) ? 'active' : ''}`}>
                              <div className="step-icon">1</div>
                              <div className="step-label">Pending</div>
                            </div>
                            <div className={`status-step ${['confirmed', 'shipped', 'delivered'].includes(orderDetails.status?.toLowerCase()) ? 'active' : ''}`}>
                              <div className="step-icon">2</div>
                              <div className="step-label">Confirmed</div>
                            </div>
                            <div className={`status-step ${['shipped', 'delivered'].includes(orderDetails.status?.toLowerCase()) ? 'active' : ''}`}>
                              <div className="step-icon">3</div>
                              <div className="step-label">Shipped</div>
                            </div>
                            <div className={`status-step ${['delivered'].includes(orderDetails.status?.toLowerCase()) ? 'active' : ''}`}>
                              <div className="step-icon">4</div>
                              <div className="step-label">Delivered</div>
                            </div>
                          </div>
                        </div>

                        {/* Order Items */}
                        <div className="order-items-section">
                          <h4>Items</h4>
                          <div className="order-items-list">
                            {orderDetails.items && orderDetails.items.length > 0 ? (
                              orderDetails.items.map((item, index) => (
                                <div className="order-item" key={item.id || index}>
                                  <div className="item-image">
                                    <img 
                                      src={getOrderItemImageUrl(item)}
                                      alt={item.product_title || 'Product'} 
                                      onError={(e) => {
                                        if (!e.target.src.includes('placeholder')) {
                                          e.target.src = '/images/placeholder-product.webp';
                                        }
                                      }}
                                    />
                                  </div>
                                  <div className="item-details">
                                    <h5>{item.product_title || `Item #${index + 1}`}</h5>
                                    <p className="item-price">
                                      ₹{parseFloat(item.product_price || 0).toFixed(2)} x {item.quantity || 1}
                                    </p>
                                    <p className="item-subtotal">
                                      ₹{parseFloat(item.total_price || 0).toFixed(2)}
                                    </p>
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="no-items-message">No items found in this order</div>
                            )}
                          </div>
                        </div>

                        {/* Order Summary */}
                        <div className="order-summary-section">
                          <h4>Summary</h4>
                          <div className="summary-row">
                            <span>Items Subtotal:</span>
                            <span>₹{parseFloat(
                              orderDetails.items?.reduce((sum, item) => sum + parseFloat(item.total_price || 0), 0) || 0
                            ).toFixed(2)}</span>
                          </div>
                          <div className="summary-row">
                            <span>Tax & Fees:</span>
                            <span>₹{(parseFloat(orderDetails.total_amount || 0) - 
                              parseFloat(orderDetails.items?.reduce((sum, item) => sum + parseFloat(item.total_price || 0), 0) || 0)
                            ).toFixed(2)}</span>
                          </div>
                          <div className="summary-row total">
                            <span>Total:</span>
                            <span>₹{parseFloat(orderDetails.total_amount || 0).toFixed(2)}</span>
                          </div>
                        </div>

                        {/* Payment Information */}
                        <div className="payment-details-section">
                          <h4>Payment Information</h4>
                          <p><strong>Payment Status:</strong> {orderDetails.payment_status || 'N/A'}</p>
                          <p><strong>Payment ID:</strong> {orderDetails.payment_id || 'N/A'}</p>
                          <p><strong>Order Date:</strong> {new Date(orderDetails.created_at).toLocaleDateString()} {new Date(orderDetails.created_at).toLocaleTimeString()}</p>
                        </div>

                        {/* User Information */}
                        <div className="shipping-details-section">
                          <h4>Shipping Information</h4>
                          <p><strong>Name:</strong> {orderDetails.user?.full_name || 'N/A'}</p>
                          <p><strong>Email:</strong> {orderDetails.user?.email || 'N/A'}</p>
                          <p><strong>Phone:</strong> {orderDetails.user?.phone || 'N/A'}</p>
                          <p><strong>Address:</strong> {orderDetails.address || 'Not provided'}</p>
                        </div>

                        {/* Customer Support */}
                        <div className="support-section">
                          <h4>Need Help?</h4>
                          <p>Contact our customer service team:</p>
                          <p><strong>Email:</strong> support@fashionkesang.com</p>
                          <p><strong>Phone:</strong> +91 (123) 456-7890</p>
                          <p><strong>Hours:</strong> Mon-Sat 10:00 AM - 6:00 PM</p>
                        </div>
                      </div>
                    ) : (
                      <div className="error-details">Failed to load order details</div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Orders;