import { useEffect, useState } from 'react';
import { api, orderAPI, subscriptionAPI } from '../../services/api';
import { Badge, Btn, Loading, Modal, PageHero, Pagination, SearchBar, Table } from '../../components/ui/AdminUI';
import { pickProductImage } from '../../utils/marketImages';

const statusMap = {
  cho_xac_nhan: { label: 'Chờ xác nhận', color: 'yellow' },
  da_xac_nhan: { label: 'Đã xác nhận', color: 'blue' },
  dang_giao: { label: 'Đang giao', color: 'purple' },
  da_giao: { label: 'Đã giao', color: 'green' },
  da_huy: { label: 'Đã hủy', color: 'red' },
};

const nextStatusMap = { cho_xac_nhan: 'da_xac_nhan', da_xac_nhan: 'dang_giao', dang_giao: 'da_giao' };

const orderTypeMap = {
  thuong: { label: 'Đơn thường', color: 'gray' },
  dat_truoc: { label: 'Đặt trước', color: 'orange' },
};

const subscriptionStatusMap = {
  dang_hoat_dong: { label: 'Đang hoạt động', color: 'green' },
  tam_dung: { label: 'Tạm dừng', color: 'yellow' },
  da_huy: { label: 'Đã hủy', color: 'red' },
  hoan_tat: { label: 'Hoàn tất', color: 'gray' },
};

const frequencyMap = { hang_tuan: 'Hàng tuần', hai_tuan: '2 tuần / lần', hang_thang: 'Hàng tháng' };

const formatCurrency = value => `${Number(value || 0).toLocaleString('vi-VN')}đ`;

const paymentMethodLabel = method => {
  if (method === 'tien_mat') return { label: 'Tiền mặt (COD)', color: 'orange' };
  if (method === 'banking') return { label: 'Chuyển khoản', color: 'blue' };
  return { label: method || 'Chưa xác định', color: 'gray' };
};

