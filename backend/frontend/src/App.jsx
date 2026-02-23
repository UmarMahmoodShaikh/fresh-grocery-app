import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuth } from './hooks/useAuth';
import { CartProvider } from './context/CartContext';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Products from './pages/Products';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import OrderConfirmation from './pages/OrderConfirmation';
import AdminLogin from './pages/AdminLogin';
import AdminDashboard from './pages/AdminDashboard';
import LoginTest from './pages/LoginTest';
import Brands from './pages/Brands';
import Categories from './pages/Categories';
import OrdersPage from './pages/OrdersPage';
import TrackOrder from './pages/TrackOrder';
import OrderDetailsPage from './pages/OrderDetailsPage';
import { ThemeProvider } from './context/ThemeContext';
import './styles/App.css';


function ConditionalNavbar() {
  const location = useLocation();
  // Don't show global navbar on any admin routes
  if (location.pathname.startsWith('/admin')) {
    return null;
  }
  return <Navbar />;
}

function ProtectedRoute({ children, isAdmin }) {
  // Check localStorage directly for most reliable auth check
  const savedUser = localStorage.getItem('user');
  const token = localStorage.getItem('token');

  let isUserAdmin = false;
  if (savedUser && token) {
    try {
      const userData = JSON.parse(savedUser);
      isUserAdmin = userData.role === 'admin';
    } catch (e) {
      console.error('Error parsing user from localStorage:', e);
    }
  }

  return isUserAdmin ? children : <Navigate to="/admin/login" />;
}

function App() {
  const { isAdmin } = useAuth();
  const [isAdminCurrent, setIsAdminCurrent] = useState(isAdmin);

  // Check isAdmin status whenever the route changes (via a listener)
  useEffect(() => {
    const checkAdminStatus = () => {
      const savedUser = localStorage.getItem('user');
      if (savedUser) {
        try {
          const userData = JSON.parse(savedUser);
          setIsAdminCurrent(userData.role === 'admin');
        } catch (e) {
          setIsAdminCurrent(false);
        }
      } else {
        setIsAdminCurrent(false);
      }
    };

    // Check on component mount
    checkAdminStatus();

    // Also update when isAdmin from hook changes
    setIsAdminCurrent(isAdmin);
  }, [isAdmin]);

  return (
    <ThemeProvider>
      <Router>
        <CartProvider>
          <div className="app-wrapper">
            <ConditionalNavbar />
            <main className="app-main">
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<Home />} />
                <Route path="/products" element={<Products />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/order-confirmation/:orderId" element={<OrderConfirmation />} />
                <Route path="/brands" element={<Brands />} />
                <Route path="/categories" element={<Categories />} />
                <Route path="/track-order" element={<TrackOrder />} />
                <Route path="/login-test" element={<LoginTest />} />

                {/* Admin Routes */}
                <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
                <Route path="/admin/login" element={<AdminLogin />} />
                <Route
                  path="/admin/dashboard"
                  element={
                    <ProtectedRoute isAdmin={isAdminCurrent}>
                      <AdminDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/orders"
                  element={
                    <ProtectedRoute isAdmin={isAdminCurrent}>
                      <OrdersPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin/orders/:id"
                  element={
                    <ProtectedRoute isAdmin={isAdminCurrent}>
                      <OrderDetailsPage />
                    </ProtectedRoute>
                  }
                />

                {/* Catch all */}
                <Route path="*" element={<Navigate to="/" />} />
              </Routes>
            </main>
          </div>
        </CartProvider>
      </Router>
    </ThemeProvider>
  );
}

export default App;
