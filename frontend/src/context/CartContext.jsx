import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { cartAPI, promotionAPI } from '../services/api';
import { useAuth } from './AuthContext';

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { user }            = useAuth();
  const [items,   setItems] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoad]  = useState(false);

  // --- Promo code state ---
  const [promoCode, setPromoCode]     = useState('');
  const [promoResult, setPromoResult] = useState(null); // { tien_giam, mien_phi_ship, used_code, message, applied, error }
  const [promoLoading, setPromoLoading] = useState(false);

  const fetchCart = async () => {
    if (!user || user.role !== 'buyer') { setItems([]); setSummary(null); return; }
    try { setLoad(true); const d = await cartAPI.get(); setItems(d.cart || []); setSummary(d.summary || null); }
    catch { setItems([]); setSummary(null); } finally { setLoad(false); }
  };

  useEffect(() => { fetchCart(); }, [user]);

  // Khi xóa/cập nhật giỏ hàng mà đang có mã code → re-validate
  const revalidateCode = useCallback(async () => {
    if (!promoCode || !promoCode.trim() || !items.length) return;
    const totalPrice = items.reduce((s, i) => s + i.quantity * (i.product?.price || 0), 0);
    const totalQty = items.reduce((s, i) => s + i.quantity, 0);
    try {
      const res = await promotionAPI.validateCode({
        ma_code: promoCode, tong_tien: totalPrice, so_luong: totalQty, loai_don: 'thuong',
      });
      setPromoResult({ ...res, error: null });
    } catch (err) {
      setPromoResult({ tien_giam: 0, error: err.message });
    }
  }, [promoCode, items]);

  const addToCart  = async (pid, qty=1) => { await cartAPI.add({ product_id: pid, quantity: qty }); await fetchCart(); };
  const updateItem = async (pid, qty)   => { await cartAPI.update(pid, qty); await fetchCart(); };
  const removeItem = async (pid)        => { await cartAPI.remove(pid); await fetchCart(); };
  const clearCart  = async ()           => { await cartAPI.clear(); setItems([]); setSummary(null); clearCode(); };

  // --- Promo code actions ---
  const applyCode = async (code) => {
    if (!code || !code.trim()) return;
    const totalPrice = items.reduce((s, i) => s + i.quantity * (i.product?.price || 0), 0);
    const totalQty = items.reduce((s, i) => s + i.quantity, 0);
    setPromoLoading(true);
    try {
      const res = await promotionAPI.validateCode({
        ma_code: code.trim(), tong_tien: totalPrice, so_luong: totalQty, loai_don: 'thuong',
      });
      setPromoCode(code.trim());
      setPromoResult({ ...res, error: null });
    } catch (err) {
      setPromoCode(code.trim());
      setPromoResult({ tien_giam: 0, error: err.message });
    } finally {
      setPromoLoading(false);
    }
  };

  const clearCode = () => {
    setPromoCode('');
    setPromoResult(null);
  };

  // Re-validate mã khi giỏ hàng thay đổi
  useEffect(() => { if (promoCode) revalidateCode(); }, [items.length]);

  const totalItems = items.reduce((s,i) => s + i.quantity, 0);
  const totalPrice = items.reduce((s,i) => s + i.quantity * (i.product?.price || 0), 0);

  return (
    <CartContext.Provider value={{
      items, loading, summary, totalItems, totalPrice,
      addToCart, updateItem, removeItem, clearCart, fetchCart,
      promoCode, promoResult, promoLoading, applyCode, clearCode,
    }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
