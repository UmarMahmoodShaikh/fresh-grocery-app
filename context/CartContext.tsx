import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { cartApi } from '../services/api';
import { useStore } from './StoreContext';

export interface CartItem {
    id: number;
    product_id: number;
    name: string;
    price: number;
    quantity: number;
    image_url: string;
    subtotal: number;
}

interface CartContextType {
    cartItems: CartItem[];
    addToCart: (product: any, quantity?: number) => Promise<void>;
    removeFromCart: (id: number) => Promise<void>;
    updateQuantity: (id: number, quantity: number) => Promise<void>;
    clearCart: () => Promise<void>;
    cartTotal: number;
    cartCount: number;
    isLoadingCart: boolean;
    refreshCart: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { selectedStore } = useStore();
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [isLoadingCart, setIsLoadingCart] = useState(false);

    const refreshCart = async () => {
        if (!selectedStore) return;
        
        setIsLoadingCart(true);
        try {
            const result = await cartApi.get(selectedStore.slug);
            if (result.data && result.data.items) {
                setCartItems(result.data.items.map((item: any) => ({
                    id: item.product_id, // Map for unique key usage
                    product_id: item.product_id,
                    name: item.name,
                    price: item.price,
                    quantity: item.quantity,
                    image_url: item.image_url,
                    subtotal: item.subtotal
                })));
            } else if (result.status === 404 || !result.data?.items) {
                setCartItems([]);
            }
        } catch (error) {
            console.error('Failed to load cart from Redis', error);
        } finally {
            setIsLoadingCart(false);
        }
    };

    // Load from Redis whenever store changes
    useEffect(() => {
        refreshCart();
    }, [selectedStore]);

    const addToCart = async (product: any, quantity = 1) => {
        if (!selectedStore) return;

        // Optimistic update
        const existingItem = cartItems.find(item => item.product_id === product.id);
        if (existingItem) {
            setCartItems(prev => prev.map(item => 
                item.product_id === product.id ? { ...item, quantity: item.quantity + quantity } : item
            ));
        } else {
            setCartItems(prev => [...prev, {
                id: product.id,
                product_id: product.id,
                name: product.name,
                price: Number(product.price),
                quantity,
                image_url: product.image_url,
                subtotal: Number(product.price) * quantity
            }]);
        }

        // Sync with backend
        const result = await cartApi.addItem(selectedStore.slug, product.id, quantity);
        if (!result.data) {
            // Revert on failure
            refreshCart();
        }
    };

    const removeFromCart = async (id: number) => {
        if (!selectedStore) return;

        setCartItems(prev => prev.filter(item => item.product_id !== id));
        const result = await cartApi.removeItem(selectedStore.slug, id);
        if (!result.data) refreshCart();
    };

    const updateQuantity = async (id: number, quantity: number) => {
        if (!selectedStore) return;

        if (quantity <= 0) {
            await removeFromCart(id);
            return;
        }

        const currentItem = cartItems.find(item => item.product_id === id);
        if (!currentItem) return;
        
        const diff = quantity - currentItem.quantity;
        
        setCartItems(prev => prev.map(item => item.product_id === id ? { ...item, quantity } : item));
        
        const result = await cartApi.addItem(selectedStore.slug, id, diff);
        if (!result.data) refreshCart();
    };

    const clearCart = async () => {
        if (!selectedStore) return;
        setCartItems([]);
        await cartApi.clear(selectedStore.slug);
        refreshCart();
    };

    const cartTotal = cartItems.reduce(
        (total, item) => total + item.price * item.quantity,
        0
    );

    const cartCount = cartItems.reduce(
        (count, item) => count + item.quantity,
        0
    );

    return (
        <CartContext.Provider
            value={{
                cartItems,
                addToCart,
                removeFromCart,
                updateQuantity,
                clearCart,
                cartTotal,
                cartCount,
                isLoadingCart,
                refreshCart
            }}
        >
            {children}
        </CartContext.Provider>
    );
};

export const useCart = () => {
    const context = useContext(CartContext);
    if (context === undefined) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
};
