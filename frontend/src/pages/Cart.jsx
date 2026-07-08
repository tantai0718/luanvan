import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { orderAPI } from '../services/api';
import { pickProductImage } from '../utils/marketImages';

const formatCurrency = value => `${Number(value || 0).toLocaleString('vi-VN')}đ`;

const promotionLabelMap = {
  BULK_QUANTITY: 'Mua từ 10 sản phẩm',
  LOYAL_CUSTOMER: 'Khách hàng mua nhiều lần',
};

function PaymentChoice({ checked, icon, title, copy, onChange }) {
  return (
    <label className={`flex cursor-pointer items-center justify-between gap-4 rounded-2xl border p-4 transition-all ${
      checked ? 'border-primary bg-primary-fixed' : 'border-outline-variant bg-surface hover:bg-surface-container-high'
    }`}>
      <span className="flex items-center gap-4">
        <input type="radio" checked={checked} onChange={onChange} className="h-5 w-5 accent-primary" />
        <span>
          <strong className="block text-title-md font-title-md">{title}</strong>
          <small className="mt-1 block text-body-md font-body-md text-on-surface-variant">{copy}</small>
        </span>
      </span>
      <span className="material-symbols-outlined text-primary">{icon}</span>
    </label>
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

  return (
    <div className="bg-background min-h-screen py-xl">
      <div className="max-w-7xl mx-auto px-margin-mobile md:px-margin-desktop">
        <div className="mb-lg">
          <h1 className="text-display-lg font-display-lg text-on-surface">Hoàn tất đơn hàng</h1>
          <div className="flex items-center gap-2 text-body-md font-body-md text-on-surface-variant mt-1">
            <span>Giỏ hàng</span>
            <span className="material-symbols-outlined text-sm">chevron_right</span>
            <span className="text-primary">Thanh toán</span>
          </div>
        </div>

        <div className="grid gap-xl lg:grid-cols-12 lg:items-start">
          <div className="space-y-lg lg:col-span-8">
            {/* Shipping Info */}
            <section className="bg-surface rounded-3xl p-lg md:p-xl border border-outline-variant organic-shadow">
              <div className="flex items-center gap-3 mb-lg">
                <span className="material-symbols-outlined text-primary">local_shipping</span>
                <h2 className="text-title-md font-title-md text-on-surface">Thông tin giao hàng</h2>
              </div>
              <div className="grid gap-lg md:grid-cols-2">
                <label className="grid gap-2">
                  <span className="text-label-sm font-label-sm text-on-surface-variant">Họ và tên</span>
                  <input readOnly value={user?.name || ''} placeholder="Tên người nhận" className="bg-surface border border-outline-variant rounded-xl px-4 py-3 text-body-md" />
                </label>
                <label className="grid gap-2">
                  <span className="text-label-sm font-label-sm text-on-surface-variant">Tài khoản</span>
                  <input readOnly value={user?.email || user?.role || 'Người mua'} className="bg-surface border border-outline-variant rounded-xl px-4 py-3 text-body-md" />
                </label>
                <label className="grid gap-2 md:col-span-2">
                  <span className="text-label-sm font-label-sm text-on-surface-variant">Địa chỉ giao hàng</span>
                  <textarea rows={3} value={form.dia_chi_giao} onChange={e => setForm({ ...form, dia_chi_giao: e.target.value })} placeholder="Số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành..." className="bg-surface border border-outline-variant rounded-xl resize-none px-4 py-3 text-body-md focus:ring-2 focus:ring-primary focus:border-primary outline-none" />
                </label>
                <label className="grid gap-2 md:col-span-2">
                  <span className="text-label-sm font-label-sm text-on-surface-variant">Ghi chú thêm</span>
                  <textarea rows={3} value={form.ghi_chu} onChange={e => setForm({ ...form, ghi_chu: e.target.value })} placeholder="Ghi chú về thời gian giao hoặc chỉ dẫn địa chỉ..." className="bg-surface border border-outline-variant rounded-xl resize-none px-4 py-3 text-body-md focus:ring-2 focus:ring-primary focus:border-primary outline-none" />
                </label>
                <label className="flex items-center gap-3 md:col-span-2">
                  <input type="checkbox" checked={form.ship_to_other} onChange={e => setForm({ ...form, ship_to_other: e.target.checked })} className="h-5 w-5 accent-primary" />
                  <span className="text-body-md font-body-md text-on-surface">Giao hàng cho người khác</span>
                </label>
                {form.ship_to_other && (
                  <>
                    <label className="grid gap-2">
                      <span className="text-label-sm font-label-sm text-on-surface-variant">Người nhận <span className="text-red-500">*</span></span>
                      <input value={form.ten_nguoi_nhan} onChange={e => setForm({ ...form, ten_nguoi_nhan: e.target.value })} placeholder="Họ tên người nhận" className="bg-surface border border-outline-variant rounded-xl px-4 py-3 text-body-md focus:ring-2 focus:ring-primary focus:border-primary outline-none" />
                    </label>
                    <label className="grid gap-2">
                      <span className="text-label-sm font-label-sm text-on-surface-variant">Số điện thoại <span className="text-red-500">*</span></span>
                      <input value={form.sdt_nguoi_nhan} onChange={e => setForm({ ...form, sdt_nguoi_nhan: e.target.value })} placeholder="Số điện thoại người nhận" className="bg-surface border border-outline-variant rounded-xl px-4 py-3 text-body-md focus:ring-2 focus:ring-primary focus:border-primary outline-none" />
                    </label>
                  </>
                )}
              </div>
              <p className="mt-lg rounded-xl bg-primary-fixed px-4 py-3 text-body-md font-body-md text-on-primary-container">
                Đơn hàng dự kiến giao trong vòng 2 ngày kể từ khi đặt hàng thành công.
              </p>
            </section>

            {/* Payment Method */}
            <section className="bg-surface rounded-3xl p-lg md:p-xl border border-outline-variant organic-shadow">
              <div className="flex items-center gap-3 mb-lg">
                <span className="material-symbols-outlined text-primary">payments</span>
                <h2 className="text-title-md font-title-md text-on-surface">Phương thức thanh toán</h2>
              </div>
              <div className="space-y-4">
                <PaymentChoice checked={form.phuong_thuc_tt === 'tien_mat'} onChange={() => setForm({ ...form, phuong_thuc_tt: 'tien_mat' })} icon="local_atm" title="Thanh toán khi nhận hàng (COD)" copy="Thanh toán bằng tiền mặt khi shipper giao hàng." />
                <PaymentChoice checked={form.phuong_thuc_tt === 'banking'} onChange={() => setForm({ ...form, phuong_thuc_tt: 'banking' })} icon="account_balance" title="Chuyển khoản ngân hàng" copy="Sau khi đặt hàng, vui lòng chuyển khoản đến tài khoản của shop." />
              </div>
            </section>
          </div>

          {/* Order Summary */}
          <aside className="space-y-lg lg:sticky lg:top-28 lg:col-span-4">
            <section className="bg-surface rounded-3xl p-lg md:p-xl border border-outline-variant organic-shadow">
              <h2 className="text-title-md font-title-md text-on-surface mb-lg">Đơn hàng của bạn</h2>
              <div className="space-y-4 border-b border-outline-variant pb-lg mb-lg">
                {items.map(item => {
                  const product = { ten_san_pham: item.product?.name, ma_danh_muc: item.product?.category_id, images: item.product?.images || [] };
                  return (
                    <div key={item.product_id} className="flex gap-4">
                      <img src={pickProductImage(product)} alt={item.product?.name} className="w-20 h-20 rounded-2xl object-cover flex-shrink-0" />
                      <div className="min-w-0 flex-1">
                        <p className="text-body-md font-body-md text-on-surface line-clamp-2">{item.product?.name}</p>
                        <p className="text-label-sm text-on-surface-variant mt-1">{item.quantity} {item.product?.unit}</p>
                        <p className="text-label-sm text-on-surface-variant">Đơn giá: {formatCurrency(item.product?.price || 0)}/{item.product?.unit}</p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-title-md font-title-md text-primary">{formatCurrency(item.quantity * Number(item.product?.price || 0))}</span>
                          <div className="flex gap-1">
                            <button onClick={() => updateItem(item.product_id, item.quantity + 1)} className="w-8 h-8 rounded-lg bg-surface-container-high text-on-surface flex items-center justify-center hover:bg-surface-container-highest"><span className="material-symbols-outlined text-sm">add</span></button>
                            <button onClick={() => (item.quantity > 1 ? updateItem(item.product_id, item.quantity - 1) : removeItem(item.product_id))} className="w-8 h-8 rounded-lg bg-surface-container-high text-on-surface flex items-center justify-center hover:bg-surface-container-highest"><span className="material-symbols-outlined text-sm">remove</span></button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="space-y-3 text-body-md font-body-md">
                <div className="flex justify-between text-on-surface-variant"><span>Tạm tính</span><span>{formatCurrency(totalPrice)}</span></div>
                <div className="flex justify-between text-primary"><span>Khuyến mãi</span><span>{discount ? `-${formatCurrency(discount)}` : formatCurrency(0)}</span></div>
                {promotions.length ? (
                  <div className="rounded-xl bg-primary-fixed p-3 text-label-sm font-label-sm text-on-primary-container">
                    {promotions.map(p => <p key={p.code}>{promotionLabelMap[p.code] || p.label}: -{formatCurrency(p.amount)}</p>)}
                  </div>
                ) : (
                  <p className="rounded-xl bg-surface-container-low p-3 text-label-sm font-label-sm text-on-surface-variant">
                    Mua từ 10 sản phẩm hoặc hoàn tất từ 3 đơn để nhận khuyến mãi.
                  </p>
                )}
                <div className="flex justify-between text-on-surface-variant"><span>Phí vận chuyển</span><span>{shipping ? formatCurrency(shipping) : 'Miễn phí'}</span></div>
                <div className="flex justify-between border-t border-outline-variant pt-4 text-title-md font-title-md"><span>Tổng cộng</span><span className="text-secondary text-headline-lg">{formatCurrency(total)}</span></div>
              </div>
              {error && <p className="mt-3 rounded-xl bg-error-container p-3 text-label-sm font-label-sm text-on-error-container">{error}</p>}
              <button onClick={handleOrder} disabled={loading} className="mt-lg w-full bg-primary text-on-primary py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-on-primary-fixed-variant transition-all disabled:opacity-60 active:scale-95">
                {loading ? 'Đang xử lý...' : 'Đặt hàng ngay'}
                {!loading && <span className="material-symbols-outlined">arrow_forward</span>}
              </button>
            </section>
            <div className="flex flex-wrap justify-center gap-4 text-label-sm font-label-sm text-on-surface-variant">
              <span className="inline-flex items-center gap-1"><span className="material-symbols-outlined text-base">verified_user</span>Bảo mật</span>
              <span className="inline-flex items-center gap-1"><span className="material-symbols-outlined text-base">local_shipping</span>Giao nhanh</span>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
