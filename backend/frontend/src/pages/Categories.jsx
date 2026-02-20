import React, { useState, useEffect } from 'react';
import { useCategories } from '../hooks/useCategories';
import { Link } from 'react-router-dom';
import '../styles/Brands.css';

const Categories = () => {
    const { categories, loading, fetchCategories } = useCategories();
    const [search, setSearch] = useState('');

    useEffect(() => {
        fetchCategories();
    }, [fetchCategories]);

    const filteredCategories = categories.filter(c =>
        c.name.toLowerCase().includes(search.toLowerCase())
    );

    if (loading && categories.length === 0) return <div className="brands-loading">Loading Categories...</div>;

    return (
        <div className="brands-page"> {/* Reusing class for layout */}
            <div className="brands-header">
                <h1>Explore Categories</h1>
                <p>Browse products by aisle</p>
                <input
                    type="text"
                    placeholder="Search categories..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="brand-search"
                />
            </div>

            <div className="brands-grid">
                {filteredCategories.map(cat => (
                    <Link to={`/products?category=${encodeURIComponent(cat.name)}`} key={cat.name} className="brand-card-link">
                        <div className="brand-card">
                            <div className="brand-logo-placeholder">
                                {cat.image_url ? <img src={cat.image_url} alt={cat.name} /> : <span>{cat.name[0]}</span>}
                            </div>
                            <h3>{cat.name}</h3>
                            <span className="product-count">Explore Category</span>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
};

export default Categories;
