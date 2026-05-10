import { createContext, useContext, useState, useEffect } from 'react';
import { cartAPI } from '../services/api';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { user }            = useAuth();
  const [items,   setItems] = useState([]);
  const [loading, setLoad]  = useState(false);

  const fetchCart = async () => {
    if (!user || user.role !== 'buyer') { setItems([]); return; }
    try { setLoad(true); const d = await cartAPI.get(); setItems(d.cart || []); }
    catch { setItems([]); } finally { setLoad(false); }
  };

  useEffect(() => { fetchCart(); }, [user]);

  const addToCart  = async (pid, qty=1) => { await cartAPI.add({ product_id: pid, quantity: qty }); fetchCart(); };
  const updateItem = async (pid, qty)   => { await cartAPI.update(pid, qty); fetchCart(); };
  const removeItem = async (pid)        => { await cartAPI.remove(pid); fetchCart(); };
  const clearCart  = async ()           => { await cartAPI.clear(); setItems([]); };

  const totalItems = items.reduce((s,i) => s + i.quantity, 0);
  const totalPrice = items.reduce((s,i) => s + i.quantity * (i.product?.price || 0), 0);

  return (
    <CartContext.Provider value={{ items, loading, totalItems, totalPrice, addToCart, updateItem, removeItem, clearCart, fetchCart }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
