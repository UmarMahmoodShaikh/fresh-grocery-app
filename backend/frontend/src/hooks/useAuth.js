import { useState, useCallback } from 'react';
import { authAPI } from '../services/api';

export const useAuth = () => {
  const [user, setUser] = useState(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    return token && savedUser ? JSON.parse(savedUser) : null;
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const login = useCallback(async (email, password) => {
    console.log('🔑 useAuth.login() called with email:', email);
    setLoading(true);
    setError(null);
    try {
      console.log('📡 Making API request to authAPI.login()');
      const response = await authAPI.login(email, password);
      console.log('📨 API response received:', response);
      console.log('  Status:', response.status);
      console.log('  Data:', response.data);
      
      const { token, user } = response.data;
      console.log('🔍 Extracting token and user:');
      console.log('  Token:', token ? token.substring(0, 20) + '...' : 'MISSING');
      console.log('  User:', user);
      
      if (!token || !user) {
        console.error('❌ Missing token or user in response');
        throw new Error('Invalid response: missing token or user');
      }
      
      console.log('💾 Saving to localStorage:');
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      console.log('✅ Stored in localStorage');
      
      console.log('📝 Setting user state:', user);
      setUser(user);
      console.log('✅ User state updated');
      
      return user;
    } catch (err) {
      console.error('❌ Login error in useAuth:', err);
      console.error('  Error message:', err.message);
      if (err.response) {
        console.error('  Response status:', err.response.status);
        console.error('  Response data:', err.response.data);
      }
      const message = err.response?.data?.message || err.message || 'Login failed';
      console.log('📋 Setting error:', message);
      setError(message);
      throw new Error(message);
    } finally {
      console.log('🔚 useAuth.login() finished, setting loading to false');
      setLoading(false);
    }
  }, []);

  const signup = useCallback(async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const response = await authAPI.signup(email, password);
      console.log('Signup response:', response);
      const { token, user } = response.data;
      if (!token || !user) {
        throw new Error('Invalid response: missing token or user');
      }
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      setUser(user);
      return user;
    } catch (err) {
      console.error('Signup error:', err);
      const message = err.response?.data?.message || err.message || 'Signup failed';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
  }, []);

  return {
    user,
    loading,
    error,
    login,
    signup,
    logout,
    isAuthenticated: !!user,
    isAdmin: user?.role === 'admin',
  };
};
