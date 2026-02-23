import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../context/ThemeContext';
import '../styles/Navbar.css';

export default function Navbar() {
  const { cartCount } = useCart();
  const { user, logout, isAdmin } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const handleLogout = () => {
    logout();
  };

  return (
    <nav className="navbar">
      <div className="nav-container">
        <Link to="/" className="nav-logo">
          🛒 Fresh Grocery
        </Link>
        <div className="nav-links">
          <Link to="/" className="nav-link">Home</Link>
          <Link to="/brands" className="nav-link">Brands</Link>
          <Link to="/categories" className="nav-link">Categories</Link>
          <Link to="/track-order" className="nav-link">Track Order</Link>
          <Link to="/cart" className="nav-link cart-link">
            Cart {cartCount > 0 && <span className="cart-badge">{cartCount}</span>}
          </Link>

          <button onClick={toggleTheme} className="theme-toggle-btn" aria-label="Toggle Dark Mode">
            {theme === 'light' ? '🌙' : '☀️'}
          </button>

          {!user ? (
            null
          ) : (
            <button onClick={handleLogout} className="nav-link logout-btn">
              Logout
            </button>
          )}
        </div>
      </div>
    </nav>
  );
}
