import { useEffect, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { orderAPI, subscriptionAPI } from "../services/api";

const orderStatusMap = {
  cho_xac_nhan: { label: "Chờ xác nhận", color: "bg-amber-50 text-amber-700 border border-amber-200" },
  da_xac_nhan: { label: "Đã xác nhận", color: "bg-blue-50 text-blue-700 border border-blue-200" },
  dang_giao: { label: "Đang giao", color: "bg-purple-50 text-purple-700 border border-purple-200" },
  da_giao: { label: "Đã giao", color: "bg-[#e8f5ee] text-[#1a7a4a] border border-[#b8e0c6]" },
  da_huy: { label: "Đã hủy", color: "bg-rose-50 text-rose-700 border border-rose-200" },
};

const subscriptionStatusMap = {
  dang_hoat_dong: { label: "Đang hoạt động", color: "bg-[#e8f5ee] text-[#1a7a4a] border border-[#b8e0c6]" },
  tam_dung: { label: "Tạm dừng", color: "bg-amber-50 text-amber-700 border border-amber-200" },
  da_huy: { label: "Đã hủy", color: "bg-rose-50 text-rose-700 border border-rose-200" },
  hoan_tat: { label: "Hoàn tất", color: "bg-slate-100 text-slate-700 border border-slate-200" },
};

const orderTypeMap = {
  thuong: { label: "Đơn thường", color: "bg-slate-100 text-slate-700" },
  dat_truoc: { label: "Đặt trước", color: "bg-orange-50 text-orange-700 border border-orange-200" },
};

const frequencyMap = {
  hang_tuan: "Hàng tuần",
  hai_tuan: "2 tuần / lần",
  hang_thang: "Hàng tháng",
};

const paymentLabelMap = {
  tien_mat: "💵 Tiền mặt khi nhận hàng (COD)",
  vnpay: "💳 VNPay",
};

const formatCurrency = (value) => `${Number(value || 0).toLocaleString("vi-VN")}₫`;
const canCancelOrder = (status) => ["cho_xac_nhan", "da_xac_nhan"].includes(status);

// --- COMPONENT ORDERLIST ---
export function OrderList() {
  const [activeTab, setActiveTab] = useState("orders");
  const [orders, setOrders] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [cancelingOrderId, setCancelingOrderId] = useState(null);
  const [cancelingSubscriptionId, setCancelingSubscriptionId] = useState(null);

  const fetchData = () => {
    setLoading(true);
    Promise.allSettled([orderAPI.getAll(), subscriptionAPI.getAll()])
      .then(([ordersResult, subscriptionsResult]) => {
        setOrders(ordersResult.status === "fulfilled" ? ordersResult.value.orders || [] : []);
        setSubscriptions(subscriptionsResult.status === "fulfilled" ? subscriptionsResult.value.subscriptions || [] : []);

        if ((ordersResult.value?.orders || []).length === 0 && (subscriptionsResult.value?.subscriptions || []).length > 0) {
          setActiveTab("subscriptions");
        }
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCancelOrder = async (event, orderId) => {
    event.preventDefault();
    event.stopPropagation();
    if (!window.confirm("Bạn có chắc muốn hủy đơn hàng này không?")) return;
    setCancelingOrderId(orderId);
    try {
      await orderAPI.cancel(orderId, {});
      setOrders((prev) =>
        prev.map((order) => (order.ma_don_hang === orderId ? { ...order, trang_thai: "da_huy" } : order))
      );
    } finally {
      setCancelingOrderId(null);
    }
  };

  const handleCancelSubscription = async (event, id) => {
    event.preventDefault();
    event.stopPropagation();
    if (!window.confirm("Bạn có chắc muốn hủy đăng ký giao định kỳ này không?")) return;
    setCancelingSubscriptionId(id);
    try {
      await subscriptionAPI.cancel(id);
      setSubscriptions((prev) =>
        prev.map((item) => (item.ma_dang_ky === id ? { ...item, trang_thai: "da_huy" } : item))
      );
    } finally {
      setCancelingSubscriptionId(null);
    }
  };

  return (
    <div className="bg-slate-50 min-h-screen pb-16">
      <div className="max-w-7xl mx-auto px-4 pt-8 space-y-6">

        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm">
          <span className="text-sm font-semibold uppercase tracking-wider text-[#1a7a4a]">
            Trang cá nhân
          </span>
          <h1 className="mt-1 text-3xl font-semibold text-slate-900">
            Quản lý lịch trình mua sắm
          </h1>
        </div>

        <div className="flex border-b border-slate-200 bg-white rounded-xl p-1.5 shadow-sm">
          <button
            onClick={() => setActiveTab("orders")}
            className={`flex-1 py-4 text-base font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2 ${activeTab === "orders"
              ? "bg-[#1a7a4a] text-white shadow-sm"
              : "text-slate-600 hover:bg-slate-50"
              }`}
          >
            <span>📦</span> Đơn hàng của bạn ({orders.length})
          </button>
          <button
            onClick={() => setActiveTab("subscriptions")}
            className={`flex-1 py-4 text-base font-semibold rounded-lg transition-all duration-200 flex items-center justify-center gap-2 ${activeTab === "subscriptions"
              ? "bg-[#1a7a4a] text-white shadow-sm"
              : "text-slate-600 hover:bg-slate-50"
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
                        className="block bg-white rounded-2xl border border-slate-100 p-5 shadow-sm hover:border-[#1a7a4a]/30 hover:shadow-md transition duration-200"
                      >
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                          <div className="flex items-center gap-2.5">
                            <span className="text-lg font-semibold text-slate-900">Đơn #{order.ma_don_hang}</span>
                            <span className={`rounded-full px-2 py-0.5 text-sm font-medium ${orderType.color}`}>{orderType.label}</span>
                            <span className={`rounded-full px-2 py-0.5 text-sm font-medium ${status.color}`}>{status.label}</span>
                          </div>
                          <span className="text-sm font-normal text-slate-400">{new Date(order.ngay_tao).toLocaleString("vi-VN")}</span>
                        </div>

                        <div className="mt-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                          <div className="space-y-1.5">
                            {order.loai_don === "dat_truoc" ? (
                              <p className="text-base font-medium text-amber-700 flex items-center gap-1.5">
                                ⏳ Hàng đặt trước · Dự kiến giao: {order.ngay_giao_du_kien ? new Date(order.ngay_giao_du_kien).toLocaleDateString("vi-VN") : "Chưa rõ"}
                              </p>
                            ) : order.ngay_giao_du_kien ? (
                              <p className="text-base text-slate-600">
                                🚚 Ngày giao dự kiến: <span className="font-semibold text-slate-800">{new Date(order.ngay_giao_du_kien).toLocaleDateString("vi-VN")}</span>
                              </p>
                            ) : null}
                            <p className="text-sm font-normal text-slate-400">Nhấn để xem lộ trình chi tiết và sản phẩm</p>
                          </div>

                          <div className="flex items-center justify-between md:justify-end gap-6 border-t md:border-none pt-3 md:pt-0">
                            <div className="text-left md:text-right">
                              <span className="text-sm font-normal text-slate-400 block">Tổng thanh toán</span>
                              <span className="text-2xl font-semibold text-[#1a7a4a]">{formatCurrency(order.tong_thanh_toan)}</span>
                            </div>
                            {canCancelOrder(order.trang_thai) && (
                              <button
                                onClick={(e) => handleCancelOrder(e, order.ma_don_hang)}
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
                  <div className="bg-white rounded-2xl border border-slate-100 py-16 text-center shadow-sm">
                    <span className="text-4xl block mb-2">🍃</span>
                    <p className="text-slate-400 text-sm">Bạn chưa có đơn hàng truyền thống nào.</p>
                  </div>
                )}
              </div>
            )}

            {activeTab === "subscriptions" && (
              <div className="grid gap-4 md:grid-cols-2">
                {subscriptions.length ? (
                  subscriptions.map((subscription) => {
                    const status = subscriptionStatusMap[subscription.trang_thai] || subscriptionStatusMap.hoan_tat;
                    return (
                      <Link
                        key={subscription.ma_dang_ky}
                        to={`/subscriptions/${subscription.ma_dang_ky}`}
                        className="block bg-white rounded-2xl border border-slate-100 p-5 shadow-sm flex flex-col justify-between hover:border-[#1a7a4a]/30 hover:shadow-md transition duration-200"
                      >
                        <div>
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="font-semibold text-slate-900 text-lg line-clamp-1">{subscription.ten_san_pham}</h3>
                            <span className={`shrink-0 rounded-full px-2.5 py-0.5 text-sm font-medium ${status.color}`}>
                              {status.label}
                            </span>
                          </div>
                          <div className="mt-3 space-y-1.5 text-base text-slate-600">
                            <p>📦 Số lượng: <span className="font-semibold text-slate-800">{subscription.so_luong} {subscription.don_vi} / mỗi kỳ</span></p>
                            <p>📅 Tần suất: <span className="font-semibold text-slate-800">{frequencyMap[subscription.tan_suat_giao] || subscription.tan_suat_giao}</span></p>
                            <p>🔄 Tiến độ: <span className="font-semibold text-[#1a7a4a]">Đã nhận {subscription.so_ky_da_giao || 0}/{subscription.so_ky_giao || 0} lần giao</span></p>
                            <p className="text-sm font-normal text-slate-400">Kỳ giao tiếp theo: {new Date(subscription.ngay_giao_tiep_theo).toLocaleDateString("vi-VN")}</p>
                          </div>
                          <p className="mt-2 text-sm font-normal text-slate-400">Nhấn để xem chi tiết đăng ký</p>
                        </div>

                        <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between">
                          <div>
                            <span className="text-sm font-normal text-slate-400 block">Giá mỗi kỳ</span>
                            <span className="text-2xl font-semibold text-[#1a7a4a]">{formatCurrency(subscription.gia_tam_tinh * subscription.so_luong)}</span>
                          </div>
                          {["dang_hoat_dong", "tam_dung"].includes(subscription.trang_thai) && (
                            <button
                              onClick={(e) => handleCancelSubscription(e, subscription.ma_dang_ky)}
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
                  <div className="col-span-full bg-white rounded-2xl border border-slate-100 py-16 text-center shadow-sm">
                    <span className="text-4xl block mb-2">🔄</span>
                    <p className="text-slate-400 text-sm">Bạn chưa đăng ký gói nhận nông sản định kỳ nào.</p>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// --- COMPONENT ORDERDETAIL (giữ nguyên, không đổi) ---
export function OrderDetail() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [canceling, setCanceling] = useState(false);
  const success = searchParams.get("success");

  useEffect(() => {
    setLoading(true);
    orderAPI
      .getById(id)
      .then(setData)
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [id]);

  const handleCancel = async () => {
    if (!data?.order || !canCancelOrder(data.order.trang_thai)) return;
    if (!window.confirm("Bạn có chắc muốn hủy đơn hàng này không?")) return;
    setCanceling(true);
    try {
      await orderAPI.cancel(id, {});
      setData((prev) => ({
        ...prev,
        order: { ...prev.order, trang_thai: "da_huy" },
      }));
    } finally {
      setCanceling(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="h-8 w-8 animate-spin rounded-full border-3 border-[#1a7a4a] border-t-transparent" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="flex min-h-screen items-center justify-center text-slate-500 bg-slate-50">
        ⚠️ Không tìm thấy thông tin đơn hàng này.
      </div>
    );
  }

  const { order } = data;
  const items = order.items || [];
  const status = orderStatusMap[order.trang_thai] || orderStatusMap.da_huy;
  const orderType = orderTypeMap[order.loai_don || "thuong"] || orderTypeMap.thuong;
  const subtotal = items.reduce((sum, item) => sum + Number(item.thanh_tien || 0), 0);

  const giamGia = Number(order.giam_gia || 0);
  const shippingFee = Math.max(0, Number(order.tong_thanh_toan || 0) - subtotal + giamGia);

  const statusSteps = ["cho_xac_nhan", "da_xac_nhan", "dang_giao", "da_giao"];
  const currentStepIndex = statusSteps.indexOf(order.trang_thai);

  return (
    <div className="bg-slate-50 min-h-screen pb-16">
      <div className="max-w-7xl mx-auto px-4 pt-6 space-y-5">

        {success && (
          <div className="bg-[#e8f5ee] border border-[#b8e0c6] rounded-2xl p-4 flex items-center gap-3 shadow-sm">
            <span className="text-2xl">🎉</span>
            <div>
              <h3 className="font-semibold text-[#1a7a4a] text-base">Đặt hàng thành công!</h3>
              <p className="text-sm text-[#236845] font-normal">Hệ thống đã nhận đơn hàng #{order.ma_don_hang} của bạn.</p>
            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-100">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold text-slate-900">Mã đơn hàng: #{order.ma_don_hang}</h1>
                <span className={`rounded-full px-2.5 py-0.5 text-sm font-medium ${orderType.color}`}>{orderType.label}</span>
                <span className={`rounded-full px-2.5 py-0.5 text-sm font-medium ${status.color}`}>{status.label}</span>
              </div>
              <p className="text-sm font-normal text-slate-400 mt-1.5">Thời gian đặt: {new Date(order.ngay_tao).toLocaleString("vi-VN")}</p>
            </div>
            <div className="text-left sm:text-right shrink-0">
              <span className="text-sm font-normal text-slate-400 block">Tổng thanh toán</span>
              <span className="text-3xl font-semibold text-[#1a7a4a]">{formatCurrency(order.tong_thanh_toan)}</span>
            </div>
          </div>

          {order.trang_thai !== "da_huy" && (
            <div className="py-2 px-1">
              <div className="relative flex items-center justify-between w-full">
                <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-slate-100 w-full rounded-full z-0" />
                <div
                  className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-[#1a7a4a] transition-all duration-500 z-0"
                  style={{ width: `${(Math.max(0, currentStepIndex) / (statusSteps.length - 1)) * 100}%` }}
                />

                {statusSteps.map((stepKey, idx) => {
                  const stepMap = orderStatusMap[stepKey];
                  const isCompleted = idx <= currentStepIndex;
                  const isCurrent = idx === currentStepIndex;
                  return (
                    <div key={stepKey} className="relative z-10 flex flex-col items-center">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-all ${isCompleted ? "bg-[#1a7a4a] text-white ring-4 ring-green-50" : "bg-slate-200 text-slate-500"
                        }`}>
                        {isCompleted && !isCurrent ? "✓" : idx + 1}
                      </div>
                      <span className={`text-xs font-semibold mt-2.5 whitespace-nowrap hidden sm:block ${isCurrent ? "text-[#1a7a4a] font-semibold" : "text-slate-500"}`}>
                        {stepMap?.label}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-4">
          <h2 className="text-base font-bold uppercase tracking-wide text-slate-500">Danh sách nông sản</h2>
          <div className="divide-y divide-slate-100">
            {items.map((item) => (
              <div key={item.mactdh} className="flex items-center gap-4 py-3 first:pt-0 last:pb-0">
                <img
                  src={
                    item.hinh_san_pham
                      ? item.hinh_san_pham.startsWith("/upload/")
                        ? `http://localhost:5000${item.hinh_san_pham}`
                        : `http://localhost:5000/upload/${item.hinh_san_pham}`
                      : "https://placehold.co/80x80/e8f5ee/1a7a4a?text=RauQuả"
                  }
                  alt={item.ten_san_pham}
                  className="h-16 w-16 rounded-xl object-cover bg-slate-50 border border-slate-100 shrink-0"
                />
                <div className="flex-1 min-w-0">
                  <h4 className="font-semibold text-slate-900 text-base sm:text-lg truncate">{item.ten_san_pham}</h4>
                  <p className="text-sm sm:text-base text-slate-500 mt-1">
                    {item.so_luong} × <span className="text-slate-800 font-semibold">{formatCurrency(item.don_gia)}</span>
                  </p>
                </div>
                <span className="font-semibold text-slate-900 text-base sm:text-lg shrink-0">{formatCurrency(item.thanh_tien)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
            <h3 className="text-base font-bold uppercase tracking-wide text-slate-500">
              🏡 ĐỊA CHỈ NHẬN HÀNG
            </h3>

            <div className="mt-4 space-y-4 text-[17px]">

              <div className="grid grid-cols-[130px_1fr]">
                <span className="font-semibold text-slate-600">
                  Họ và tên:
                </span>

                <span className="font-medium text-slate-900">
                  {order.ten_nguoi_nhan}
                </span>
              </div>

              <div className="grid grid-cols-[130px_1fr]">
                <span className="font-semibold text-slate-600">
                  Số điện thoại:
                </span>

                <span className="font-medium text-slate-900">
                  {order.sdt_nguoi_nhan}
                </span>
              </div>

              <div className="grid grid-cols-[130px_1fr]">
                <span className="font-semibold text-slate-600">
                  Địa chỉ:
                </span>

                <span className="font-medium text-slate-900 leading-7">
                  {order.dia_chi_giao}
                </span>
              </div>

              <div className="grid grid-cols-[130px_1fr]">
                <span className="font-semibold text-slate-600">
                  Ghi chú:
                </span>

                <span className="font-medium text-slate-900">
                  {order.ghi_chu || "Không có"}
                </span>
              </div>

            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
            <h3 className="text-base font-bold uppercase tracking-wide text-slate-500">
              💳 PHƯƠNG THỨC THANH TOÁN
            </h3>
            <div className="mt-4 space-y-4 text-[17px]">
              <div className="grid grid-cols-[130px_1fr]">
                <span className="font-semibold text-slate-600">
                  Phương thức:
                </span>
                <span className="font-medium text-slate-900">
                  {order.phuong_thuc_tt === "tien_mat" ? "💵 Tiền mặt khi nhận hàng (COD)" : order.phuong_thuc_tt === "banking" ? "🏦 Chuyển khoản qua ngân hàng" : order.phuong_thuc_tt}
                </span>
              </div>
              <div className="grid grid-cols-[130px_1fr]">
                <span className="font-semibold text-slate-600">
                  Trạng thái:
                </span>
                <div>
                  <span className={`inline-block text-[15px] font-semibold px-2.5 py-0.5 rounded-full ${order.trang_thai_tt === "da_tt" ? "bg-green-50 text-[#1a7a4a] border border-green-200" : "bg-amber-50 text-amber-700 border border-amber-200"}`}>
                    {order.trang_thai_tt === "da_tt" ? "Đã tất toán" : "Chưa thanh toán"}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {order.phuong_thuc_tt === "banking" && order.trang_thai_tt !== "da_tt" && order.trang_thai !== "da_huy" && (
          <div className="bg-amber-50/60 border border-amber-200 rounded-2xl p-6 shadow-sm">
            <h3 className="text-base font-black text-amber-900 mb-4">⚡ Quét mã VietQR chuyển khoản nhanh</h3>
            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">

              <div className="md:col-span-3 flex justify-center shrink-0">
                {order.banking_info?.qr_url && (
                  <img src={order.banking_info.qr_url} alt="VietQR" className="h-48 w-48 rounded-xl border border-amber-200 bg-white p-2 shadow-sm" />
                )}
              </div>

              <div className="md:col-span-4 flex flex-col gap-2.5 text-base font-semibold text-amber-900">
                <p>Ngân hàng: <b className="text-slate-900 font-bold">{order.banking_info?.bank_name}</b></p>
                <p>Số tài khoản: <b className="text-slate-900 font-bold">{order.banking_info?.account_number}</b></p>
                <p>Chủ tài khoản: <b className="text-slate-900 font-bold">{order.banking_info?.account_holder}</b></p>

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
                  <li>Mở app ngân hàng bất kỳ để quét mã <b>VietQR</b>.</li>
                  <li>Hệ thống sẽ tự động điền số tiền và nội dung.</li>
                  <li>Kiểm tra kỹ tên chủ tài khoản trước khi bấm xác nhận.</li>
                  <li>Đơn hàng sẽ tự động cập nhật sau khi nhận được tiền (từ 1 - 3 phút).</li>
                </ul>
              </div>

            </div>
          </div>
        )}

        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-4 text-[17px]">
          <div className="flex justify-between text-slate-500">
            <span className="font-semibold text-slate-600">Tiền tạm tính</span>
            <span className="font-medium text-slate-900">{formatCurrency(subtotal)}</span>
          </div>
          {giamGia > 0 && (
            <div className="flex justify-between text-rose-600">
              <span className="font-semibold">Khuyến mãi</span>
              <span className="font-medium">-{formatCurrency(giamGia)}</span>
            </div>
          )}
          <div className="flex justify-between text-slate-500">
            <span className="font-semibold text-slate-600">Phí vận chuyển</span>
            <span className="font-medium text-slate-900">
              {shippingFee > 0 ? formatCurrency(shippingFee) : "Miễn phí"}
            </span>
          </div>
          <div className="flex justify-between border-t border-slate-100 pt-4 text-[18px]">
            <span className="font-bold text-slate-900">Tổng tiền thanh toán</span>
            <span className="text-2xl text-[#1a7a4a] font-bold">{formatCurrency(order.tong_thanh_toan)}</span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Link to="/orders" className="flex-1 rounded-xl border border-slate-200 py-3.5 text-center text-base font-semibold text-slate-600 bg-white hover:bg-slate-50 transition">
            ← Quay lại danh sách
          </Link>
          {canCancelOrder(order.trang_thai) ? (
            <button onClick={handleCancel} disabled={canceling} className="flex-1 rounded-xl bg-rose-50 hover:bg-rose-100 py-3.5 text-base font-semibold text-rose-600 transition">
              {canceling ? "Đang hủy..." : "Hủy đơn hàng"}
            </button>
          ) : (
            <Link to="/products" className="flex-1 rounded-xl bg-[#1a7a4a] hover:bg-[#14633b] py-3.5 text-center text-base font-semibold text-white transition">
              Tiếp tục mua hàng 🛒
            </Link>
          )}
        </div>

      </div>
    </div >
  );
}

// --- COMPONENT SUBSCRIPTIONDETAIL (MỚI) ---
export function SubscriptionDetail() {
  const { id } = useParams();
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [canceling, setCanceling] = useState(false);

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

  const handleCancel = async () => {
    if (!subscription || !["dang_hoat_dong", "tam_dung"].includes(subscription.trang_thai)) return;
    if (!window.confirm("Bạn có chắc muốn hủy đăng ký giao định kỳ này không?")) return;
    setCanceling(true);
    try {
      await subscriptionAPI.cancel(id);
      setSubscription((prev) => ({ ...prev, trang_thai: "da_huy" }));
    } finally {
      setCanceling(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="h-8 w-8 animate-spin rounded-full border-3 border-[#1a7a4a] border-t-transparent" />
      </div>
    );
  }

  if (!subscription) {
    return (
      <div className="flex min-h-screen items-center justify-center text-slate-500 bg-slate-50">
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

  const imageUrl = subscription.hinh_san_pham
    ? subscription.hinh_san_pham.startsWith("/upload/")
      ? `http://localhost:5000${subscription.hinh_san_pham}`
      : `http://localhost:5000/upload/${subscription.hinh_san_pham}`
    : "https://placehold.co/80x80/e8f5ee/1a7a4a?text=RauQuả";

  return (
    <div className="bg-slate-50 min-h-screen pb-16">
      <div className="max-w-7xl mx-auto px-4 pt-6 space-y-5">

        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-4 border-b border-slate-100">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-bold text-slate-900">Mã đăng ký: #{subscription.ma_dang_ky}</h1>
                <span className="rounded-full px-2.5 py-0.5 text-sm font-medium bg-slate-100 text-slate-700">🔄 Giao định kỳ</span>
                <span className={`rounded-full px-2.5 py-0.5 text-sm font-medium ${status.color}`}>{status.label}</span>
              </div>
              <p className="text-sm font-normal text-slate-400 mt-1.5">
                Ngày bắt đầu: {subscription.start_date ? new Date(subscription.start_date).toLocaleString("vi-VN") : "Chưa xác định"}
              </p>
            </div>
            <div className="text-left sm:text-right shrink-0">
              <span className="text-sm font-normal text-slate-400 block">Giá mỗi kỳ</span>
              <span className="text-3xl font-semibold text-[#1a7a4a]">{formatCurrency(giaMoiKy)}</span>
            </div>
          </div>

          {subscription.trang_thai !== "da_huy" && (
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="font-semibold text-slate-600">Tiến độ giao hàng</span>
                <span className="font-semibold text-[#1a7a4a]">{soKyDaGiao}/{soKyGiao} kỳ</span>
              </div>
              <div className="h-2.5 w-full rounded-full bg-slate-100">
                <div
                  className="h-2.5 rounded-full bg-[#1a7a4a] transition-all duration-500"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
              <p className="text-sm text-slate-500">
                Kỳ tiếp theo: {subscription.ngay_giao_tiep_theo ? new Date(subscription.ngay_giao_tiep_theo).toLocaleDateString("vi-VN") : "Chưa xác định"}
              </p>
            </div>
          )}
        </div>

        <div className="bg-white rounded-2xl border border-slate-100 p-6 shadow-sm space-y-4">
          <h2 className="text-base font-bold uppercase tracking-wide text-slate-500">Sản phẩm đăng ký</h2>
          <div className="flex items-center gap-4">
            <img
              src={imageUrl}
              alt={subscription.ten_san_pham}
              className="h-20 w-20 rounded-xl object-cover bg-slate-50 border border-slate-100 shrink-0"
            />
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-slate-900 text-lg truncate">{subscription.ten_san_pham}</h4>
              <p className="text-base text-slate-500 mt-1">
                {subscription.so_luong} {subscription.don_vi} / kỳ ×{" "}
                <span className="text-slate-800 font-semibold">
                  {formatCurrency(subscription.gia_tam_tinh)}
                </span>
              </p>
              <p className="mt-1 text-sm text-slate-500">
                Tần suất giao: <span className="font-semibold text-slate-800">
                  {frequencyMap[subscription.tan_suat_giao] || subscription.tan_suat_giao}
                </span>
              </p>
            </div>
            <span className="font-semibold text-slate-900 text-lg shrink-0">{formatCurrency(giaMoiKy)}</span>
          </div>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
            <h3 className="text-base font-bold uppercase tracking-wide text-slate-500">
              🏡 ĐỊA CHỈ NHẬN HÀNG
            </h3>

            <div className="mt-4 space-y-4 text-[17px]">
              <div className="grid grid-cols-[130px_1fr]">
                <span className="font-semibold text-slate-600">Họ và tên:</span>
                <span className="font-medium text-slate-900">
                  {subscription.ten_nguoi_mua || "Chưa cập nhật"}
                </span>
              </div>

              <div className="grid grid-cols-[130px_1fr]">
                <span className="font-semibold text-slate-600">Số điện thoại:</span>
                <span className="font-medium text-slate-900">
                  {subscription.so_dien_thoai || "Chưa cập nhật"}
                </span>
              </div>

              <div className="grid grid-cols-[130px_1fr]">
                <span className="font-semibold text-slate-600">Địa chỉ:</span>
                <span className="font-medium text-slate-900 leading-7">
                  {subscription.dia_chi_giao || "Chưa cập nhật"}
                </span>
              </div>

              <div className="grid grid-cols-[130px_1fr]">
                <span className="font-semibold text-slate-600">Ghi chú:</span>
                <span className="font-medium text-slate-900">
                  {subscription.ghi_chu || "Không có"}
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
            <h3 className="text-base font-bold uppercase tracking-wide text-slate-500">
              💳 PHƯƠNG THỨC THANH TOÁN
            </h3>
            <div className="mt-4 space-y-4 text-[17px]">
              <div className="grid grid-cols-[130px_1fr]">
                <span className="font-semibold text-slate-600">Phương thức:</span>
                <span className="font-medium text-slate-900">
                  {paymentLabelMap[subscription.phuong_thuc_tt] || subscription.phuong_thuc_tt || "Chưa cập nhật"}
                </span>
              </div>
              <div className="grid grid-cols-[130px_1fr]">
                <span className="font-semibold text-slate-600">Tổng số kỳ:</span>
                <span className="font-medium text-slate-900">{soKyGiao} kỳ</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 pt-2">
          <Link to="/orders" className="flex-1 rounded-xl border border-slate-200 py-3.5 text-center text-base font-semibold text-slate-600 bg-white hover:bg-slate-50 transition">
            ← Quay lại danh sách
          </Link>
          {canCancel ? (
            <button onClick={handleCancel} disabled={canceling} className="flex-1 rounded-xl bg-rose-50 hover:bg-rose-100 py-3.5 text-base font-semibold text-rose-600 transition">
              {canceling ? "Đang hủy..." : "Hủy đăng ký"}
            </button>
          ) : (
            <Link to="/products" className="flex-1 rounded-xl bg-[#1a7a4a] hover:bg-[#14633b] py-3.5 text-center text-base font-semibold text-white transition">
              Tiếp tục mua hàng 🛒
            </Link>
          )}
        </div>

      </div>
    </div>
  );
}