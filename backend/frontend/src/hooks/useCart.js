import { useState, useCallback, useEffect } from 'react';

export const useCart = () => {
  const [cartItems, setCartItems] = useState(() => {
    const saved = localStorage.getItem('cart');
    return saved ? JSON.parse(saved) : [];
  });

  // Persist cart to localStorage
  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = useCallback((product, quantity = 1) => {
    setCartItems((prevItems) => {
      const existingItem = prevItems.find((item) => item.id === product.id);
      const availableStock = product.stock || 0;

      if (existingItem) {
        const newQuantity = existingItem.quantity + quantity;
        if (newQuantity > availableStock) {
          // Ideally show a toast here, but for now we clamp
          return prevItems.map((item) =>
            item.id === product.id
              ? { ...item, quantity: availableStock }
              : item
          );
        }
        return prevItems.map((item) =>
          item.id === product.id
            ? { ...item, quantity: newQuantity }
            : item
        );
      }

      // If adding new item but requested quantity > stock
      if (quantity > availableStock) {
        return [...prevItems, { ...product, quantity: availableStock }];
      }

      return [...prevItems, { ...product, quantity }];
    });
  }, []);

  const removeFromCart = useCallback((productId) => {
    setCartItems((prevItems) =>
      prevItems.filter((item) => item.id !== productId)
    );
  }, []);

  const updateQuantity = useCallback((productId, quantity) => {
    setCartItems((prevItems) => {
      const item = prevItems.find(i => i.id === productId);
      if (!item) return prevItems;

      if (quantity <= 0) {
        return prevItems.filter(i => i.id !== productId);
      }

      if (quantity > (item.stock || 0)) {
        return prevItems.map(i => i.id === productId ? { ...i, quantity: item.stock } : i);
      }

      return prevItems.map(i =>
        i.id === productId ? { ...i, quantity } : i
      );
    });
  }, []);

  const clearCart = useCallback(() => {
    setCartItems([]);
  }, []);

  const cartCount = cartItems.reduce((total, item) => total + item.quantity, 0);
  const cartTotal = cartItems.reduce(
    (total, item) => total + (item.price * item.quantity),
    0
  );

  return {
    cartItems,
    cartCount,
    cartTotal,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    isEmpty: cartItems.length === 0,
  };
};
