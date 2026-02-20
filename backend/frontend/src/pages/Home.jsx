import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useProducts } from '../hooks/useProducts';
import { useBrands } from '../hooks/useBrands';
import { useCategories } from '../hooks/useCategories';
import { useTheme } from '../context/ThemeContext';
import ProductCard from '../components/ProductCard';
import ProductModal from '../components/ProductModal';
import '../styles/pages/Home.css';

const Home = () => {
  const { products, loading: productsLoading, fetchProducts } = useProducts();
  const { brands, loading: brandsLoading, fetchBrands } = useBrands();
  const { categories, loading: categoriesLoading, fetchCategories } = useCategories();
  const { theme } = useTheme();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const slides = [
    {
      id: 1,
      image: '/hero/fresh.png',
      title: '',
      subtitle: '',
      badge: 'Fresh & Organic'
    },
    {
      id: 2,
      image: '/hero/delivery.png',
      title: 'Fast Delivery, Straight to You',
      subtitle: 'Get your groceries delivered in record time with our express service.',
      badge: 'Grocery Flash'
    },
    {
      id: 3,
      image: '/hero/healthy.png',
      title: 'Nourish Your Life',
      subtitle: 'Discover a balanced diet with our premium healthy food options.',
      badge: 'Healthy Living'
    }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [slides.length]);

  useEffect(() => {
    fetchProducts();
    fetchBrands();
    fetchCategories();
  }, [fetchProducts, fetchBrands, fetchCategories]);

  const topProducts = useMemo(() => products.slice(0, 20), [products]);
  const topBrands = useMemo(() => brands.slice(0, 15), [brands]);
  const topCategories = useMemo(() => categories.slice(0, 20), [categories]);

  const loading = productsLoading || brandsLoading || categoriesLoading;

  if (loading && products.length === 0) {
    return <div className="loading">Loading Fresh Goods...</div>;
  }

  return (
    <div className="home-landing">
      {/* Hero Slider */}
      <section className="hero-slider">
        {slides.map((slide, index) => (
          <div
            key={slide.id}
            className={`slide ${index === currentSlide ? 'active' : ''}`}
            style={{ backgroundImage: `url(${slide.image})` }}
          >
            <div className="slide-overlay"></div>
            <div className="hero-content">
              <div className="hero-badge">{slide.badge}</div>
              <h1>{slide.title}</h1>
              <p>{slide.subtitle}</p>
              <Link to="/products" className="cta-button">Shop Now</Link>
            </div>
          </div>
        ))}

        {/* Slider Indicators */}
        <div className="slider-dots">
          {slides.map((_, idx) => (
            <span
              key={idx}
              className={`dot ${idx === currentSlide ? 'active' : ''}`}
              onClick={() => setCurrentSlide(idx)}
            ></span>
          ))}
        </div>
      </section>

      {/* Top Categories */}
      <section className="landing-section">
        <div className="section-header">
          <h2>Shop by Category</h2>
          <Link to="/categories" className="view-all">View all</Link>
        </div>
        <div className="home-scroll-container">
          {topCategories.map(cat => (
            <Link to={`/products?category=${encodeURIComponent(cat.name)}`} key={cat.name} className="category-card-home">
              <div className="card-image-wrapper">
                {cat.image_url ? <img src={cat.image_url} alt={cat.name} /> : <span>{cat.name[0]}</span>}
              </div>
              <div className="card-body">
                <h3>{cat.name}</h3>
                <span className="card-meta">Shop Now</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Top Products */}
      <section className="landing-section">
        <div className="section-header">
          <h2>Top Selling Products</h2>
          <Link to="/products" className="view-all">View all</Link>
        </div>
        <div className="home-scroll-container products-scroll">
          {topProducts.map(product => (
            <ProductCard
              key={product.id}
              product={product}
              onClick={() => setSelectedProduct(product)}
            />
          ))}
        </div>
      </section>

      {/* Top Brands */}
      <section className="landing-section">
        <div className="section-header">
          <h2>Featured Brands</h2>
          <Link to="/brands" className="view-all">View all</Link>
        </div>
        <div className="home-scroll-container">
          {topBrands.map(brand => (
            <Link to={`/products?brand=${encodeURIComponent(brand.name)}`} key={brand.name} className="brand-card-home">
              <div className="card-image-wrapper">
                {brand.image_url ? <img src={brand.image_url} alt={brand.name} /> : <span>{brand.name[0]}</span>}
              </div>
              <div className="card-body">
                <h3>{brand.name}</h3>
                <span className="card-meta">Shop Brand</span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Product Details Modal */}
      {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </div>
  );
};

export default Home;
