import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { HeroSlideProvider } from './context/HeroSlideContext';
import Layout from './components/layout/Layout';
import AdminLayout from './components/admin/AdminLayout';

import ProductDetail from './components/product/ProductDetail';
import Login from './components/auth/Login';
import Signup from './components/auth/Signup';
import Home from './components/layout/Home'; 

import CheckoutForm from './components/checkout/CheckoutForm';
import PaymentProcess from './components/checkout/PaymentProcess';

import ProductFeed from './components/product/ProductFeed';

import Account from './components/User/Account';
import Orders from './components/User/Orders';
import Contact from './components/User/Contact';
import About from './components/User/About';
import ReelsPage from './components/reels/ReelsPage';
// import Categories from './components/product/Categories';

import Dashboard from './components/admin/Dashboard';
import OrdersManagement from './components/admin/OrdersManagement';
import UsersManagement from './components/admin/UsersManagement';
import ProductManagement from './components/admin/ProductManagement';
import CategoriesManagement from './components/admin/CategoriesManagement';
import AdminLogin from './components/admin/AdminLogin';
import ReelsManagement from './components/admin/ReelsManagement';
import HeroSlidesManagement from './components/admin/HeroSlidesManagement';
import OrderDetail from './components/admin/OrderDetail';

import './styles/theme.css';

// This is our router-free wrapper app
const AppContent = () => {
  return (
    <AuthProvider>
      <CartProvider>
        <HeroSlideProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/" element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="/account" element={<Account />} />
              <Route path="/orders" element={<Orders />} />
              <Route path="product/:id" element={<ProductDetail />} />
              <Route path="products" element={<ProductFeed />} />
              <Route path="checkout/:checkoutId" element={<CheckoutForm />} />
              <Route path="/payment/:checkoutId" element={<PaymentProcess />} />
              <Route path="contact" element={<Contact />} />
              <Route path="about" element={<About />} />
              <Route path="reels" element={<ReelsPage />} />
            </Route>
            
            <Route path="/admin/login" element={<AdminLogin />} />
            <Route path="/admin/logout" element={<AdminLogin />} />
            {/* Admin Routes */}
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="orders" element={<OrdersManagement />} />
              <Route path="users" element={<UsersManagement />} />
              <Route path="products" element={<ProductManagement />} />
              <Route path="categories" element={<CategoriesManagement />} />
              <Route path="reels" element={<ReelsManagement />} />
              <Route path="reels/:id" element={<ReelsManagement />} />
              <Route path="hero-slides" element={<HeroSlidesManagement />} />
              <Route path="orders/:orderId" element={<OrderDetail />} />
            </Route>
          </Routes>
        </HeroSlideProvider>
      </CartProvider>
    </AuthProvider>
  );
};

function App() {
  return (
    <Router basename="/website">
      <AppContent />
    </Router>
  );
}

export default App;
