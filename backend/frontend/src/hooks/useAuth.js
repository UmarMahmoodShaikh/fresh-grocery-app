import { useCallback, useState } from 'react';
import { authAPI } from '../services/api';

const isDev = import.meta.env.DEV;

export const useAuth = () => {
  const [user, setUser] = useState(() => {
    const token = localStorage.getItem('token');
    const savedUser = localStorage.getItem('user');
    return token && savedUser ? JSON.parse(savedUser) : null;
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const login = useCallback(async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const response = await authAPI.login(email, password);

      const { token, user } = response.data;

      if (!token || !user) {
        throw new Error('Invalid response: missing token or user');
      }

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      setUser(user);

      return user;
    } catch (err) {
      if (isDev) {
        // Only log non-sensitive error metadata in development
        console.error('[Auth] Login failed:', err.response?.status ?? err.message);
      }
      const message = err.response?.data?.message || err.message || 'Login failed';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const signup = useCallback(async (email, password) => {
    setLoading(true);
    setError(null);
    try {
      const response = await authAPI.signup(email, password);
      const { token, user } = response.data;
      if (!token || !user) {
        throw new Error('Invalid response: missing token or user');
      }
      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(user));
      setUser(user);
      return user;
    } catch (err) {
      if (isDev) {
        console.error('[Auth] Signup failed:', err.response?.status ?? err.message);
      }
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
