import { useCart } from '../context/CartContext';
import '../styles/CartItem.css';

export default function CartItem({ item }) {
  const { updateQuantity, removeFromCart } = useCart();

  const handleQuantityChange = (e) => {
    const value = parseInt(e.target.value);
    if (!isNaN(value) && value > 0) {
      updateQuantity(item.id, value);
    }
  };

  const handleDecrement = () => {
    if (item.quantity > 1) {
      updateQuantity(item.id, item.quantity - 1);
    }
  };

  const handleIncrement = () => {
    if (item.stock && item.quantity >= item.stock) return;
    updateQuantity(item.id, item.quantity + 1);
  };

  const itemTotal = item.price * item.quantity;
  const maxStock = item.stock || 999;
  const isMaxReached = item.quantity >= maxStock;

  return (
    <div className="cart-item">
      <div className="item-image">
        {item.picture ? (
          <img src={item.picture} alt={item.name} />
        ) : (
          <div className="item-placeholder">🥕</div>
        )}
      </div>

      <div className="item-info">
        <h3 className="item-name">{item.name}</h3>
        <p className="item-price">${item.price.toFixed(2)} each</p>

        {item.stock_label && (
          <span className={`cart-stock-label ${item.stock_label.replace(/\s+/g, '-').toLowerCase()}`}>
            {item.stock_label}
          </span>
        )}
      </div>

      <div className="item-quantity">
        <button
          onClick={handleDecrement}
          className="qty-btn"
          disabled={item.quantity <= 1}
          title="Decrease quantity"
        >
          −
        </button>
        <input
          type="number"
          value={item.quantity}
          onChange={handleQuantityChange}
          className="qty-input"
          min="1"
          max={maxStock}
        />
        <button
          onClick={handleIncrement}
          className="qty-btn"
          disabled={isMaxReached}
          title={isMaxReached ? "Maximum stock reached" : "Increase quantity"}
        >
          +
        </button>
      </div>

      <div className="item-total">
        <span className="total-amount">${itemTotal.toFixed(2)}</span>
      </div>

      <button
        onClick={() => removeFromCart(item.id)}
        className="remove-btn"
        title="Remove from cart"
        aria-label={`Remove ${item.name} from cart`}
      >
        ✕
      </button>
    </div>
  );
}
