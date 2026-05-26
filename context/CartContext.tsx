import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {createContext, useContext, useEffect, useState} from 'react';
import {cartApi} from '../services/api';
import {useStore} from './StoreContext';
import {Alert} from 'react-native';
import {useBudget} from './BudgetContext';

export interface CartItem {
    id: number;
    product_id: number;
    name: string;
    price: number;
    quantity: number;
    image_url: string;
    subtotal: number;
    category_id?: number | null;
    category_name?: string;
    calories?: number | null;
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
    totalCalories: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

import { useNetwork } from './NetworkContext';

// ... (keep CartItem interface and CartContextType as is)

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({children}) => {
    const {selectedStore} = useStore();
    const {isOnline} = useNetwork();
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const [isLoadingCart, setIsLoadingCart] = useState(false);
    const [hasOfflineChanges, setHasOfflineChanges] = useState(false);
    const {totalBudget, getCategoryBudget} = useBudget();

    // ─── Helper functions ────────────────────────────────────────────────

    const getCategoryKeyLabel = (categoryId: number | null | undefined, categoryName: string | null | undefined) => {
        if (categoryName && categoryName.trim().length > 0) {
            return categoryName;
        }
        if (categoryId !== null && categoryId !== undefined) {
            return `Category ${categoryId}`;
        }
        return "Uncategorized";
    };

    const resolveCategoryKey = (categoryId: number | null | undefined, categoryName: string | null | undefined) => {
        if (categoryId !== null && categoryId !== undefined) {
            return `id:${categoryId}`;
        }
        if (categoryName && categoryName.trim().length > 0) {
            return `name:${categoryName.trim().toLowerCase()}`;
        }
        return "";
    };

    const calculateCartTotal = (items: CartItem[]) => items.reduce(
        (total, item) => total + item.price * item.quantity,
        0
    );

    const getNextItems = (product: any, quantity: number) => {
        const existingItem = cartItems.find(item => item.id === product.id);

        const getCalories = (productData: any): number | null => {
            if (productData.calories) return productData.calories;
            if (productData.nutrition?.calories) return productData.nutrition.calories;
            if (productData.nutrition?.energy) return productData.nutrition.energy;
            return null;
        };

        if (existingItem) {
            return cartItems.map(item =>
                item.id === product.id
                    ? {...item, quantity: item.quantity + quantity}
                    : item
            );
        }

        return [
            ...cartItems,
            {
                id: product.id,
                product_id: product.id,
                name: product.name,
                price: Number(product.price),
                quantity,
                image_url: product.image_url,
                subtotal: Number(product.price) * quantity,
                category_id: product.category?.id ?? null,
                category_name: product.category?.name ?? "",
                calories: getCalories(product),
            },
        ];
    };

    const validateBudgets = (nextItems: CartItem[], product: any, quantity: number) => {
        const nextTotal = calculateCartTotal(nextItems);
        const issues: string[] = [];

        if (totalBudget > 0 && nextTotal > totalBudget) {
            issues.push(`Total budget exceeded: €${nextTotal.toFixed(2)} / €${totalBudget.toFixed(2)}`);
        }

        const categoryKey = resolveCategoryKey(product.category?.id, product.category?.name);
        if (categoryKey) {
            const categoryBudget = getCategoryBudget(product.category?.id, product.category?.name);
            if (categoryBudget > 0) {
                const nextCategoryTotal = nextItems
                    .filter(item => resolveCategoryKey(item.category_id, item.category_name) === categoryKey)
                    .reduce((total, item) => total + item.price * item.quantity, 0);

                if (nextCategoryTotal > categoryBudget) {
                    issues.push(
                        `${getCategoryKeyLabel(product.category?.id, product.category?.name)} budget exceeded: €${nextCategoryTotal.toFixed(2)} / €${categoryBudget.toFixed(2)}`,
                    );
                }
            }
        }

        return issues;
    };

    // ─── Refresh cart from Redis backend ──────────────────────────────────

    const refreshCart = async () => {
        if (!selectedStore || !isOnline) return;

        setIsLoadingCart(true);
        try {
            const result = await cartApi.get(selectedStore.slug);
            if (result.data && result.data.items) {
                setCartItems(result.data.items.map((item: any) => ({
                    id: item.product_id,
                    product_id: item.product_id,
                    name: item.name,
                    price: item.price,
                    quantity: item.quantity,
                    image_url: item.image_url,
                    subtotal: item.subtotal,
                    category_id: item.category_id ?? null,
                    category_name: item.category_name ?? "",
                    calories: item.calories ?? null,
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

    // ─── Effects ─────────────────────────────────────────────────────────

    // Load cart from AsyncStorage on mount
    useEffect(() => {
        const loadCart = async () => {
            try {
                const stored = await AsyncStorage.getItem('shopping_cart');
                const offlineFlags = await AsyncStorage.getItem('cart_offline_changes');
                if (stored) setCartItems(JSON.parse(stored));
                if (offlineFlags === 'true') setHasOfflineChanges(true);
            } catch (e) {
                console.error('Failed to load cart from storage', e);
            }
        };
        loadCart();
    }, []);

    // Save to AsyncStorage whenever cart changes
    useEffect(() => {
        const saveCart = async () => {
            try {
                await AsyncStorage.setItem('shopping_cart', JSON.stringify(cartItems));
                await AsyncStorage.setItem('cart_offline_changes', hasOfflineChanges ? 'true' : 'false');
            } catch (error) {
                console.error('Failed to save cart data', error);
            }
        };
        saveCart();
    }, [cartItems, hasOfflineChanges]);

    // Load from Redis whenever store changes
    useEffect(() => {
        refreshCart();
    }, [selectedStore]);

    // Sync offline changes when back online
    useEffect(() => {
        const syncOffline = async () => {
            if (isOnline && hasOfflineChanges && selectedStore) {
                try {
                    await cartApi.clear(selectedStore.slug);
                    for (const item of cartItems) {
                        await cartApi.addItem(selectedStore.slug, item.product_id, item.quantity);
                    }
                    setHasOfflineChanges(false);
                } catch (e) {
                    console.error("Failed to sync offline cart", e);
                }
            }
        };
        syncOffline();
    }, [isOnline, hasOfflineChanges, selectedStore]);

    // ─── Cart operations ─────────────────────────────────────────────────

    const addToCart = async (product: any, quantity = 1) => {
        if (!selectedStore) return;

        const nextItems = getNextItems(product, quantity);
        const issues = validateBudgets(nextItems, product, quantity);

        if (issues.length > 0) {
            Alert.alert("Budget alert", issues.join("\n\n"), [{text: "OK"}]);
            return;
        }

        // Optimistic update
        setCartItems(nextItems);

        if (!isOnline) {
            setHasOfflineChanges(true);
            return;
        }

        // Sync with backend
        try {
            const result = await cartApi.addItem(selectedStore.slug, product.id, quantity);
            if (!result.data) {
                setHasOfflineChanges(true); // Mark to retry later
            }
        } catch {
            setHasOfflineChanges(true);
        }
    };

    const removeFromCart = async (id: number) => {
        if (!selectedStore) return;

        setCartItems(prev => prev.filter(item => item.product_id !== id));
        
        if (!isOnline) {
            setHasOfflineChanges(true);
            return;
        }

        try {
            const result = await cartApi.removeItem(selectedStore.slug, id);
            if (!result.data) setHasOfflineChanges(true);
        } catch {
            setHasOfflineChanges(true);
        }
    };

    const updateQuantity = async (id: number, quantity: number) => {
        if (!selectedStore) return;

        if (quantity <= 0) {
            await removeFromCart(id);
            return;
        }

        const currentItem = cartItems.find(item => item.product_id === id);
        if (!currentItem) return;

        const nextItems = cartItems.map(item =>
            item.product_id === id ? {...item, quantity} : item
        );
        const changedItem = nextItems.find(item => item.product_id === id);

        if (changedItem) {
            const issues = validateBudgets(nextItems, {
                category: { id: changedItem.category_id, name: changedItem.category_name },
            }, quantity);

            if (issues.length > 0) {
                Alert.alert("Budget alert", issues.join("\n\n"), [{text: "OK"}]);
                return;
            }
        }

        const diff = quantity - currentItem.quantity;
        setCartItems(nextItems);

        if (!isOnline) {
            setHasOfflineChanges(true);
            return;
        }

        try {
            const result = await cartApi.addItem(selectedStore.slug, id, diff);
            if (!result.data) setHasOfflineChanges(true);
        } catch {
            setHasOfflineChanges(true);
        }
    };

    const clearCart = async () => {
        if (!selectedStore) return;
        setCartItems([]);
        
        if (!isOnline) {
            setHasOfflineChanges(true);
            return;
        }
        
        try {
            await cartApi.clear(selectedStore.slug);
        } catch {
            setHasOfflineChanges(true);
        }
    };

    // ─── Computed values ─────────────────────────────────────────────────

    const cartTotal = cartItems.reduce(
        (total, item) => total + item.price * item.quantity,
        0
    );

    const cartCount = cartItems.reduce(
        (count, item) => count + item.quantity,
        0
    );

    const totalCalories = cartItems.reduce(
        (total, item) => total + ((item.calories || 0) * item.quantity),
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
                refreshCart,
                totalCalories,
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
