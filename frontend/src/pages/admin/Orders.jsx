import { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { Badge, Btn, Loading, Modal, Pagination, SearchBar, Table } from '../../components/ui/AdminUI';

const STATUS = {
  cho_xac_nhan: { label: 'Chờ xác nhận', color: 'yellow' },
  da_xac_nhan: { label: 'Đã xác nhận', color: 'blue' },
  dang_giao: { label: 'Đang giao', color: 'purple' },
  da_giao: { label: 'Đã giao', color: 'green' },
  da_huy: { label: 'Đã hủy', color: 'red' },
};

const NEXT_STATUS = {
  cho_xac_nhan: 'da_xac_nhan',
  da_xac_nhan: 'dang_giao',
  dang_giao: 'da_giao',
};

const formatCurrency = value => `${Number(value || 0).toLocaleString('vi-VN')}₫`;

function OrderDetailModal({ detail, orderId, onClose, onAdvanceStatus }) {
  const nextStatus = NEXT_STATUS[detail.order.trang_thai];

  return (
    <Modal title={`Chi tiết đơn hàng #${orderId}`} onClose={onClose} size="lg">
      <div className="space-y-4">
        <div className="grid gap-3 md:grid-cols-2 text-sm">
          {[
            ['Người mua', detail.order.ten_nguoi_mua || detail.order.ho_ten || 'Chưa cập nhật'],
            ['Số điện thoại', detail.order.so_dien_thoai || 'Chưa cập nhật'],
            ['Địa chỉ giao', detail.order.dia_chi_giao || 'Chưa cập nhật'],
            ['Thanh toán', detail.order.phuong_thuc_tt === 'tien_mat' ? 'Tiền mặt' : 'VNPay'],
            ['Ngày đặt', new Date(detail.order.ngay_tao).toLocaleString('vi-VN')],
            ['Trạng thái', STATUS[detail.order.trang_thai]?.label || detail.order.trang_thai],
          ].map(([label, value]) => (
            <div key={label} className="rounded-xl bg-gray-50 p-3">
              <p className="text-xs text-gray-400">{label}</p>
              <p className="mt-1 text-sm font-medium text-gray-800">{value}</p>
            </div>
          ))}
        </div>

        {detail.order.ghi_chu && (
          <div className="rounded-xl bg-yellow-50 p-3 text-sm text-gray-700">
            <p className="text-xs text-gray-400">Ghi chú</p>
            <p className="mt-1">{detail.order.ghi_chu}</p>
          </div>
        )}

        <div>
          <p className="mb-3 text-sm font-semibold text-gray-700">Danh sách sản phẩm</p>
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
        </div>

        <div className="flex items-center justify-between rounded-xl bg-green-50 p-4 text-base font-bold">
          <span>Tổng thanh toán</span>
          <span className="text-green-700">{formatCurrency(detail.order.tong_thanh_toan)}</span>
        </div>

        <div className="flex gap-3">
          {nextStatus && (
            <Btn variant="primary" className="flex-1 justify-center" onClick={() => onAdvanceStatus(orderId, detail.order.trang_thai)}>
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

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState(null);
  const [detail, setDetail] = useState(null);
  const limit = 15;

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: String(limit), page: String(page) });
      if (search) params.set('q', search);
      if (status) params.set('trang_thai', status);

      const data = await api.get(`/admin/orders?${params.toString()}`);
      setOrders(data.orders || []);
      setTotal(data.total || 0);
    } catch {
      setOrders([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [search, status, page]);

  const openDetail = async orderId => {
    try {
      const response = await api.get(`/orders/${orderId}`);
      setSelectedId(orderId);
      setDetail(response);
    } catch {}
  };

  const handleAdvanceStatus = async (orderId, currentStatus) => {
    const nextStatus = NEXT_STATUS[currentStatus];
    if (!nextStatus) return;

    await api.patch(`/orders/${orderId}/status`, { trang_thai: nextStatus });
    setOrders(prev => prev.map(order => (order.ma_don_hang === orderId ? { ...order, trang_thai: nextStatus } : order)));

    if (selectedId === orderId && detail) {
      setDetail(prev => ({ ...prev, order: { ...prev.order, trang_thai: nextStatus } }));
    }
  };

  const handleCancel = async orderId => {
    if (!window.confirm('Bạn có chắc muốn hủy đơn hàng này không?')) return;
    await api.patch(`/orders/${orderId}/status`, { trang_thai: 'da_huy' });
    setOrders(prev => prev.map(order => (order.ma_don_hang === orderId ? { ...order, trang_thai: 'da_huy' } : order)));
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3">
        <SearchBar value={search} onChange={value => { setSearch(value); setPage(1); }} placeholder="Tìm mã đơn hoặc địa chỉ..." />
        <select
          value={status}
          onChange={event => { setStatus(event.target.value); setPage(1); }}
          className="rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm focus:border-green-500 focus:outline-none"
        >
          <option value="">Tất cả trạng thái</option>
          {Object.entries(STATUS).map(([value, meta]) => (
            <option key={value} value={value}>
              {meta.label}
            </option>
          ))}
        </select>
        <span className="ml-auto text-sm text-gray-500">
          Tổng đơn: <b>{total}</b>
        </span>
      </div>

      {loading ? (
        <Loading />
      ) : (
        <Table
          headers={['Mã đơn', 'Người mua', 'Số điện thoại', 'Thanh toán', 'Tổng tiền', 'Trạng thái', 'Ngày tạo', 'Thao tác']}
          empty={{ icon: '🛒', text: 'Không tìm thấy đơn hàng nào' }}
        >
          {orders.map(order => {
            const statusMeta = STATUS[order.trang_thai] || { label: order.trang_thai, color: 'gray' };
            const nextStatus = NEXT_STATUS[order.trang_thai];

            return (
              <tr key={order.ma_don_hang} className="transition-colors hover:bg-gray-50">
                <td className="px-4 py-3 font-mono text-xs text-gray-500">#{order.ma_don_hang}</td>
                <td className="px-4 py-3 text-sm font-medium text-gray-800">{order.ten_nguoi_mua || order.ho_ten || 'Khách hàng'}</td>
                <td className="px-4 py-3 text-sm text-gray-500">{order.so_dien_thoai || 'Chưa cập nhật'}</td>
                <td className="px-4 py-3">
                  <Badge text={order.phuong_thuc_tt === 'tien_mat' ? 'COD' : 'VNPay'} color={order.phuong_thuc_tt === 'tien_mat' ? 'orange' : 'blue'} />
                </td>
                <td className="px-4 py-3 text-sm font-semibold text-green-700">{formatCurrency(order.tong_thanh_toan)}</td>
                <td className="px-4 py-3">
                  <Badge text={statusMeta.label} color={statusMeta.color} />
                </td>
                <td className="px-4 py-3 text-xs text-gray-400">{new Date(order.ngay_tao).toLocaleDateString('vi-VN')}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    <Btn size="sm" variant="outline" onClick={() => openDetail(order.ma_don_hang)}>
                      Chi tiết
                    </Btn>
                    {nextStatus && (
                      <Btn size="sm" variant="primary" onClick={() => handleAdvanceStatus(order.ma_don_hang, order.trang_thai)}>
                        {nextStatus === 'da_xac_nhan' ? 'Xác nhận' : nextStatus === 'dang_giao' ? 'Giao hàng' : 'Đã giao'}
                      </Btn>
                    )}
                    {['cho_xac_nhan', 'da_xac_nhan'].includes(order.trang_thai) && (
                      <Btn size="sm" variant="danger" onClick={() => handleCancel(order.ma_don_hang)}>
                        Hủy
                      </Btn>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </Table>
      )}

      <Pagination page={page} total={total} limit={limit} onChange={setPage} />

      {selectedId && detail && (
        <OrderDetailModal
          orderId={selectedId}
          detail={detail}
          onClose={() => {
            setSelectedId(null);
            setDetail(null);
          }}
          onAdvanceStatus={handleAdvanceStatus}
        />
      )}
    </div>
  );
}
