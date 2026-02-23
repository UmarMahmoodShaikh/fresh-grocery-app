import React from 'react';
import '../styles/FilterSidebar.css';

const FilterSidebar = ({
    categories = [],
    brands = [],
    selectedCategory,
    onSelectCategory,
    selectedBrand,
    onSelectBrand,
    searchQuery,
    onSearchChange,
    barcodeQuery,
    onBarcodeChange,
    tagQuery,
    onTagChange,
    priceRange,
    onPriceChange,
    minPrice = 0,
    maxPrice = 100
}) => {
    return (
        <aside className="filter-sidebar">
            <div className="filter-header">
                <h3>Filters</h3>
                <button
                    className="btn-clear"
                    onClick={() => {
                        onSelectCategory('');
                        onSelectBrand('');
                        onSearchChange('');
                        onBarcodeChange('');
                        onTagChange('');
                        onPriceChange([0, maxPrice]);
                    }}
                >
                    Clear All
                </button>
            </div>

            {/* 1. Category Searchable Dropdown */}
            <div className="filter-section">
                <h4>Category</h4>
                <input
                    list="category-options"
                    placeholder="Search Category..."
                    className="filter-input"
                    value={selectedCategory}
                    onChange={(e) => onSelectCategory(e.target.value)}
                />
                <datalist id="category-options">
                    <option value="All" />
                    {categories.map(cat => (
                        <option key={cat} value={cat} />
                    ))}
                </datalist>
            </div>

            {/* 2. Brand Searchable Dropdown */}
            <div className="filter-section">
                <h4>Brand</h4>
                <input
                    list="brand-options"
                    placeholder="Search Brand..."
                    className="filter-input"
                    value={selectedBrand}
                    onChange={(e) => onSelectBrand(e.target.value)}
                />
                <datalist id="brand-options">
                    <option value="All" />
                    {brands.map(brand => (
                        <option key={brand} value={brand} />
                    ))}
                </datalist>
            </div>

            {/* 3. Text Search */}
            <div className="filter-section">
                <h4>Product Name</h4>
                <input
                    type="text"
                    placeholder="Search Name..."
                    value={searchQuery || ''}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="filter-input"
                />
            </div>

            {/* 4. Barcode Search */}
            <div className="filter-section">
                <h4>Barcode</h4>
                <input
                    type="text"
                    placeholder="e.g. 12345678"
                    value={barcodeQuery || ''}
                    onChange={(e) => onBarcodeChange(e.target.value)}
                    className="filter-input"
                />
            </div>

            {/* 5. Tag Search */}
            <div className="filter-section">
                <h4>Tag</h4>
                <input
                    type="text"
                    placeholder="e.g. vegan, gluten-free"
                    value={tagQuery || ''}
                    onChange={(e) => onTagChange(e.target.value)}
                    className="filter-input"
                />
            </div>

            {/* 6. Price Range */}
            <div className="filter-section">
                <h4>Price Range</h4>
                <div className="price-inputs">
                    <div className="price-field">
                        <span className="currency">$</span>
                        <input
                            type="number"
                            placeholder="Min"
                            value={priceRange[0]}
                            onChange={(e) => onPriceChange([Number(e.target.value), priceRange[1]])}
                            min="0"
                        />
                    </div>
                    <span className="separator">-</span>
                    <div className="price-field">
                        <span className="currency">$</span>
                        <input
                            type="number"
                            placeholder="Max"
                            value={priceRange[1]}
                            onChange={(e) => onPriceChange([priceRange[0], Number(e.target.value)])}
                            min="0"
                        />
                    </div>
                </div>
                {/* Visual Slider support could be added here later */}
            </div>
        </aside>
    );
};

export default FilterSidebar;
