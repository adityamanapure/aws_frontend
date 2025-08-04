import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import '../../styles/admin/Dashboard.css'; 
import api from '../../services/api'; // Use the configured api service instead of axios directly

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingPayments: 0,
    successfulOrders: 0,
    totalUsers: 0,
    popularProducts: [],
    recentActivity: []
  });
  
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        setIsLoading(true);
        
        // Get admin token
        const token = localStorage.getItem('adminToken');
        
        if (!token) {
          setError('Authentication token not found. Please log in again.');
          setIsLoading(false);
          return;
        }
        
        console.log('Fetching dashboard data with token:', token);
        
        // Use the configured api service instead of hardcoded localhost
        const response = await api.get('/api/admin/dashboard/', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        console.log('Dashboard response:', response.data);
        
        // Match the field names with what your backend returns
        setStats({
          totalOrders: response.data.total_orders || 0,
          pendingPayments: response.data.pending_payments || 0,
          successfulOrders: response.data.successful_orders || 0,
          totalUsers: response.data.total_users || 0,
          // Handle the case where popular_products might be null or undefined
          popularProducts: (response.data.popular_products || []).map(product => ({
            id: product.id || 'unknown',
            name: product.product_title || 'Unknown Product',
            sales: product.sold_count || 0,
            image: product.image || "/placeholders/product.png"
          })),
          // If your backend doesn't send recent activity, initialize with empty array
          recentActivity: []
        });
        
        setIsLoading(false);
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
        setError('Failed to load dashboard data: ' + (error.response?.data?.detail || error.message));
        setIsLoading(false);
      }
    };
    
    fetchDashboardData();
  }, []);
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#D4AF37]"></div>
      </div>
    );
  }
  
  if (error) {
    return (
      <div className="bg-red-50 p-4 rounded-lg text-red-700 text-center">
        <p className="font-medium">Error</p>
        <p>{error}</p>
        <button 
          onClick={() => window.location.reload()}
          className="mt-2 px-4 py-2 bg-red-100 hover:bg-red-200 rounded-md transition-colors duration-200"
        >
          Try Again
        </button>
      </div>
    );
  }
  
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow-md p-6 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-700">Total Orders</h3>
            <div className="p-2 bg-blue-100 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-800">{stats.totalOrders}</div>
          <Link to="/admin/orders" className="mt-4 text-sm text-[#D4AF37] hover:underline">
            View all orders →
          </Link>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-700">Pending Payments</h3>
            <div className="p-2 bg-yellow-100 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-800">{stats.pendingPayments}</div>
          <Link to="/admin/orders?status=pending_payment" className="mt-4 text-sm text-[#D4AF37] hover:underline">
            View pending payments →
          </Link>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-700">Successful Orders</h3>
            <div className="p-2 bg-green-100 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-800">{stats.successfulOrders}</div>
          <Link to="/admin/orders?status=completed" className="mt-4 text-sm text-[#D4AF37] hover:underline">
            View successful orders →
          </Link>
        </div>
        
        <div className="bg-white rounded-lg shadow-md p-6 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-700">Total Users</h3>
            <div className="p-2 bg-purple-100 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
          <div className="text-3xl font-bold text-gray-800">{stats.totalUsers}</div>
          <Link to="/admin/users" className="mt-4 text-sm text-[#D4AF37] hover:underline">
            View all users →
          </Link>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">Popular Products</h3>
          {stats.popularProducts && stats.popularProducts.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Product
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Sales
                    </th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {stats.popularProducts.map((product, index) => (
                    <tr key={product.id || index}>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 flex-shrink-0">
                            <img 
                              className="h-10 w-10 rounded-full object-cover" 
                              src={product.image} 
                              alt={product.name}
                              onError={(e) => {e.target.src = 'https://via.placeholder.com/100?text=Product'}}
                            />
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{product.name}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">{product.sales} sold</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <Link to={`/admin/products/${product.id}`} className="text-[#D4AF37] hover:text-[#FFD700]">
                          View
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-4 text-gray-500">
              No product data available
            </div>
          )}
          <Link to="/admin/products" className="block mt-4 text-sm text-[#D4AF37] hover:underline text-right">
            View all products →
          </Link>
        </div>
        
        {stats.recentActivity && stats.recentActivity.length > 0 ? (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">Recent Activity</h3>
            <div className="space-y-4">
              {stats.recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-start">
                  <div className="p-2 bg-gray-100 rounded-full mr-4">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                    <p className="text-xs text-gray-500">{activity.details}</p>
                    <p className="text-xs text-gray-500">{activity.timestamp}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">Recent Activity</h3>
            <div className="text-center py-4 text-gray-500">
              No recent activity
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;