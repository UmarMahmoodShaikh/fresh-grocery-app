import { useState, useCallback } from 'react';
import { productsAPI } from '../services/api';

export const useProducts = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const [pagination, setPagination] = useState({ page: 1, limit: 50, total: 0, hasMore: true });

  const fetchProducts = useCallback(async (filters = {}, page = 1, isLoadMore = false) => {
    setLoading(true);
    setError(null);
    try {
      // Pass page and limit in filters
      const queryParams = { ...filters, page, limit: 50 };
      const response = await productsAPI.getAll(queryParams);

      // Backend now returns { data, count, page, limit }
      // Or just array if not updated yet (fallback compatibility)
      // productsAPI.getAll returns { data: [...], count: N }
      console.log("🔍 [useProducts] Raw API Response:", response);
      const newData = response.data || [];
      const totalCount = response.count || newData.length;
      console.log(`✅ [useProducts] Extracted: ${newData.length} items (Total in DB: ${totalCount})`);

      setProducts(prev => isLoadMore ? [...prev, ...newData] : newData);

      setPagination({
        page,
        limit: 50,
        total: totalCount,
        hasMore: (page * 50) < totalCount
      });

      return newData;
    } catch (err) {
      console.error("❌ [Frontend] fetchProducts error:", err);
      const message = err.response?.data?.message || 'Failed to fetch products';
      setError({ message });
    } finally {
      setLoading(false);
    }
  }, []);

  const loadMore = useCallback((filters = {}) => {
    if (!loading && pagination.hasMore) {
      fetchProducts(filters, pagination.page + 1, true);
    }
  }, [loading, pagination, fetchProducts]);

  const fetchProductById = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      const response = await productsAPI.getById(id);
      return response.data;
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to fetch product';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const createProduct = useCallback(async (data) => {
    setLoading(true);
    setError(null);
    try {
      const response = await productsAPI.create(data);
      setProducts((prev) => [...prev, response.data]);
      return response.data;
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to create product';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteProduct = useCallback(async (id) => {
    setLoading(true);
    setError(null);
    try {
      await productsAPI.delete(id);
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      const message = err.response?.data?.message || 'Failed to delete product';
      setError(message);
      throw new Error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    products,
    loading,
    error,
    pagination,
    loadMore,
    fetchProducts,
    fetchProductById,
    createProduct,
    deleteProduct,
  };
};
