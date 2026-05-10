import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { orderAPI } from '../services/api';

export default function Cart() {
  const { items, updateItem, removeItem, clearCart, totalPrice } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    dia_chi_giao: user?.address || '',
    ghi_chu: '',
    phuong_thuc_tt: 'tien_mat',
  });
  const [load, setLoad] = useState(false);
  const [err, setErr] = useState('');

  const shippingFee = totalPrice > 500000 ? 0 : 30000;
  const total = totalPrice + shippingFee;

  const handleOrder = async () => {
    if (!form.dia_chi_giao.trim()) {
      setErr('Vui lòng nhập địa chỉ giao hàng');
      return;
    }

    setLoad(true);
    setErr('');

    try {
      const data = await orderAPI.create(form);
      await clearCart();
      navigate(`/orders/${data.order.id}?success=1`);
    } catch (error) {
      setErr(error.message || 'Đặt hàng thất bại');
    } finally {
      setLoad(false);
    }
  };

  if (!items.length) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-50">
        <div className="text-center">
          <div className="mb-4 text-7xl">🛍️</div>
          <h2 className="mb-2 text-xl font-bold text-stone-700">Giỏ hàng đang trống</h2>
          <p className="mb-6 text-sm text-stone-400">Hãy thêm vài sản phẩm tươi ngon vào giỏ hàng của bạn.</p>
          <Link to="/products" className="rounded-2xl bg-emerald-700 px-6 py-3 font-medium text-white transition-colors hover:bg-emerald-800">
            Xem sản phẩm
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="mx-auto max-w-5xl px-4 py-8">
        <h1 className="mb-6 text-2xl font-bold text-stone-800">
          {step === 1 ? '🛍️ Giỏ hàng' : '📋 Xác nhận đơn hàng'}
        </h1>

        <div className="flex flex-col gap-6 lg:flex-row">
          <div className="flex-1 space-y-3">
            {step === 1 ? (
              items.map(item => (
                <div key={item.product_id} className="flex gap-4 rounded-3xl border border-stone-200 bg-white p-4">
                  <img
                    src={item.product?.images?.[0] || 'https://placehold.co/80x80/e8f5e9/2e7d32?text=NS'}
                    alt={item.product?.name}
                    className="h-20 w-20 rounded-2xl object-cover"
                  />

                  <div className="flex-1">
                    <h3 className="text-sm font-semibold text-stone-800">{item.product?.name}</h3>
                    <p className="mt-0.5 text-xs text-emerald-700">{item.product?.farm_name}</p>

                    <div className="mt-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => (item.quantity > 1 ? updateItem(item.product_id, item.quantity - 1) : removeItem(item.product_id))}
                          className="flex h-7 w-7 items-center justify-center rounded-full border border-stone-200 text-sm font-bold text-stone-600 transition-colors hover:border-emerald-500 hover:text-emerald-700"
                        >
                          -
                        </button>
                        <span className="w-7 text-center text-sm font-medium">{item.quantity}</span>
                        <button
                          onClick={() => updateItem(item.product_id, item.quantity + 1)}
                          className="flex h-7 w-7 items-center justify-center rounded-full border border-stone-200 text-sm font-bold text-stone-600 transition-colors hover:border-emerald-500 hover:text-emerald-700"
                        >
                          +
                        </button>
                      </div>

                      <div className="text-right">
                        <p className="text-sm font-bold text-emerald-700">
                          {(item.quantity * (item.product?.price || 0)).toLocaleString('vi-VN')}₫
                        </p>
                        <p className="text-xs text-stone-400">
                          {Number(item.product?.price).toLocaleString('vi-VN')}₫/{item.product?.unit}
                        </p>
                      </div>
                    </div>
                  </div>

                  <button onClick={() => removeItem(item.product_id)} className="self-start text-stone-300 transition-colors hover:text-red-400">
                    ✕
                  </button>
                </div>
              ))
            ) : (
              <div className="space-y-4 rounded-3xl border border-stone-200 bg-white p-6">
                <h3 className="font-semibold text-stone-700">Thông tin giao hàng</h3>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-stone-600">Địa chỉ giao hàng *</label>
                  <textarea
                    value={form.dia_chi_giao}
                    onChange={event => setForm({ ...form, dia_chi_giao: event.target.value })}
                    placeholder="Số nhà, đường, phường, quận, tỉnh/thành phố"
                    rows={3}
                    className="w-full resize-none rounded-2xl border border-stone-200 px-4 py-3 text-sm focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-100"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-stone-600">Ghi chú</label>
                  <input
                    value={form.ghi_chu}
                    onChange={event => setForm({ ...form, ghi_chu: event.target.value })}
                    placeholder="Giao giờ hành chính, gọi trước khi giao..."
                    className="w-full rounded-2xl border border-stone-200 px-4 py-3 text-sm focus:border-emerald-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-stone-600">Phương thức thanh toán</label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { v: 'tien_mat', icon: '💵', l: 'Tiền mặt (COD)' },
                      { v: 'vnpay', icon: '💳', l: 'VNPay' },
                    ].map(payment => (
                      <button
                        key={payment.v}
                        type="button"
                        onClick={() => setForm({ ...form, phuong_thuc_tt: payment.v })}
                        className={`rounded-2xl border-2 p-3 text-left transition-all ${
                          form.phuong_thuc_tt === payment.v ? 'border-emerald-500 bg-emerald-50' : 'border-stone-200'
                        }`}
                      >
                        <div className="mb-1 text-xl">{payment.icon}</div>
                        <div className="text-sm font-medium text-stone-800">{payment.l}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {err && <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">⚠️ {err}</div>}
              </div>
            )}
          </div>

          <div className="lg:w-80">
            <div className="sticky top-20 rounded-3xl border border-stone-200 bg-white p-5">
              <h3 className="mb-4 font-semibold text-stone-700">Tóm tắt đơn hàng</h3>

              {step === 2 && (
                <div className="mb-4 space-y-1.5 border-b border-stone-100 pb-4">
                  {items.map(item => (
                    <div key={item.product_id} className="flex justify-between text-xs text-stone-600">
                      <span className="line-clamp-1 flex-1">{item.product?.name} × {item.quantity}</span>
                      <span className="ml-2 font-medium">{(item.quantity * (item.product?.price || 0)).toLocaleString('vi-VN')}₫</span>
                    </div>
                  ))}
                </div>
              )}

              <div className="space-y-2 text-sm">
                <div className="flex justify-between text-stone-600">
                  <span>Tạm tính</span>
                  <span>{totalPrice.toLocaleString('vi-VN')}₫</span>
                </div>
                <div className="flex justify-between text-stone-600">
                  <span>Phí vận chuyển</span>
                  <span className={shippingFee === 0 ? 'font-medium text-emerald-700' : ''}>
                    {shippingFee === 0 ? 'Miễn phí' : `${shippingFee.toLocaleString('vi-VN')}₫`}
                  </span>
                </div>
                {shippingFee === 0 && (
                  <p className="rounded-xl bg-emerald-50 px-2 py-1 text-xs text-emerald-700">🎉 Miễn phí vận chuyển cho đơn trên 500.000₫</p>
                )}
              </div>

              <div className="mt-4 flex justify-between border-t border-stone-100 pt-4 text-lg font-bold">
                <span>Tổng cộng</span>
                <span className="text-emerald-700">{total.toLocaleString('vi-VN')}₫</span>
              </div>

              {step === 1 ? (
                <button
                  onClick={() => setStep(2)}
                  className="mt-4 w-full rounded-2xl bg-emerald-700 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-800"
                >
                  Đặt hàng →
                </button>
              ) : (
                <div className="mt-4 space-y-2">
                  <button
                    onClick={handleOrder}
                    disabled={load}
                    className="w-full rounded-2xl bg-emerald-700 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-800 disabled:opacity-60"
                  >
                    {load ? 'Đang xử lý...' : '✓ Xác nhận đặt hàng'}
                  </button>
                  <button
                    onClick={() => setStep(1)}
                    className="w-full rounded-2xl bg-stone-100 py-2.5 text-sm font-medium text-stone-700 transition-colors hover:bg-stone-200"
                  >
                    ← Quay lại
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
