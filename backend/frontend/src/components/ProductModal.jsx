import React, { useState, useMemo } from 'react';
import { useCart } from '../context/CartContext';
import '../styles/ProductModal.css';

const ProductModal = ({ product, onClose }) => {
    const { addToCart } = useCart();
    const [activeImage, setActiveImage] = useState(product?.picture);

    if (!product) return null;

    // Combine main picture and gallery into a unique list
    const images = useMemo(() => {
        const rawGallery = Array.isArray(product.gallery) ? product.gallery :
            (product.nutritionalInfo?.gallery ? product.nutritionalInfo.gallery : []);

        const allImages = [product.picture, ...rawGallery].filter(Boolean);
        return [...new Set(allImages)]; // Remove duplicates
    }, [product]);

    // Ensure tags is an array
    const tags = Array.isArray(product.tags) ? product.tags :
        (product.nutritionalInfo?.tags ? product.nutritionalInfo.tags : []);
    // Fallback to nutritionalInfo tags if I move them there

    // Ensure gallery is an array
    const gallery = Array.isArray(product.gallery) ? product.gallery :
        (product.nutritionalInfo?.gallery ? product.nutritionalInfo.gallery : []);

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
                <button className="modal-close-btn" onClick={onClose}>&times;</button>

                <div className="modal-body">
                    <div className="modal-image-section">
                        <div className="modal-main-image-wrapper">
                            {activeImage && (
                                <img src={activeImage} alt={product.name} className="modal-product-img" />
                            )}
                        </div>

                        {/* Gallery Thumbnails */}
                        {images.length > 1 && (
                            <div className="modal-gallery">
                                {images.map((img, idx) => (
                                    <div
                                        key={idx}
                                        className={`gallery-thumb ${activeImage === img ? 'active' : ''}`}
                                        onClick={() => setActiveImage(img)}
                                    >
                                        <img src={img} alt={`View ${idx + 1}`} />
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    <div className="modal-details-section">
                        <div className="modal-brand-header">
                            {product.brand_image && (
                                <img src={product.brand_image} alt={product.brand} className="modal-brand-logo" />
                            )}
                            <span className="modal-brand">{product.brand && product.brand !== 'Unknown' ? product.brand : 'Fresh Grocery'}</span>
                        </div>
                        <h2 className="modal-title">{product.name}</h2>

                        {/* Tags Badges */}
                        {tags.length > 0 && (
                            <div className="modal-tags">
                                {tags.map(tag => (
                                    <span key={tag} className="tag-badge">{tag}</span>
                                ))}
                            </div>
                        )}

                        <div className="modal-meta">
                            <span className="modal-category">{product.category || 'General'}</span>
                            {product.stock_label && (
                                <span className={`modal-stock-label ${product.stock_label.replace(/\s+/g, '-').toLowerCase()}`}>
                                    {product.stock_label}
                                </span>
                            )}
                            {/* Always show limited stock count if low */}
                            {product.stock < 50 && (
                                <span className="modal-low-stock" style={{ marginLeft: '10px' }}>({product.stock} left)</span>
                            )}
                        </div>

                        <div className="modal-price-section">
                            <span className="modal-price">${typeof product.price === 'number' ? product.price.toFixed(2) : product.price}</span>
                            {product.barcode && <span className="modal-barcode">Barcode: {product.barcode}</span>}
                        </div>

                        <p className="modal-description">{product.description || `A premium quality ${product.name} item, carefully selected for our customers.`}</p>

                        {/* Nutrition Section ... */}
                        {product.nutrition && Object.keys(product.nutrition).length > 0 && (
                            <div className="modal-nutrition-chart">
                                <h3>Nutrition Facts</h3>
                                <div className="nutrition-table">
                                    <div className="nutrition-row">
                                        <span className="nutrition-label">Energy</span>
                                        <span className="nutrition-value">{product.nutrition.energy || 'N/A'}</span>
                                    </div>
                                    <div className="nutrition-row">
                                        <span className="nutrition-label">Proteins</span>
                                        <span className="nutrition-value">{product.nutrition.proteins || '0'}g</span>
                                    </div>
                                    <div className="nutrition-row">
                                        <span className="nutrition-label">Carbohydrates</span>
                                        <span className="nutrition-value">{product.nutrition.carbs || '0'}g</span>
                                    </div>
                                    <div className="nutrition-row">
                                        <span className="nutrition-label">Sugars</span>
                                        <span className="nutrition-value">{product.nutrition.sugars || '0'}g</span>
                                    </div>
                                    <div className="nutrition-row">
                                        <span className="nutrition-label">Fat</span>
                                        <span className="nutrition-value">{product.nutrition.fat || '0'}g</span>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="modal-actions">
                            <button
                                className={`btn-add-cart-large ${product.stock_label === 'out of stock' ? 'disabled' : ''}`}
                                disabled={product.stock_label === 'out of stock'}
                                onClick={() => {
                                    if (product.stock_label !== 'out of stock') {
                                        addToCart(product);
                                        onClose();
                                    }
                                }}
                            >
                                {product.stock_label === 'out of stock' ? 'Out of Stock' : 'Add to Cart'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductModal;
