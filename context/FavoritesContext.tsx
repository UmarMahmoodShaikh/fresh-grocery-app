import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';

export interface Product {
    id: number | string;
    name: string;
    price: number;
    image_url?: string;
    description?: string;
    category_id?: number;
    stock?: number;
}

interface FavoritesContextType {
    favorites: Product[];
    addFavorite: (product: Product) => void;
    removeFavorite: (productId: number | string) => void;
    isFavorite: (productId: number | string) => boolean;
    toggleFavorite: (product: Product) => void;
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined);

export const FavoritesProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [favorites, setFavorites] = useState<Product[]>([]);

    useEffect(() => {
        loadFavorites();
    }, []);

    const loadFavorites = async () => {
        try {
            const storedFavorites = await AsyncStorage.getItem('favorites');
            if (storedFavorites) {
                setFavorites(JSON.parse(storedFavorites));
            }
        } catch (error) {
            console.error('Error loading favorites:', error);
        }
    };

    const saveFavorites = async (updatedFavorites: Product[]) => {
        try {
            await AsyncStorage.setItem('favorites', JSON.stringify(updatedFavorites));
        } catch (error) {
            console.error('Error saving favorites:', error);
        }
    };

    const addFavorite = (product: Product) => {
        if (!favorites.find((fav) => fav.id === product.id)) {
            const updated = [...favorites, product];
            setFavorites(updated);
            saveFavorites(updated);
        }
    };

    const removeFavorite = (productId: number | string) => {
        const updated = favorites.filter((fav) => fav.id !== productId);
        setFavorites(updated);
        saveFavorites(updated);
    };

    const isFavorite = (productId: number | string) => {
        return favorites.some((fav) => fav.id === productId);
    };

    const toggleFavorite = (product: Product) => {
        if (isFavorite(product.id)) {
            removeFavorite(product.id);
        } else {
            addFavorite(product);
        }
    };

    return (
        <FavoritesContext.Provider value={{ favorites, addFavorite, removeFavorite, isFavorite, toggleFavorite }}>
            {children}
        </FavoritesContext.Provider>
    );
};

export const useFavorites = () => {
    const context = useContext(FavoritesContext);
    if (context === undefined) {
        throw new Error('useFavorites must be used within a FavoritesProvider');
    }
    return context;
};
