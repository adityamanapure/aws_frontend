// File: src/components/cart/CartItem.jsx
import React from 'react';
import { useCart } from '../../context/CartContext';
import api from '../../services/api';

function CartItem({ item }) {
  // Add defaults for all item properties
  const safeItem = {
    id: item?.id || 0,
    title: item?.title || 'Unknown Product',
    price: item?.price || 0,
    discount: item?.discount || 0,
    quantity: item?.quantity || 1,
    images: item?.images || [],
    available_stock: item?.available_stock || 0,
    product_id: item?.product_id || 0
  };

  const { removeFromCart, updateQuantity, updateCartItemQuantity } = useCart();
  
  // Calculate discounted price if applicable
  const displayPrice = safeItem.discount > 0 
    ? safeItem.price * (1 - safeItem.discount / 100) 
    : safeItem.price;
  
  // Handle quantity change
  const handleQuantityChange = async (newQuantity) => {
    if (newQuantity > 0 && newQuantity <= safeItem.available_stock) {
      try {
        // First update the API
        await api.post('/api/cart/update_item/', {
          item_id: safeItem.id,
          quantity: newQuantity
        });
        
        // Then update local state - use updateCartItemQuantity if updateQuantity is undefined
        const updateFn = updateQuantity || updateCartItemQuantity;
        if (updateFn) {
          updateFn(safeItem.id, newQuantity);
        } else {
          console.error('No update quantity function available in context');
        }
      } catch (err) {
        console.error('Error updating item quantity:', err);
      }
    }
  };
  
  // Handle item removal
  const handleRemove = async () => {
    try {
      // First update the API
      await api.post('/api/cart/remove_item/', {
        item_id: safeItem.id
      });
      
      // Then update local state
      removeFromCart(safeItem.id);
    } catch (err) {
      console.error('Error removing item:', err);
    }
  };
  
  // Use default image if none provided
  const itemImage = safeItem.images && safeItem.images.length > 0 
    ? safeItem.images[0] 
    : 'https://via.placeholder.com/80x80?text=Product';
  
  return (
    <div className="cart-item">
      <div className="cart-item-image">
        <img 
          src={itemImage} 
          alt={safeItem.title} 
          onError={(e) => {e.target.src = 'https://via.placeholder.com/80x80?text=Product'}}
        />
      </div>
      
      <div className="cart-item-info">
        <h3 className="cart-item-title">{safeItem.title}</h3>
        <div className="cart-item-price">
          ₹{displayPrice.toLocaleString()}
          
          {safeItem.discount > 0 && (
            <span className="cart-item-original-price">
              ₹{safeItem.price.toLocaleString()}
            </span>
          )}
        </div>
        
        <div className="cart-item-controls">
          <div className="quantity-control">
            <button 
              onClick={() => handleQuantityChange(safeItem.quantity - 1)}
              disabled={safeItem.quantity <= 1}
              className="quantity-btn"
            >
              -
            </button>
            
            <span className="quantity-display">{safeItem.quantity}</span>
            
            <button 
              onClick={() => handleQuantityChange(safeItem.quantity + 1)}
              disabled={safeItem.quantity >= safeItem.available_stock}
              className="quantity-btn"
            >
              +
            </button>
          </div>
          
          <button 
            onClick={handleRemove}
            className="remove-item-btn"
            aria-label="Remove item"
          >
            Remove
          </button>
        </div>
      </div>
    </div>
  );
}

export default CartItem;