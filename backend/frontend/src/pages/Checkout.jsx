import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../hooks/useAuth';
import { ordersAPI } from '../services/api';
import CheckoutFlow from '../components/CheckoutFlow';
import CheckoutForm from '../components/CheckoutForm';
import '../styles/pages/Checkout.css';

export default function Checkout() {
  const navigate = useNavigate();
  const { cartItems, cartTotal, clearCart, isEmpty } = useCart();
  const { user } = useAuth();
  const [checkoutStep, setCheckoutStep] = useState('auth'); // auth or form
  const [checkoutUser, setCheckoutUser] = useState(null); // { type, user, email, isGuest }
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (isEmpty) {
    return (
      <div className="checkout-page">
        <h1>Checkout</h1>
        <div className="empty-state">
          <p>Your cart is empty. Add items before checking out.</p>
        </div>
      </div>
    );
  }

  const handleAuthComplete = (authData) => {
    setCheckoutUser(authData);
    setCheckoutStep('form');
  };

  const handleSubmit = async (formData) => {
    setLoading(true);
    setError('');

    try {
      const subtotal = parseFloat(cartTotal.toFixed(2));
      const deliveryFee = 0; // Free shipping
      const total = parseFloat((subtotal * 1.08).toFixed(2)); // With tax

      // Build order data based on checkout type
      const payload = {
        order: {
          user_id: checkoutUser.user ? checkoutUser.user.id : null,
          total: total,
          delivery_address: `${formData.address}, ${formData.city}, ${formData.state} ${formData.zip}`,
          delivery_fee: deliveryFee,
          delivery_instructions: formData.deliveryInstructions || '',
          delivery_method: formData.deliveryMethod || 'standard',
          payment_method: formData.paymentMethod || 'card',
        },
        guest_info: checkoutUser.isGuest ? {
          first_name: formData.firstName,
          last_name: formData.lastName,
          email: checkoutUser.email,
          phone: formData.phone,
        } : null,
        items: cartItems.map((item) => ({
          product_id: item.id,
          quantity: item.quantity,
          price: item.price,
        })),
      };

      const response = await ordersAPI.create(payload);
      clearCart();
      const orderId = response.data.order ? response.data.order.id : response.data.id;
      navigate(`/order-confirmation/${orderId}`);
    } catch (err) {
      console.error('Order Error:', err);
      setError(err.response?.data?.message || err.response?.data?.errors?.join(', ') || 'Failed to process order');
    } finally {
      setLoading(false);
    }
  };

  if (checkoutStep === 'auth') {
    return (
      <div className="checkout-page">
        <CheckoutFlow onProceed={handleAuthComplete} isLoading={loading} />
      </div>
    );
  }

  return (
    <div className="checkout-page">
      <div className="checkout-header">
        <h1>Checkout</h1>
        <p className="checkout-user-info">
          Checking out as: <strong>{checkoutUser?.email}</strong>
          {checkoutUser?.user && ` (${checkoutUser.user.email})`}
        </p>
      </div>

      <div className="checkout-container">
        <div className="checkout-main">
          {error && (
            <div className="alert alert-error">
              <strong>Error:</strong> {error}
            </div>
          )}

          <CheckoutForm onSubmit={handleSubmit} isLoading={loading} />
        </div>

        <div className="checkout-sidebar">
          <div className="order-review">
            <h2>Order Review</h2>

            <div className="review-items">
              {cartItems.map((item) => (
                <div key={item.id} className="review-item">
                  <div className="review-item-info">
                    <span className="item-name">{item.name}</span>
                    <span className="item-qty">x {item.quantity}</span>
                  </div>
                  <span className="item-price">
                    ${(item.price * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>

            <div className="review-totals">
              <div className="review-total-row">
                <span>Subtotal:</span>
                <span>${cartTotal.toFixed(2)}</span>
              </div>
              <div className="review-total-row">
                <span>Shipping:</span>
                <span>FREE</span>
              </div>
              <div className="review-total-row">
                <span>Tax (est.):</span>
                <span>${(cartTotal * 0.08).toFixed(2)}</span>
              </div>
              <div className="review-total-row final">
                <span>Total:</span>
                <span>${(cartTotal * 1.08).toFixed(2)}</span>
              </div>
            </div>
          </div>

          <div className="payment-methods">
            <h3>Payment Methods</h3>
            <label className="method">
              <input type="radio" name="payment" defaultChecked />
              <span>Credit Card</span>
            </label>
            <label className="method">
              <input type="radio" name="payment" />
              <span>PayPal</span>
            </label>
            <label className="method">
              <input type="radio" name="payment" />
              <span>Debit Card</span>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}