function OrderDetailModal({ detail, orderId, onClose, onAdvanceStatus, onCancel, onConfirmBankingPayment }) {
  const nextStatus = nextStatusMap[detail.order.trang_thai];
  const canCancel = ['cho_xac_nhan', 'da_xac_nhan'].includes(detail.order.trang_thai);
  const orderType = orderTypeMap[detail.order.loai_don || 'thuong'] || orderTypeMap.thuong;
  const payMethod = paymentMethodLabel(detail.order.phuong_thuc_tt);
  const isBanking = detail.order.phuong_thuc_tt === 'banking';
  const isUnpaidBanking = isBanking && detail.order.trang_thai_tt !== 'da_tt';
  return (
    <Modal title={`Chi tiết đơn hàng #${orderId}`} onClose={onClose} size="lg">
      <div className="space-y-4">
        <div className="grid gap-3 md:grid-cols-2">
          {[
            ['Người mua', detail.order.ten_nguoi_nhan || detail.order.ho_ten || 'Chưa cập nhật'],
            ['Số điện thoại', detail.order.sdt_nguoi_nhan || 'Chưa cập nhật'],
            ['Địa chỉ giao', detail.order.dia_chi_giao || 'Chưa cập nhật'],
            ['Thanh toán', <Badge key="pay" text={payMethod.label} color={payMethod.color} />],
            ['Ngày đặt', new Date(detail.order.ngay_tao).toLocaleString('vi-VN')],
            ['Ngày giao dự kiến', detail.order.ngay_giao_du_kien ? new Date(detail.order.ngay_giao_du_kien).toLocaleDateString('vi-VN') : 'Chưa cập nhật'],
            ...(detail.order.ngay_giao_thuc_te ? [['Ngày giao thực tế', new Date(detail.order.ngay_giao_thuc_te).toLocaleString('vi-VN')]] : []),
            ['Loại đơn', orderType.label],
            ['Ghi chú', detail.order.ghi_chu || 'Không có ghi chú'],
          ].map(([label, value]) => (
            <div key={label} className="rounded-2xl bg-surface-container-low p-4">
              <p className="text-label-sm text-on-surface-variant">{label}</p>
              <p className="mt-1 text-body-md font-medium text-on-surface">{value}</p>
            </div>
          ))}
        </div>

        <div className="space-y-3">
          {(detail.order.items || []).map(item => (
            <div key={item.ma_chi_tiet} className="flex items-center gap-4 rounded-2xl bg-surface-container-low p-4">
              <img src={item.hinh_san_pham ? (item.hinh_san_pham.startsWith('/upload/') ? `http://localhost:5000${item.hinh_san_pham}` : `http://localhost:5000/upload/${item.hinh_san_pham}`) : 'https://placehold.co/60x60/b1f0ce/0f5238?text=NS'} alt={item.ten_san_pham} className="h-14 w-14 rounded-xl object-cover" />
              <div className="flex-1">
                <p className="text-title-md font-title-md text-on-surface">{item.ten_san_pham}</p>
                <p className="text-label-sm text-on-surface-variant">{item.so_luong} x {formatCurrency(item.don_gia)}</p>
              </div>
              <p className="text-title-md font-title-md text-primary">{formatCurrency(item.thanh_tien)}</p>
            </div>
          ))}
        </div>

        <div className="rounded-2xl bg-primary-fixed px-4 py-3 text-body-md text-on-primary-fixed-variant">
          {Number(detail.order.giam_gia || 0) > 0 && (
            <div className="mb-2 flex items-center justify-between"><span>Khuyến mãi</span><span>-{formatCurrency(detail.order.giam_gia)}</span></div>
          )}
          {detail.order.ghi_chu_khuyen_mai && <p className="mb-2 text-label-sm">{detail.order.ghi_chu_khuyen_mai}</p>}
          <div className="flex items-center justify-between font-bold"><span>Tổng thanh toán</span><span>{formatCurrency(detail.order.tong_thanh_toan)}</span></div>
        </div>

        {isUnpaidBanking && (
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4">
            <p className="mb-3 text-title-md font-title-md text-amber-800">Chờ chuyển khoản</p>
            <div className="space-y-1 text-body-md text-amber-700">
              <p>Ngân hàng: <b>{detail.order.banking_info?.bank_name || 'Techcombank'}</b></p>
              <p>Số tài khoản: <b>{detail.order.banking_info?.account_number || '4718072003'}</b></p>
              <p>Chủ tài khoản: <b>{detail.order.banking_info?.account_holder || 'Vo Ngoc Tan Tai'}</b></p>
              <p>Số tiền: <b>{formatCurrency(detail.order.tong_thanh_toan)}</b></p>
              <p>Nội dung CK: <b>{detail.order.banking_info?.noi_dung_chuyen_khoan || 'TT' + orderId}</b></p>
            </div>
            {detail.order.hinh_anh_chuyen_khoan && (
              <div className="mt-3">
                <p className="mb-2 text-label-sm text-amber-700">Biên lai khách tải lên:</p>
                <img src={detail.order.hinh_anh_chuyen_khoan} alt="Banking proof" className="max-h-48 rounded-xl object-contain border border-amber-300" />
              </div>
            )}
            <Btn className="mt-3" onClick={() => onConfirmBankingPayment(orderId)}>Xác nhận đã nhận tiền</Btn>
          </div>
        )}
        {isBanking && detail.order.trang_thai_tt === 'da_tt' && (
          <div className="rounded-2xl border border-green-200 bg-green-50 p-4">
            <p className="text-title-md font-title-md text-green-800">Đã thanh toán chuyển khoản</p>
          </div>
        )}
        <div className="rounded-2xl border border-outline-variant bg-surface p-4">
          <p className="mb-3 text-title-md font-title-md text-on-surface">Trạng thái đơn hàng</p>
          <Badge text={statusMap[detail.order.trang_thai].label} color={statusMap[detail.order.trang_thai].color} />
          <div className="mt-2">
            <Badge text={detail.order.trang_thai_tt === 'da_tt' ? 'Đã thanh toán' : 'Chưa thanh toán'} color={detail.order.trang_thai_tt === 'da_tt' ? 'green' : 'yellow'} />
          </div>
          {detail.order.loai_don === 'dat_truoc' && (
            <div className="mt-3 rounded-xl bg-secondary-fixed border border-secondary-fixed-dim p-3">
              <p className="text-body-md text-on-secondary-fixed-variant">Đây là đơn <b>đặt trước</b>. Hệ thống sẽ giao hàng vào khoảng <b>{detail.order.ngay_giao_du_kien ? new Date(detail.order.ngay_giao_du_kien).toLocaleDateString('vi-VN') : 'chưa xác định'}</b>.</p>
            </div>
          )}
          <div className="mt-4 flex flex-wrap gap-3">
            {nextStatus && <Btn onClick={() => onAdvanceStatus(orderId, detail.order.trang_thai)}>{detail.order.trang_thai === 'cho_xac_nhan' && 'Xác nhận đơn'}{detail.order.trang_thai === 'da_xac_nhan' && 'Bắt đầu giao'}{detail.order.trang_thai === 'dang_giao' && 'Xác nhận đã giao'}</Btn>}
            {canCancel && <Btn variant="danger" onClick={() => onCancel(orderId)}>Hủy đơn</Btn>}
            <Btn variant="outline" onClick={onClose}>Đóng</Btn>
          </div>
        </div>
      </div>
    </Modal>
  );
}

