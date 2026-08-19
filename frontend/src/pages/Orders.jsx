import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { orderAPI, subscriptionAPI } from "../services/api";

const orderStatusMap = {
  cho_xac_nhan: { label: "Chờ xác nhận", color: "bg-amber-50 text-amber-700 border border-amber-200" },
  da_xac_nhan: { label: "Đã xác nhận", color: "bg-blue-50 text-blue-700 border border-blue-200" },
  dang_giao: { label: "Đang giao", color: "bg-purple-50 text-purple-700 border border-purple-200" },
  da_giao: { label: "Đã giao", color: "bg-[#e8f5ee] text-[#16A34A] border border-[#b8e0c6]" },
  da_huy: { label: "Đã hủy", color: "bg-rose-50 text-rose-700 border border-rose-200" },
};

const subscriptionStatusMap = {
  dang_hoat_dong: { label: "Đang hoạt động", color: "bg-[#e8f5ee] text-[#16A34A] border border-[#b8e0c6]" },
  tam_dung: { label: "Tạm dừng", color: "bg-amber-50 text-amber-700 border border-amber-200" },
  da_huy: { label: "Đã hủy", color: "bg-rose-50 text-rose-700 border border-rose-200" },
  hoan_tat: { label: "Hoàn tất", color: "bg-slate-100 text-slate-700 border border-slate-200" },
};

const orderTypeMap = {
  thuong: { label: "Đơn thường", color: "bg-slate-100 text-slate-700" },
  dat_truoc: { label: "Đặt trước", color: "bg-orange-50 text-orange-700 border border-orange-200" },
  dinh_ky: { label: "Giao định kỳ", color: "bg-emerald-50 text-emerald-700 border border-emerald-200" },
};

const frequencyMap = {
  hang_tuan: "Hàng tuần",
  hai_tuan: "2 tuần / lần",
  hang_thang: "Hàng tháng",
};

const paymentLabelMap = {
  tien_mat: "💵 Tiền mặt khi nhận hàng (COD)",
  banking: "🏦 Chuyển khoản ngân hàng",
  vnpay: "💳 VNPay",
};

const formatCurrency = (value) => `${Number(value || 0).toLocaleString("vi-VN")}₫`;
const canCancelOrder = (status) => ["cho_xac_nhan", "da_xac_nhan"].includes(status);
const hasDeposit = (order) => (order?.tien_coc || 0) > 0;

const tinhTongTienMoiKy = (subscription) => {
  const tienSanPham = Number(subscription.gia_tam_tinh || 0) * Number(subscription.so_luong || 0);
  const phiVanChuyen = tienSanPham >= 500000 ? 0 : 30000;
  return tienSanPham + phiVanChuyen;
};

