import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { orderAPI, subscriptionAPI } from '../services/api';

const orderStatusMap = {
  cho_xac_nhan: { label: 'Chờ xác nhận', color: 'bg-amber-50 text-amber-700' },
  da_xac_nhan: { label: 'Đã xác nhận', color: 'bg-sky-50 text-sky-700' },
  dang_giao: { label: 'Đang giao', color: 'bg-violet-50 text-violet-700' },
  da_giao: { label: 'Đã giao', color: 'bg-[#e8f5ee] text-[#1a7a4a]' },
  da_huy: { label: 'Đã hủy', color: 'bg-red-50 text-red-700' },
};

const subscriptionStatusMap = {
  dang_hoat_dong: { label: 'Đang hoạt động', color: 'bg-[#e8f5ee] text-[#1a7a4a]' },
  tam_dung: { label: 'Tạm dừng', color: 'bg-amber-50 text-amber-700' },
  da_huy: { label: 'Đã hủy', color: 'bg-red-50 text-red-700' },
  hoan_tat: { label: 'Hoàn tất', color: 'bg-slate-100 text-slate-700' },
};

const orderTypeMap = {
  thuong: { label: 'Đơn thường', color: 'bg-slate-100 text-slate-700' },
  dat_truoc: { label: 'Đặt trước', color: 'bg-orange-50 text-orange-700' },
};

const frequencyMap = {
  hang_tuan: 'Hàng tuần',
  hai_tuan: '2 tuần / lần',
  hang_thang: 'Hàng tháng',
};

const formatCurrency = value => `${Number(value || 0).toLocaleString('vi-VN')}₫`;
const canCancelOrder = status => ['cho_xac_nhan', 'da_xac_nhan'].includes(status);

