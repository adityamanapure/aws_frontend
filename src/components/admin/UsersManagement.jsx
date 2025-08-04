import React, { useState, useEffect } from 'react';
import api from '../../services/api';
import { Search, ChevronDown, ChevronUp, ShoppingCart, Eye } from 'lucide-react';
import '../../styles/admin/UserManagement.css';

const UsersManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState('created_at');
  const [sortDirection, setSortDirection] = useState('desc');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showCartModal, setShowCartModal] = useState(false);
  const [userCartItems, setUserCartItems] = useState([]);
  const [cartLoading, setCartLoading] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, [sortField, sortDirection]);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      
      // Log the request details for debugging
      console.log('Fetching users with params:', { 
        sortField, 
        sortDirection,
        endpoint: '/api/admin/users/'  // Note the trailing slash
      });
      
      const token = localStorage.getItem('adminToken');
      
      // Make sure to use the correct URL with trailing slash
      const response = await api.get('/api/admin/users/', {
        headers: { Authorization: `Bearer ${token}` },
        params: { sort_field: sortField, sort_direction: sortDirection }
      });
      
      console.log('Users API response:', response.data);
      
      // Check if response.data is an array
      if (Array.isArray(response.data)) {
        setUsers(response.data);
      } else {
        console.error('Expected array but got:', typeof response.data);
        setError('Invalid data format received from server');
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Error fetching users:', err);
      setError(`Error fetching users: ${err.response?.data?.detail || err.message}`);
      setLoading(false);
    }
  };

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  const handleSearch = (e) => {
    setSearchQuery(e.target.value);
  };

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    user.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (user.phone && user.phone.includes(searchQuery))
  );

  const viewUserCart = async (userId) => {
    try {
      setCartLoading(true);
      setShowCartModal(true);
      setSelectedUser(users.find(user => user.id === userId));
      
      const token = localStorage.getItem('adminToken');
      
      // Use consistent URL format without trailing slash 
      // to match what's defined in your backend
      const response = await api.get(`/api/admin/users/${userId}/cart`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('Cart response:', response.data);
      
      // Handle non-array responses
      if (Array.isArray(response.data)) {
        setUserCartItems(response.data);
      } else {
        // If response isn't an array, convert it to empty array
        console.warn('Expected array for cart items but got:', typeof response.data);
        setUserCartItems([]);
      }
      
      setCartLoading(false);
    } catch (err) {
      console.error('Error fetching cart items:', err);
      
      // Show a more specific error message
      setError(`Error fetching cart items: ${err.response?.data?.detail || err.message}`);
      
      // Ensure cart items are set to empty array on error
      setUserCartItems([]);
      
      setCartLoading(false);
    }
  };

  const viewUserDetails = (userId) => {
    setSelectedUser(users.find(user => user.id === userId));
    // You could navigate to a detailed user view here
  };

  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateString).toLocaleDateString(undefined, options);
  };

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6">
        <h2 className="text-xl font-semibold mb-4 md:mb-0">Manage Users</h2>
        
        <div className="relative w-full md:w-64">
          <input
            type="text"
            placeholder="Search users..."
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-yellow-400"
            value={searchQuery}
            onChange={handleSearch}
          />
          <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center my-8">
          <div className="w-16 h-16 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : error ? (
        <div className="text-red-500 text-center my-4">{error}</div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white">
              <thead className="bg-gray-50">
                <tr>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('name')}
                  >
                    <div className="flex items-center">
                      Name
                      {sortField === 'name' && (
                        sortDirection === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />
                      )}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Phone
                  </th>
                  <th 
                    className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                    onClick={() => handleSort('created_at')}
                  >
                    <div className="flex items-center">
                      Joined On
                      {sortField === 'created_at' && (
                        sortDirection === 'asc' ? <ChevronUp size={16} /> : <ChevronDown size={16} />
                      )}
                    </div>
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                      No users found
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map(user => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="w-8 h-8 rounded-full bg-yellow-100 flex items-center justify-center text-yellow-800 font-semibold mr-3">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="text-sm font-medium text-gray-900">{user.name}</div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.phone || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(user.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">
                        <div className="flex justify-center space-x-2">
                          <button 
                            onClick={() => viewUserCart(user.id)}
                            className="p-1 rounded-full hover:bg-yellow-50 text-yellow-600"
                            title="View Cart"
                          >
                            <ShoppingCart size={18} />
                          </button>
                          <button 
                            onClick={() => viewUserDetails(user.id)}
                            className="p-1 rounded-full hover:bg-blue-50 text-blue-600"
                            title="View Details"
                          >
                            <Eye size={18} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Cart Modal */}
          {showCartModal && selectedUser && (
            <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
              <div className="bg-white rounded-lg w-full max-w-3xl max-h-screen overflow-auto">
                <div className="p-6 border-b">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold">
                      {selectedUser.name}'s Cart
                    </h3>
                    <button 
                      onClick={() => setShowCartModal(false)}
                      className="text-gray-400 hover:text-gray-500"
                    >
                      &times;
                    </button>
                  </div>
                </div>
                
                <div className="p-6">
                  {cartLoading ? (
                    <div className="flex justify-center my-8">
                      <div className="w-10 h-10 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  ) : userCartItems.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">Cart is empty</p>
                  ) : (
                    <>
                      {userCartItems.map(item => (
                        <div key={item.id} className="flex border-b py-4">
                          <div className="w-16 h-16 bg-gray-100 rounded flex-shrink-0">
                            {item.product.image_url && (
                              <img 
                                src={item.product.image_url} 
                                alt={item.product.title}
                                className="w-full h-full object-cover rounded"
                              />
                            )}
                          </div>
                          <div className="ml-4 flex-1">
                            <h4 className="font-medium">{item.product.title}</h4>
                            <div className="flex justify-between mt-2">
                              <div className="text-sm text-gray-500">
                                Quantity: {item.quantity}
                              </div>
                              <div className="font-medium text-yellow-700">
                                ₹{(item.product.price * item.quantity).toLocaleString()}
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                      
                      <div className="mt-6 pt-4 border-t flex justify-between items-center">
                        <span className="font-semibold">Total:</span>
                        <span className="font-bold text-lg text-yellow-700">
                          ₹{userCartItems.reduce((sum, item) => sum + (item.product.price * item.quantity), 0).toLocaleString()}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default UsersManagement;
