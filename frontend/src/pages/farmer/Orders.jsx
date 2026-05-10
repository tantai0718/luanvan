import { useEffect, useMemo, useState } from 'react';
import { api, orderAPI } from '../../services/api';
import { Badge, Btn, Loading, Modal, StatCard } from '../../components/ui/AdminUI';

const ORDER_STATUS = {
  cho_xac_nhan: { label: 'Chờ xác nhận', color: 'yellow' },
  da_xac_nhan: { label: 'Đã xác nhận', color: 'blue' },
  dang_giao: { label: 'Đang giao', color: 'purple' },
  da_giao: { label: 'Đã giao', color: 'green' },
  da_huy: { label: 'Đã hủy', color: 'red' },
};

const NEXT_ORDER_STATUS = {
  cho_xac_nhan: 'da_xac_nhan',
  da_xac_nhan: 'dang_giao',
  dang_giao: 'da_giao',
};

const formatCurrency = value => `${Number(value || 0).toLocaleString('vi-VN')}₫`;
const getStatusMeta = status => ORDER_STATUS[status] || { label: status, color: 'gray' };

function OrderDetailModal({ orderId, detail, onClose, onAdvanceStatus }) {
  const nextStatus = NEXT_ORDER_STATUS[detail.order.trang_thai];

  return (
    <Modal title={`Chi tiết đơn hàng #${orderId}`} onClose={onClose} size="lg">
      <div className="space-y-4">
        <div className="grid gap-3 md:grid-cols-2 text-sm">
          {[
            ['Người mua', detail.order.ten_nguoi_mua || 'Khách hàng'],
            ['Số điện thoại', detail.order.so_dien_thoai || 'Chưa cập nhật'],
            ['Địa chỉ giao', detail.order.dia_chi_giao || 'Chưa cập nhật'],
            ['Thanh toán', detail.order.phuong_thuc_tt === 'tien_mat' ? 'Tiền mặt' : 'VNPay'],
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl bg-gray-50 p-3">
              <p className="text-xs text-gray-400">{label}</p>
              <p className="mt-1 font-medium text-gray-800">{value}</p>
            </div>
          ))}
        </div>

        <div className="space-y-2">
          {detail.items?.map(item => (
            <div key={item.ma_chi_tiet} className="flex items-center gap-3 rounded-xl bg-gray-50 p-3">
              <img
                src={item.hinh_san_pham || 'https://placehold.co/48x48/e8f5e9/2e7d32?text=NS'}
                alt={item.ten_san_pham}
                className="h-12 w-12 rounded-lg object-cover"
              />
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-800">{item.ten_san_pham}</p>
                <p className="text-xs text-gray-400">
                  {item.so_luong} {item.don_vi} × {formatCurrency(item.gia_tai_thoi_diem)}
                </p>
              </div>
              <p className="text-sm font-semibold text-green-700">{formatCurrency(item.thanh_tien)}</p>
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between rounded-xl bg-green-50 p-4 text-base font-bold">
          <span>Tổng thanh toán</span>
          <span className="text-green-700">{formatCurrency(detail.order.tong_thanh_toan)}</span>
        </div>

        <div className="flex gap-3">
          {nextStatus && (
            <Btn variant="primary" className="flex-1 justify-center" onClick={() => onAdvanceStatus(nextStatus)}>
              Chuyển trạng thái tiếp
            </Btn>
          )}
          <Btn variant="outline" className="flex-1 justify-center" onClick={onClose}>
            Đóng
          </Btn>
        </div>
      </div>
    </Modal>
  );
}

function OrderCard({ order, onOpenDetail, onAdvanceStatus }) {
  const statusMeta = getStatusMeta(order.trang_thai);
  const nextStatus = NEXT_ORDER_STATUS[order.trang_thai];

  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold text-gray-800">Đơn #{order.ma_don_hang}</p>
            <Badge text={statusMeta.label} color={statusMeta.color} />
          </div>
          <p className="text-sm text-gray-600">{order.ten_nguoi_mua || 'Khách hàng'}</p>
          <p className="text-xs text-gray-400">
            {order.so_dien_thoai || 'Chưa có số điện thoại'} · {new Date(order.ngay_tao).toLocaleString('vi-VN')}
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="text-left sm:text-right">
            <p className="text-xs text-gray-400">Tổng thanh toán</p>
            <p className="font-bold text-green-700">{formatCurrency(order.tong_thanh_toan)}</p>
          </div>

          <div className="flex gap-2">
            <Btn variant="outline" size="sm" onClick={() => onOpenDetail(order.ma_don_hang)}>
              Chi tiết
            </Btn>
            {nextStatus && (
              <Btn variant="primary" size="sm" onClick={() => onAdvanceStatus(order.ma_don_hang, nextStatus)}>
                {nextStatus === 'da_xac_nhan' ? 'Xác nhận' : nextStatus === 'dang_giao' ? 'Giao hàng' : 'Đã giao'}
              </Btn>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function FarmerOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const [selectedOrderDetail, setSelectedOrderDetail] = useState(null);

  const summary = useMemo(
    () => ({
      total: orders.length,
      pending: orders.filter(order => order.trang_thai === 'cho_xac_nhan').length,
      shipping: orders.filter(order => order.trang_thai === 'dang_giao').length,
      done: orders.filter(order => order.trang_thai === 'da_giao').length,
    }),
    [orders]
  );

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const data = await orderAPI.farmerOrders();
      setOrders(data.orders || []);
    } catch {
      setOrders([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const openOrderDetail = async orderId => {
    try {
      const data = await api.get(`/orders/${orderId}`);
      setSelectedOrderId(orderId);
      setSelectedOrderDetail(data);
    } catch {}
  };

  const updateOrderStatus = async (orderId, nextStatus) => {
    await orderAPI.updateStatus(orderId, { trang_thai: nextStatus });

    setOrders(prev => prev.map(order => (order.ma_don_hang === orderId ? { ...order, trang_thai: nextStatus } : order)));

    if (selectedOrderId === orderId && selectedOrderDetail) {
      setSelectedOrderDetail(prev => ({
        ...prev,
        order: { ...prev.order, trang_thai: nextStatus },
      }));
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl space-y-6 px-4 py-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Đơn hàng của nông trại</h1>
          <p className="mt-1 text-sm text-gray-500">Theo dõi và cập nhật tiến trình xử lý đơn hàng từ khách mua.</p>
        </div>

        <div className="grid gap-4 md:grid-cols-4">
          <StatCard icon="📦" label="Tổng đơn hàng" value={summary.total} color="blue" />
          <StatCard icon="⏳" label="Chờ xác nhận" value={summary.pending} color="orange" />
          <StatCard icon="🚚" label="Đang giao" value={summary.shipping} color="purple" />
          <StatCard icon="✅" label="Đã giao" value={summary.done} color="green" />
        </div>

        {loading ? (
          <Loading />
        ) : !orders.length ? (
          <div className="rounded-2xl border border-gray-100 bg-white py-16 text-center text-gray-400 shadow-sm">
            <div className="mb-3 text-5xl">📦</div>
            <p className="font-medium">Chưa có đơn hàng nào</p>
          </div>
        ) : (
          <div className="space-y-3">
            {orders.map(order => (
              <OrderCard
                key={order.ma_don_hang}
                order={order}
                onOpenDetail={openOrderDetail}
                onAdvanceStatus={updateOrderStatus}
              />
            ))}
          </div>
        )}
      </div>

      {selectedOrderId && selectedOrderDetail && (
        <OrderDetailModal
          orderId={selectedOrderId}
          detail={selectedOrderDetail}
          onClose={() => {
            setSelectedOrderId(null);
            setSelectedOrderDetail(null);
          }}
          onAdvanceStatus={nextStatus => updateOrderStatus(selectedOrderId, nextStatus)}
        />
      )}
    </div>
  );
}