export default function AdminOrders() {
  const [orders, setOrders] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [tab, setTab] = useState('thuong');
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [deliveringSubscriptionId, setDeliveringSubscriptionId] = useState(null);
  const limit = 15;

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ limit: String(limit), page: String(page) });
      if (search) params.set('q', search);
      if (status) params.set('trang_thai', status);
      if (tab === 'subscription') {
        const data = await subscriptionAPI.adminAll();
        setSubscriptions(data.subscriptions || []);
        setOrders([]);
        setTotal(data.subscriptions?.length || 0);
      } else {
        params.set('loai_don', tab);
        const data = await api.get(`/admin/orders?${params.toString()}`);
        setOrders(data.orders || []);
        setTotal(data.total || 0);
      }
    } catch { setOrders([]); setSubscriptions([]); setTotal(0); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchOrders(); }, [page, search, status, tab]);

  const openDetail = async id => {
    const response = await orderAPI.adminGetById(id);
    setSelectedId(id);
    setDetail(response);
  };

  const handleAdvanceStatus = async (id, currentStatus) => {
    const nextStatus = nextStatusMap[currentStatus];
    if (!nextStatus) return;
    await orderAPI.adminUpdateStatus(id, { trang_thai: nextStatus });
    setOrders(prev => prev.map(order => order.ma_don_hang === id ? { ...order, trang_thai: nextStatus } : order));
    if (selectedId === id && detail) {
      setDetail(prev => ({ ...prev, order: { ...prev.order, trang_thai: nextStatus, ...(nextStatus === 'da_giao' ? { ngay_giao_thuc_te: new Date().toISOString() } : {}) } }));
    }
  };

  const handleCancel = async id => {
    if (!window.confirm('Bạn có chắc muốn hủy đơn hàng này không?')) return;
    await orderAPI.adminUpdateStatus(id, { trang_thai: 'da_huy' });
    setOrders(prev => prev.map(order => order.ma_don_hang === id ? { ...order, trang_thai: 'da_huy' } : order));
  };

  const handleConfirmBankingPayment = async id => {
    if (!window.confirm('Xác nhận đã nhận được tiền chuyển khoản cho đơn hàng này?')) return;
    await api.patch('/orders/admin/' + id + '/confirm-banking');
    setOrders(prev => prev.map(order => order.ma_don_hang === id ? { ...order, trang_thai_thanh_toan: 'da_thanh_toan', trang_thai_tt: 'da_tt' } : order));
    if (selectedId === id && detail) {
      setDetail(prev => ({ ...prev, order: { ...prev.order, trang_thai_thanh_toan: 'da_thanh_toan', trang_thai_tt: 'da_tt' } }));
    }
  };

  const handleDeliverSubscription = async id => {
    if (!window.confirm('Ghi nhận đã giao một kỳ cho đăng ký này?')) return;
    setDeliveringSubscriptionId(id);
    try {
      const response = await subscriptionAPI.adminDeliver(id);
      setSubscriptions(prev => prev.map(sub => sub.ma_dang_ky === id ? { ...sub, so_ky_da_giao: response.subscription.so_ky_da_giao, ngay_giao_tiep_theo: response.subscription.ngay_giao_tiep_theo, trang_thai: response.subscription.trang_thai } : sub));
    } finally { setDeliveringSubscriptionId(null); }
  };

  return (
    <div className="space-y-6">
      <PageHero eyebrow="Đơn hàng" title="Theo dõi đơn hàng và các đăng ký giao định kỳ" body="Admin có thể xem toàn bộ đơn hàng, chuyển trạng thái xử lý và ghi nhận số kỳ đã giao cho từng đăng ký định kỳ." />

      <div className="bg-surface rounded-3xl p-lg border border-outline-variant organic-shadow">
        <div className="flex gap-3 flex-wrap">
          {['thuong', 'dat_truoc', 'subscription'].map(t => (
            <button key={t} className={`rounded-xl px-5 py-2 text-body-md font-semibold transition-all ${tab === t ? 'bg-primary text-on-primary' : 'bg-surface-container-high text-on-surface-variant hover:bg-surface-container-highest'}`}
              onClick={() => { setTab(t); setPage(1); }}>
              <span className="material-symbols-outlined text-sm mr-1">{t === 'thuong' ? 'inventory' : t === 'dat_truoc' ? 'schedule' : 'repeat'}</span>
              {t === 'thuong' ? 'Đơn thường' : t === 'dat_truoc' ? 'Đặt trước' : 'Định kỳ'}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-surface rounded-3xl p-lg border border-outline-variant organic-shadow">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <SearchBar value={search} onChange={v => { setSearch(v); setPage(1); }} placeholder="Tìm mã đơn hoặc địa chỉ..." />
          <select value={status} onChange={e => { setStatus(e.target.value); setPage(1); }} className="rounded-2xl border border-outline-variant bg-surface px-4 py-3 text-body-md focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary-fixed">
            <option value="">Tất cả trạng thái</option>
            {Object.entries(statusMap).map(([value, meta]) => <option key={value} value={value}>{meta.label}</option>)}
          </select>
          <div className="ml-auto text-body-md text-on-surface-variant">{tab === 'subscription' ? 'Tổng đăng ký: ' : 'Tổng đơn hàng: '}<span className="font-bold text-on-surface">{total}</span></div>
        </div>
      </div>

      {loading ? <Loading /> : (
        <>
          {tab === 'subscription' ? (
            <div className="bg-surface rounded-3xl p-lg border border-outline-variant organic-shadow">
              <h2 className="text-title-md font-title-md text-on-surface mb-lg">Đăng ký giao định kỳ</h2>
              {(subscriptions || []).length ? (
                <div className="space-y-3">
                  {subscriptions.map(subscription => {
                    const subStatus = subscriptionStatusMap[subscription.trang_thai] || subscriptionStatusMap.hoan_tat;
                    return (
                      <div key={subscription.ma_dang_ky} className="rounded-2xl border border-outline-variant bg-surface p-4">
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="text-title-md font-title-md text-on-surface">{subscription.ten_san_pham}</p>
                              <Badge text={subStatus.label} color={subStatus.color} />
                            </div>
                            <p className="mt-2 text-body-md text-on-surface-variant">{subscription.ten_nguoi_mua} · {subscription.so_luong} {subscription.don_vi} / kỳ · {frequencyMap[subscription.tan_suat_giao] || subscription.tan_suat_giao}</p>
                            <p className="mt-1 text-body-md font-bold text-primary">{formatCurrency(subscription.gia_tam_tinh * subscription.so_luong)} / kỳ{subscription.so_luong >= 10 && <span className="ml-2 text-label-sm font-normal text-on-surface-variant line-through">{formatCurrency(subscription.product?.price * subscription.so_luong)}</span>}</p>
                            <p className="mt-1 text-body-md font-bold text-primary">Đã giao {Number(subscription.so_ky_da_giao || 0)} / {Number(subscription.so_ky_giao || 0)} kỳ</p>
                            <p className="mt-1 text-body-md text-on-surface-variant">Kỳ tiếp theo: {new Date(subscription.ngay_giao_tiep_theo).toLocaleDateString('vi-VN')}</p>
                          </div>
                          <div className="flex flex-col items-start gap-3 lg:items-end">
                            {['dang_hoat_dong', 'tam_dung'].includes(subscription.trang_thai) && (
                              <Btn size="sm" onClick={() => handleDeliverSubscription(subscription.ma_dang_ky)} disabled={deliveringSubscriptionId === subscription.ma_dang_ky}>
                                {deliveringSubscriptionId === subscription.ma_dang_ky ? 'Đang ghi nhận...' : 'Ghi nhận đã giao'}
                              </Btn>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : <p className="py-8 text-center text-body-md text-on-surface-variant">Chưa có đăng ký giao định kỳ nào.</p>}
            </div>
          ) : (
            <Table headers={['Mã đơn', 'Loại đơn', 'Người mua', 'Điện thoại', 'Thanh toán', 'Tổng tiền', 'Trạng thái', 'Ngày tạo', 'Thao tác']}
              empty={{ icon: 'receipt_long', text: 'Không có đơn hàng phù hợp.' }}>
              {orders.map(order => {
                const orderStatus = statusMap[order.trang_thai] || { label: order.trang_thai, color: 'gray' };
                const orderType = orderTypeMap[order.loai_don || 'thuong'] || orderTypeMap.thuong;
                return (
                  <tr key={order.ma_don_hang} className="hover:bg-surface-container-low">
                    <td className="px-4 py-3 text-body-md font-bold text-on-surface">#{order.ma_don_hang}</td>
                    <td className="px-4 py-3"><Badge text={orderType.label} color={orderType.color} /></td>
                    <td className="px-4 py-3 text-body-md text-on-surface">{order.ten_nguoi_nhan || order.ho_ten || 'Khách hàng'}</td>
                    <td className="px-4 py-3 text-body-md text-on-surface-variant">{order.sdt_nguoi_nhan || 'Chưa cập nhật'}</td>
                    <td className="px-4 py-3">{(() => { const pm = paymentMethodLabel(order.phuong_thuc_tt); return <Badge text={pm.label} color={pm.color} />; })()}</td>
                    <td className="px-4 py-3 text-body-md font-bold text-primary">{formatCurrency(order.tong_thanh_toan)}</td>
                    <td className="px-4 py-3"><Badge text={orderStatus.label} color={orderStatus.color} /></td>
                    <td className="px-4 py-3 text-body-md text-on-surface-variant">{new Date(order.ngay_tao).toLocaleDateString('vi-VN')}</td>
                    <td className="px-4 py-3"><Btn size="sm" variant="outline" onClick={() => openDetail(order.ma_don_hang)}>Xem</Btn></td>
                  </tr>
                );
              })}
            </Table>
          )}
        </>
      )}
      <Pagination page={page} total={total} limit={limit} onChange={setPage} />
      {selectedId && detail && <OrderDetailModal detail={detail} orderId={selectedId} onClose={() => { setSelectedId(null); setDetail(null); }} onAdvanceStatus={handleAdvanceStatus} onCancel={handleCancel} onConfirmBankingPayment={handleConfirmBankingPayment} />}
    </div>
  );
}
