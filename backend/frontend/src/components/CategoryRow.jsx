import React from 'react';
import ProductCard from './ProductCard';
import '../styles/CategoryRow.css';

const CategoryRow = ({ title, products, onViewAll, onProductClick }) => {
    if (!products || products.length === 0) return null;

    return (
        <div className="category-row-section">
            <div className="category-row-header">
                <h2>{title}</h2>
                <button className="btn-view-all" onClick={onViewAll}>
                    View all
                </button>
            </div>

            <div className="horizontal-scroll-container">
                {products.map(product => (
                    <div key={product.id} className="horizontal-card-wrapper" onClick={() => onProductClick(product)}>
                        <ProductCard product={product} />
                    </div>
                ))}
            </div>
        </div>
    );
};

export default CategoryRow;
