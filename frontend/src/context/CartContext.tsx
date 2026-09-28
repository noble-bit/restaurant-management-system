import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import type { MenuItem } from '../types';
import { getOrdersApi } from '../api/orders';
import { useAuth } from './AuthContext';

export interface CartItem {
  menu_item: MenuItem;
  quantity: number;
  note: string;
}

interface CartContextType {
  cart: CartItem[];
  addToCart: (item: MenuItem) => void;
  updateQuantity: (itemId: number, delta: number) => void;
  setExactQuantity: (itemId: number, qty: number) => void;
  updateNote: (itemId: number, note: string) => void;
  removeFromCart: (itemId: number) => void;
  clearCart: () => void;
  cartCount: number;
  activeOrdersCount: number;
  refreshActiveOrders: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [activeOrdersCount, setActiveOrdersCount] = useState<number>(0);

  const addToCart = useCallback((item: MenuItem) => {
    setCart((prevCart) => {
      const existingIndex = prevCart.findIndex((ci) => ci.menu_item.id === item.id);
      if (existingIndex > -1) {
        const updated = [...prevCart];
        updated[existingIndex].quantity += 1;
        return updated;
      }
      return [...prevCart, { menu_item: item, quantity: 1, note: '' }];
    });
  }, []);

  const updateQuantity = useCallback((itemId: number, delta: number) => {
    setCart((prevCart) =>
      prevCart
        .map((ci) => {
          if (ci.menu_item.id === itemId) {
            const newQty = ci.quantity + delta;
            return newQty > 0 ? { ...ci, quantity: newQty } : null;
          }
          return ci;
        })
        .filter((ci): ci is CartItem => ci !== null)
    );
  }, []);

  const setExactQuantity = useCallback((itemId: number, qty: number) => {
    if (qty < 1) return;
    setCart((prevCart) =>
      prevCart.map((ci) => (ci.menu_item.id === itemId ? { ...ci, quantity: qty } : ci))
    );
  }, []);

  const updateNote = useCallback((itemId: number, note: string) => {
    setCart((prevCart) =>
      prevCart.map((ci) => (ci.menu_item.id === itemId ? { ...ci, note } : ci))
    );
  }, []);

  const removeFromCart = useCallback((itemId: number) => {
    setCart((prevCart) => prevCart.filter((ci) => ci.menu_item.id !== itemId));
  }, []);

  const clearCart = useCallback(() => {
    setCart([]);
  }, []);

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // Real data for Bell notification count based on user role
  const refreshActiveOrders = useCallback(async () => {
    if (!user) {
      setActiveOrdersCount(0);
      return;
    }

    try {
      const role = user.role;
      let targetStatus: string | undefined = undefined;

      if (role === 'chef') {
        targetStatus = 'pending,preparing';
      } else if (role === 'waiter') {
        targetStatus = 'ready';
      } else if (role === 'cashier') {
        targetStatus = 'served';
      }

      // Fetch active orders matching target status
      const orders = await getOrdersApi(targetStatus);
      setActiveOrdersCount(orders.length);
    } catch {
      setActiveOrdersCount(0);
    }
  }, [user]);

  useEffect(() => {
    refreshActiveOrders();
    const interval = setInterval(refreshActiveOrders, 15000);
    return () => clearInterval(interval);
  }, [refreshActiveOrders]);

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        updateQuantity,
        setExactQuantity,
        updateNote,
        removeFromCart,
        clearCart,
        cartCount,
        activeOrdersCount,
        refreshActiveOrders,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = (): CartContextType => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
