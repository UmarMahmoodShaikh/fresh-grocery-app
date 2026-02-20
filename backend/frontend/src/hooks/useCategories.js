import { useState, useCallback } from 'react';
import { categoriesAPI } from '../services/api';

export const useCategories = () => {
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchCategories = useCallback(async () => {
        setLoading(true);
        try {
            const response = await categoriesAPI.getAll();
            setCategories(response.data);
            setError(null);
        } catch (err) {
            console.error('Error fetching categories:', err);
            setError('Failed to load categories');
        } finally {
            setLoading(false);
        }
    }, []);

    return { categories, loading, error, fetchCategories };
};
