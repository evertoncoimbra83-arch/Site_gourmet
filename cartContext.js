// cartContext.js
import { createContext, useContext, useState } from 'react';
import { calculateCartDetailedTotals } from '../cartPricingEngine';

const CartContext = createContext();

export const useCart = () => useContext(CartContext);

export const CartProvider = ({ children }) => {
  const [items, setItems] = useState([]);

  const addItem = async (item) => {
    // Lógica para adicionar item ao carrinho
    setItems([...items, item]);
  };

  const removeItem = async (itemId) => {
    // Lógica para remover item do carrinho
    setItems(items.filter(item => item.id !== itemId));
  };

  const updateQuantity = async (itemId, quantity) => {
    // Lógica para atualizar quantidade de item no carrinho
    setItems(items.map(item => 
      item.id === itemId ? { ...item, quantity } : item
    ));
  };

  const clearCart = () => {
    setItems([]);
  };

  const refreshCart = async () => {
    // Lógica para atualizar o carrinho com dados do backend
  };

  const getTotalItems = () => items.length;

  const isAdding = false;

  const totals = calculateCartDetailedTotals(items);

  return (
    <CartContext.Provider value={{ 
      items, 
      addItem, 
      removeItem, 
      updateQuantity, 
      clearCart, 
      refreshCart, 
      getTotalItems, 
      isAdding, 
      totals 
    }}>
      {children}
    </CartContext.Provider>
  );
};
