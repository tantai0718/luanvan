import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { orderAPI, subscriptionAPI } from '../services/api';
import { pickProductImage } from '../utils/marketImages';

const formatCurrency = value => `${Number(value || 0).toLocaleString('vi-VN')}đ`;

const promotionLabelMap = {
  BULK_QUANTITY: 'Mua từ 10 sản phẩm',
  LOYAL_CUSTOMER: 'Khách hàng mua nhiều lần',
};

const inputCls = 'bg-surface border border-outline-variant rounded-xl px-4 py-3 text-body-md focus:ring-2 focus:ring-primary focus:border-primary outline-none transition-all';

function PaymentChoice({ checked, icon, title, copy, onChange }) {
  return (
    <label className={`flex cursor-pointer items-center justify-between gap-4 rounded-2xl border-2 p-4 transition-all ${
      checked ? 'border-primary bg-primary/5 shadow-md shadow-primary/10' : 'border-outline-variant bg-surface hover:border-primary/30 hover:bg-surface-container-low'
    }`}>
      <span className="flex items-center gap-4">
        <input type="radio" checked={checked} onChange={onChange} className="h-5 w-5 accent-primary" />
        <span>
          <strong className="block text-title-sm font-title-sm">{title}</strong>
          <small className="mt-0.5 block text-body-sm text-on-surface-variant">{copy}</small>
        </span>
      </span>
      <span className={`material-symbols-outlined ${checked ? 'text-primary' : 'text-on-surface-variant/40'}`}>{icon}</span>
    </label>
  );
}

