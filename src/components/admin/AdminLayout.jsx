import React, { useState, useEffect } from 'react';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Users, Package, ShoppingBag, BarChart2, LogOut, Layers, Home } from 'lucide-react';
import '../../styles/admin/AdminLayout.css'; // Import your custom styles
import api from '../../services/api'; // Use the configured api service instead of axios directly

const AdminLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [userData, setUserData] = useState(null);

  // Verify admin access on component mount
  useEffect(() => {
    const verifyAdminAccess = async () => {
      const adminToken = localStorage.getItem('adminToken');
      
      if (!adminToken) {
        navigate('/admin/login');
        return;
      }
      
      // Use the configured api service instead of axios directly
      try {
        const response = await api.get('/api/admin/verify/', {
          headers: {
            Authorization: `Bearer ${adminToken}`
          }
        });
        
        // Check the response data
        if (response.data.is_valid) {
          setUserData({
            email: response.data.email,
            fullName: response.data.full_name,
            isAdmin: true
          });
          setIsLoading(false);
        } else {
          throw new Error('Token is invalid');
        }
      } catch (error) {
        console.error('Admin verification failed:', error);
        
        // Clear all admin-related data
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminRefreshToken');
        localStorage.removeItem('adminUser');
        
        // Redirect to login
        navigate('/admin/login');
      }
    };
    
    verifyAdminAccess();
  }, [navigate]);

  const navItems = [
    { path: '/admin/dashboard', icon: <BarChart2 />, label: 'Dashboard' },
    { path: '/admin/orders', icon: <ShoppingBag />, label: 'Orders' },
    { path: '/admin/users', icon: <Users />, label: 'Users' },
    { path: '/admin/products', icon: <Package />, label: 'Products' },
    { path: '/admin/categories', icon: <Package />, label: 'Categories' },
    { path: '/admin/reels', icon: <Package />, label: 'Reels' },
    {path: '/admin/hero-slides', icon: <Layers />, label: 'Hero Slides' },
  ];

  const handleLogout = () => {
    // Clear JWT token from localStorage
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminRefreshToken');
    localStorage.removeItem('adminUser');
    // Redirect to login
    navigate('/admin/login');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="spinner"></div>
        <p className="ml-2">Verifying admin access...</p>
      </div>
    );
  }

  return (
    <div className="admin-layout flex h-screen bg-gray-50">
      {/* Sidebar */}
      <div className={`admin-sidebar bg-white shadow-lg ${collapsed ? 'w-16' : 'w-64'} transition-all duration-300 flex flex-col`}>
        <div className="p-4 border-b flex items-center justify-between">
          {!collapsed && <h1 className="text-xl font-semibold text-gray-800">Fashion Admin</h1>}
          <button 
            onClick={() => setCollapsed(!collapsed)} 
            className="p-1 rounded hover:bg-gray-100"
          >
            {collapsed ? '→' : '←'}
          </button>
        </div>
        
        <nav className="admin-nav flex-1 py-4">
          <ul>
            {navItems.map(item => (
              <li key={item.path} className="mb-2">
                <Link
                  to={item.path}
                  className={`flex items-center px-4 py-3 ${
                    location.pathname === item.path 
                      ? 'bg-yellow-50 text-yellow-700 border-r-4 border-yellow-500' 
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}
                >
                  <span className="mr-3">{item.icon}</span>
                  {!collapsed && <span>{item.label}</span>}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
        
        <div className="mt-auto p-4 border-t">
          <button 
            onClick={handleLogout}
            className={`flex items-center ${collapsed ? 'justify-center' : ''} w-full px-4 py-2 text-red-600 hover:bg-red-50 rounded`}
          >
            <LogOut className="mr-2" size={20} />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="admin-content flex-1 overflow-auto">
        {/* Header */}
        <header className="admin-header bg-white shadow-sm py-4 px-6 flex justify-between items-center">
          <h1 className="text-2xl font-semibold text-gray-800">
            {navItems.find(item => item.path === location.pathname)?.label || 'Admin'}
          </h1>
          <div className="flex items-center">
            {userData && (
              <div className="mr-4 text-sm text-gray-600">
                {userData.fullName || userData.email}
              </div>
            )}
            <div className="w-8 h-8 rounded-full bg-yellow-200 flex items-center justify-center text-yellow-800 font-semibold">
              {userData && userData.fullName ? userData.fullName.charAt(0).toUpperCase() : 'A'}
            </div>
          </div>
        </header>
        
        {/* Content */}
        <main className="admin-page-content p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;