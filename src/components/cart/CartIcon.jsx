
// File: src/components/cart/CartIcon.jsx
import { useCart } from '../../context/CartContext';

export default function CartIcon() {
  const { cartItems } = useCart();
  
  const itemCount = cartItems.reduce((total, item) => total + item.quantity, 0);
  
  return (
    <div className="relative">
      <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
      </svg>
      
    </div>
  );
}