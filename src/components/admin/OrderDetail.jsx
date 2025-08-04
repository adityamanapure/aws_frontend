import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../../services/api';
import '../../styles/admin/OrderDetail.css';

const OrderDetail = () => {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusUpdating, setStatusUpdating] = useState(false);

  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        setLoading(true);
        
        // Make sure you're using the correct API endpoint
        const response = await api.get(`/api/admin/orders/${orderId}/`);
        
        console.log('Order details response:', response.data);
        
        // Set the order data
        setOrder(response.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching order details:', err);
        if (err.response) {
          console.error('Error response status:', err.response.status);
          console.error('Error response data:', err.response.data);
        }
        setError('Failed to load order details. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [orderId]);

  const handleStatusChange = async (newStatus) => {
    try {
      setStatusUpdating(true);
      await api.put(`/api/admin/orders/${orderId}/status`, { status: newStatus });
      setOrder({ ...order, status: newStatus });
      alert(`Order status updated to ${newStatus}`);
    } catch (err) {
      console.error('Error updating order status:', err);
      alert('Failed to update order status. Please try again.');
    } finally {
      setStatusUpdating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#D4AF37]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
        <strong className="font-bold">Error!</strong>
        <span className="block sm:inline"> {error}</span>
      </div>
    );
  }

  if (!order) {
    return <div className="text-center py-8">Order not found</div>;
  }

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'processing': return 'bg-blue-100 text-blue-800';
      case 'shipped': return 'bg-purple-100 text-purple-800';
      case 'delivered': return 'bg-green-100 text-green-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString()}`;
  };

  const calculateSubtotal = () => {
    if (!order.items || !order.items.length) return 0;
    return order.items.reduce((sum, item) => sum + parseFloat(item.total_price || (item.product_price * item.quantity) || 0), 0);
  };

  const subtotal = calculateSubtotal();
  const tax = parseFloat(order.total_amount) - subtotal;

  return (
    <div className="order-detail-container">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <Link to="/admin/orders" className="text-[#D4AF37] hover:text-[#FFD700] mb-4 inline-block">
            ← Back to Orders
          </Link>
          <h1 className="text-2xl font-bold text-gray-800">Order #{order.id}</h1>
        </div>
        <div className="flex items-center space-x-4">
          <span className={`px-3 py-1 inline-flex text-sm leading-5 font-semibold rounded-full ${getStatusBadgeColor(order.status)}`}>
            {order.status ? order.status.charAt(0).toUpperCase() + order.status.slice(1) : "Unknown"}
          </span>

          {order.status !== 'delivered' && order.status !== 'cancelled' && (
            <select
              className="border border-gray-300 rounded-md text-sm py-1.5 pl-3 pr-8 bg-white hover:border-[#D4AF37] focus:outline-none focus:ring-[#D4AF37] focus:border-[#D4AF37]"
              value={order.status || ""}
              onChange={(e) => handleStatusChange(e.target.value)}
              disabled={statusUpdating}
            >
              <option value="pending">Pending</option>
              <option value="processing">Processing</option>
              <option value="shipped">Shipped</option>
              <option value="delivered">Delivered</option>
              <option value="cancelled">Cancelled</option>
            </select>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Order Info and Status Timeline */}
        <div className="lg:col-span-2">
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Order Information</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Order Date</p>
                <p className="font-medium">{formatDate(order.created_at)}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Payment Status</p>
                <p className="font-medium capitalize">{order.payment_status || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Payment ID</p>
                <p className="font-medium">{order.payment_id || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Razorpay Order ID</p>
                <p className="font-medium">{order.razorpay_order_id || 'N/A'}</p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Last Updated</p>
                <p className="font-medium">{formatDate(order.updated_at)}</p>
              </div>
            </div>
          </div>

          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Order Status Timeline</h2>
            <div className="order-timeline">
              <div className={`timeline-step ${['pending', 'processing', 'shipped', 'delivered'].includes(order.status) ? 'completed' : ''}`}>
                <div className="timeline-point"></div>
                <div className="timeline-content">
                  <h4>Order Received</h4>
                  <p>We've received your order</p>
                </div>
              </div>
              <div className={`timeline-step ${['processing', 'shipped', 'delivered'].includes(order.status) ? 'completed' : ''}`}>
                <div className="timeline-point"></div>
                <div className="timeline-content">
                  <h4>Order Processing</h4>
                  <p>We're preparing your order</p>
                </div>
              </div>
              <div className={`timeline-step ${['shipped', 'delivered'].includes(order.status) ? 'completed' : ''}`}>
                <div className="timeline-point"></div>
                <div className="timeline-content">
                  <h4>Order Shipped</h4>
                  <p>Your order is on its way</p>
                </div>
              </div>
              <div className={`timeline-step ${['delivered'].includes(order.status) ? 'completed' : ''}`}>
                <div className="timeline-point"></div>
                <div className="timeline-content">
                  <h4>Order Delivered</h4>
                  <p>Your order has been delivered</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Customer Info */}
        <div className="lg:col-span-1">
          <div className="bg-white shadow rounded-lg p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Customer Information</h2>
            <div className="mb-4">
              <p className="text-sm text-gray-600">Full Name</p>
              <p className="font-medium">{order.user?.full_name || 'N/A'}</p>
            </div>
            <div className="mb-4">
              <p className="text-sm text-gray-600">Email</p>
              <p className="font-medium">{order.user?.email || 'N/A'}</p>
            </div>
            <div className="mb-4">
              <p className="text-sm text-gray-600">Phone</p>
              <p className="font-medium">{order.user?.phone || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Shipping Address</p>
              <p className="font-medium">{order.address || 'Not provided'}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Order Items */}
      <div className="bg-white shadow rounded-lg p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Order Items</h2>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {order.items && order.items.length > 0 ? (
                order.items.map((item, index) => (
                  <tr key={item.id || index}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="h-10 w-10 flex-shrink-0 rounded bg-gray-100 mr-4">
                          {/* Product image would go here if available */}
                        </div>
                        <div>
                          <div className="text-sm font-medium text-gray-900">{item.product_title || 'Unknown Product'}</div>
                          {item.variant_details && (
                            <div className="text-sm text-gray-500">
                              {Object.entries(item.variant_details).map(([key, value]) => `${key}: ${value}`).join(', ')}
                            </div>
                          )}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      ₹{parseFloat(item.product_price || 0).toFixed(2)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {item.quantity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      ₹{parseFloat(item.total_price || (item.product_price * item.quantity) || 0).toFixed(2)}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="px-6 py-4 text-center text-sm text-gray-500">
                    No items found in this order.
                  </td>
                </tr>
              )}
            </tbody>
            <tfoot>
              <tr>
                <td colSpan="3" className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">Subtotal</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">₹{subtotal.toFixed(2)}</td>
              </tr>
              <tr>
                <td colSpan="3" className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">Tax (18% GST)</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">₹{tax.toFixed(2)}</td>
              </tr>
              <tr>
                <td colSpan="3" className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold">Total</td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold">₹{parseFloat(order.total_amount || 0).toFixed(2)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

      {/* Admin Actions */}
      <div className="bg-white shadow rounded-lg p-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Admin Actions</h2>
        <div className="flex flex-wrap gap-4">
          <button 
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#D4AF37]"
            onClick={() => window.print()}
          >
            Print Order
          </button>
          <button 
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#D4AF37]"
            onClick={() => {
              try {
                const orderDataStr = JSON.stringify(order, null, 2);
                const blob = new Blob([orderDataStr], { type: 'application/json' });
                const href = URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = href;
                link.download = `order-${order.id}.json`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
              } catch (err) {
                console.error('Error exporting order data:', err);
                alert('Failed to export order data');
              }
            }}
          >
            Export Order Data
          </button>
        </div>
      </div>
    </div>
  );
};

export default OrderDetail;