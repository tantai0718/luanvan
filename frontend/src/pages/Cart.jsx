import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { orderAPI } from '../services/api';
import { pickProductImage } from '../utils/marketImages';
import { ShoppingCart, ChevronRight, Info, Plus, Minus, ArrowRight, ShieldCheck, Truck, HeadphonesIcon, CreditCard, Landmark, AlertCircle } from 'lucide-react';

const formatCurrency = value => `${Number(value || 0).toLocaleString('vi-VN')}đ`;

const promotionLabelMap = {
  BULK_QUANTITY: 'Mua từ 10 sản phẩm',
  LOYAL_CUSTOMER: 'Khách hàng mua nhiều lần',
};

const inputCls = 'bg-card border border-border rounded-xl px-4 py-3.5 text-body focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all shadow-sm';

function PaymentChoice({ checked, icon, title, copy, onChange }) {
  return (
    <label className={`flex cursor-pointer items-center justify-between gap-4 rounded-2xl border-2 p-5 transition-all ${
      checked ? 'border-primary bg-primary/5 shadow-sm shadow-primary/10' : 'border-border bg-card hover:border-primary/30 hover:bg-background'
    }`}>
      <div className="flex items-start gap-4">
        <input type="radio" checked={checked} onChange={onChange} className="mt-1 h-5 w-5 accent-primary flex-shrink-0 cursor-pointer" />
        <div>
          <strong className="block text-h3 font-semibold text-text-primary">{title}</strong>
          <p className="mt-1 text-body text-text-secondary leading-relaxed">{copy}</p>
        </div>
      </div>
      <span className={`p-2 rounded-xl flex-shrink-0 ${checked ? 'text-primary bg-primary/10' : 'text-text-secondary/50 bg-background'}`}>
        {icon}
      </span>
    </label>
  );
}