function StepBadge({ step, color }) {
  const bg = color === 'secondary' ? 'bg-secondary text-on-secondary' : color === 'tertiary' ? 'bg-tertiary text-on-tertiary' : 'bg-primary text-on-primary';
  return (
    <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-label-sm font-bold ${bg}`}>
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

  const [preorderForm, setPreorderForm] = useState({ ngay_giao_du_kien: '', dia_chi_giao: user?.address || '', phuong_thuc_tt: 'tien_mat', loai_tien_coc: '30' });
  const [preorderMsg, setPreorderMsg] = useState('');
  const [savingPreorder, setSavingPreorder] = useState(false);

  const [subForm, setSubForm] = useState({ tan_suat_giao: 'hang_tuan', so_ky_giao: 4, ngay_bat_dau: '', dia_chi_giao: user?.address || '', phuong_thuc_tt: 'tien_mat', loai_tien_coc: '30' });
  const [subMsg, setSubMsg] = useState('');
  const [savingSub, setSavingSub] = useState(false);

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

  const handlePreorder = async e => {
    e.preventDefault();
    if (!cartProducts.length) { setPreorderMsg('Giỏ hàng trống.'); return; }
    if (!preorderForm.dia_chi_giao.trim()) { setPreorderMsg('Vui lòng nhập địa chỉ giao hàng.'); return; }
    setSavingPreorder(true); setPreorderMsg('');
    try {
      let lastOrder = null;
      for (const p of cartProducts) {
        lastOrder = await orderAPI.createPreorder({ product_id: p.id, quantity: p.quantity, dia_chi_giao: preorderForm.dia_chi_giao, phuong_thuc_tt: preorderForm.phuong_thuc_tt, ngay_giao_du_kien: preorderForm.ngay_giao_du_kien, loai_tien_coc: preorderForm.phuong_thuc_tt === 'banking' ? preorderForm.loai_tien_coc : null });
      }
      if (lastOrder?.order?.id) navigate(`/orders/${lastOrder.order.id}?success=1`);
      else setPreorderMsg('Đặt trước thành công.');
    } catch (err) { setPreorderMsg(err.message || 'Không thể tạo đơn đặt trước.'); }
    finally { setSavingPreorder(false); }
  };

  const handleSubscription = async e => {
    e.preventDefault();
    if (!cartProducts.length) { setSubMsg('Giỏ hàng trống.'); return; }
    if (!subForm.dia_chi_giao.trim()) { setSubMsg('Vui lòng nhập địa chỉ giao hàng.'); return; }
    setSavingSub(true); setSubMsg('');
    try {
      let lastData = null;
      for (const p of cartProducts) {
        lastData = await subscriptionAPI.create({ product_id: p.id, quantity: p.quantity, dia_chi_giao: subForm.dia_chi_giao, phuong_thuc_tt: subForm.phuong_thuc_tt, ngay_bat_dau: subForm.ngay_bat_dau, tan_suat_giao: subForm.tan_suat_giao, so_ky_giao: subForm.so_ky_giao, loai_tien_coc: subForm.phuong_thuc_tt === 'banking' ? subForm.loai_tien_coc : null });
      }
      if (lastData?.order_id) navigate(`/orders/${lastData.order_id}?success=1`);
      else setSubMsg('Đăng ký giao định kỳ thành công.');
    } catch (err) { setSubMsg(err.message || 'Không thể tạo đăng ký.'); }
    finally { setSavingSub(false); }
  };

  if (!items.length) {
    return (
      <div className="bg-background min-h-screen flex items-center justify-center py-xl">
        <div className="bg-surface rounded-3xl p-xl text-center max-w-md w-full mx-margin-mobile border border-outline-variant organic-shadow">
          <span className="material-symbols-outlined text-6xl text-on-surface-variant/30">shopping_cart</span>
          <h1 className="text-headline-lg font-headline-lg text-on-surface mt-4">Giỏ hàng đang trống</h1>
          <p className="text-body-md font-body-md text-on-surface-variant mt-2">Thêm sản phẩm sạch trước khi hoàn tất đơn hàng.</p>
          <Link to="/products" className="mt-6 inline-flex bg-primary text-on-primary px-6 py-3 rounded-xl font-bold transition-all active:scale-95">Xem sản phẩm</Link>
        </div>
      </div>
    );
  }

  const cartProducts = items.map(item => ({ id: item.product_id, name: item.product?.name, unit: item.product?.unit, price: item.product?.price, quantity: item.quantity, images: item.product?.images || [] }));

  return (
    <div className="bg-background min-h-screen py-xl">
      <div className="max-w-7xl mx-auto px-margin-mobile md:px-margin-desktop">

        {/* Header */}
        <div className="mb-xl">
          <h1 className="text-display-sm font-display-sm text-on-surface">Hoàn tất đơn hàng</h1>
          <div className="flex items-center gap-2 text-body-sm font-body-sm text-on-surface-variant mt-2">
            <Link to="/cart" className="hover:text-primary transition-colors">Giỏ hàng</Link>
            <span className="material-symbols-outlined text-sm">chevron_right</span>
            <span className="text-primary font-medium">Thanh toán</span>
          </div>
        </div>

        {/* ===== MAIN GRID ===== */}
        <div className="grid gap-xl lg:grid-cols-12 lg:items-start">

          {/* ===== LEFT COLUMN ===== */}
          <div className="space-y-xl lg:col-span-8">

            {/* ── Bước 1: Thông tin giao hàng ── */}
            <section className="bg-surface rounded-3xl border border-outline-variant organic-shadow overflow-hidden">
              <div className="flex items-center gap-3 px-xl pt-xl pb-lg">
                <StepBadge step={1} color="primary" />
                <h2 className="text-title-lg font-title-lg text-on-surface">Thông tin giao hàng</h2>
              </div>
              <div className="grid gap-lg md:grid-cols-2 px-xl pb-xl">
                <label className="grid gap-2">
                  <span className="text-label-sm font-label-sm text-on-surface-variant">Họ và tên</span>
                  <input readOnly value={user?.name || ''} placeholder="Tên người nhận" className={`${inputCls} bg-surface-container-low cursor-not-allowed`} />
                </label>
                <label className="grid gap-2">
                  <span className="text-label-sm font-label-sm text-on-surface-variant">Tài khoản</span>
                  <input readOnly value={user?.email || user?.role || 'Người mua'} className={`${inputCls} bg-surface-container-low cursor-not-allowed`} />
                </label>
                <label className="grid gap-2 md:col-span-2">
                  <span className="text-label-sm font-label-sm text-on-surface-variant">Địa chỉ giao hàng <span className="text-error">*</span></span>
                  <textarea rows={3} value={form.dia_chi_giao} onChange={e => setForm({ ...form, dia_chi_giao: e.target.value })} placeholder="Số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành..." className={`${inputCls} resize-none`} />
                </label>
                <label className="grid gap-2 md:col-span-2">
                  <span className="text-label-sm font-label-sm text-on-surface-variant">Ghi chú thêm</span>
                  <textarea rows={3} value={form.ghi_chu} onChange={e => setForm({ ...form, ghi_chu: e.target.value })} placeholder="Thời gian giao, chỉ dẫn địa chỉ..." className={`${inputCls} resize-none`} />
                </label>
                <label className="flex items-center gap-3 md:col-span-2 p-3 rounded-xl bg-surface-container-low hover:bg-surface-container-high transition-colors cursor-pointer">
                  <input type="checkbox" checked={form.ship_to_other} onChange={e => setForm({ ...form, ship_to_other: e.target.checked })} className="h-5 w-5 accent-primary" />
                  <span className="text-body-md text-on-surface">Giao hàng cho người khác</span>
                </label>
                {form.ship_to_other && (
                  <>
                    <label className="grid gap-2">
                      <span className="text-label-sm font-label-sm text-on-surface-variant">Người nhận <span className="text-error">*</span></span>
                      <input value={form.ten_nguoi_nhan} onChange={e => setForm({ ...form, ten_nguoi_nhan: e.target.value })} placeholder="Họ tên người nhận" className={inputCls} />
                    </label>
                    <label className="grid gap-2">
                      <span className="text-label-sm font-label-sm text-on-surface-variant">Số điện thoại <span className="text-error">*</span></span>
                      <input value={form.sdt_nguoi_nhan} onChange={e => setForm({ ...form, sdt_nguoi_nhan: e.target.value })} placeholder="Số điện thoại người nhận" className={inputCls} />
                    </label>
                  </>
                )}
              </div>
              <div className="mx-xl mb-xl rounded-xl bg-primary/5 border border-primary/10 px-4 py-3 flex items-center gap-3">
                <span className="material-symbols-outlined text-primary text-lg">info</span>
                <p className="text-body-sm text-on-surface-variant">Đơn hàng dự kiến giao trong vòng <span className="font-bold text-on-surface">2 ngày</span> kể từ khi đặt hàng thành công.</p>
              </div>
            </section>

            {/* ── Bước 2: Phương thức thanh toán ── */}
            <section className="bg-surface rounded-3xl border border-outline-variant organic-shadow overflow-hidden">
              <div className="flex items-center gap-3 px-xl pt-xl pb-lg">
                <StepBadge step={2} color="primary" />
                <h2 className="text-title-lg font-title-lg text-on-surface">Phương thức thanh toán</h2>
              </div>
              <div className="space-y-3 px-xl pb-xl">
                <PaymentChoice checked={form.phuong_thuc_tt === 'tien_mat'} onChange={() => setForm({ ...form, phuong_thuc_tt: 'tien_mat' })} icon="local_atm" title="Thanh toán khi nhận hàng (COD)" copy="Thanh toán bằng tiền mặt khi shipper giao hàng." />
                <PaymentChoice checked={form.phuong_thuc_tt === 'banking'} onChange={() => setForm({ ...form, phuong_thuc_tt: 'banking' })} icon="account_balance" title="Chuyển khoản ngân hàng" copy="Sau khi đặt hàng, vui lòng chuyển khoản đến tài khoản của shop." />
              </div>
            </section>
          </div>

          {/* ===== RIGHT COLUMN — Order Summary ===== */}
          <aside className="space-y-lg lg:sticky lg:top-28 lg:col-span-4">
            <section className="bg-surface rounded-3xl border border-outline-variant organic-shadow overflow-hidden">
              <div className="px-xl pt-xl pb-lg border-b border-outline-variant">
                <h2 className="text-title-lg font-title-lg text-on-surface">Đơn hàng của bạn</h2>
              </div>
              <div className="px-xl py-lg space-y-4 border-b border-outline-variant">
                {items.map(item => {
                  const product = { ten_san_pham: item.product?.name, ma_danh_muc: item.product?.category_id, images: item.product?.images || [] };
                  return (
                    <div key={item.product_id} className="flex gap-3">
                      <img src={pickProductImage(product)} alt={item.product?.name} className="w-16 h-16 rounded-xl object-cover flex-shrink-0 border border-outline-variant" />
                      <div className="min-w-0 flex-1">
                        <p className="text-body-sm font-body-sm text-on-surface line-clamp-2">{item.product?.name}</p>
                        <p className="text-label-sm text-on-surface-variant mt-0.5">{item.quantity} {item.product?.unit}</p>
                        <div className="flex items-center justify-between mt-1.5">
                          <span className="text-title-sm font-title-sm text-primary">{formatCurrency(item.quantity * Number(item.product?.price || 0))}</span>
                          <div className="flex gap-1">
                            <button onClick={() => updateItem(item.product_id, item.quantity + 1)} className="w-7 h-7 rounded-lg bg-surface-container-high text-on-surface flex items-center justify-center hover:bg-surface-container-highest transition-colors"><span className="material-symbols-outlined text-xs">add</span></button>
                            <button onClick={() => (item.quantity > 1 ? updateItem(item.product_id, item.quantity - 1) : removeItem(item.product_id))} className="w-7 h-7 rounded-lg bg-surface-container-high text-on-surface flex items-center justify-center hover:bg-surface-container-highest transition-colors"><span className="material-symbols-outlined text-xs">remove</span></button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="px-xl py-lg space-y-3 text-body-sm font-body-sm">
                <div className="flex justify-between text-on-surface-variant"><span>Tạm tính</span><span>{formatCurrency(totalPrice)}</span></div>
                <div className="flex justify-between text-primary"><span>Khuyến mãi</span><span>{discount ? `-${formatCurrency(discount)}` : formatCurrency(0)}</span></div>
                {promotions.length ? (
                  <div className="rounded-xl bg-primary/5 border border-primary/10 p-3 text-label-sm font-label-sm text-on-surface-variant">
                    {promotions.map(p => <p key={p.code}>{promotionLabelMap[p.code] || p.label}: <span className="text-primary font-bold">-{formatCurrency(p.amount)}</span></p>)}
                  </div>
                ) : (
                  <p className="rounded-xl bg-surface-container-low p-3 text-label-sm text-on-surface-variant">
                    Khuyến mãi sẽ được tự động áp dụng khi đủ điều kiện.
                  </p>
                )}
                <div className="flex justify-between text-on-surface-variant"><span>Phí vận chuyển</span><span>{shipping ? formatCurrency(shipping) : <span className="text-primary font-bold">Miễn phí</span>}</span></div>
                <div className="flex justify-between border-t border-outline-variant pt-4 text-title-lg font-title-lg"><span>Tổng cộng</span><span className="text-secondary">{formatCurrency(total)}</span></div>
              </div>
              {error && <div className="mx-xl mb-lg rounded-xl bg-error-container p-3 text-label-sm text-on-error-container flex items-center gap-2"><span className="material-symbols-outlined text-base">error</span>{error}</div>}
              <button onClick={handleOrder} disabled={loading} className="mx-xl mb-xl w-[calc(100%-3rem)] bg-primary text-on-primary py-4 rounded-2xl text-title-sm font-title-sm flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-primary/25 transition-all disabled:opacity-60 active:scale-[0.98]">
                {loading ? 'Đang xử lý...' : 'Đặt hàng ngay'}
                {!loading && <span className="material-symbols-outlined">arrow_forward</span>}
              </button>
            </section>
            <div className="flex flex-wrap justify-center gap-5 text-label-sm text-on-surface-variant">
              <span className="inline-flex items-center gap-1.5"><span className="material-symbols-outlined text-base text-primary">verified_user</span>Bảo mật</span>
              <span className="inline-flex items-center gap-1.5"><span className="material-symbols-outlined text-base text-primary">local_shipping</span>Giao nhanh</span>
              <span className="inline-flex items-center gap-1.5"><span className="material-symbols-outlined text-base text-primary">support_agent</span>Hỗ trợ 24/7</span>
            </div>
          </aside>
        </div>
        </div>
      </div>
  );
}
