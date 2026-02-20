import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useProducts } from '../hooks/useProducts';
import { adminAPI, reportsAPI, usersAPI, productsAPI } from '../services/api';
import '../styles/pages/AdminDashboard.css';

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { user, logout, isAdmin } = useAuth();
  const { products, loading, fetchProducts, createProduct, deleteProduct } =
    useProducts();

  const [activeTab, setActiveTab] = useState('overview'); // overview, products, reports, users
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [summary, setSummary] = useState(null);
  const [orders, setOrders] = useState([]);
  const [users, setUsers] = useState([]);
  const [loadingSummary, setLoadingSummary] = useState(false);

  // Reports state
  const [reports, setReports] = useState({
    sales: null,
    avgTransaction: null,
    topProducts: null,
    activeCustomers: null,
    lowStock: null,
    revenueByCategory: null,
  });
  const [loadingReports, setLoadingReports] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    brand: '',
    description: '',
    price: '',
    stock: '',
    category: '',
    barcode: '',
  });

  useEffect(() => {
    console.log('🔍 AdminDashboard mounted, checking auth...');
    console.log('  isAdmin from hook:', isAdmin);
    console.log('  user from hook:', user);

    // Check localStorage directly
    const checkAuth = () => {
      const savedUser = localStorage.getItem('user');
      const token = localStorage.getItem('token');
      console.log('  Checking localStorage:');
      console.log('    Token:', token ? 'EXISTS' : 'MISSING');
      console.log('    User:', savedUser);

      if (!savedUser || !token) {
        console.log('❌ No token or user in localStorage, redirecting to login');
        logout();
        navigate('/admin/login');
        return false;
      }

      try {
        const userData = JSON.parse(savedUser);
        console.log('    Parsed user:', userData);

        if (userData.role !== 'admin') {
          console.log(`❌ User role is "${userData.role}", not "admin", redirecting to login`);
          logout();
          navigate('/admin/login');
          return false;
        }

        console.log('✅ User is admin, loading dashboard');
        return true;
      } catch (e) {
        console.error('  Error parsing user:', e);
        logout();
        navigate('/admin/login');
        return false;
      }
    };

    if (checkAuth()) {
      fetchProducts();
      loadDashboardData();
      if (activeTab === 'reports') {
        loadReports();
      }
    }
  }, [isAdmin, logout, navigate, fetchProducts, activeTab]);

  const loadDashboardData = async () => {
    setLoadingSummary(true);
    try {
      const [summaryData, ordersData] = await Promise.all([
        adminAPI.getDashboardSummary(),
        adminAPI.getDashboardOrders(),
      ]);
      setSummary(summaryData.data);
      setOrders(ordersData.data);
    } catch (err) {
      console.error('Error loading dashboard data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoadingSummary(false);
    }
  };

  const loadUsers = async () => {
    setLoadingSummary(true);
    try {
      const usersData = await usersAPI.getAll();
      setUsers(Array.isArray(usersData.data) ? usersData.data : []);
    } catch (err) {
      console.error('Error loading users:', err);
      setError('Failed to load users');
    } finally {
      setLoadingSummary(false);
    }
  };

  const handleDeleteUser = async (userId) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await usersAPI.deleteUser(userId);
        setSuccess('User deleted successfully!');
        loadUsers();
      } catch (err) {
        setError(err.message || 'Failed to delete user');
      }
    }
  };

  const loadReports = async () => {
    setLoadingReports(true);
    try {
      const [
        salesData,
        avgTransData,
        topProdsData,
        activeCustData,
        lowStockData,
        revenueCatData,
      ] = await Promise.all([
        reportsAPI.getSales({ days: 30 }),
        reportsAPI.getAverageTransaction({ days: 30 }),
        reportsAPI.getTopProducts({ days: 30, limit: 10 }),
        reportsAPI.getActiveCustomers({ days: 30 }),
        reportsAPI.getLowStock({ threshold: 10 }),
        reportsAPI.getRevenueByCategory({ days: 30 }),
      ]);

      setReports({
        sales: salesData.data,
        avgTransaction: avgTransData.data,
        topProducts: topProdsData.data,
        activeCustomers: activeCustData.data,
        lowStock: lowStockData.data,
        revenueByCategory: revenueCatData.data,
      });
    } catch (err) {
      console.error('Error loading reports:', err);
      setError('Failed to load reports');
    } finally {
      setLoadingReports(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      await createProduct({
        ...formData,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock),
      });
      setFormData({ name: '', brand: '', description: '', price: '', stock: '', category: '', barcode: '' });
      setShowForm(false);
      setSuccess('Product created successfully!');
      fetchProducts();
      loadDashboardData();
    } catch (err) {
      setError(err.message || 'Failed to create product');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      try {
        await deleteProduct(id);
        setSuccess('Product deleted successfully!');
      } catch (err) {
        setError(err.message || 'Failed to delete product');
      }
    }
  };

  const handleEditClick = (product) => {
    setEditingId(product.id);
    setFormData({
      name: product.name,
      brand: product.brand || '',
      description: product.description || '',
      price: product.price,
      stock: product.stock,
      category: product.category || '',
    });
    setShowForm(true);
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    try {
      const updatedProduct = {
        name: formData.name,
        brand: formData.brand,
        description: formData.description,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock),
        category: formData.category,
      };
      await productsAPI.update(editingId, updatedProduct);
      setSuccess('Product updated successfully!');
      setEditingId(null);
      setShowForm(false);
      setFormData({
        name: '',
        brand: '',
        description: '',
        price: '',
        stock: '',
        category: '',
        barcode: '',
      });
      fetchProducts();
    } catch (err) {
      setError(err.message || 'Failed to update product');
    }
  };

  const cancelEdit = () => {
    setEditingId(null);
    setShowForm(false);
    setFormData({
      name: '',
      brand: '',
      description: '',
      price: '',
      stock: '',
      category: '',
      barcode: '',
    });
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <div className="admin-dashboard-layout">
      {/* Unified Admin Header */}
      <header className="fresh-admin-header">
        <div className="brand-section">
          <div className="logo-icon">🛒</div>
          <h1>Fresh Grocery <span className="admin-badge">Admin</span></h1>
        </div>

        <nav className="admin-nav">
          <button
            className={`nav-item ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            Dashboard
          </button>
          <button
            className={`nav-item ${activeTab === 'products' ? 'active' : ''}`}
            onClick={() => setActiveTab('products')}
          >
            Products
          </button>
          <button
            className="nav-item"
            onClick={() => navigate('/admin/orders')}
          >
            Orders
          </button>
          <button
            className={`nav-item ${activeTab === 'reports' ? 'active' : ''}`}
            onClick={() => setActiveTab('reports')}
          >
            Reports
          </button>
          <button
            className={`nav-item ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => { setActiveTab('users'); loadUsers(); }}
          >
            Users
          </button>
        </nav>

        <div className="user-section">
          <div className="user-info">
            <span className="user-email">{user?.email}</span>
            <span className="user-role">Administrator</span>
          </div>
          <button onClick={handleLogout} className="logout-btn-text">
            Logout
          </button>
        </div>
      </header>

      <div className="admin-content">
        {error && (
          <div className="alert alert-error">
            {error}
          </div>
        )}
        {success && (
          <div className="alert alert-success">
            {success}
          </div>
        )}

        {/* OVERVIEW TAB */}
        {activeTab === 'overview' && (
          <>
            {/* Dashboard Summary Section */}
            {loadingSummary ? (
              <div className="loading">Loading dashboard...</div>
            ) : summary ? (
              <div className="dashboard-summary">
                <div className="summary-card">
                  <h3>Total Orders</h3>
                  <p className="summary-value">{summary.totalOrders || 0}</p>
                </div>
                <div className="summary-card">
                  <h3>Total Invoices</h3>
                  <p className="summary-value">{summary.totalInvoices || 0}</p>
                </div>
                <div className="summary-card">
                  <h3>Customers</h3>
                  <p className="summary-value">{summary.totalUsersWithOrders || 0}</p>
                </div>
              </div>
            ) : null}

            {/* Recent Orders Section */}
            {orders.length > 0 && (
              <div className="orders-section">
                <h2>Recent Orders</h2>
                <div className="orders-table-wrapper">
                  <table className="orders-table">
                    <thead>
                      <tr>
                        <th>Order ID</th>
                        <th>Customer</th>
                        <th>Email</th>
                        <th>Amount</th>
                        <th>Status</th>
                        <th>Payment</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.slice(0, 10).map((order, idx) => (
                        <tr key={order.id || order.orderId || idx}>
                          <td>#{order.id || order.orderId || 'N/A'}</td>
                          <td>{order.userName || (order.user ? order.user.email : 'Guest')}</td>
                          <td>{order.userEmail || (order.user ? order.user.email : '-')}</td>
                          <td>${parseFloat(order.totalAmount || 0).toFixed(2)}</td>
                          <td><span className={`status ${order.status?.toLowerCase()}`}>{order.status}</span></td>
                          <td><span className={`payment ${order.paymentStatus?.toLowerCase()}`}>{order.paymentStatus}</span></td>
                          <td>{new Date(order.orderDate || order.createdAt).toLocaleDateString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}

        {/* PRODUCTS TAB */}
        {activeTab === 'products' && (
          <>
            <div className="admin-actions">
              <button
                onClick={() => {
                  if (editingId) {
                    cancelEdit();
                  } else {
                    setShowForm(!showForm);
                  }
                }}
                className="btn btn-primary"
              >
                {showForm ? '✕ Cancel' : '+ Add Product'}
              </button>
            </div>

            {showForm && (
              <div className="add-product-form-section">
                <form onSubmit={editingId ? handleEditSubmit : handleSubmit} className="product-form">
                  <h2>{editingId ? 'Edit Product' : 'Add New Product'}</h2>

                  <div className="form-group">
                    <label htmlFor="barcode">Barcode (ISBN/UPC)</label>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <input
                        type="text"
                        id="barcode"
                        name="barcode"
                        value={formData.barcode || ''}
                        onChange={handleChange}
                        placeholder="Scan or enter barcode"
                        style={{ flex: 1 }}
                      />
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={async () => {
                          if (!formData.barcode) return alert('Please enter a barcode');
                          try {
                            const res = await productsAPI.lookupByBarcode(formData.barcode);
                            const data = res.data;
                            setFormData(prev => ({
                              ...prev,
                              name: data.name || prev.name,
                              brand: data.brand || prev.brand,
                              category: data.category || prev.category,
                              description: data.description || prev.description,
                              picture: data.picture || prev.picture,
                            }));
                            setSuccess('Found product in OpenFoodFacts!');
                          } catch (err) {
                            setError('Product not found in OpenFoodFacts database');
                          }
                        }}
                      >
                        🔍 Lookup
                      </button>
                    </div>
                  </div>

                  <div className="form-group">
                    <label htmlFor="name">Product Name *</label>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="brand">Brand</label>
                    <input
                      type="text"
                      id="brand"
                      name="brand"
                      value={formData.brand}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="description">Description</label>
                    <textarea
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      rows="3"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="category">Category</label>
                    <input
                      type="text"
                      id="category"
                      name="category"
                      value={formData.category}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label htmlFor="price">Price *</label>
                      <input
                        type="number"
                        id="price"
                        name="price"
                        value={formData.price}
                        onChange={handleChange}
                        step="0.01"
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label htmlFor="stock">Stock Quantity *</label>
                      <input
                        type="number"
                        id="stock"
                        name="stock"
                        value={formData.stock}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>

                  <button type="submit" className="btn btn-primary">
                    {editingId ? 'Update Product' : 'Add Product'}
                  </button>
                </form>
              </div>
            )}

            <div className="products-section">
              <h2>Product Inventory</h2>
              {loading ? (
                <div className="loading">Loading products...</div>
              ) : products.length === 0 ? (
                <div className="empty-state">
                  <p>No products found</p>
                  <small style={{ color: '#888' }}>
                    (Debug: Total in DB header: {products.length}, Loading: {loading ? 'Yes' : 'No'}, Error: {error ? JSON.stringify(error) : 'None'})
                  </small>
                </div>
              ) : (
                <div className="table-wrapper">
                  <table className="products-table">
                    <thead>
                      <tr>
                        <th>Product Name</th>
                        <th>Brand</th>
                        <th>Price</th>
                        <th>Stock</th>
                        <th>Category</th>
                        <th>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.map((product) => (
                        <tr key={product.id}>
                          <td>
                            <strong>{product.name}</strong>
                          </td>
                          <td>{product.brand || '-'}</td>
                          <td className="price">${product.price.toFixed(2)}</td>
                          <td>
                            <span className={`stock ${product.stock === 0 ? 'low' : ''}`}>
                              {product.stock}
                            </span>
                          </td>
                          <td>{product.category || '-'}</td>
                          <td>
                            <div className="action-buttons">
                              <button
                                onClick={() => handleEditClick(product)}
                                className="btn btn-sm btn-secondary"
                              >
                                Edit
                              </button>
                              <button
                                onClick={() => handleDelete(product.id)}
                                className="btn btn-sm btn-danger"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </>
        )}

        {/* REPORTS TAB */}
        {activeTab === 'reports' && (
          <>
            {loadingReports ? (
              <div className="loading">Loading reports...</div>
            ) : (
              <div className="reports-section">
                <h2>Business Analytics & Reports</h2>

                <div className="reports-grid">
                  {reports.sales && (
                    <div className="report-card">
                      <h3>Total Sales (30 days)</h3>
                      <p className="report-value">${parseFloat(reports.sales.totalSales || 0).toFixed(2)}</p>
                      <p className="report-detail">Orders: {reports.sales.orderCount || 0}</p>
                    </div>
                  )}

                  {reports.avgTransaction && (
                    <div className="report-card">
                      <h3>Avg Transaction Value</h3>
                      <p className="report-value">${parseFloat(reports.avgTransaction.averageTransactionValue || reports.avgTransaction.averageTransaction || 0).toFixed(2)}</p>
                    </div>
                  )}

                  {reports.activeCustomers && (
                    <div className="report-card">
                      <h3>Active Customers (30 days)</h3>
                      <p className="report-value">{reports.activeCustomers.activeCustomerCount || 0}</p>
                    </div>
                  )}

                  {reports.lowStock && (
                    <div className="report-card alert-card">
                      <h3>Low Stock Items</h3>
                      <p className="report-value">{reports.lowStock.length || 0}</p>
                      <p className="report-detail">Action needed!</p>
                    </div>
                  )}
                </div>

                {reports.topProducts && reports.topProducts.length > 0 && (
                  <div className="report-table">
                    <h3>Top 10 Products</h3>
                    <table>
                      <thead>
                        <tr>
                          <th>Product</th>
                          <th>Units Sold</th>
                          <th>Revenue</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reports.topProducts.map((p, idx) => (
                          <tr key={idx}>
                            <td>{p.productName || p.name || 'Unknown'}</td>
                            <td>{p.unitsSold || p.quantity || 0}</td>
                            <td>${parseFloat(p.revenue || p.totalRevenue || 0).toFixed(2)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {reports.lowStock && reports.lowStock.length > 0 && (
                  <div className="report-table">
                    <h3>Low Stock Alert</h3>
                    <table>
                      <thead>
                        <tr>
                          <th>Product</th>
                          <th>Current Stock</th>
                          <th>Threshold</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reports.lowStock.map((p, idx) => (
                          <tr key={idx} className="alert-row">
                            <td>{p.productName || p.name || 'Unknown'}</td>
                            <td>{p.quantityInStock || p.stock || 0}</td>
                            <td>10 units</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {reports.revenueByCategory && reports.revenueByCategory.length > 0 && (
                  <div className="report-table">
                    <h3>Revenue by Category</h3>
                    <table>
                      <thead>
                        <tr>
                          <th>Category</th>
                          <th>Revenue</th>
                          <th>% of Total</th>
                        </tr>
                      </thead>
                      <tbody>
                        {reports.revenueByCategory.map((c, idx) => (
                          <tr key={idx}>
                            <td>{c.category || 'Uncategorized'}</td>
                            <td>${parseFloat(c.totalRevenue || c.revenue || 0).toFixed(2)}</td>
                            <td>{c.percentageOfTotal || '0'}%</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}
          </>
        )}

        {/* USERS TAB */}
        {activeTab === 'users' && (
          <div className="users-section">
            <h2>User Management</h2>
            {loadingSummary ? (
              <div className="loading">Loading users...</div>
            ) : users && users.length > 0 ? (
              <div className="users-table-wrapper">
                <table className="users-table">
                  <thead>
                    <tr>
                      <th>User ID</th>
                      <th>Email</th>
                      <th>Role</th>
                      <th>Created At</th>
                      <th>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id}>
                        <td>#{user.id}</td>
                        <td>{user.email}</td>
                        <td><span className={`role-badge ${user.isAdmin ? 'admin' : 'customer'}`}>
                          {user.isAdmin ? 'Admin' : 'Customer'}
                        </span></td>
                        <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                        <td>
                          <button
                            className="btn-delete"
                            onClick={() => handleDeleteUser(user.id)}
                            title="Delete user"
                          >
                            🗑️
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <p>No users found</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
