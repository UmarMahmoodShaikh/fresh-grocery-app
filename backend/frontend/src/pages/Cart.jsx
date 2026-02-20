import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import CartItem from '../components/CartItem';
import '../styles/pages/Cart.css';

export default function Cart() {
  const { cartItems, cartTotal, isEmpty } = useCart();

  return (
    <div className="cart-page" style={{ minHeight: '500px' }}>
      <h1>Shopping Cart</h1>
      
      {isEmpty ? (
        <div className="empty-cart-state">
          <div className="empty-icon">🛒</div>
          <h2>Your cart is empty</h2>
          <p>Add some fresh products to get started!</p>
          <Link to="/" className="continue-btn">
            Continue Shopping
          </Link>
        </div>
      ) : (
        <div className="cart-layout">
          <div className="cart-items-section">
            <div className="items-count">
              {cartItems.length} item{cartItems.length !== 1 ? 's' : ''} in cart
            </div>
            <div className="cart-items-list">
              {cartItems.map((item) => (
                <CartItem key={item.id} item={item} />
              ))}
            </div>
          </div>

          <div className="cart-summary-section">
            <div className="order-summary">
              <h2>Order Summary</h2>

              <div className="summary-row">
                <span>Subtotal:</span>
                <span className="price">${cartTotal.toFixed(2)}</span>
              </div>

              <div className="summary-row">
                <span>Shipping:</span>
                <span className="price highlight">FREE</span>
              </div>

              <div className="summary-row tax">
                <span>Tax (estimated):</span>
                <span className="price">
                  ${(cartTotal * 0.08).toFixed(2)}
                </span>
              </div>

              <div className="summary-row total">
                <span>Total:</span>
                <span className="price total-amount">
                  ${(cartTotal * 1.08).toFixed(2)}
                </span>
              </div>

              <Link to="/checkout" className="checkout-btn">
                Proceed to Checkout
              </Link>

              <Link to="/" className="continue-shopping-btn">
                Continue Shopping
              </Link>
            </div>

            <div className="promo-section">
              <h3>Special Offers</h3>
              <p>Free shipping on orders over $50! 🎉</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
