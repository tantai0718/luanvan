import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { orderAPI } from '../services/api';

const STATUS_MAP = {
  cho_xac_nhan: { label: 'Chờ xác nhận', color: 'bg-yellow-100 text-yellow-700' },
  da_xac_nhan: { label: 'Đã xác nhận', color: 'bg-blue-100 text-blue-700' },
  dang_giao: { label: 'Đang giao', color: 'bg-purple-100 text-purple-700' },
  da_giao: { label: 'Đã giao', color: 'bg-green-100 text-green-700' },
  da_huy: { label: 'Đã hủy', color: 'bg-red-100 text-red-700' },
};

const formatCurrency = value => `${Number(value || 0).toLocaleString('vi-VN')}₫`;
const canCancelOrder = status => ['cho_xac_nhan', 'da_xac_nhan'].includes(status);

export function OrderList() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelingId, setCancelingId] = useState(null);

  const fetchOrders = () => {
    setLoading(true);
    orderAPI
      .getAll()
      .then(data => setOrders(data.orders || []))
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const handleCancel = async (event, orderId) => {
    event.preventDefault();
    event.stopPropagation();

    if (!window.confirm('Bạn có chắc muốn hủy đơn hàng này không?')) return;

    setCancelingId(orderId);
    try {
      await orderAPI.cancel(orderId, {});
      setOrders(prev => prev.map(order => (order.ma_don_hang === orderId ? { ...order, trang_thai: 'da_huy' } : order)));
    } catch {
    } finally {
      setCancelingId(null);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-stone-800">Đơn hàng của tôi</h1>
          <p className="mt-2 text-sm text-stone-500">Theo dõi trạng thái xử lý và quản lý các đơn bạn đã đặt.</p>
        </div>

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-32 animate-pulse rounded-3xl border border-stone-200 bg-white" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="rounded-3xl border border-dashed border-stone-300 bg-white py-20 text-center text-stone-400">
            <div className="mb-3 text-5xl">📦</div>
            <p className="font-medium">Bạn chưa có đơn hàng nào</p>
            <Link to="/products" className="mt-4 inline-block text-sm font-medium text-emerald-700">
              Mua sắm ngay →
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map(order => {
              const status = STATUS_MAP[order.trang_thai] || { label: order.trang_thai, color: 'bg-gray-100 text-gray-600' };

              return (
                <Link
                  to={`/orders/${order.ma_don_hang}`}
                  key={order.ma_don_hang}
                  className="block rounded-3xl border border-stone-200 bg-white p-5 transition-all hover:shadow-md"
                >
                  <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-stone-700">Đơn #{order.ma_don_hang}</p>
                      <p className="mt-1 text-xs text-stone-400">{new Date(order.ngay_tao).toLocaleString('vi-VN')}</p>
                    </div>
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${status.color}`}>{status.label}</span>
                  </div>

                  <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                    <div className="space-y-1">
                      <p className="text-xs text-stone-500">
                        Thanh toán: {order.phuong_thuc_tt === 'tien_mat' ? 'Tiền mặt khi nhận hàng' : 'VNPay'}
                      </p>
                      <p className="text-lg font-bold text-emerald-700">{formatCurrency(order.tong_thanh_toan)}</p>
                    </div>

                    <div className="flex gap-2">
                      <span className="rounded-2xl border border-stone-200 px-4 py-2 text-sm font-medium text-stone-600">Xem chi tiết</span>
                      {canCancelOrder(order.trang_thai) && (
                        <button
                          onClick={event => handleCancel(event, order.ma_don_hang)}
                          disabled={cancelingId === order.ma_don_hang}
                          className="rounded-2xl bg-red-50 px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-100 disabled:opacity-60"
                        >
                          {cancelingId === order.ma_don_hang ? 'Đang hủy...' : 'Hủy đơn'}
                        </button>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export function OrderDetail() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [canceling, setCanceling] = useState(false);
  const success = searchParams.get('success');

  const fetchOrder = () => {
    setLoading(true);
    orderAPI
      .getById(id)
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchOrder();
  }, [id]);

  const handleCancel = async () => {
    if (!data?.order || !canCancelOrder(data.order.trang_thai)) return;
    if (!window.confirm('Bạn có chắc muốn hủy đơn hàng này không?')) return;

    setCanceling(true);
    try {
      await orderAPI.cancel(id, {});
      setData(prev => ({ ...prev, order: { ...prev.order, trang_thai: 'da_huy' } }));
    } catch {
    } finally {
      setCanceling(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-stone-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-700 border-t-transparent" />
      </div>
    );
  }

  if (!data) {
    return <div className="flex min-h-screen items-center justify-center bg-stone-50 text-stone-400">Không tìm thấy đơn hàng</div>;
  }

  const { order, items } = data;
  const status = STATUS_MAP[order.trang_thai] || { label: order.trang_thai, color: 'bg-gray-100 text-gray-600' };

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="mx-auto max-w-3xl px-4 py-8">
        {success && (
          <div className="mb-5 rounded-3xl border border-green-200 bg-green-50 p-5 text-center">
            <div className="mb-2 text-4xl">🎉</div>
            <h2 className="text-lg font-bold text-green-700">Đặt hàng thành công</h2>
            <p className="mt-1 text-sm text-green-600">Đơn hàng #{order.ma_don_hang} đã được tạo trên hệ thống.</p>
          </div>
        )}

        <div className="rounded-3xl border border-stone-200 bg-white p-6">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-lg font-bold text-stone-800">Đơn hàng #{order.ma_don_hang}</h1>
              <p className="mt-1 text-sm text-stone-400">{new Date(order.ngay_tao).toLocaleString('vi-VN')}</p>
            </div>
            <span className={`inline-flex rounded-full px-3 py-1.5 text-xs font-medium ${status.color}`}>{status.label}</span>
          </div>

          <div className="mb-5 space-y-3">
            {items.map(item => (
              <div key={item.ma_chi_tiet} className="flex items-center gap-3 rounded-2xl bg-stone-50 p-3">
                <img
                  src={item.hinh_san_pham || 'https://placehold.co/60x60/e8f5e9/2e7d32?text=NS'}
                  alt={item.ten_san_pham}
                  className="h-16 w-16 rounded-2xl object-cover"
                />
                <div className="flex-1">
                  <p className="text-sm font-medium text-stone-800">{item.ten_san_pham}</p>
                  <p className="mt-1 text-xs text-stone-400">
                    {item.so_luong} {item.don_vi} × {formatCurrency(item.gia_tai_thoi_diem)}
                  </p>
                </div>
                <p className="text-sm font-semibold text-emerald-700">{formatCurrency(item.thanh_tien)}</p>
              </div>
            ))}
          </div>

          <div className="space-y-2 border-t border-stone-100 pt-4 text-sm">
            <div className="flex justify-between text-stone-500">
              <span>Tổng tiền hàng</span>
              <span>{formatCurrency(order.tong_tien_hang)}</span>
            </div>
            <div className="flex justify-between text-stone-500">
              <span>Phí vận chuyển</span>
              <span>{formatCurrency(order.phi_van_chuyen)}</span>
            </div>
            <div className="flex justify-between pt-1 text-base font-bold">
              <span>Tổng thanh toán</span>
              <span className="text-emerald-700">{formatCurrency(order.tong_thanh_toan)}</span>
            </div>
          </div>

          <div className="mt-4 space-y-2 border-t border-stone-100 pt-4 text-sm text-stone-500">
            <p>📍 {order.dia_chi_giao}</p>
            <p>{order.phuong_thuc_tt === 'tien_mat' ? '💵 Tiền mặt khi nhận hàng' : '💳 VNPay'}</p>
            {order.ghi_chu && <p>📝 {order.ghi_chu}</p>}
          </div>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <Link
              to="/orders"
              className="flex-1 rounded-2xl border border-stone-200 py-2.5 text-center text-sm font-medium text-stone-600 transition-colors hover:bg-stone-50"
            >
              ← Về danh sách đơn
            </Link>
            {canCancelOrder(order.trang_thai) ? (
              <button
                onClick={handleCancel}
                disabled={canceling}
                className="flex-1 rounded-2xl bg-red-50 py-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-100 disabled:opacity-60"
              >
                {canceling ? 'Đang hủy đơn...' : 'Hủy đơn hàng'}
              </button>
            ) : (
              <Link
                to="/products"
                className="flex-1 rounded-2xl bg-emerald-700 py-2.5 text-center text-sm font-medium text-white transition-colors hover:bg-emerald-800"
              >
                Tiếp tục mua
              </Link>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
