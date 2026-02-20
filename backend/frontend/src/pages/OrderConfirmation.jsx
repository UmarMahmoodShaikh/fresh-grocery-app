import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { ordersAPI } from '../services/api';
import '../styles/pages/OrderConfirmation.css';

export default function OrderConfirmation() {
  const { orderId } = useParams();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const response = await ordersAPI.getById(orderId);
        setOrder(response.data);
      } catch (err) {
        setError('Failed to load order details. The order may not exist.');
      } finally {
        setLoading(false);
      }
    };

    if (orderId) {
      fetchOrder();
    }
  }, [orderId]);

  if (loading) {
    return (
      <div className="confirmation-page">
        <div className="loading-container">
          <div className="spinner"></div>
          <p>Loading your order...</p>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="confirmation-page">
        <div className="error-state">
          <span className="error-icon">❌</span>
          <h2>Oops!</h2>
          <p>{error}</p>
          <Link to="/" className="back-home-btn">
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="confirmation-page">
      <div className="confirmation-card">
        <div className="success-section">
          <span className="success-icon">✓</span>
          <h1>Order Confirmed!</h1>
          <p className="confirmation-message">
            Thank you for your order. We're processing it right now.
          </p>
        </div>

        <div className="order-details">
          <div className="detail-grid">
            <div className="detail-item">
              <label>Order ID</label>
              <span className="detail-value">#{order.id}</span>
            </div>
            {order.invoice && (
              <div className="detail-item">
                <label>Invoice Number</label>
                <span className="detail-value">{order.invoice.invoice_number}</span>
              </div>
            )}
            <div className="detail-item">
              <label>Order Date</label>
              <span className="detail-value">
                {new Date(order.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </span>
            </div>
            <div className="detail-item">
              <label>Order Status</label>
              <span className={`detail-value status ${order.status}`}>
                {order.status}
              </span>
            </div>
            <div className="detail-item">
              <label>Order Total</label>
              <span className="detail-value total">
                ${order.total.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        {order.items && order.items.length > 0 && (
          <div className="items-section">
            <h2>Items Ordered</h2>
            <div className="items-list">
              {order.items.map((item, index) => (
                <div key={index} className="order-item">
                  <span className="item-name">
                    {item.name} <span className="item-qty">x{item.quantity}</span>
                  </span>
                  <span className="item-price">
                    ${(item.price * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="confirmation-footer">
          <div className="next-steps">
            <h3>What's Next?</h3>
            <ul>
              <li>✓ Order confirmation sent to your email</li>
              <li>📦 Preparing your items for shipment</li>
              <li>🚚 Shipping updates coming soon</li>
            </ul>
          </div>

          <Link to="/" className="continue-shopping-btn">
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  );
}