function StepBadge({ step, color }) {
  const bg = color === 'secondary' ? 'bg-secondary text-on-secondary' : color === 'tertiary' ? 'bg-tertiary text-on-tertiary' : 'bg-primary text-white';
  return (
    <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold shadow-sm ${bg}`}>
      {step}
    </span>
  );
}

export default function Cart() {
  const { items, updateItem, removeItem, clearCart, totalPrice, summary } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    dia_chi_giao: user?.address || '',
    ghi_chu: '',
    phuong_thuc_tt: 'tien_mat',
    ship_to_other: false,
    ten_nguoi_nhan: '',
    sdt_nguoi_nhan: '',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const discount = Number(summary?.discountAmount || 0);
  const promotions = summary?.discounts || [];
  const shipping = Number(summary?.shipping ?? (totalPrice > 500000 ? 0 : 30000));
  const total = Number(summary?.total ?? (Math.max(0, totalPrice - discount) + shipping));

  const handleOrder = async () => {
    if (!form.dia_chi_giao.trim()) { setError('Vui lòng nhập địa chỉ giao hàng.'); return; }
    if (form.ship_to_other) {
      if (!form.ten_nguoi_nhan.trim()) { setError('Vui lòng nhập tên người nhận.'); return; }
      if (!form.sdt_nguoi_nhan.trim()) { setError('Vui lòng nhập số điện thoại người nhận.'); return; }
    }
    setLoading(true); setError('');
    try {
      const data = await orderAPI.create(form);
      await clearCart();
      if (data.payment_url) { window.location.assign(data.payment_url); return; }
      navigate(`/orders/${data.order.id}?success=1`);
    } catch (err) { setError(err.message || 'Đặt hàng thất bại.'); }
    finally { setLoading(false); }
  };

  if (!items.length) {
    return (
      <div className="bg-background min-h-screen flex items-center justify-center py-16 px-4">
        <div className="bg-card rounded-3xl p-8 md:p-12 text-center max-w-md w-full border border-border shadow-card">
          <ShoppingCart size={56} className="mx-auto text-text-secondary/30" />
          <h1 className="text-h2 text-text-primary mt-6 font-bold">Giỏ hàng đang trống</h1>
          <p className="text-body text-text-secondary mt-2">Thêm sản phẩm sạch trước khi hoàn tất đơn hàng.</p>
          <Link to="/products" className="mt-8 inline-flex bg-primary text-white px-8 py-3.5 rounded-xl font-bold transition-all active:scale-95 shadow-md hover:bg-primary/90">
            Xem sản phẩm
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-background min-h-screen py-8 md:py-12">
      <div className="max-w-7xl mx-auto px-4 md:px-8">

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-h1 text-text-primary font-bold">Hoàn tất đơn hàng</h1>
          <div className="flex items-center gap-2 text-body text-text-secondary mt-3">
            <Link to="/cart" className="hover:text-primary transition-colors">Giỏ hàng</Link>
            <ChevronRight size={14} />
            <span className="text-primary font-semibold">Thanh toán</span>
          </div>
        </div>

        {/* ===== MAIN GRID ===== */}
        <div className="grid gap-8 lg:grid-cols-12 lg:items-start">

          {/* ===== LEFT COLUMN ===== */}
          <div className="space-y-8 lg:col-span-7 xl:col-span-8">

            {/* ── Bước 1: Thông tin giao hàng ── */}
            <section className="bg-card rounded-3xl border border-border shadow-card overflow-hidden">
              <div className="flex items-center gap-3 p-6 md:p-8 border-b border-border/50">
                <StepBadge step={1} color="primary" />
                <h2 className="text-h3 font-bold text-text-primary">Thông tin giao hàng</h2>
              </div>

              <div className="p-6 md:p-8 space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <label className="grid gap-2">
                    <span className="text-[13px] font-medium text-text-secondary">Họ và tên</span>
                    <input readOnly value={user?.name || ''} placeholder="Tên người nhận" className={`${inputCls} bg-background/60 text-text-secondary cursor-not-allowed`} />
                  </label>
                  <label className="grid gap-2">
                    <span className="text-[13px] font-medium text-text-secondary">Tài khoản</span>
                    <input readOnly value={user?.email || user?.role || 'Người mua'} className={`${inputCls} bg-background/60 text-text-secondary cursor-not-allowed`} />
                  </label>
                </div>

                <label className="grid gap-2">
                  <span className="text-[13px] font-medium text-text-secondary">
                    Địa chỉ giao hàng <span className="text-danger font-bold">*</span>
                  </span>
                  <textarea rows={3} value={form.dia_chi_giao} onChange={e => setForm({ ...form, dia_chi_giao: e.target.value })} placeholder="Số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành..." className={`${inputCls} resize-none`} />
                </label>

                <label className="grid gap-2">
                  <span className="text-[13px] font-medium text-text-secondary">Ghi chú thêm</span>
                  <textarea rows={2} value={form.ghi_chu} onChange={e => setForm({ ...form, ghi_chu: e.target.value })} placeholder="Thời gian giao, chỉ dẫn địa chỉ..." className={`${inputCls} resize-none`} />
                </label>

                <label className="flex items-center gap-3 p-4 rounded-xl bg-background border border-border/60 hover:border-primary/40 transition-colors cursor-pointer">
                  <input type="checkbox" checked={form.ship_to_other} onChange={e => setForm({ ...form, ship_to_other: e.target.checked })} className="h-5 w-5 accent-primary rounded cursor-pointer" />
                  <span className="text-body font-medium text-text-primary">Giao hàng cho người khác</span>
                </label>

                {form.ship_to_other && (
                  <div className="grid gap-6 md:grid-cols-2 pt-2 border-t border-border/40">
                    <label className="grid gap-2">
                      <span className="text-[13px] font-medium text-text-secondary">Người nhận <span className="text-danger">*</span></span>
                      <input value={form.ten_nguoi_nhan} onChange={e => setForm({ ...form, ten_nguoi_nhan: e.target.value })} placeholder="Họ tên người nhận" className={inputCls} />
                    </label>
                    <label className="grid gap-2">
                      <span className="text-[13px] font-medium text-text-secondary">Số điện thoại <span className="text-danger">*</span></span>
                      <input value={form.sdt_nguoi_nhan} onChange={e => setForm({ ...form, sdt_nguoi_nhan: e.target.value })} placeholder="Số điện thoại người nhận" className={inputCls} />
                    </label>
                  </div>
                )}

                <div className="rounded-2xl bg-primary/5 border border-primary/15 p-4 flex items-start gap-3.5">
                  <Info size={20} className="text-primary flex-shrink-0 mt-0.5" />
                  <p className="text-body text-text-secondary leading-relaxed">
                    Đơn hàng dự kiến giao trong vòng <span className="font-bold text-text-primary">2 ngày</span> kể từ khi đặt hàng thành công.
                  </p>
                </div>
              </div>
            </section>

            {/* ── Bước 2: Phương thức thanh toán ── */}
            <section className="bg-card rounded-3xl border border-border shadow-card overflow-hidden">
              <div className="flex items-center gap-3 p-6 md:p-8 border-b border-border/50">
                <StepBadge step={2} color="primary" />
                <h2 className="text-h3 font-bold text-text-primary">Phương thức thanh toán</h2>
              </div>
              <div className="p-6 md:p-8 space-y-4">
                <PaymentChoice checked={form.phuong_thuc_tt === 'tien_mat'} onChange={() => setForm({ ...form, phuong_thuc_tt: 'tien_mat' })} icon={<CreditCard size={24} />} title="Thanh toán khi nhận hàng (COD)" copy="Thanh toán bằng tiền mặt khi shipper giao hàng." />
                <PaymentChoice checked={form.phuong_thuc_tt === 'banking'} onChange={() => setForm({ ...form, phuong_thuc_tt: 'banking' })} icon={<Landmark size={24} />} title="Chuyển khoản ngân hàng" copy="Sau khi đặt hàng, vui lòng chuyển khoản đến tài khoản của shop." />
              </div>
            </section>
          </div>

          {/* ===== RIGHT COLUMN — Order Summary ===== */}
          <aside className="space-y-6 lg:sticky lg:top-24 lg:col-span-5 xl:col-span-4">
            <section className="bg-card rounded-3xl border border-border shadow-card overflow-hidden">
              <div className="p-6 border-b border-border/60">
                <h2 className="text-h3 font-bold text-text-primary">Đơn hàng của bạn</h2>
              </div>

              {/* Items List */}
              <div className="p-6 space-y-4 border-b border-border/60 max-h-[380px] overflow-y-auto">
                {items.map(item => {
                  const product = { ten_san_pham: item.product?.name, ma_danh_muc: item.product?.category_id, images: item.product?.images || [] };
                  return (
                    <div key={item.product_id} className="flex gap-4 items-center">
                      <img src={pickProductImage(product)} alt={item.product?.name} className="w-16 h-16 rounded-2xl object-cover flex-shrink-0 border border-border shadow-sm" />
                      <div className="min-w-0 flex-1">
                        <p className="text-body font-medium text-text-primary line-clamp-1">{item.product?.name}</p>
                        <p className="text-[12px] font-medium text-text-secondary mt-0.5">{item.quantity} {item.product?.unit}</p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-body font-bold text-primary">{formatCurrency(item.quantity * Number(item.product?.price || 0))}</span>
                          <div className="flex items-center gap-1.5 border border-border rounded-lg p-0.5 bg-background">
                            <button onClick={() => (item.quantity > 1 ? updateItem(item.product_id, item.quantity - 1) : removeItem(item.product_id))} className="w-6 h-6 rounded-md bg-card text-text-primary flex items-center justify-center hover:bg-border transition-colors"><Minus size={12} /></button>
                            <span className="text-xs font-semibold px-1">{item.quantity}</span>
                            <button onClick={() => updateItem(item.product_id, item.quantity + 1)} className="w-6 h-6 rounded-md bg-card text-text-primary flex items-center justify-center hover:bg-border transition-colors"><Plus size={12} /></button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Pricing breakdown */}
              <div className="p-6 space-y-3.5 text-body">
                <div className="flex justify-between text-text-secondary"><span>Tạm tính</span><span className="font-medium text-text-primary">{formatCurrency(totalPrice)}</span></div>
                <div className="flex justify-between text-primary"><span>Khuyến mãi</span><span className="font-semibold">{discount ? `-${formatCurrency(discount)}` : formatCurrency(0)}</span></div>
                
                {promotions.length ? (
                  <div className="rounded-xl bg-primary/5 border border-primary/10 p-3 text-[12px] space-y-1">
                    {promotions.map(p => <p key={p.code} className="text-text-secondary">{promotionLabelMap[p.code] || p.label}: <span className="text-primary font-bold">-{formatCurrency(p.amount)}</span></p>)}
                  </div>
                ) : (
                  <p className="rounded-xl bg-background border border-border/50 p-3 text-[12px] font-medium text-text-secondary">
                    Khuyến mãi sẽ được tự động áp dụng khi đủ điều kiện.
                  </p>
                )}
                
                <div className="flex justify-between text-text-secondary"><span>Phí vận chuyển</span><span>{shipping ? formatCurrency(shipping) : <span className="text-primary font-bold">Miễn phí</span>}</span></div>
                
                <div className="flex justify-between border-t border-border pt-4 text-h3">
                  <span className="font-bold text-text-primary">Tổng cộng</span>
                  <span className="font-bold text-primary text-xl">{formatCurrency(total)}</span>
                </div>
              </div>

              {/* Action Button & Errors */}
              <div className="px-6 pb-6 pt-2">
                {error && (
                  <div className="mb-4 rounded-xl bg-red-50 border border-red-200 p-3.5 text-xs font-medium text-danger flex items-center gap-2">
                    <AlertCircle size={16} className="flex-shrink-0" />
                    {error}
                  </div>
                )}
                <button onClick={handleOrder} disabled={loading} className="w-full bg-primary text-white py-4 rounded-2xl font-bold text-body flex items-center justify-center gap-2 hover:bg-primary/90 hover:shadow-lg hover:shadow-primary/25 transition-all disabled:opacity-60 active:scale-[0.98]">
                  {loading ? 'Đang xử lý...' : 'Đặt hàng ngay'}
                  {!loading && <ArrowRight size={18} />}
                </button>
              </div>
            </section>

            {/* Guarantees */}
            <div className="flex items-center justify-around p-4 rounded-2xl bg-card border border-border text-[12px] font-medium text-text-secondary">
              <span className="inline-flex items-center gap-1.5"><ShieldCheck size={16} className="text-primary" />Bảo mật</span>
              <span className="inline-flex items-center gap-1.5"><Truck size={16} className="text-primary" />Giao nhanh</span>
              <span className="inline-flex items-center gap-1.5"><HeadphonesIcon size={16} className="text-primary" />Hỗ trợ 24/7</span>
            </div>
          </aside>

        </div>
      </div>
    </div>
  );
}