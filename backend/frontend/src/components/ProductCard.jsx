import { useCart } from '../context/CartContext';
import '../styles/ProductCard.css';

export default function ProductCard({ product, onClick }) {
  const { addToCart } = useCart();

  const handleAddToCart = (e) => {
    e.stopPropagation(); // Prevent opening the modal
    // Ensure price is a number for cart calculations
    const productWithPrice = {
      ...product,
      price: typeof product.price === 'string' ? parseFloat(product.price) : product.price
    };
    addToCart(productWithPrice);
  };

  const isOutOfStock = product.stock === 0;

  // Check if image is a URL (http, https, /, or data URI)
  const isImageUrl = product.picture && (
    product.picture.startsWith('http') ||
    product.picture.startsWith('/') ||
    product.picture.startsWith('data:')
  );

  return (
    <div className="product-card" onClick={onClick} style={{ cursor: 'pointer' }}>
      <div className="product-image-wrapper">
        {isImageUrl ? (
          <img src={product.picture} alt={product.name} className="product-img" />
        ) : (
          <div className="product-placeholder">{product.picture || '🥕'}</div>
        )}

        {/* Optional Badge */}
        {product.onSale && <span className="badge badge-sale">Sale</span>}
        {product.stock_label === 'out of stock' && <span className="badge badge-out">Sold Out</span>}
      </div>

      <div className="product-body">
        <div className="product-category">{product.category || 'Groceries'}</div>
        <h3 className="product-title" title={product.name}>{product.name}</h3>

        <div className="product-rating">
          <span className="stars">★★★★★</span>
          <span className="rating-text">(3.8)</span>
        </div>

        <div className="product-action-row">
          <div className="product-price">
            ${parseFloat(product.price).toFixed(2)}
          </div>

          <button
            onClick={handleAddToCart}
            className="btn-add"
            disabled={product.stock_label === 'out of stock'}
          >
            {product.stock_label === 'out of stock' ? 'Out' : '+ Add'}
          </button>
        </div>
        {product.stock_label === 'low stock item' && (
          <div className="low-stock-alert">Low Stock: {product.stock} left</div>
        )}
      </div>
    </div>
  );
}
