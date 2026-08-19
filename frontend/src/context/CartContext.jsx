import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { cartAPI, promotionAPI } from '../services/api';
import { useAuth } from './AuthContext';
import { getExpiryDiscountAmount } from '../utils/expiryDiscount';
import { AlertCircle, X } from 'lucide-react';

const CartContext = createContext(null);

function calcCartTotals(items) {
  const totalPrice = items.reduce((s, i) => s + i.quantity * Number(i.product?.price || 0), 0);
  const totalQty = items.reduce((s, i) => s + i.quantity, 0);
  const expiryDiscountTotal = items.reduce((s, i) => s + getExpiryDiscountAmount(i.product, i.quantity), 0);
  const priceAfterExpiry = Math.max(0, totalPrice - expiryDiscountTotal);
  return { totalPrice, totalQty, expiryDiscountTotal, priceAfterExpiry };
}

export function CartProvider({ children }) {
  const { user }            = useAuth();
  const [items,   setItems] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loading, setLoad]  = useState(false);

  // --- Toast notification state ---
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = 'warning') => {
    setToast({ message, type, id: Date.now() });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 3500);
    return () => clearTimeout(timer);
  }, [toast]);

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
    const { totalQty, priceAfterExpiry } = calcCartTotals(items);
    try {
      const res = await promotionAPI.validateCode({
        ma_code: promoCode, tong_tien: priceAfterExpiry, so_luong: totalQty, loai_don: 'thuong',
      });
      setPromoResult({ ...res, error: null });
    } catch (err) {
      setPromoResult({ tien_giam: 0, error: err.message });
    }
  }, [promoCode, items]);

  const addToCart = async (pid, qty = 1) => {
    try {
      await cartAPI.add({ product_id: pid, quantity: qty });
      await fetchCart();
      return { success: true };
    } catch (err) {
      const msg = err?.message || 'Không thể thêm vào giỏ hàng';
      showToast(msg, 'warning');
      return { success: false, message: msg };
    }
  };

  const updateItem = async (pid, qty) => {
    try {
      await cartAPI.update(pid, qty);
      await fetchCart();
      return { success: true };
    } catch (err) {
      const msg = err?.message || 'Không thể cập nhật giỏ hàng';
      showToast(msg, 'warning');
      return { success: false, message: msg };
    }
  };

  const removeItem = async (pid) => {
    try {
      await cartAPI.remove(pid);
      await fetchCart();
      return { success: true };
    } catch (err) {
      const msg = err?.message || 'Không thể xóa sản phẩm';
      showToast(msg, 'warning');
      return { success: false, message: msg };
    }
  };

  const clearCart = async () => {
    try {
      await cartAPI.clear();
      setItems([]);
      setSummary(null);
      clearCode();
      return { success: true };
    } catch (err) {
      return { success: false };
    }
  };

  // --- Promo code actions ---
  const applyCode = async (code) => {
    if (!code || !code.trim()) return;
    const { totalQty, priceAfterExpiry } = calcCartTotals(items);
    setPromoLoading(true);
    try {
      const res = await promotionAPI.validateCode({
        ma_code: code.trim(), tong_tien: priceAfterExpiry, so_luong: totalQty, loai_don: 'thuong',
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

  const totalItems = items.length;
  const totalPrice = items.reduce((s,i) => s + i.quantity * (i.product?.price || 0), 0);

  return (
    <CartContext.Provider value={{
      items, loading, summary, totalItems, totalPrice,
      addToCart, updateItem, removeItem, clearCart, fetchCart,
      promoCode, promoResult, promoLoading, applyCode, clearCode,
      showToast,
    }}>
      {children}
      {toast && (
        <div className="fixed top-6 right-6 z-[9999] max-w-sm animate-in fade-in slide-in-from-top-4 duration-300">
          <div className={`flex items-center gap-3 px-4 py-3.5 rounded-2xl shadow-2xl border text-sm font-semibold backdrop-blur-md transition-all ${
            toast.type === 'warning' || toast.type === 'error'
              ? 'bg-amber-500/95 text-white border-amber-400/50 shadow-amber-500/30'
              : 'bg-emerald-600/95 text-white border-emerald-500/50 shadow-emerald-600/30'
          }`}>
            <AlertCircle className="w-5 h-5 flex-shrink-0" />
            <span className="flex-1 leading-snug">{toast.message}</span>
            <button
              onClick={() => setToast(null)}
              className="p-1 rounded-lg hover:bg-white/20 transition-colors flex-shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);

