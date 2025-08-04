import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import ScrollToTop from './ScrollToTop'; // Import the new component
import Home from './Home';
import ProductFeed from '../product/ProductFeed';
import ProductDetail from '../product/ProductDetail'; 
import Account from '../User/Account';
import Orders from '../User/Orders'; 
import CheckoutForm from '../checkout/CheckoutForm';
import PaymentProcess from '../checkout/PaymentProcess';
import About from '../User/About';
import Contact from '../User/Contact';
import ReelsPage from '../reels/ReelsPage';


const Layout = () => {
  return (
    <div className="app-container">
      <ScrollToTop /> {/* Add this line */}
      <Navbar />
      <main className="main-container">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/products" element={<ProductFeed />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/account" element={<Account />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/checkout/:checkoutId" element={<CheckoutForm />} />
          <Route path="/payment/:checkoutId" element={<PaymentProcess />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/reels"element={<ReelsPage/>}/>
          <Route path='/reels/:id'element={<ReelsPage/>}/>
          
        </Routes>
      </main>
      <Footer />
    </div>
  );
};

export default Layout;