import React, { createContext, useContext, useState, useCallback } from 'react';

const CartContext = createContext();

export function CartProvider({ children }) {
  const [items, setItems] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const addItem = useCallback((product, lens_option = 'standard', color = '', quantity = 1) => {
    const surcharges = { standard: 0, polarized: 30, blue_light: 20 };
    const surcharge = surcharges[lens_option] || 0;

    setItems(prev => {
      const key = `${product.id}-${lens_option}-${color}`;
      const existing = prev.find(i => `${i.product_id}-${i.lens_option}-${i.color}` === key);
      if (existing) {
        return prev.map(i =>
          `${i.product_id}-${i.lens_option}-${i.color}` === key
            ? { ...i, quantity: i.quantity + quantity }
            : i
        );
      }
      return [...prev, {
        product_id: product.id,
        title: product.title,
        image: product.images?.[0] || '',
        price: product.price,
        quantity,
        lens_option,
        lens_surcharge: surcharge,
        color,
      }];
    });
    setIsCartOpen(true);
  }, []);

  const removeItem = useCallback((productId, lensOption, color) => {
    setItems(prev => prev.filter(i =>
      !(`${i.product_id}-${i.lens_option}-${i.color}` === `${productId}-${lensOption}-${color}`)
    ));
  }, []);

  const updateQuantity = useCallback((productId, lensOption, color, quantity) => {
    if (quantity <= 0) return removeItem(productId, lensOption, color);
    setItems(prev => prev.map(i =>
      `${i.product_id}-${i.lens_option}-${i.color}` === `${productId}-${lensOption}-${color}`
        ? { ...i, quantity }
        : i
    ));
  }, [removeItem]);

  const clearCart = useCallback(() => setItems([]), []);

  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);
  const subtotal = items.reduce((sum, i) => sum + (i.price + i.lens_surcharge) * i.quantity, 0);
  const FREE_SHIPPING_THRESHOLD = 150;
  const shippingProgress = Math.min((subtotal / FREE_SHIPPING_THRESHOLD) * 100, 100);
  const freeShipping = subtotal >= FREE_SHIPPING_THRESHOLD;

  return (
    <CartContext.Provider value={{
      items, addItem, removeItem, updateQuantity, clearCart,
      itemCount, subtotal, isCartOpen, setIsCartOpen,
      FREE_SHIPPING_THRESHOLD, shippingProgress, freeShipping
    }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);