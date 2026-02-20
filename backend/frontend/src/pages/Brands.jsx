import React, { useState, useEffect } from 'react';
import { useBrands } from '../hooks/useBrands';
import { Link } from 'react-router-dom';
import '../styles/Brands.css';

const Brands = () => {
    const { brands, loading, fetchBrands } = useBrands();
    const [search, setSearch] = useState('');

    useEffect(() => {
        fetchBrands();
    }, [fetchBrands]);

    const filteredBrands = brands.filter(b =>
        b.name.toLowerCase().includes(search.toLowerCase())
    );

    if (loading && brands.length === 0) return <div className="brands-loading">Loading Brands...</div>;

    return (
        <div className="brands-page">
            <div className="brands-header">
                <h1>Explore Brands</h1>
                <p>Discover your favorite producers</p>
                <input
                    type="text"
                    placeholder="Search brands..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="brand-search"
                />
            </div>

            <div className="brands-grid">
                {filteredBrands.map(brand => (
                    <Link to={`/products?brand=${encodeURIComponent(brand.name)}`} key={brand.name} className="brand-card-link">
                        <div className="brand-card">
                            <div className="brand-logo-placeholder">
                                {brand.image_url ? <img src={brand.image_url} alt={brand.name} /> : <span>{brand.name[0]}</span>}
                            </div>
                            <h3>{brand.name}</h3>
                            <span className="product-count">Shop Collection</span>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    );
};

export default Brands;