// --- COMPONENT ORDERLIST ---
export function OrderList() {
  const [activeTab, setActiveTab] = useState("orders");
  const [orders, setOrders] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelingOrderId, setCancelingOrderId] = useState(null);
  const [cancelingSubscriptionId, setCancelingSubscriptionId] = useState(null);
  const [cancelModal, setCancelModal] = useState({ isOpen: false, id: null, tienCoc: 0, tongTien: 0, loaiDon: null, type: null });

  const fetchData = () => {
  setLoading(true);
  Promise.allSettled([orderAPI.getAll(), subscriptionAPI.getAll()])
    .then(([ordersResult, subscriptionsResult]) => {
      const allOrders = ordersResult.status === "fulfilled" ? ordersResult.value.orders || [] : [];
      const regularOrders = allOrders.filter((o) => o.loai_don !== "dinh_ky");
      setOrders(regularOrders);
      setSubscriptions(subscriptionsResult.status === "fulfilled" ? subscriptionsResult.value.subscriptions || [] : []);

      if (regularOrders.length === 0 && (subscriptionsResult.value?.subscriptions || []).length > 0) {
        setActiveTab("subscriptions");
      }
    })
    .finally(() => setLoading(false));
};

  useEffect(() => {
    fetchData();
  }, []);

  const handleCancelOrder = (event, order) => {
    event.preventDefault();
    event.stopPropagation();
    setCancelModal({
      isOpen: true,
      id: order.ma_don_hang,
      tienCoc: Number(order.tien_coc || 0),
      tongTien: Number(order.tong_thanh_toan || 0),
      loaiDon: order.loai_don,
      type: 'order'
    });
  };

  const handleCancelSubscription = (event, id, tienCoc = 0, tongTien = 0) => {
    event.preventDefault();
    event.stopPropagation();
    setCancelModal({ isOpen: true, id, tienCoc, tongTien, type: 'subscription' });
  };

  const executeCancel = async () => {
    const { id, type } = cancelModal;
    if (type === 'subscription') {
      setCancelingSubscriptionId(id);
      try {
        await subscriptionAPI.cancel(id);
        setSubscriptions((prev) =>
          prev.map((item) => (item.ma_dang_ky === id ? { ...item, trang_thai: "da_huy" } : item))
        );
      } finally {
        setCancelingSubscriptionId(null);
        setCancelModal({ isOpen: false, id: null, tienCoc: 0, tongTien: 0, loaiDon: null, type: null });
      }
    } else if (type === 'order') {
      setCancelingOrderId(id);
      try {
        await orderAPI.cancel(id, {});
        setOrders((prev) =>
          prev.map((order) => (order.ma_don_hang === id ? { ...order, trang_thai: "da_huy" } : order))
        );
      } finally {
        setCancelingOrderId(null);
        setCancelModal({ isOpen: false, id: null, tienCoc: 0, tongTien: 0, loaiDon: null, type: null });
      }
    }
  };

  return (
    <div className="bg-background min-h-screen pb-16">
      <div className="max-w-7xl mx-auto px-4 pt-8 space-y-6">

        <div className="bg-white rounded-2xl border border-border p-6 shadow-sm">
          <span className="text-sm font-semibold uppercase tracking-wider text-primary">
            Trang cá nhân
          </span>
          <h1 className="mt-1 text-3xl font-semibold text-text-primary">
            Quản lý lịch trình mua sắm
          </h1>
        </div>

        <div className="flex border-b border-border bg-white rounded-xl p-1.5 shadow-sm">
          <button
            onClick={() => setActiveTab("orders")}
            className={`flex-1 py-4 text-base font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2 ${activeTab === "orders"
              ? "bg-primary text-white shadow-sm"
              : "text-text-secondary hover:bg-background"
              }`}
          >
            <span>📦</span> Đơn hàng của bạn ({orders.length})
          </button>
          <button
            onClick={() => setActiveTab("subscriptions")}
            className={`flex-1 py-4 text-base font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2 ${activeTab === "subscriptions"
              ? "bg-primary text-white shadow-sm"
              : "text-text-secondary hover:bg-background"
              }`}
          >
            <span>🔄</span> Đăng ký giao định kỳ ({subscriptions.length})
          </button>
        </div>

        {loading ? (
          <div className="space-y-4">
            {Array.from({ length: 2 }).map((_, index) => (
              <div key={index} className="h-32 animate-pulse rounded-2xl bg-slate-200/60" />
            ))}
          </div>
        ) : (
          <>
            {activeTab === "orders" && (
              <div className="space-y-4">
                {orders.length ? (
                  orders.map((order) => {
                    const status = orderStatusMap[order.trang_thai] || orderStatusMap.da_huy;
                    const orderType = orderTypeMap[order.loai_don || "thuong"] || orderTypeMap.thuong;
                    return (
                      <Link
                        key={order.ma_don_hang}
                        to={`/orders/${order.ma_don_hang}`}
                        className="block bg-white rounded-2xl border border-border p-5 shadow-sm hover:border-primary/30 hover:shadow-md transition duration-200"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-border">
                          <div className="flex items-center gap-2.5">
                            <span className="text-lg font-semibold text-text-primary">Đơn #{order.ma_don_hang}</span>
                            <span className={`rounded-full px-2 py-0.5 text-sm font-medium ${orderType.color}`}>{orderType.label}</span>
                            <span className={`rounded-full px-2 py-0.5 text-sm font-medium ${status.color}`}>{status.label}</span>
                          </div>
                          <span className="text-sm font-normal text-text-secondary">{new Date(order.ngay_tao).toLocaleString("vi-VN")}</span>
                        </div>

                        <div className="mt-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="space-y-1.5">
                            {order.loai_don === "dat_truoc" ? (
                              <p className="text-base font-medium text-amber-700 flex items-center gap-1.5">
                                ⏳ Hàng đặt trước · Dự kiến giao: {order.ngay_giao_du_kien ? new Date(order.ngay_giao_du_kien).toLocaleDateString("vi-VN") : "Chưa rõ"}
                              </p>
                            ) : order.ngay_giao_du_kien ? (
                              <p className="text-base text-text-secondary">
                                🚚 Ngày giao dự kiến: <span className="font-semibold text-text-primary">{new Date(order.ngay_giao_du_kien).toLocaleDateString("vi-VN")}</span>
                              </p>
                            ) : null}
                            <p className="text-sm font-normal text-text-secondary">Nhấn để xem lộ trình chi tiết và sản phẩm</p>
                          </div>

                          <div className="flex items-center justify-between md:justify-end gap-6 border-t md:border-none pt-3 md:pt-0">
                            <div className="text-left md:text-right">
                              <span className="text-sm font-normal text-text-secondary block">Tổng thanh toán</span>
                              <span className="text-2xl font-semibold text-primary">{formatCurrency(order.tong_thanh_toan)}</span>
                            </div>
                            {canCancelOrder(order.trang_thai) && (
                              <button
                                onClick={(e) => handleCancelOrder(e, order)}
                                disabled={cancelingOrderId === order.ma_don_hang}
                                className="text-sm font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 px-4 py-2.5 rounded-xl transition shrink-0"
                              >
                                {cancelingOrderId === order.ma_don_hang ? "Đang hủy..." : "Hủy đơn"}
                              </button>
                            )}
                          </div>
                        </div>
                      </Link>
                    );
                  })
                ) : (
                  <div className="bg-white rounded-2xl border border-border py-16 text-center shadow-sm">
                    <span className="text-4xl block mb-2">🍃</span>
                    <p className="text-text-secondary text-sm">Bạn chưa có đơn hàng truyền thống nào.</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === "subscriptions" && (
              <div className="grid gap-4 md:grid-cols-2">
                {subscriptions.length ? (
                  subscriptions.map((subscription) => {
                    const status = subscriptionStatusMap[subscription.trang_thai] || subscriptionStatusMap.hoan_tat;
                    const soKyDaGiao = Number(subscription.so_ky_da_giao || 0);
                    const soKyGiao = Number(subscription.so_ky_giao || 0);
                    const isLastCycle = soKyDaGiao >= soKyGiao - 1 && soKyGiao > 0;
                    const tienCoc = Number(subscription.order_tien_coc || 0);
                    const tongTien = tinhTongTienMoiKy(subscription);
                    const giaHienThi = isLastCycle && tienCoc > 0 ? Math.max(0, tongTien - tienCoc) : tongTien;
                    return (
                      <Link
                        key={subscription.ma_dang_ky}
                        to={`/subscriptions/${subscription.ma_dang_ky}`}
                        className="block bg-white rounded-2xl border border-border p-5 shadow-sm flex flex-col justify-between hover:border-primary/30 hover:shadow-md transition duration-200"
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="font-semibold text-text-primary text-lg line-clamp-1">{subscription.ten_san_pham}</h3>
                            <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-sm font-medium ${status.color}`}>
                              {status.label}
                            </span>
                          </div>
                          <div className="mt-3 space-y-1.5 text-base text-text-secondary">
                            <p>📦 Số lượng: <span className="font-semibold text-text-primary">{subscription.so_luong} {subscription.don_vi} / mỗi kỳ</span></p>
                            <p>📅 Tần suất: <span className="font-semibold text-text-primary">{frequencyMap[subscription.tan_suat_giao] || subscription.tan_suat_giao}</span></p>
                            <p>🔄 Tiến độ: <span className="font-semibold text-primary">Đã nhận {soKyDaGiao}/{soKyGiao} lần giao</span></p>
                            <p className="text-sm font-normal text-text-secondary">Kỳ giao tiếp theo: {new Date(subscription.ngay_giao_tiep_theo).toLocaleDateString("vi-VN")}</p>
                          </div>
                          <p className="mt-2 text-sm font-normal text-text-secondary">Nhấn để xem chi tiết đăng ký</p>
                        </div>

                        <div className="mt-5 pt-4 border-t border-border flex items-center justify-between">
                        <div>
                          <span className="text-sm font-normal text-text-secondary block">
                            {isLastCycle && tienCoc > 0 ? `Giá kỳ cuối (trừ cọc ${formatCurrency(tienCoc)})` : 'Giá mỗi kỳ'}
                          </span>
                          <span className={`text-2xl font-semibold ${isLastCycle && tienCoc > 0 ? 'text-green-600' : 'text-primary'}`}>
                            {formatCurrency(giaHienThi)}
                          </span>
                        </div>
                        {["dang_hoat_dong", "tam_dung"].includes(subscription.trang_thai) && (
                          <button
                            onClick={(e) => handleCancelSubscription(e, subscription.ma_dang_ky, tienCoc, Number(subscription.order_tong_tien || 0))}
                            disabled={cancelingSubscriptionId === subscription.ma_dang_ky}
                            className="text-sm font-semibold text-rose-600 bg-rose-50 hover:bg-rose-100 px-4 py-2.5 rounded-xl transition disabled:opacity-50"
                          >
                            {cancelingSubscriptionId === subscription.ma_dang_ky ? "Đang xử lý..." : "Hủy đăng ký"}
                          </button>
                        )}
                      </div>
                      </Link>
                    );
                  })
                ) : (
                  <div className="col-span-full bg-white rounded-2xl border border-border py-16 text-center shadow-sm">
                    <span className="text-4xl block mb-2">🔄</span>
                    <p className="text-text-secondary text-sm">Bạn chưa đăng ký gói nhận nông sản định kỳ nào.</p>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>

      {cancelModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm transition-opacity">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl space-y-4 animate-in fade-in zoom-in duration-200">
            <h3 className="text-xl font-semibold text-text-primary">
              {cancelModal.type === 'subscription'
                ? 'Xác nhận hủy đăng ký định kỳ?'
                : cancelModal.loaiDon === 'dat_truoc' || cancelModal.tienCoc > 0
                ? 'Xác nhận hủy đơn đặt trước?'
                : 'Xác nhận hủy đơn hàng?'}
            </h3>
            <p className="text-text-secondary text-base leading-relaxed">
              {cancelModal.type === 'subscription' ? (
                <>
                  Nếu hủy gói đăng ký lúc này, khoản tiền cọc {cancelModal.tongTien > 0 && cancelModal.tienCoc >= cancelModal.tongTien ? 100 : 30}%
                  {cancelModal.tienCoc > 0 ? <strong className="text-rose-600"> {formatCurrency(cancelModal.tienCoc)}</strong> : ''} đã thanh toán ban đầu sẽ <strong className="text-rose-600">không được hoàn trả</strong> theo quy định.
                  <br /><br />
                  Bạn có chắc chắn muốn hủy gói không?
                </>
              ) : cancelModal.loaiDon === 'dat_truoc' || cancelModal.tienCoc > 0 ? (
                <>
                  Nếu hủy đơn đặt trước lúc này, khoản tiền cọc {cancelModal.tongTien > 0 && cancelModal.tienCoc >= cancelModal.tongTien ? 100 : 30}%
                  {cancelModal.tienCoc > 0 ? <strong className="text-rose-600"> {formatCurrency(cancelModal.tienCoc)}</strong> : ''} đã thanh toán ban đầu sẽ <strong className="text-rose-600">không được hoàn trả</strong> theo quy định.
                  <br /><br />
                  Bạn có chắc chắn muốn hủy đơn không?
                </>
              ) : (
                'Bạn có chắc chắn muốn hủy đơn hàng này không?'
              )}
            </p>
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-border">
              <button
                onClick={() => setCancelModal({ isOpen: false, id: null, tienCoc: 0, tongTien: 0, loaiDon: null, type: null })}
                className="px-5 py-2.5 rounded-xl text-text-secondary bg-slate-100 hover:bg-slate-200 font-medium transition duration-200"
              >
                Hủy bỏ
              </button>
              <button
                onClick={executeCancel}
                className="px-5 py-2.5 rounded-xl text-white bg-rose-600 hover:bg-rose-700 font-medium transition duration-200 shadow-sm shadow-rose-200"
              >
                Đồng ý hủy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export function OrderDetail() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [canceling, setCanceling] = useState(false);
  const [cancelModal, setCancelModal] = useState({ isOpen: false, id: null, tienCoc: 0, tongTien: 0, loaiDon: null, type: null });
  const [polling, setPolling] = useState(false);
  const success = searchParams.get("success");

  useEffect(() => {
    setLoading(true);
    orderAPI
      .getById(id)
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!data?.order) return;
    const order = data.order;
    if (order.phuong_thuc_tt !== 'banking' || order.trang_thai_tt === 'da_tt' || order.trang_thai === 'da_huy') return;
    setPolling(true);
    const interval = setInterval(async () => {
      try {
        const refreshed = await orderAPI.getById(id);
        setData(refreshed);
        if (refreshed.order.trang_thai_tt === 'da_tt') {
          clearInterval(interval);
          setPolling(false);
        }
      } catch {}
    }, 5000);
    return () => { clearInterval(interval); setPolling(false); };
  }, [data?.order?.trang_thai_tt, id]);

  const handleCancel = () => {
    if (!data?.order || !canCancelOrder(data.order.trang_thai)) return;
    setCancelModal({
      isOpen: true,
      id: id,
      tienCoc: Number(data.order.tien_coc || 0),
      tongTien: Number(data.order.tong_thanh_toan || 0),
      loaiDon: data.order.loai_don,
      type: 'order'
    });
  };

  const executeCancel = async () => {
    setCanceling(true);
    try {
      await orderAPI.cancel(id, {});
      setData((prev) => ({
        ...prev,
        order: { ...prev.order, trang_thai: "da_huy" },
      }));
    } finally {
      setCanceling(false);
      setCancelModal({ isOpen: false, id: null, tienCoc: 0, tongTien: 0, loaiDon: null, type: null });
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex min-h-screen items-center justify-center text-text-secondary bg-background">
        ⚠️ Không tìm thấy thông tin đơn hàng này.
      </div>
    );
  }

  const { order } = data;
  const items = order.items || [];
  const status = orderStatusMap[order.trang_thai] || orderStatusMap.da_huy;
  const orderType = orderTypeMap[order.loai_don || "thuong"] || orderTypeMap.thuong;
  const subtotal = items.reduce((sum, item) => sum + Number(item.thanh_tien || 0), 0);

  const isFinalDeliveryOrder = order.loai_don === 'dinh_ky' && order.trang_thai === 'da_giao' && Number(order.tien_coc || 0) > 0;
  const khauTruCocOrder = isFinalDeliveryOrder ? Number(order.tien_coc || 0) : 0;
  const orderTongTien = Number(order.tong_thanh_toan || 0);
  const depositPercent = orderTongTien > 0 && Number(order.tien_coc || 0) >= orderTongTien ? 100 : 30;

  const giamGia = Number(order.giam_gia || 0) || Math.max(0, subtotal + 30000 - Number(order.tong_thanh_toan || 0) - khauTruCocOrder);
  const shippingFee = Math.max(0, Number(order.tong_thanh_toan || 0) - subtotal + giamGia + khauTruCocOrder);

  const statusSteps = ["cho_xac_nhan", "da_xac_nhan", "dang_giao", "da_giao"];
  const currentStepIndex = statusSteps.indexOf(order.trang_thai);

  return (
    <div className="bg-background min-h-screen pb-16">
      <div className="max-w-7xl mx-auto px-4 pt-6 space-y-5">

        {success && (
          <div className="bg-[#e8f5ee] border border-[#b8e0c6] rounded-2xl p-4 flex items-center gap-3 shadow-sm">
            <span className="text-2xl">🎉</span>
            <div>
              <h3 className="font-semibold text-[#16A34A] text-base">Đặt hàng thành công!</h3>
              <p className="text-sm text-[#236845] font-normal">Hệ thống đã nhận đơn hàng #{order.ma_don_hang} của bạn.</p>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl border border-border p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-border">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold text-text-primary">Mã đơn hàng: #{order.ma_don_hang}</h1>
                <span className={`rounded-full px-2.5 py-0.5 text-sm font-medium ${orderType.color}`}>{orderType.label}</span>
                <span className={`rounded-full px-2.5 py-0.5 text-sm font-medium ${status.color}`}>{status.label}</span>
              </div>
              <p className="text-sm font-normal text-text-secondary mt-1.5">Thời gian đặt: {new Date(order.ngay_tao).toLocaleString("vi-VN")}</p>
            </div>
            <div className="text-left sm:text-right shrink-0">
              <span className="text-sm font-normal text-text-secondary block">Tổng thanh toán</span>
              <span className="text-3xl font-semibold text-primary">{formatCurrency(order.tong_thanh_toan)}</span>
            </div>
          </div>

          {order.trang_thai !== "da_huy" && (
            <div className="py-2 px-1">
              <div className="relative flex items-center justify-between w-full">
                <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-border w-full rounded-full z-0" />
                <div
                  className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-primary transition-all duration-500 z-0"
                  style={{ width: `${(Math.max(0, currentStepIndex) / (statusSteps.length - 1)) * 100}%` }}
                />

                {statusSteps.map((stepKey, idx) => {
                  const stepMap = orderStatusMap[stepKey];
                  const isCompleted = idx <= currentStepIndex;
                  const isCurrent = idx === currentStepIndex;
                  return (
                    <div key={stepKey} className="relative z-10 flex flex-col items-center">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-all ${isCompleted ? "bg-primary text-white ring-4 ring-green-50" : "bg-slate-200 text-slate-500"
                        }`}>
                        {isCompleted && !isCurrent ? "✓" : idx + 1}
                      </div>
                      <span className={`text-xs font-semibold mt-2.5 whitespace-nowrap hidden sm:block ${isCurrent ? "text-primary font-semibold" : "text-slate-500"}`}>
                        {stepMap?.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-border p-6 shadow-sm space-y-4">
          <h2 className="text-base font-bold uppercase tracking-wide text-text-secondary">Danh sách nông sản</h2>
          <div className="divide-y divide-border">
            {items.map((item) => (
              <div key={item.mactdh} className="flex items-center gap-4 py-3 first:pt-0 last:pb-0">
                <img
                  src={
                    item.hinh_san_pham
                      ? item.hinh_san_pham.startsWith("/upload/")
                        ? `http://localhost:5000${item.hinh_san_pham}`
                        : `http://localhost:5000/upload/${item.hinh_san_pham}`
                      : "https://placehold.co/80x80/e8f5ee/16A34A?text=RauQuả"
                  }
                  alt={item.ten_san_pham}
                  className="h-16 w-16 rounded-xl object-cover bg-background border border-border shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-text-primary text-base sm:text-lg truncate">{item.ten_san_pham}</h4>
                  <p className="text-sm sm:text-base text-text-secondary mt-1">
                    {item.so_luong} × <span className="text-text-primary font-semibold">{formatCurrency(item.don_gia)}</span>
                  </p>
                </div>
                <span className="font-semibold text-text-primary text-base sm:text-lg shrink-0">{formatCurrency(item.thanh_tien)}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-border p-5 shadow-sm space-y-4 text-[17px]">
          <div className="flex justify-between text-text-secondary">
            <span className="font-semibold text-text-secondary">Tiền tạm tính</span>
            <span className="font-medium text-text-primary">{formatCurrency(subtotal)}</span>
          </div>
          {giamGia > 0 && (
            <div className="flex justify-between text-rose-600">
              <span className="font-semibold">Khuyến mãi</span>
              <span className="font-medium">-{formatCurrency(giamGia)}</span>
            </div>
          )}
          <div className="flex justify-between text-text-secondary">
            <span className="font-semibold text-text-secondary">Phí vận chuyển</span>
            <span className="font-medium text-text-primary">
              {shippingFee > 0 ? formatCurrency(shippingFee) : "Miễn phí"}
            </span>
          </div>
          {khauTruCocOrder > 0 && (
            <div className="flex justify-between text-[#16A34A] font-semibold">
              <span>Khấu trừ tiền cọc gói ({depositPercent}%)</span>
              <span>-{formatCurrency(khauTruCocOrder)}</span>
            </div>
          )}
          <div className="flex justify-between border-t border-border pt-4 text-[18px]">
            <span className="font-bold text-text-primary">Tổng tiền thanh toán (COD)</span>
            <span className="text-2xl text-primary font-bold">{formatCurrency(order.tong_thanh_toan)}</span>
          </div>
          {hasDeposit(order) && !isFinalDeliveryOrder && order.phuong_thuc_tt === 'banking' && (
            <>
              <div className="flex justify-between text-amber-700 bg-amber-50 rounded-xl px-4 py-2.5">
                <span className="font-semibold">Cọc trước (QR)</span>
                <span className="font-bold">{formatCurrency(order.tien_coc)}</span>
              </div>
              {order.tong_thanh_toan > order.tien_coc && (
                <div className="flex justify-between text-text-secondary">
                  <span className="font-semibold text-text-secondary">Còn lại (COD khi nhận hàng)</span>
                  <span className="font-medium text-rose-600">{formatCurrency(order.tong_thanh_toan - order.tien_coc)}</span>
                </div>
              )}
            </>
          )}
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="bg-white rounded-2xl border border-border p-5 shadow-sm">
            <h3 className="text-base font-bold uppercase tracking-wide text-text-secondary">
              🏡 ĐỊA CHỈ NHẬN HÀNG
            </h3>

            <div className="mt-4 space-y-4 text-[17px]">

              <div className="grid grid-cols-[130px_1fr]">
                <span className="font-semibold text-text-secondary">
                  Họ và tên:
                </span>

                <span className="font-medium text-text-primary">
                  {order.ten_nguoi_nhan}
                </span>
              </div>

              <div className="grid grid-cols-[130px_1fr]">
                <span className="font-semibold text-text-secondary">
                  Số điện thoại:
                </span>

                <span className="font-medium text-text-primary">
                  {order.sdt_nguoi_nhan}
                </span>
              </div>

              <div className="grid grid-cols-[130px_1fr]">
                <span className="font-semibold text-text-secondary">
                  Địa chỉ:
                </span>

                <span className="font-medium text-text-primary leading-7">
                  {order.dia_chi_giao}
                </span>
              </div>

              <div className="grid grid-cols-[130px_1fr]">
                <span className="font-semibold text-text-secondary">
                  Ghi chú:
                </span>

                <span className="font-medium text-text-primary">
                  {order.ghi_chu || "Không có"}
                </span>
              </div>

            </div>
          </div>

          <div className="bg-white rounded-2xl border border-border p-5 shadow-sm">
            <h3 className="text-base font-bold uppercase tracking-wide text-text-secondary">
              💳 PHƯƠNG THỨC THANH TOÁN
            </h3>
            <div className="mt-4 space-y-4 text-[17px]">
              <div className="grid grid-cols-[130px_1fr]">
                <span className="font-semibold text-text-secondary">
                  Phương thức:
                </span>
                <span className="font-medium text-text-primary">
                  {order.phuong_thuc_tt === "tien_mat" ? "💵 Tiền mặt khi nhận hàng (COD)" : order.phuong_thuc_tt === "banking" ? "🏦 Chuyển khoản qua ngân hàng" : order.phuong_thuc_tt}
                </span>
              </div>
              <div className="grid grid-cols-[130px_1fr]">
                <span className="font-semibold text-text-secondary">
                  Trạng thái:
                </span>
                <div>
                  <span className={`inline-block text-[15px] font-semibold px-2.5 py-0.5 rounded-full ${order.trang_thai_tt === "da_tt" ? "bg-green-50 text-[#16A34A] border border-green-200" : "bg-amber-50 text-amber-700 border border-amber-200"}`}>
                    {order.trang_thai_tt === "da_tt" ? "Đã tất toán" : "Chưa thanh toán"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
        {order.phuong_thuc_tt === "banking" && order.trang_thai !== "da_huy" && (
          <div className="bg-amber-50/60 border border-amber-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-black text-amber-900">⚡ Quét mã QR chuyển khoản nhanh</h3>
              {polling && <span className="text-xs font-medium text-amber-600 animate-pulse">🔄 Đang chờ xác nhận thanh toán...</span>}
            </div>
            {hasDeposit(order) && (
              <div className="mb-4 bg-white/60 rounded-xl p-3 text-sm text-amber-800 space-y-1">
                <p>💰 Tổng đơn: <strong>{formatCurrency(order.tong_thanh_toan)}</strong></p>
                <p className="font-bold text-amber-900">Cần thanh toán qua QR: {formatCurrency(order.tien_coc)}</p>
                {order.tong_thanh_toan > order.tien_coc && (
                  <p className="text-amber-700">Còn lại ({formatCurrency(order.tong_thanh_toan - order.tien_coc)}) thanh toán khi nhận hàng</p>
                )}
              </div>
            )}
            {order.trang_thai_tt === 'da_tt' ? (
              <div className="bg-green-50 border border-green-200 rounded-xl p-6 text-center">
                <span className="text-3xl">✅</span>
                <p className="mt-2 text-lg font-bold text-green-700">Đã thanh toán thành công!</p>
                <p className="text-sm text-green-600 mt-1">Hệ thống đã xác nhận đơn hàng của bạn.</p>
              </div>
            ) : (
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">

              <div className="md:col-span-3 flex justify-center shrink-0">
                {order.banking_info?.qr_url && (
                  <img src={order.banking_info.qr_url} alt="QR Chuyển khoản" className="h-48 w-48 rounded-xl border border-amber-200 bg-white p-2 shadow-sm" />
                )}
              </div>

              <div className="md:col-span-4 flex flex-col gap-2.5 text-base font-semibold text-amber-900">
                <p>Ngân hàng: <b className="text-text-primary font-bold">{order.banking_info?.bank_name}</b></p>
                <p>Số tài khoản: <b className="text-text-primary font-bold">{order.banking_info?.account_number}</b></p>
                <p>Chủ tài khoản: <b className="text-text-primary font-bold">{order.banking_info?.account_holder}</b></p>

                <div className="mt-1">
                  <p className="text-sm font-bold text-amber-700 mb-1">Nội dung chuyển khoản chính xác:</p>
                  <p className="inline-block bg-amber-100 text-amber-950 font-mono text-lg font-black px-4 py-1 rounded-lg border-2 border-amber-300 shadow-sm">
                    {order.banking_info?.noi_dung_chuyen_khoan}
                  </p>
                </div>
              </div>

              <div className="md:col-span-5 border-t md:border-t-0 md:border-l border-amber-200 pt-4 md:pt-0 md:pl-8 space-y-3 text-[17px] text-amber-800 self-start">
                <h4 className="font-bold text-[18px] text-amber-900 flex items-center gap-2">
                  📌 Hướng dẫn thực hiện
                </h4>
                <ul className="list-disc list-inside space-y-2 font-medium leading-7">
                  <li>Mở app ngân hàng bất kỳ để quét mã QR.</li>
                  <li>Hệ thống sẽ tự động điền số tiền và nội dung.</li>
                  <li>Kiểm tra kỹ tên chủ tài khoản trước khi bấm xác nhận.</li>
                  <li>Đơn hàng sẽ tự động cập nhật sau khi nhận được tiền (từ 1 - 3 phút).</li>
                </ul>
              </div>

            </div>
            )}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Link to="/orders" className="flex-1 rounded-xl border border-border py-3.5 text-center text-base font-semibold text-text-secondary bg-white hover:bg-background transition">
            ← Quay lại danh sách
          </Link>
          {canCancelOrder(order.trang_thai) ? (
            <button onClick={handleCancel} disabled={canceling} className="flex-1 rounded-xl bg-rose-50 hover:bg-rose-100 py-3.5 text-base font-semibold text-rose-600 transition">
              {canceling ? "Đang hủy..." : "Hủy đơn hàng"}
            </button>
          ) : (
            <Link to="/products" className="flex-1 rounded-xl bg-primary hover:bg-primary/90 py-3.5 text-center text-base font-semibold text-white transition">
              Tiếp tục mua hàng 🛒
            </Link>
          )}
        </div>

        {cancelModal.isOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm transition-opacity">
            <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl space-y-4 animate-in fade-in zoom-in duration-200">
              <h3 className="text-xl font-semibold text-text-primary">
                {cancelModal.loaiDon === 'dat_truoc' || cancelModal.tienCoc > 0 ? 'Xác nhận hủy đơn đặt trước?' : 'Xác nhận hủy đơn hàng?'}
              </h3>
              <p className="text-text-secondary text-base leading-relaxed">
                {cancelModal.loaiDon === 'dat_truoc' || cancelModal.tienCoc > 0 ? (
                  <>
                    Nếu hủy đơn đặt trước lúc này, khoản tiền cọc {cancelModal.tongTien > 0 && cancelModal.tienCoc >= cancelModal.tongTien ? 100 : 30}%
                    {cancelModal.tienCoc > 0 ? <strong className="text-rose-600"> {formatCurrency(cancelModal.tienCoc)}</strong> : ''} đã thanh toán ban đầu sẽ <strong className="text-rose-600">không được hoàn trả</strong> theo quy định.
                    <br /><br />
                    Bạn có chắc chắn muốn hủy đơn không?
                  </>
                ) : (
                  'Bạn có chắc chắn muốn hủy đơn hàng này không?'
                )}
              </p>
              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-border">
                <button
                  onClick={() => setCancelModal({ isOpen: false, id: null, tienCoc: 0, tongTien: 0, loaiDon: null, type: null })}
                  className="px-5 py-2.5 rounded-xl text-text-secondary bg-slate-100 hover:bg-slate-200 font-medium transition duration-200"
                >
                  Hủy bỏ
                </button>
                <button
                  onClick={executeCancel}
                  disabled={canceling}
                  className="px-5 py-2.5 rounded-xl text-white bg-rose-600 hover:bg-rose-700 font-medium transition duration-200 shadow-sm shadow-rose-200"
                >
                  {canceling ? "Đang hủy..." : "Đồng ý hủy"}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div >
  );
}


export function SubscriptionDetail() {
  const { id } = useParams();
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [canceling, setCanceling] = useState(false);
  const [polling, setPolling] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  useEffect(() => {
    setLoading(true);
    subscriptionAPI
      .getAll()
      .then((data) => {
        const found = (data.subscriptions || []).find(
          (item) => String(item.ma_dang_ky) === String(id)
        );
        setSubscription(found || null);
      })
      .catch(() => setSubscription(null))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (!subscription?.order_id || subscription.order_trang_thai_tt === 'da_tt' || subscription.phuong_thuc_tt !== 'banking') return;
    setPolling(true);
    const interval = setInterval(async () => {
      try {
        const data = await subscriptionAPI.getAll();
        const updated = (data.subscriptions || []).find(
          (item) => String(item.ma_dang_ky) === String(id)
        );
        if (updated) {
          setSubscription(updated);
          if (updated.order_trang_thai_tt === 'da_tt') {
            clearInterval(interval);
            setPolling(false);
          }
        }
      } catch {}
    }, 5000);
    return () => { clearInterval(interval); setPolling(false); };
  }, [subscription?.order_id, subscription?.order_trang_thai_tt, id]);

  const handleCancel = () => {
    if (!subscription || !["dang_hoat_dong", "tam_dung"].includes(subscription.trang_thai)) return;
    setShowCancelModal(true);
  };

  const confirmCancel = async () => {
    setCanceling(true);
    try {
      await subscriptionAPI.cancel(id);
      setSubscription((prev) => ({ ...prev, trang_thai: "da_huy" }));
    } finally {
      setCanceling(false);
      setShowCancelModal(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="flex min-h-screen items-center justify-center text-text-secondary bg-background">
        ⚠️ Không tìm thấy đăng ký giao định kỳ này.
      </div>
    );
  }

  const status = subscriptionStatusMap[subscription.trang_thai] || subscriptionStatusMap.hoan_tat;
  const canCancel = ["dang_hoat_dong", "tam_dung"].includes(subscription.trang_thai);
  const soKyGiao = Number(subscription.so_ky_giao || 0);
  const soKyDaGiao = Number(subscription.so_ky_da_giao || 0);
  const progressPercent = soKyGiao > 0 ? Math.min(100, (soKyDaGiao / soKyGiao) * 100) : 0;
  const giaMoiKy = Number(subscription.gia_tam_tinh || 0) * Number(subscription.so_luong || 0);

  const tienSanPham = giaMoiKy;
  const donGiaGoc = Number(subscription.product?.price || 0);
  const giamGiaMoiKy = Math.max(0, (donGiaGoc - Number(subscription.gia_tam_tinh || 0)) * Number(subscription.so_luong || 0));
  const tienTamTinh = tienSanPham + giamGiaMoiKy;
  const phiVanChuyen = tienSanPham >= 500000 ? 0 : 30000;
  const tongTienMoiKy = tienSanPham + phiVanChuyen;

  const orderTienCoc = Number(subscription.order_tien_coc || 0);
  const orderTongTien = Number(subscription.order_tong_tien || 0);
  const depositPercent = orderTongTien > 0 && orderTienCoc >= orderTongTien ? 100 : 30;

  const imageUrl = subscription.hinh_san_pham
    ? subscription.hinh_san_pham.startsWith("/upload/")
      ? `http://localhost:5000${subscription.hinh_san_pham}`
      : `http://localhost:5000/upload/${subscription.hinh_san_pham}`
    : "https://placehold.co/80x80/e8f5ee/16A34A?text=RauQuả";

  return (
    <div className="bg-background min-h-screen pb-16">
      <div className="max-w-7xl mx-auto px-4 pt-6 space-y-5">

        <div className="bg-white rounded-2xl border border-border p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-border">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold text-text-primary">Mã đăng ký: #{subscription.ma_dang_ky}</h1>
                <span className="rounded-full px-2.5 py-0.5 text-sm font-medium bg-slate-100 text-slate-700">🔄 Giao định kỳ</span>
                <span className={`rounded-full px-2.5 py-0.5 text-sm font-medium ${status.color}`}>{status.label}</span>
              </div>
              <p className="text-sm font-normal text-text-secondary mt-1.5">
                Ngày bắt đầu: {subscription.start_date ? new Date(subscription.start_date).toLocaleString("vi-VN") : "Chưa xác định"}
              </p>
            </div>
            <div className="text-left sm:text-right shrink-0">
              <span className="text-sm font-normal text-text-secondary block">
                {soKyDaGiao >= soKyGiao - 1 && Number(subscription.order_tien_coc || 0) > 0 ? `Giá kỳ cuối (trừ cọc ${formatCurrency(subscription.order_tien_coc)})` : 'Giá mỗi kỳ'}
              </span>
              <span className={`text-3xl font-semibold ${soKyDaGiao >= soKyGiao - 1 && Number(subscription.order_tien_coc || 0) > 0 ? 'text-green-600' : 'text-primary'}`}>
                {formatCurrency(soKyDaGiao >= soKyGiao - 1 && Number(subscription.order_tien_coc || 0) > 0 ? Math.max(0, tongTienMoiKy - Number(subscription.order_tien_coc || 0)) : tongTienMoiKy)}
              </span>
            </div>
          </div>

          {subscription.trang_thai !== "da_huy" && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold text-text-secondary">Tiến độ giao hàng</span>
                <span className="font-semibold text-primary">{soKyDaGiao}/{soKyGiao} kỳ</span>
              </div>
              <div className="h-2.5 w-full rounded-full bg-border">
                <div
                  className="h-2.5 rounded-full bg-primary transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <p className="text-sm text-text-secondary">
                Kỳ tiếp theo: {subscription.ngay_giao_tiep_theo ? new Date(subscription.ngay_giao_tiep_theo).toLocaleDateString("vi-VN") : "Chưa xác định"}
              </p>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-border p-6 shadow-sm space-y-4">
          <h2 className="text-base font-bold uppercase tracking-wide text-text-secondary">Danh sách nông sản</h2>
          <div className="divide-y divide-border">
            <div className="flex items-center gap-4 py-3 first:pt-0 last:pb-0">
              <img
                src={imageUrl}
                alt={subscription.ten_san_pham}
                className="h-16 w-16 rounded-xl object-cover bg-background border border-border shrink-0"
              />
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-text-primary text-base sm:text-lg truncate">{subscription.ten_san_pham}</h4>
                <p className="text-sm sm:text-base text-text-secondary mt-1">
                  {subscription.so_luong} {subscription.don_vi} × <span className="text-text-primary font-semibold">{formatCurrency(donGiaGoc)}</span>
                </p>
                <p className="mt-0.5 text-sm text-text-secondary">
                  Tần suất giao: <span className="font-semibold text-text-primary">{frequencyMap[subscription.tan_suat_giao] || subscription.tan_suat_giao}</span>
                </p>
              </div>
              <span className="font-semibold text-text-primary text-base sm:text-lg shrink-0">{formatCurrency(tienTamTinh)}</span>
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl border border-border p-5 shadow-sm space-y-4 text-[17px]">
          <div className="flex justify-between text-text-secondary">
            <span className="font-semibold text-text-secondary">Tiền tạm tính</span>
            <span className="font-medium text-text-primary">{formatCurrency(tienTamTinh)}</span>
          </div>
          {giamGiaMoiKy > 0 && (
            <div className="flex justify-between text-rose-600">
              <span className="font-semibold">Khuyến mãi</span>
              <span className="font-medium">-{formatCurrency(giamGiaMoiKy)}</span>
            </div>
          )}
          <div className="flex justify-between text-text-secondary">
            <span className="font-semibold text-text-secondary">Phí vận chuyển</span>
            <span className="font-medium text-text-primary">
              {phiVanChuyen > 0 ? formatCurrency(phiVanChuyen) : "Miễn phí"}
            </span>
          </div>
          {soKyDaGiao >= soKyGiao - 1 && Number(subscription.order_tien_coc || 0) > 0 && (
            <div className="flex justify-between text-[#16A34A] font-semibold">
              <span>Khấu trừ tiền cọc gói ({depositPercent}%)</span>
              <span>-{formatCurrency(subscription.order_tien_coc)}</span>
            </div>
          )}
          <div className="flex justify-between border-t border-border pt-4 text-[18px]">
            <span className="font-bold text-text-primary">
              {soKyDaGiao >= soKyGiao - 1 ? `Tổng thanh toán kỳ cuối (Kỳ ${soKyGiao} COD)` : "Tổng tiền mỗi kỳ"}
            </span>
            <span className="text-2xl text-primary font-bold">
              {formatCurrency(soKyDaGiao >= soKyGiao - 1 ? Math.max(0, tongTienMoiKy - Number(subscription.order_tien_coc || 0)) : tongTienMoiKy)}
            </span>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2"></div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="bg-white rounded-2xl border border-border p-5 shadow-sm">
            <h3 className="text-base font-bold uppercase tracking-wide text-text-secondary">
              🏡 ĐỊA CHỈ NHẬN HÀNG
            </h3>

            <div className="mt-4 space-y-4 text-[17px]">
              <div className="grid grid-cols-[130px_1fr]">
                <span className="font-semibold text-text-secondary">Họ và tên:</span>
                <span className="font-medium text-text-primary">
                  {subscription.ten_nguoi_mua || "Chưa cập nhật"}
                </span>
              </div>

              <div className="grid grid-cols-[130px_1fr]">
                <span className="font-semibold text-text-secondary">Số điện thoại:</span>
                <span className="font-medium text-text-primary">
                  {subscription.so_dien_thoai || "Chưa cập nhật"}
                </span>
              </div>

              <div className="grid grid-cols-[130px_1fr]">
                <span className="font-semibold text-text-secondary">Địa chỉ:</span>
                <span className="font-medium text-text-primary leading-7">
                  {subscription.dia_chi_giao || "Chưa cập nhật"}
                </span>
              </div>

              <div className="grid grid-cols-[130px_1fr]">
                <span className="font-semibold text-text-secondary">Ghi chú:</span>
                <span className="font-medium text-text-primary">
                  {subscription.ghi_chu || "Không có"}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-border p-5 shadow-sm">
            <h3 className="text-base font-bold uppercase tracking-wide text-text-secondary">
              💳 PHƯƠNG THỨC THANH TOÁN
            </h3>
            <div className="mt-4 space-y-4 text-[17px]">
              <div className="grid grid-cols-[130px_1fr]">
                <span className="font-semibold text-text-secondary">Phương thức:</span>
                <span className="font-medium text-text-primary">
                  {paymentLabelMap[subscription.phuong_thuc_tt] || subscription.phuong_thuc_tt || "Chưa cập nhật"}
                </span>
              </div>
              <div className="grid grid-cols-[130px_1fr]">
                <span className="font-semibold text-text-secondary">Tổng số kỳ:</span>
                <span className="font-medium text-text-primary">{soKyGiao} kỳ</span>
              </div>
            </div>
          </div>
        </div>

          {subscription.phuong_thuc_tt === "banking" && subscription.order_id && subscription.order_trang_thai_tt === "da_tt" && (
            <div className="bg-green-50 border border-green-200 rounded-2xl p-6 shadow-sm text-center">
              <span className="text-3xl">✅</span>
              <p className="mt-2 text-lg font-bold text-green-700">Đã thanh toán thành công!</p>
              <p className="text-sm text-green-600 mt-1">Hệ thống đã xác nhận đơn hàng của bạn.</p>
            </div>
          )}
          {subscription.phuong_thuc_tt === "banking" && subscription.order_id && subscription.order_trang_thai_tt !== "da_tt" && (
            <div className="bg-amber-50/60 border border-amber-200 rounded-2xl p-6 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-base font-black text-amber-900">⚡ Quét mã QR chuyển khoản nhanh</h3>
                {polling && <span className="text-xs font-medium text-amber-600 animate-pulse">🔄 Đang chờ xác nhận thanh toán...</span>}
              </div>
              <div className="mb-4 bg-white/60 rounded-xl p-3 text-sm text-amber-800 space-y-1">
                <p>💰 Tổng mỗi kỳ: <strong>{formatCurrency(tongTienMoiKy)}</strong></p>
                <p className="font-bold text-amber-900">Cần thanh toán cọc qua QR: {formatCurrency(subscription.banking_info.amount)}</p>
                {tongTienMoiKy > subscription.banking_info.amount && (
                  <p className="text-amber-700">Thanh toán COD khi nhận hàng: <strong>{formatCurrency(tongTienMoiKy)}</strong>/kỳ (Riêng kỳ cuối đối trừ cọc: <strong>{formatCurrency(tongTienMoiKy - subscription.banking_info.amount)}</strong>)</p>
                )}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
                <div className="md:col-span-3 flex justify-center shrink-0">
                  {subscription.banking_info.qr_url && (
                    <img src={subscription.banking_info.qr_url} alt="QR Chuyển khoản" className="h-48 w-48 rounded-xl border border-amber-200 bg-white p-2 shadow-sm" />
                  )}
                </div>
                <div className="md:col-span-4 flex flex-col gap-2.5 text-base font-semibold text-amber-900">
                  <p>Ngân hàng: <b className="text-text-primary font-bold">{subscription.banking_info.bank_name}</b></p>
                  <p>Số tài khoản: <b className="text-text-primary font-bold">{subscription.banking_info.account_number}</b></p>
                  <p>Chủ tài khoản: <b className="text-text-primary font-bold">{subscription.banking_info.account_holder}</b></p>
                  <div className="mt-1">
                    <p className="text-sm font-bold text-amber-700 mb-1">Nội dung chuyển khoản chính xác:</p>
                    <p className="inline-block bg-amber-100 text-amber-950 font-mono text-lg font-black px-4 py-1 rounded-lg border-2 border-amber-300 shadow-sm">
                      {subscription.banking_info.noi_dung_chuyen_khoan}
                    </p>
                  </div>
                </div>
                <div className="md:col-span-5 border-t md:border-t-0 md:border-l border-amber-200 pt-4 md:pt-0 md:pl-8 space-y-3 text-[17px] text-amber-800 self-start">
                  <h4 className="font-bold text-[18px] text-amber-900 flex items-center gap-2">📌 Hướng dẫn thực hiện</h4>
                  <ul className="list-disc list-inside space-y-2 font-medium leading-7">
                    <li>Mở app ngân hàng bất kỳ để quét mã QR.</li>
                    <li>Hệ thống sẽ tự động điền số tiền và nội dung.</li>
                    <li>Kiểm tra kỹ tên chủ tài khoản trước khi bấm xác nhận.</li>
                    <li>Đơn hàng sẽ tự động cập nhật sau khi nhận được tiền (từ 1 - 3 phút).</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Link to="/orders" className="flex-1 rounded-xl border border-border py-3.5 text-center text-base font-semibold text-text-secondary bg-white hover:bg-background transition">
            ← Quay lại danh sách
          </Link>
          {canCancel ? (
            <button onClick={handleCancel} disabled={canceling} className="flex-1 rounded-xl bg-rose-50 hover:bg-rose-100 py-3.5 text-base font-semibold text-rose-600 transition">
              {canceling ? "Đang hủy..." : "Hủy đăng ký"}
            </button>
          ) : (
            <Link to="/products" className="flex-1 rounded-xl bg-primary hover:bg-primary/90 py-3.5 text-center text-base font-semibold text-white transition">
              Tiếp tục mua hàng 🛒
            </Link>
          )}
        </div>

      </div>

      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm transition-opacity">
          <div className="bg-white rounded-2xl w-full max-w-md p-6 shadow-xl space-y-4 animate-in fade-in zoom-in duration-200">
            <h3 className="text-xl font-semibold text-text-primary">Xác nhận hủy đăng ký định kỳ?</h3>
            <p className="text-text-secondary text-base leading-relaxed">
              Nếu hủy gói đăng ký lúc này, khoản tiền cọc {depositPercent}%
              {Number(subscription.order_tien_coc || 0) > 0 ? <strong className="text-rose-600"> {formatCurrency(Number(subscription.order_tien_coc))}</strong> : ''} đã thanh toán ban đầu sẽ <strong className="text-rose-600">không được hoàn trả</strong> theo quy định.
              <br /><br />
              Bạn có chắc chắn muốn hủy gói không?
            </p>
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-border">
              <button
                onClick={() => setShowCancelModal(false)}
                className="px-5 py-2.5 rounded-xl text-text-secondary bg-slate-100 hover:bg-slate-200 font-medium transition duration-200"
              >
                Hủy bỏ
              </button>
              <button
                onClick={confirmCancel}
                className="px-5 py-2.5 rounded-xl text-white bg-rose-600 hover:bg-rose-700 font-medium transition duration-200 shadow-sm shadow-rose-200"
              >
                Đồng ý hủy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
