import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import '../styles/pages/AdminLogin.css';

export default function AdminLogin() {
  const navigate = useNavigate();
  const { login, loading, error: authError } = useAuth();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!formData.email || !formData.password) {
      setError('Please fill in all fields');
      return;
    }

    try {
      console.log('🔐 LOGIN ATTEMPT');
      console.log('  Email:', formData.email);
      console.log('  Password:', formData.password ? '****' : 'empty');

      const user = await login(formData.email, formData.password);
      console.log('✅ Login hook returned:', user);

      // Small delay to ensure all updates are complete
      console.log('⏳ Waiting 500ms before checking localStorage and navigating...');
      await new Promise(resolve => setTimeout(resolve, 500));

      // Check localStorage after login
      const token = localStorage.getItem('token');
      const savedUser = localStorage.getItem('user');
      console.log('📦 LocalStorage after wait:');
      console.log('  Token exists:', !!token);
      console.log('  User:', savedUser);

      if (!savedUser || !token) {
        console.error('❌ Token or user not in localStorage');
        setError('Login failed: Data not saved to storage');
        return;
      }

      const userData = JSON.parse(savedUser);
      console.log('👤 Parsed user:', userData);

      if (userData.role !== 'admin') {
        console.error(`❌ User role is "${userData.role}", not "admin"`);
        setError(`Login failed: You are a ${userData.role}, not an admin`);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        return;
      }

      console.log('✅ All checks passed, navigating to /admin/dashboard');
      navigate('/admin/dashboard');

    } catch (err) {
      console.error('❌ Login error:', err);
      const errorMessage = err.message || 'Login failed. Please try again.';
      setError(errorMessage);
    }
  };

  return (
    <div className="admin-login-page">
      <div className="login-container">
        <div className="login-header">
          <div className="login-logo">🛒</div>
          <h1>Admin Login</h1>
          <p>Please sign in to continue</p>
        </div>

        <form onSubmit={handleSubmit} className="login-form" noValidate>
          {(error || authError) && (
            <div className="alert alert-error">
              {error || authError}
            </div>
          )}

          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="admin@example.com"
              disabled={loading}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="••••••••"
              disabled={loading}
              required
            />
          </div>

          <button type="submit" disabled={loading} className="login-btn">
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="login-footer">
          <p>Not an admin? <a href="/">Return to store</a></p>
        </div>
      </div>
    </div>
  );
}
