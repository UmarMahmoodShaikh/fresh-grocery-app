import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import { useBudget } from './BudgetContext';

export interface CartItem {
    id: number;
    name: string;
    price: number;
    quantity: number;
    image_url: string;
    category_id?: number | null;
    category_name?: string;
    calories?: number | null;
}

interface CartContextType {
    cartItems: CartItem[];
    addToCart: (product: any, quantity?: number) => void;
    removeFromCart: (id: number) => void;
    updateQuantity: (id: number, quantity: number) => void;
    clearCart: () => void;
    cartTotal: number;
    cartCount: number;
    totalCalories: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [cartItems, setCartItems] = useState<CartItem[]>([]);
    const { totalBudget, getCategoryBudget } = useBudget();

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
// Extract calories from product nutrition data
        const getCalories = (productData: any): number | null => {
            if (productData.calories) return productData.calories;
            if (productData.nutrition?.calories) return productData.nutrition.calories;
            if (productData.nutrition?.energy) return productData.nutrition.energy;
            return null;
        };

        if (existingItem) {
            return cartItems.map(item =>
                item.id === product.id
                    ? { ...item, quantity: item.quantity + quantity }
                    : item
            );
        }

        return [
            ...cartItems,
            {
                id: product.id,
                name: product.name,
                price: Number(product.price),
                quantity,
                image_url: product.image_url,
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

    // Load from AsyncStorage
    useEffect(() => {
        const loadCart = async () => {
            try {
                const storedCart = await AsyncStorage.getItem('shopping_cart');
                if (storedCart) {
                    setCartItems(JSON.parse(storedCart));
                }
            } catch (error) {
                console.error('Failed to load cart data', error);
            }
        };
        loadCart();
    }, []);

    // Save to AsyncStorage
    useEffect(() => {
        const saveCart = async () => {
            try {
                await AsyncStorage.setItem('shopping_cart', JSON.stringify(cartItems));
            } catch (error) {
                console.error('Failed to save cart data', error);
            }
        };
        saveCart();
    }, [cartItems]);

    const addToCart = (product: any, quantity = 1) => {
        const nextItems = getNextItems(product, quantity);
        const issues = validateBudgets(nextItems, product, quantity);

        if (issues.length > 0) {
            Alert.alert(
                "Budget alert",
                issues.join("\n\n"),
                [{ text: "OK" }],
            );
            return false;
        }

        setCartItems(nextItems);
        return true;
    };

    const removeFromCart = (id: number) => {
        setCartItems(prevItems => prevItems.filter(item => item.id !== id));
    };

    const updateQuantity = (id: number, quantity: number) => {
        if (quantity <= 0) {
            removeFromCart(id);
            return;
        }

        const nextItems = cartItems.map(item => (item.id === id ? { ...item, quantity } : item));
        const changedItem = nextItems.find(item => item.id === id);

        if (changedItem) {
            const issues = validateBudgets(nextItems, {
                category: {
                    id: changedItem.category_id,
                    name: changedItem.category_name,
                },
            }, quantity);

            if (issues.length > 0) {
                Alert.alert(
                    "Budget alert",
                    issues.join("\n\n"),
                    [{ text: "OK" }],
                );
                return;
            }
        }

        setCartItems(nextItems);
    };

    const clearCart = () => setCartItems([]);

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
