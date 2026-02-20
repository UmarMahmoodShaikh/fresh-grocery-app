import { useState, useCallback } from 'react';
import { brandsAPI } from '../services/api';

export const useBrands = () => {
    const [brands, setBrands] = useState([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchBrands = useCallback(async () => {
        setLoading(true);
        try {
            const response = await brandsAPI.getAll();
            setBrands(response.data);
            setError(null);
        } catch (err) {
            console.error('Error fetching brands:', err);
            setError('Failed to load brands');
        } finally {
            setLoading(false);
        }
    }, []);

    return { brands, loading, error, fetchBrands };
};