export function OrderList() {
  const [orders, setOrders] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelingOrderId, setCancelingOrderId] = useState(null);
  const [cancelingSubscriptionId, setCancelingSubscriptionId] = useState(null);

  const fetchData = () => {
    setLoading(true);
    Promise.allSettled([orderAPI.getAll(), subscriptionAPI.getAll()])
      .then(([ordersResult, subscriptionsResult]) => {
        setOrders(ordersResult.status === 'fulfilled' ? ordersResult.value.orders || [] : []);
        setSubscriptions(
          subscriptionsResult.status === 'fulfilled' ? subscriptionsResult.value.subscriptions || [] : []
        );
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCancelOrder = async (event, orderId) => {
    event.preventDefault();
    event.stopPropagation();
    if (!window.confirm('Bạn có chắc muốn hủy đơn hàng này không?')) return;
    setCancelingOrderId(orderId);
    try {
      await orderAPI.cancel(orderId, {});
      setOrders(prev => prev.map(order => (order.ma_don_hang === orderId ? { ...order, trang_thai: 'da_huy' } : order)));
    } finally {
      setCancelingOrderId(null);
    }
  };

  const handleCancelSubscription = async id => {
    if (!window.confirm('Bạn có chắc muốn hủy đăng ký giao định kỳ này không?')) return;
    setCancelingSubscriptionId(id);
    try {
      await subscriptionAPI.cancel(id);
      setSubscriptions(prev => prev.map(item => (item.ma_dang_ky === id ? { ...item, trang_thai: 'da_huy' } : item)));
    } finally {
      setCancelingSubscriptionId(null);
    }
  };

  return (
    <div className="market-shell pb-10">
      <div className="market-page space-y-6 py-6">
        <section className="market-panel p-6">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[#2d9e63]">Đơn hàng của tôi</p>
          <h1 className="mt-2 text-4xl font-bold text-slate-900">Theo dõi toàn bộ đơn hàng và lịch giao trong một nơi</h1>
          <p className="mt-3 text-sm leading-7 text-slate-600">
            Gồm đơn thường, đơn đặt trước và các đăng ký giao định kỳ mà bạn đang sử dụng trên hệ thống.
          </p>
        </section>

        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="h-28 animate-pulse rounded-[18px] bg-[#f3f7f4]" />
            ))}
          </div>
        ) : (
          <>
            {subscriptions.length ? (
              <section className="market-panel p-5">
                <div className="market-section-title">
                  <h2>Giao định kỳ</h2>
                </div>
                <div className="space-y-3">
                  {subscriptions.map(subscription => {
                    const status = subscriptionStatusMap[subscription.trang_thai] || subscriptionStatusMap.hoan_tat;
                    return (
                      <div key={subscription.ma_dang_ky} className="rounded-[18px] border border-[#dce7df] bg-white p-4">
                        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-semibold text-slate-900">{subscription.ten_san_pham}</p>
                              <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${status.color}`}>{status.label}</span>
                            </div>
                            <p className="mt-2 text-sm text-slate-600">
                              {subscription.so_luong} {subscription.don_vi} / kỳ · {frequencyMap[subscription.tan_suat_giao] || subscription.tan_suat_giao}
                            </p>
                            <p className="mt-1 text-sm font-semibold text-[#1a7a4a]">
                              Đã giao {Number(subscription.so_ky_da_giao || 0)} / {Number(subscription.so_ky_giao || 0)} kỳ
                            </p>
                            <p className="mt-1 text-sm text-slate-500">
                              Bắt đầu {new Date(subscription.ngay_bat_dau).toLocaleDateString('vi-VN')} · Kỳ tiếp theo {new Date(subscription.ngay_giao_tiep_theo).toLocaleDateString('vi-VN')}
                            </p>
                          </div>
                          {['dang_hoat_dong', 'tam_dung'].includes(subscription.trang_thai) ? (
                            <button
                              onClick={() => handleCancelSubscription(subscription.ma_dang_ky)}
                              disabled={cancelingSubscriptionId === subscription.ma_dang_ky}
                              className="rounded-full bg-red-50 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-100 disabled:opacity-60"
                            >
                              {cancelingSubscriptionId === subscription.ma_dang_ky ? 'Đang hủy...' : 'Hủy đăng ký'}
                            </button>
                          ) : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            ) : null}

            <section className="space-y-4">
              {orders.length ? (
                orders.map(order => {
                  const status = orderStatusMap[order.trang_thai] || orderStatusMap.da_huy;
                  const orderType = orderTypeMap[order.loai_don || 'thuong'] || orderTypeMap.thuong;
                  return (
                    <Link
                      key={order.ma_don_hang}
                      to={`/orders/${order.ma_don_hang}`}
                      className="market-panel block p-5 hover:-translate-y-1 hover:shadow-md"
                    >
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div>
                          <div className="flex flex-wrap items-center gap-2">
                            <h2 className="text-xl font-semibold text-slate-900">Đơn #{order.ma_don_hang}</h2>
                            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${orderType.color}`}>{orderType.label}</span>
                            <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${status.color}`}>{status.label}</span>
                          </div>
                          <p className="mt-2 text-sm text-slate-500">{new Date(order.ngay_tao).toLocaleString('vi-VN')}</p>
                          {order.ngay_giao_du_kien ? (
                            <p className="mt-2 text-sm font-medium text-orange-700">
                              Giao dự kiến: {new Date(order.ngay_giao_du_kien).toLocaleDateString('vi-VN')}
                            </p>
                          ) : null}
                        </div>

                        <div className="text-left lg:text-right">
                          <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-400">Tổng thanh toán</p>
                          <p className="mt-1 text-2xl font-bold text-[#1a7a4a]">{formatCurrency(order.tong_thanh_toan)}</p>
                        </div>
                      </div>

                      <div className="mt-4 flex flex-col gap-3 border-t border-[#edf2ee] pt-4 sm:flex-row sm:items-center sm:justify-between">
                        <span className="text-sm text-slate-500">Nhấn để xem chi tiết và tiến độ giao hàng.</span>
                        {canCancelOrder(order.trang_thai) ? (
                          <button
                            onClick={event => handleCancelOrder(event, order.ma_don_hang)}
                            disabled={cancelingOrderId === order.ma_don_hang}
                            className="rounded-full bg-red-50 px-4 py-2 text-sm font-semibold text-red-600 hover:bg-red-100 disabled:opacity-60"
                          >
                            {cancelingOrderId === order.ma_don_hang ? 'Đang hủy...' : 'Hủy đơn'}
                          </button>
                        ) : null}
                      </div>
                    </Link>
                  );
                })
              ) : (
                <div className="market-panel py-16 text-center text-slate-400">
                  <div className="mb-3 text-4xl">📦</div>
                  <p>Bạn chưa có đơn hàng nào.</p>
                </div>
              )}
            </section>
          </>
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
  const [paying, setPaying] = useState(false);
  const [paymentError, setPaymentError] = useState('');
  const success = searchParams.get('success');
  const vnpayResult = searchParams.get('vnpay');
  const vnpayCode = searchParams.get('code');

  useEffect(() => {
    setLoading(true);
    orderAPI.getById(id).then(setData).catch(() => setData(null)).finally(() => setLoading(false));
  }, [id]);

  const handleCancel = async () => {
    if (!data?.order || !canCancelOrder(data.order.trang_thai)) return;
    if (!window.confirm('Bạn có chắc muốn hủy đơn hàng này không?')) return;
    setCanceling(true);
    try {
      await orderAPI.cancel(id, {});
      setData(prev => ({ ...prev, order: { ...prev.order, trang_thai: 'da_huy' } }));
    } finally {
      setCanceling(false);
    }
  };

  const handleVnpayPayment = async () => {
    setPaying(true);
    setPaymentError('');
    try {
      const payment = await orderAPI.createVnpayPayment(id);
      window.location.assign(payment.payment_url);
    } catch (err) {
      setPaymentError(err.message || 'Không thể tạo phiên thanh toán VNPAY.');
      setPaying(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#2d9e63] border-t-transparent" />
      </div>
    );
  }

  if (!data) {
    return <div className="flex min-h-screen items-center justify-center text-slate-400">Không tìm thấy đơn hàng.</div>;
  }

  const { order } = data;
  const items = order.items || [];
  const status = orderStatusMap[order.trang_thai] || orderStatusMap.da_huy;
  const orderType = orderTypeMap[order.loai_don || 'thuong'] || orderTypeMap.thuong;
  const subtotal = items.reduce((sum, item) => sum + Number(item.thanh_tien || 0), 0);

  return (
    <div className="market-shell pb-10">
      <div className="market-page space-y-6 py-6">
        {success ? (
          <div className="market-panel border border-[#b8e0c6] bg-[#e8f5ee] p-5 text-center">
            <h2 className="text-lg font-semibold text-[#1a7a4a]">Tạo đơn hàng thành công</h2>
            <p className="mt-1 text-sm text-[#1a7a4a]">Đơn hàng #{order.ma_don_hang} đã được ghi nhận.</p>
          </div>
        ) : null}
        {vnpayResult === 'success' ? (
          <div className="market-panel border border-[#b8e0c6] bg-[#e8f5ee] p-5 text-center">
            <h2 className="text-lg font-semibold text-[#1a7a4a]">Thanh toán VNPAY thành công</h2>
            <p className="mt-1 text-sm text-[#1a7a4a]">Đơn hàng #{order.ma_don_hang} đã được ghi nhận đã thanh toán.</p>
          </div>
        ) : null}
        {vnpayResult === 'failed' ? (
          <div className="market-panel border border-amber-200 bg-amber-50 p-5 text-center">
            <h2 className="text-lg font-semibold text-amber-800">Thanh toán VNPAY chưa hoàn tất</h2>
            <p className="mt-1 text-sm text-amber-700">
              Đơn hàng vẫn còn. Bạn có thể thanh toán lại{vnpayCode ? ` (mã VNPAY ${vnpayCode})` : ''}.
            </p>
          </div>
        ) : null}

        <section className="market-panel p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-3xl font-bold text-slate-900">Đơn hàng #{order.ma_don_hang}</h1>
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${orderType.color}`}>{orderType.label}</span>
                <span className={`rounded-full px-2.5 py-1 text-xs font-semibold ${status.color}`}>{status.label}</span>
              </div>
              <p className="mt-2 text-sm text-slate-500">{new Date(order.ngay_tao).toLocaleString('vi-VN')}</p>
            </div>
            <div className="rounded-[18px] bg-[#f3f7f4] px-5 py-4">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Tổng thanh toán</p>
              <p className="mt-1 text-2xl font-bold text-[#1a7a4a]">{formatCurrency(order.tong_thanh_toan)}</p>
            </div>
          </div>

          <div className="mt-6 space-y-3">
            {items.map(item => (
              <div key={item.ma_chi_tiet} className="flex items-center gap-4 rounded-[18px] border border-[#dce7df] bg-white p-4">
                <img
                  src={item.hinh_san_pham || 'https://placehold.co/84x84/e8f5ee/1a7a4a?text=NS'}
                  alt={item.ten_san_pham}
                  className="h-20 w-20 rounded-[16px] object-cover"
                />
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-slate-900">{item.ten_san_pham}</p>
                  <p className="mt-1 text-sm text-slate-500">
                    {item.so_luong} {item.don_vi} × {formatCurrency(item.gia_tai_thoi_diem)}
                  </p>
                </div>
                <p className="text-lg font-bold text-slate-900">{formatCurrency(item.thanh_tien)}</p>
              </div>
            ))}
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-[18px] bg-[#f3f7f4] p-4">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Giao hàng</p>
              <p className="mt-2 text-sm leading-7 text-slate-700">{order.dia_chi_giao || 'Chưa có địa chỉ giao hàng.'}</p>
            </div>
            <div className="rounded-[18px] bg-[#f3f7f4] p-4">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-slate-500">Thanh toán & ghi chú</p>
              <p className="mt-2 text-sm text-slate-700">
                {order.phuong_thuc_tt === 'tien_mat' ? 'Tiền mặt khi nhận hàng' : 'VNPay'}
              </p>
              <p className={`mt-2 text-sm font-semibold ${order.trang_thai_tt === 'da_tt' ? 'text-[#1a7a4a]' : 'text-amber-700'}`}>
                {order.trang_thai_tt === 'da_tt' ? 'Đã thanh toán' : 'Chưa thanh toán'}
              </p>
              <p className="mt-2 text-sm leading-7 text-slate-500">{order.ghi_chu || 'Không có ghi chú thêm.'}</p>
            </div>
          </div>

          <div className="mt-6 rounded-[18px] border border-[#dce7df] p-4">
            <div className="flex justify-between text-sm text-slate-500">
              <span>Tạm tính</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            {Number(order.giam_gia || 0) > 0 ? (
              <div className="mt-2 flex justify-between text-sm text-[#1a7a4a]">
                <span>Khuyến mãi</span>
                <span>-{formatCurrency(order.giam_gia)}</span>
              </div>
            ) : null}
            {order.ghi_chu_khuyen_mai ? (
              <p className="mt-2 rounded-lg bg-[#eef8f3] p-3 text-xs leading-5 text-[#1a7a4a]">{order.ghi_chu_khuyen_mai}</p>
            ) : null}
            <div className="mt-2 flex justify-between text-sm text-slate-500">
              <span>Phí vận chuyển</span>
              <span>{formatCurrency(order.phi_van_chuyen)}</span>
            </div>
            <div className="mt-3 flex justify-between border-t border-[#dce7df] pt-3 text-base font-bold text-slate-900">
              <span>Tổng cộng</span>
              <span>{formatCurrency(order.tong_thanh_toan)}</span>
            </div>
          </div>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <Link to="/orders" className="flex-1 rounded-full border border-[#dce7df] py-3 text-center text-sm font-semibold text-slate-700 hover:bg-[#f3f7f4]">
              ← Về danh sách đơn
            </Link>
            {canCancelOrder(order.trang_thai) ? (
              <button
                onClick={handleCancel}
                disabled={canceling}
                className="flex-1 rounded-full bg-red-50 py-3 text-sm font-semibold text-red-600 hover:bg-red-100 disabled:opacity-60"
              >
                {canceling ? 'Đang hủy...' : 'Hủy đơn hàng'}
              </button>
            ) : (
              <Link to="/products" className="flex-1 rounded-full bg-[#1a7a4a] py-3 text-center text-sm font-semibold text-white hover:bg-[#14633b]">
                Mua thêm sản phẩm
              </Link>
            )}
          </div>
          {order.phuong_thuc_tt === 'vnpay' && order.trang_thai_tt !== 'da_tt' && order.trang_thai !== 'da_huy' ? (
            <div className="mt-3">
              <button
                onClick={handleVnpayPayment}
                disabled={paying}
                className="w-full rounded-full bg-sky-600 py-3 text-sm font-semibold text-white hover:bg-sky-700 disabled:opacity-60"
              >
                {paying ? 'Đang chuyển sang VNPAY...' : 'Thanh toán VNPAY'}
              </button>
              {paymentError ? <p className="mt-2 text-sm text-red-600">{paymentError}</p> : null}
            </div>
          ) : null}
        </section>
      </div>
    </div>
  );
}
