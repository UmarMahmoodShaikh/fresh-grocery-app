
import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useProducts } from '../hooks/useProducts';
import ProductCard from '../components/ProductCard';
import ProductModal from '../components/ProductModal';
import FilterSidebar from '../components/FilterSidebar';
import '../styles/pages/Products.css'; // Updated to correct stylesheet

const Products = () => {
  const { products, loading, fetchProducts, pagination, loadMore } = useProducts();
  const [searchParams] = useSearchParams();

  // Filters State
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [selectedBrand, setSelectedBrand] = useState(searchParams.get('brand') || '');
  const [searchQuery, setSearchQuery] = useState(searchParams.get('search') || '');
  const [barcodeQuery, setBarcodeQuery] = useState('');
  const [tagQuery, setTagQuery] = useState('');
  const [priceRange, setPriceRange] = useState([0, 1000]); // Increased default max
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Initial load
  useEffect(() => {
    // Pass current filters if any
    fetchProducts({
      category: selectedCategory,
      brand: selectedBrand,
      search: searchQuery
    });
  }, [fetchProducts]); // Remove filters from dep array to avoid endless loop, rely on manual trigger if needed, or better logic

  // Refetch when filters change (resetting to page 1)
  useEffect(() => {
    // This effect handles filter changes by re-fetching page 1
    const filters = {};
    if (selectedCategory && selectedCategory !== 'All') filters.category = selectedCategory;
    if (selectedBrand && selectedBrand !== 'All') filters.brand = selectedBrand;
    if (searchQuery) filters.search = searchQuery;
    // ... other filters need backend support or frontend filtering on paginated set (complex!)

    // For now, simpler approach: Fetch page 1. Backend might handle text search.
    // NOTE: Frontend filtering on paginated data is tricky. 
    // Ideally backend should handle ALL filtering.
    // If backend only handles basic pagination, frontend filtering only works on loaded pages.
    // Assuming backend handles basic params or we just reset.
    // For this step, let's keep it simple: Reset to page 1.
    fetchProducts(filters, 1, false);
  }, [selectedCategory, selectedBrand, searchQuery, barcodeQuery, tagQuery, priceRange[0], priceRange[1], fetchProducts]);


  // Update state when URL params change
  useEffect(() => {
    const cat = searchParams.get('category');
    const brand = searchParams.get('brand');
    const search = searchParams.get('search');

    if (cat) setSelectedCategory(cat);
    if (brand) setSelectedBrand(brand);
    if (search) setSearchQuery(search);
  }, [searchParams]);

  // Derived Data: Categories & Brands (Warning: This only sees LOADED products)
  // Ideally these should come from a separate API call 'getMetadata'
  const { categories, brands, maxPrice } = useMemo(() => {
    const cats = new Set();
    const brs = new Set();
    let max = 100;

    products.forEach(p => {
      if (p.category) cats.add(p.category);
      if (p.brand && p.brand !== 'Unknown') brs.add(p.brand);
      if (p.price > max) max = p.price;
    });

    return {
      categories: Array.from(cats).sort(),
      brands: Array.from(brs).sort(),
      maxPrice: Math.ceil(max)
    };
  }, [products]);

  // Update max price range once on load
  useEffect(() => {
    if (maxPrice > 100 && priceRange[1] === 1000) {
      setPriceRange([0, maxPrice]);
    }
  }, [maxPrice]);


  // Frontend Filtering Helper (Applied to currently loaded products as fallback)
  // Since we are moving to backend pagination, ideally backend does filtering.
  // But if backend filtering isn't fully implemented for tags/barcodes yet, we rely on this.
  const filteredProducts = useMemo(() => {
    // If we rely purely on backend for major filters, we just return products.
    // But let's keep frontend filter for smooth UX on the loaded set for now.
    return products.filter(product => {
      // 1. Category
      const matchCategory = !selectedCategory || selectedCategory === 'All' || product.category === selectedCategory;

      // 2. Brand
      const matchBrand = !selectedBrand || selectedBrand === 'All' || product.brand === selectedBrand;

      // 3. Search (Name)
      const matchSearch = !searchQuery || product.name.toLowerCase().includes(searchQuery.toLowerCase());

      // 4. Barcode
      const matchBarcode = !barcodeQuery || (product.barcode && product.barcode.includes(barcodeQuery));

      // 5. Tags
      const matchTag = !tagQuery || (product.tags && product.tags.some(t => t.toLowerCase().includes(tagQuery.toLowerCase())));

      // 6. Price
      const matchPrice = product.price >= priceRange[0] && product.price <= priceRange[1];

      return matchCategory && matchBrand && matchSearch && matchPrice && matchBarcode && matchTag;
    });
  }, [products, selectedCategory, selectedBrand, searchQuery, barcodeQuery, tagQuery, priceRange]);

  const handleLoadMore = () => {
    loadMore({
      category: selectedCategory,
      brand: selectedBrand,
      search: searchQuery
    });
  };

  if (loading && products.length === 0) return <div className="loading">Loading Products...</div>;

  return (
    <div className="home-container">
      {/* Sidebar */}
      <aside className="sidebar-section">
        <FilterSidebar
          categories={categories}
          brands={brands}
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
          selectedBrand={selectedBrand}
          onSelectBrand={setSelectedBrand}
          searchQuery={searchQuery}
          onSearchChange={setSearchQuery}
          barcodeQuery={barcodeQuery}
          onBarcodeChange={setBarcodeQuery}
          tagQuery={tagQuery}
          onTagChange={setTagQuery}
          priceRange={priceRange}
          onPriceChange={setPriceRange}
          maxPrice={maxPrice}
        />
      </aside>

      {/* Main Content */}
      <main className="main-content">
        {/* Active Filters Summary */}
        {(selectedCategory || selectedBrand || searchQuery || barcodeQuery || tagQuery) && (
          <div className="active-filters" style={{ marginBottom: '20px' }}>
            <h2>
              {filteredProducts.length} Products Shown ({pagination?.total} Total)
            </h2>
            <div className="filter-badges">
              {selectedCategory && selectedCategory !== 'All' && <span className="badge">Category: {selectedCategory}</span>}
              {selectedBrand && selectedBrand !== 'All' && <span className="badge">Brand: {selectedBrand}</span>}
              {barcodeQuery && <span className="badge">Barcode: {barcodeQuery}</span>}
              {tagQuery && <span className="badge">Tag: {tagQuery}</span>}
            </div>

            <button
              onClick={() => {
                setSelectedCategory('');
                setSelectedBrand('');
                setSearchQuery('');
                setBarcodeQuery('');
                setTagQuery('');
                setPriceRange([0, maxPrice]);
              }}
              className="view-all"
              style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: '0.9rem', marginTop: '10px' }}
            >
              Clear All Filters
            </button>
          </div>
        )}

        {filteredProducts.length === 0 ? (
          <div className="no-results">
            <h3>No products found</h3>
            <p>Try adjusting your filters.</p>
          </div>
        ) : (
          <>
            <div className="product-grid">
              {filteredProducts.map(product => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onClick={() => setSelectedProduct(product)}
                />
              ))}
            </div>

            {/* Pagination Controls */}
            {pagination?.hasMore && (
              <div className="pagination-controls" style={{ textAlign: 'center', marginTop: '30px', paddingBottom: '30px' }}>
                <button
                  className="cta-button"
                  onClick={handleLoadMore}
                  disabled={loading}
                >
                  {loading ? 'Loading...' : 'Load More Products'}
                </button>
                <p style={{ marginTop: '10px', color: 'var(--text-muted)' }}>
                  Showing {products.length} of {pagination.total}
                </p>
              </div>
            )}
          </>
        )}
      </main>

      {/* Product Modal */}
      {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </div>
  );
};

export default Products;
