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
    <label className={`flex cursor-pointer items-center justify-between gap-4 rounded-xl border p-4 ${checked ? 'border-[#0f5238] bg-[#eef8f3]' : 'border-[#707973] bg-white hover:bg-[#f5f3f3]'}`}>
      <span className="flex items-center gap-4">
        <input type="radio" checked={checked} onChange={onChange} className="h-5 w-5 accent-[#0f5238]" />
        <span>
          <strong className="block text-sm">{title}</strong>
          <small className="mt-1 block text-xs leading-5 text-[#404943]">{copy}</small>
        </span>
      </span>
      <span className="material-symbols-outlined text-[#0f5238]">{icon}</span>
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
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const discount = Number(summary?.discountAmount || 0);
  const promotions = summary?.discounts || [];
  const shipping = Number(summary?.shipping ?? (totalPrice > 500000 ? 0 : 30000));
  const total = Number(summary?.total ?? (Math.max(0, totalPrice - discount) + shipping));

  const handleOrder = async () => {
    if (!form.dia_chi_giao.trim()) {
      setError('Vui lòng nhập địa chỉ giao hàng.');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const data = await orderAPI.create(form);
      await clearCart();
      if (data.payment_url) {
        window.location.assign(data.payment_url);
        return;
      }
      navigate(`/orders/${data.order.id}?success=1`);
    } catch (err) {
      setError(err.message || 'Đặt hàng thất bại.');
    } finally {
      setLoading(false);
    }
  };

  if (!items.length) {
    return (
      <div className="market-shell">
        <div className="market-page py-16">
          <div className="market-panel px-6 py-20 text-center">
            <span className="material-symbols-outlined text-5xl text-[#0f5238]">shopping_cart</span>
            <h1 className="mt-4 text-3xl font-bold">Giỏ hàng đang trống</h1>
            <p className="mt-3 text-sm text-[#404943]">Thêm sản phẩm sạch trước khi hoàn tất đơn hàng.</p>
            <Link to="/products" className="mt-6 inline-flex rounded-lg bg-[#0f5238] px-6 py-3 text-sm font-semibold text-white">Xem sản phẩm</Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="market-shell">
      <div className="market-page py-8 md:py-12">
        <div className="mb-8 flex items-center gap-2 text-sm font-semibold text-white/70">
          <span>Giỏ hàng</span>
          <span className="material-symbols-outlined text-[18px]">chevron_right</span>
          <span className="text-[#b1f0ce]">Thanh toán</span>
        </div>
        <h1 className="mb-9 text-4xl font-bold">Hoàn tất đơn hàng</h1>

        <div className="grid gap-6 lg:grid-cols-12 lg:items-start">
          <div className="space-y-6 lg:col-span-8">
            <section className="market-panel p-6 md:p-8">
              <div className="mb-6 flex items-center gap-3">
                <span className="material-symbols-outlined text-[#0f5238]">local_shipping</span>
                <h2 className="text-xl font-bold">Thông tin giao hàng</h2>
              </div>
              <div className="grid gap-5 md:grid-cols-2">
                <label className="grid gap-2 text-sm">
                  <span>Họ và tên</span>
                  <input readOnly value={user?.name || ''} placeholder="Tên tài khoản nhận hàng" className="market-field px-4 py-3 text-sm" />
                </label>
                <label className="grid gap-2 text-sm">
                  <span>Tài khoản</span>
                  <input readOnly value={user?.email || user?.role || 'Người mua'} className="market-field px-4 py-3 text-sm" />
                </label>
                <label className="grid gap-2 text-sm md:col-span-2">
                  <span>Địa chỉ giao hàng</span>
                  <textarea
                    rows={3}
                    value={form.dia_chi_giao}
                    onChange={event => setForm({ ...form, dia_chi_giao: event.target.value })}
                    placeholder="Số nhà, tên đường, phường/xã, quận/huyện, tỉnh/thành..."
                    className="market-field resize-none px-4 py-3 text-sm"
                  />
                </label>
                <label className="grid gap-2 text-sm md:col-span-2">
                  <span>Ghi chú thêm</span>
                  <textarea
                    rows={3}
                    value={form.ghi_chu}
                    onChange={event => setForm({ ...form, ghi_chu: event.target.value })}
                    placeholder="Ghi chú về thời gian giao hoặc chỉ dẫn địa chỉ..."
                    className="market-field resize-none px-4 py-3 text-sm"
                  />
                </label>
              </div>
            </section>

            <section className="market-panel p-6 md:p-8">
              <div className="mb-6 flex items-center gap-3">
                <span className="material-symbols-outlined text-[#0f5238]">payments</span>
                <h2 className="text-xl font-bold">Phương thức thanh toán</h2>
              </div>
              <div className="space-y-4">
                <PaymentChoice
                  checked={form.phuong_thuc_tt === 'tien_mat'}
                  onChange={() => setForm({ ...form, phuong_thuc_tt: 'tien_mat' })}
                  icon="local_atm"
                  title="Thanh toán khi nhận hàng (COD)"
                  copy="Thanh toán bằng tiền mặt khi shipper giao hàng."
                />
                <PaymentChoice
                  checked={form.phuong_thuc_tt === 'banking'}
                  onChange={() => setForm({ ...form, phuong_thuc_tt: 'banking' })}
                  icon="account_balance"
                  title="Chuyển khoản ngân hàng"
                  copy="Hệ thống ghi nhận đơn và bộ phận hỗ trợ sẽ xác nhận thanh toán."
                />
              </div>
            </section>
          </div>

          <aside className="space-y-4 lg:sticky lg:top-28 lg:col-span-4">
            <section className="market-panel p-6 md:p-8">
              <h2 className="text-xl font-bold">Đơn hàng của bạn</h2>
              <div className="mt-6 space-y-5 border-b border-[#d7ddd8] pb-6">
                {items.map(item => {
                  const product = {
                    ten_san_pham: item.product?.name,
                    ma_danh_muc: item.product?.category_id,
                    images: item.product?.images || [],
                  };
                  return (
                    <div key={item.product_id} className="flex gap-4">
                      <img src={pickProductImage(product)} alt={item.product?.name} className="h-20 w-20 rounded-lg object-cover" />
                      <div className="min-w-0 flex-1">
                        <p className="line-clamp-2 text-sm font-semibold">{item.product?.name}</p>
                        <p className="mt-1 text-xs text-[#404943]">{item.quantity} {item.product?.unit}</p>
                        <p className="mt-0.5 text-xs text-slate-400">Đơn giá: {formatCurrency(item.product?.price || 0)}/{item.product?.unit}</p>
                        <p className="mt-2 text-sm font-semibold text-[#0f5238]">{formatCurrency(item.quantity * Number(item.product?.price || 0))}</p>
                      </div>
                      <div className="grid content-start gap-1">
                        <button onClick={() => updateItem(item.product_id, item.quantity + 1)} className="rounded border border-[#d7ddd8] px-2 text-sm">+</button>
                        <button onClick={() => (item.quantity > 1 ? updateItem(item.product_id, item.quantity - 1) : removeItem(item.product_id))} className="rounded border border-[#d7ddd8] px-2 text-sm">-</button>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="space-y-4 py-6 text-sm">
                <div className="flex justify-between gap-4 text-[#404943]"><span>Tạm tính</span><span>{formatCurrency(totalPrice)}</span></div>
                <div className="flex justify-between gap-4 text-[#1a7a4a]"><span>Khuyến mãi</span><span>{discount ? `-${formatCurrency(discount)}` : formatCurrency(0)}</span></div>
                {promotions.length ? (
                  <div className="rounded-lg border border-[#b8e0c6] bg-[#eef8f3] p-3 text-xs text-[#1a7a4a]">
                    {promotions.map(promotion => (
                      <p key={promotion.code}>{promotionLabelMap[promotion.code] || promotion.label}: -{formatCurrency(promotion.amount)}</p>
                    ))}
                  </div>
                ) : (
                  <p className="rounded-lg bg-[#f3f7f4] p-3 text-xs leading-5 text-[#404943]">
                    Mua từ 10 sản phẩm hoặc hoàn tất từ 3 đơn để nhận khuyến mãi.
                  </p>
                )}
                <div className="flex justify-between gap-4 text-[#404943]"><span>Phí vận chuyển</span><span>{shipping ? formatCurrency(shipping) : 'Miễn phí'}</span></div>
                <div className="flex justify-between gap-4 border-t border-[#d7ddd8] pt-5 text-2xl font-bold"><span>Tổng cộng</span><span className="text-[#0f5238]">{formatCurrency(total)}</span></div>
              </div>
              {error ? <p className="mb-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p> : null}
              <button onClick={handleOrder} disabled={loading} className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#0f5238] px-5 py-4 text-sm font-bold text-white shadow-md hover:bg-[#0a402b] disabled:opacity-60">
                {loading ? 'Đang xử lý...' : 'Đặt hàng ngay'}
                {!loading ? <span className="material-symbols-outlined">arrow_forward</span> : null}
              </button>
            </section>
            <div className="flex flex-wrap justify-center gap-5 text-xs font-semibold uppercase tracking-wide text-[#707973]">
              <span className="inline-flex items-center gap-1"><span className="material-symbols-outlined text-[18px]">verified_user</span>Bảo mật</span>
              <span className="inline-flex items-center gap-1"><span className="material-symbols-outlined text-[18px]">local_shipping</span>Giao nhanh</span>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
