"use client";

import { createContext, useContext, useState } from "react";

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([[]]); // array of packs
  const [currentPackIndex, setCurrentPackIndex] = useState(0);

  const addToCart = (product, packIndex = currentPackIndex) => {
    setCart((prev) => {
      const updated = [...prev];
      const pack = updated[packIndex];
      const existing = pack.find((p) => p._id === product._id);

      if (existing) {
        const updatedPack = pack.map((p) =>
          p._id === product._id ? { ...p, quantity: p.quantity + 1 } : p
        );
        updated[packIndex] = updatedPack;
      } else {
        updated[packIndex] = [...pack, { ...product, quantity: 1 }];
      }

      return updated;
    });
  };

  const removeFromCart = (productId, packIndex = currentPackIndex) => {
    setCart((prev) => {
      const updated = [...prev];
      const pack = updated[packIndex]
        .map((item) =>
          item._id === productId
            ? { ...item, quantity: item.quantity - 1 }
            : item
        )
        .filter((item) => item.quantity > 0);

      updated[packIndex] = pack;
      return updated;
    });
  };

  const incrementItem = (productId, packIndex = currentPackIndex) => {
    setCart((prev) => {
      const updated = [...prev];
      const pack = updated[packIndex].map((item) =>
        item._id === productId ? { ...item, quantity: item.quantity + 1 } : item
      );
      updated[packIndex] = pack;
      return updated;
    });
  };

  const createPack = () => {
    setCart((prev) => [...prev, []]);
    setCurrentPackIndex(cart.length);
  };

  const duplicatePack = (index) => {
    setCart((prev) => [...prev, JSON.parse(JSON.stringify(prev[index]))]);
    setCurrentPackIndex(cart.length);
  };

  const switchPack = (index) => {
    setCurrentPackIndex(index);
  };

  const emptyCart = () => {
    setCart([[]]);
    setCurrentPackIndex(0);
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        currentPackIndex,
        addToCart,
        removeFromCart,
        incrementItem,
        createPack,
        duplicatePack,
        switchPack,
        emptyCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
