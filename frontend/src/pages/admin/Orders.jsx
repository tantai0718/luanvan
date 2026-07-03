import { useEffect, useState } from "react";
import { api, orderAPI, subscriptionAPI } from "../../services/api";
import {
  Badge,
  Btn,
  Loading,
  Modal,
  PageHero,
  Pagination,
  SearchBar,
  Table,
} from "../../components/ui/AdminUI";

const statusMap = {
  cho_xac_nhan: { label: "Chờ xác nhận", color: "yellow" },
  da_xac_nhan: { label: "Đã xác nhận", color: "blue" },
  dang_giao: { label: "Đang giao", color: "purple" },
  da_giao: { label: "Đã giao", color: "green" },
  da_huy: { label: "Đã hủy", color: "red" },
};

const nextStatusMap = {
  cho_xac_nhan: "da_xac_nhan",
  da_xac_nhan: "dang_giao",
  dang_giao: "da_giao",
};

const orderTypeMap = {
  thuong: { label: "Đơn thường", color: "gray" },
  dat_truoc: { label: "Đặt trước", color: "orange" },
};

const subscriptionStatusMap = {
  dang_hoat_dong: { label: "Đang hoạt động", color: "green" },
  tam_dung: { label: "Tạm dừng", color: "yellow" },
  da_huy: { label: "Đã hủy", color: "red" },
  hoan_tat: { label: "Hoàn tất", color: "gray" },
};

const frequencyMap = {
  hang_tuan: "Hàng tuần",
  hai_tuan: "2 tuần / lần",
  hang_thang: "Hàng tháng",
};

const formatCurrency = (value) =>
  `${Number(value || 0).toLocaleString("vi-VN")}đ`;

function OrderDetailModal({
  detail,
  orderId,
  onClose,
  onAdvanceStatus,
  onCancel,
}) {
  const nextStatus = nextStatusMap[detail.order.trang_thai];
  const canCancel = ["cho_xac_nhan", "da_xac_nhan"].includes(
    detail.order.trang_thai,
  );
  const orderType =
    orderTypeMap[detail.order.loai_don || "thuong"] || orderTypeMap.thuong;

  return (
    <Modal title={`Chi tiết đơn hàng #${orderId}`} onClose={onClose} size="lg">
      <div className="space-y-4">
        <div className="grid gap-3 md:grid-cols-2">
          {[
            [
              "Người mua",
              detail.order.ten_nguoi_nhan ||
              detail.order.ho_ten ||
              "Chưa cập nhật",
            ],
            ["Số điện thoại", detail.order.sdt_nguoi_nhan || "Chưa cập nhật"],
            ["Địa chỉ giao", detail.order.dia_chi_giao || "Chưa cập nhật"],
            [
              "Thanh toán",
              detail.order.phuong_thuc_tt === "tien_mat" ? "Tiền mặt" : "VNPay",
            ],
            [
              "Ngày đặt",
              new Date(detail.order.ngay_tao).toLocaleString("vi-VN"),
            ],
            [
              "Ngày giao dự kiến",
              detail.order.ngay_giao_du_kien
                ? new Date(
                  detail.order.ngay_giao_du_kien,
                ).toLocaleDateString("vi-VN")
                : "Chưa cập nhật",
            ],
            ...(detail.order.ngay_giao_thuc_te
              ? [
                [
                  "Ngày giao thực tế",
                  new Date(detail.order.ngay_giao_thuc_te).toLocaleString("vi-VN"),
                ],
              ]
              : []),

            ["Loại đơn", orderType.label],
            ["Ghi chú", detail.order.ghi_chu || "Không có ghi chú"],
          ].map(([label, value]) => (
            <div key={label} className="rounded-2xl bg-[#f3f7f4] p-4">
              <p className="text-xs text-slate-400">{label}</p>
              <p className="mt-1 text-sm font-medium text-slate-800">{value}</p>
            </div>
          ))}
        </div>

        <div className="space-y-3">
          {(detail.items || []).map((item) => (
            <div
              key={item.ma_chi_tiet}
              className="flex items-center gap-4 rounded-2xl bg-[#f3f7f4] p-4"
            >
              <img
                src={
                  item.hinh_san_pham ||
                  "https://placehold.co/60x60/e8f5ee/1a7a4a?text=NS"
                }
                alt={item.ten_san_pham}
                className="h-14 w-14 rounded-xl object-cover"
              />
              <div className="flex-1">
                <p className="font-semibold text-slate-900">
                  {item.ten_san_pham}
                </p>
                <p className="text-xs text-slate-500">
                  {item.so_luong} x{" "}
                  {formatCurrency(item.don_gia)}
                </p>
              </div>
              <p className="font-semibold text-[#1a7a4a]">
                {formatCurrency(item.thanh_tien)}
              </p>
            </div>
          ))}
        </div>

        <div className="rounded-2xl bg-[#e8f5ee] px-4 py-3 text-sm text-[#1a7a4a]">
          {Number(detail.order.giam_gia || 0) > 0 ? (
            <div className="mb-2 flex items-center justify-between">
              <span>Khuyến mãi</span>
              <span>-{formatCurrency(detail.order.giam_gia)}</span>
            </div>
          ) : null}
          {detail.order.ghi_chu_khuyen_mai ? (
            <p className="mb-2 text-xs">{detail.order.ghi_chu_khuyen_mai}</p>
          ) : null}
          <div className="flex items-center justify-between font-semibold">
            <span>Tổng thanh toán</span>
            <span>{formatCurrency(detail.order.tong_thanh_toan)}</span>
          </div>
        </div>

        <div className="rounded-2xl border border-[#dce7df] bg-[#f8faf8] p-4">
          <p className="mb-3 text-sm font-semibold text-slate-700">
            Trạng thái đơn hàng
          </p>

          <Badge
            text={statusMap[detail.order.trang_thai].label}
            color={statusMap[detail.order.trang_thai].color}
          />
          {detail.order.loai_don === "dat_truoc" && (
            <div className="mt-3 rounded-xl bg-orange-50 border border-orange-200 p-3">
              <p className="text-sm text-orange-700">
                Đây là đơn <b>đặt trước</b>. Hệ thống sẽ giao hàng vào khoảng{" "}
                <b>
                  {detail.order.ngay_giao_du_kien
                    ? new Date(
                      detail.order.ngay_giao_du_kien,
                    ).toLocaleDateString("vi-VN")
                    : "chưa xác định"}
                </b>
                .
              </p>
            </div>
          )}

          <div className="mt-4 flex flex-wrap gap-3">
            {nextStatus && (
              <Btn
                onClick={() =>
                  onAdvanceStatus(orderId, detail.order.trang_thai)
                }
              >
                {detail.order.trang_thai === "cho_xac_nhan" && "Xác nhận đơn"}

                {detail.order.trang_thai === "da_xac_nhan" && "Bắt đầu giao"}

                {detail.order.trang_thai === "dang_giao" && "Xác nhận đã giao"}
              </Btn>
            )}

            {canCancel && (
              <Btn variant="danger" onClick={() => onCancel(orderId)}>
                Hủy đơn
              </Btn>
            )}

            <Btn variant="outline" onClick={onClose}>
              Đóng
            </Btn>
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
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [tab, setTab] = useState("thuong");
  const [page, setPage] = useState(1);
  const [selectedId, setSelectedId] = useState(null);
  const [detail, setDetail] = useState(null);
  const [deliveringSubscriptionId, setDeliveringSubscriptionId] =
    useState(null);
  const limit = 15;

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        limit: String(limit),
        page: String(page),
      });
      if (search) params.set("q", search);
      if (status) params.set("trang_thai", status);
      if (tab === "subscription") {
        const data = await subscriptionAPI.adminAll();
        setSubscriptions(data.subscriptions || []);
        setOrders([]);
        setTotal(data.subscriptions?.length || 0);
      } else {
        params.set("loai_don", tab);

        const data = await api.get(`/admin/orders?${params.toString()}`);

        setOrders(data.orders || []);
        setTotal(data.total || 0);
      }
    } catch {
      setOrders([]);
      setSubscriptions([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [page, search, status, tab]);

  const openDetail = async (id) => {
    const response = await orderAPI.adminGetById(id);
    setSelectedId(id);
    setDetail(response);
  };

  const handleAdvanceStatus = async (id, currentStatus) => {
    const nextStatus = nextStatusMap[currentStatus];
    if (!nextStatus) return;
    await orderAPI.adminUpdateStatus(id, { trang_thai: nextStatus });
    setOrders((prev) =>
      prev.map((order) =>
        order.ma_don_hang === id ? { ...order, trang_thai: nextStatus } : order,
      ),
    );
    if (selectedId === id && detail) {
      setDetail((prev) => ({
        ...prev,
        order: {
          ...prev.order,
          trang_thai: nextStatus,
          ...(nextStatus === "da_giao" ? { ngay_giao_thuc_te: new Date().toISOString() } : {}),
        },
      }));
    }
  };

  const handleCancel = async (id) => {
    if (!window.confirm("Bạn có chắc muốn hủy đơn hàng này không?")) return;
    await orderAPI.adminUpdateStatus(id, { trang_thai: "da_huy" });
    setOrders((prev) =>
      prev.map((order) =>
        order.ma_don_hang === id ? { ...order, trang_thai: "da_huy" } : order,
      ),
    );
  };

  const handleDeliverSubscription = async (id) => {
    if (!window.confirm("Ghi nhận đã giao một kỳ cho đăng ký này?")) return;
    setDeliveringSubscriptionId(id);
    try {
      const response = await subscriptionAPI.adminDeliver(id);
      setSubscriptions((prev) =>
        prev.map((subscription) =>
          subscription.ma_dang_ky === id
            ? {
              ...subscription,
              so_ky_da_giao: response.subscription.so_ky_da_giao,
              ngay_giao_tiep_theo: response.subscription.ngay_giao_tiep_theo,
              trang_thai: response.subscription.trang_thai,
            }
            : subscription,
        ),
      );
    } finally {
      setDeliveringSubscriptionId(null);
    }
  };

  return (
    <div className="space-y-6">
      <PageHero
        eyebrow="Đơn hàng"
        title="Theo dõi đơn hàng và các đăng ký giao định kỳ"
        body="Admin có thể xem toàn bộ đơn hàng, chuyển trạng thái xử lý và ghi nhận số kỳ đã giao cho từng đăng ký định kỳ."
      />
      <div className="market-panel p-4">
        <div className="flex gap-3">
          <button
            className={`rounded-xl px-5 py-2 ${tab === "thuong" ? "bg-[#1a7a4a] text-white" : "bg-gray-100"
              }`}
            onClick={() => {
              setTab("thuong");
              setPage(1);
            }}
          >
            📦 Đơn thường
          </button>

          <button
            className={`rounded-xl px-5 py-2 ${tab === "dat_truoc" ? "bg-[#1a7a4a] text-white" : "bg-gray-100"
              }`}
            onClick={() => {
              setTab("dat_truoc");
              setPage(1);
            }}
          >
            ⏰ Đặt trước
          </button>

          <button
            className={`rounded-xl px-5 py-2 ${tab === "subscription" ? "bg-[#1a7a4a] text-white" : "bg-gray-100"
              }`}
            onClick={() => {
              setTab("subscription");
              setPage(1);
            }}
          >
            🔁 Đăng ký định kỳ
          </button>
        </div>
      </div>

      <div className="market-panel p-5">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <SearchBar
            value={search}
            onChange={(value) => {
              setSearch(value);
              setPage(1);
            }}
            placeholder="Tìm mã đơn hoặc địa chỉ..."
          />
          <select
            value={status}
            onChange={(event) => {
              setStatus(event.target.value);
              setPage(1);
            }}
            className="rounded-2xl border border-[#dce7df] px-4 py-3 text-sm outline-none focus:border-[#2d9e63]"
          >
            <option value="">Tất cả trạng thái</option>
            {Object.entries(statusMap).map(([value, meta]) => (
              <option key={value} value={value}>
                {meta.label}
              </option>
            ))}
          </select>
          <div className="ml-auto text-sm text-slate-500">
            {tab === "subscription" ? "Tổng đăng ký: " : "Tổng đơn hàng: "}
            <span className="font-semibold text-slate-900">{total}</span>
          </div>
        </div>
      </div>

      {loading ? (
        <Loading />
      ) : (
        <>
          {tab === "subscription" ? (
            <div className="market-panel p-5">
              <div className="market-section-title">
                <h2>Đăng ký giao định kỳ</h2>
              </div>

              {(subscriptions || []).length ? (
                <div className="space-y-3">
                  {subscriptions.map((subscription) => {
                    const subscriptionStatus =
                      subscriptionStatusMap[subscription.trang_thai] ||
                      subscriptionStatusMap.hoan_tat;

                    return (
                      <div
                        key={subscription.ma_dang_ky}
                        className="rounded-2xl border border-[#dce7df] bg-white p-4"
                      >
                        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                          <div>
                            <div className="flex flex-wrap items-center gap-2">
                              <p className="font-semibold text-slate-900">
                                {subscription.ten_san_pham}
                              </p>

                              <Badge
                                text={subscriptionStatus.label}
                                color={subscriptionStatus.color}
                              />
                            </div>

                            <p className="mt-2 text-sm text-slate-600">
                              {subscription.ten_nguoi_mua} ·{" "}
                              {subscription.so_luong} {subscription.don_vi} / kỳ
                              ·{" "}
                              {frequencyMap[subscription.tan_suat_giao] ||
                                subscription.tan_suat_giao}
                            </p>
                            <p className="mt-1 text-sm font-semibold text-[#0f5238]">
                              {formatCurrency(subscription.gia_tam_tinh * subscription.so_luong)} / kỳ
                              {subscription.so_luong >= 10 && (
                                <span className="ml-2 text-xs font-normal text-slate-400 line-through">
                                  {formatCurrency(subscription.product?.price * subscription.so_luong)}
                                </span>
                              )}
                            </p>

                            <p className="mt-1 text-sm font-semibold text-[#1a7a4a]">
                              Đã giao {Number(subscription.so_ky_da_giao || 0)}{" "}
                              / {Number(subscription.so_ky_giao || 0)} kỳ
                            </p>

                            <p className="mt-1 text-sm text-slate-500">
                              Kỳ tiếp theo:{" "}
                              {new Date(
                                subscription.ngay_giao_tiep_theo,
                              ).toLocaleDateString("vi-VN")}
                            </p>
                          </div>

                          <div className="flex flex-col items-start gap-3 lg:items-end">
                            <p className="text-sm font-semibold text-[#1a7a4a]">
                              {formatCurrency(
                                subscription.gia_tam_tinh *
                                subscription.so_luong,
                              )}{" "}
                              / kỳ
                            </p>

                            {["dang_hoat_dong", "tam_dung"].includes(
                              subscription.trang_thai,
                            ) ? (
                              <Btn
                                size="sm"
                                onClick={() =>
                                  handleDeliverSubscription(
                                    subscription.ma_dang_ky,
                                  )
                                }
                                disabled={
                                  deliveringSubscriptionId ===
                                  subscription.ma_dang_ky
                                }
                              >
                                {deliveringSubscriptionId ===
                                  subscription.ma_dang_ky
                                  ? "Đang ghi nhận..."
                                  : "Ghi nhận đã giao"}
                              </Btn>
                            ) : null}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="py-8 text-center text-sm text-slate-400">
                  Chưa có đăng ký giao định kỳ nào.
                </p>
              )}
            </div>
          ) : (
            <Table
              headers={[
                "Mã đơn",
                "Loại đơn",
                "Người mua",
                "Điện thoại",
                "Thanh toán",
                "Tổng tiền",
                "Trạng thái",
                "Ngày tạo",
                "Thao tác",
              ]}
              empty={{
                icon: "receipt_long",
                text: "Không có đơn hàng phù hợp.",
              }}
            >
              {orders.map((order) => {
                const orderStatus = statusMap[order.trang_thai] || {
                  label: order.trang_thai,
                  color: "gray",
                };

                const orderType =
                  orderTypeMap[order.loai_don || "thuong"] ||
                  orderTypeMap.thuong;

                const nextStatus = nextStatusMap[order.trang_thai];

                return (
                  <tr key={order.ma_don_hang} className="hover:bg-[#f9fbf9]">
                    <td className="px-4 py-3 text-sm font-semibold text-slate-900">
                      #{order.ma_don_hang}
                    </td>

                    <td className="px-4 py-3">
                      <Badge text={orderType.label} color={orderType.color} />
                    </td>

                    <td className="px-4 py-3 text-sm text-slate-700">
                      {order.ten_nguoi_nhan || order.ho_ten || "Khách hàng"}
                    </td>

                    <td className="px-4 py-3 text-sm text-slate-600">
                      {order.sdt_nguoi_nhan || "Chưa cập nhật"}
                    </td>

                    <td className="px-4 py-3">
                      <Badge
                        text={
                          order.phuong_thuc_tt === "tien_mat" ? "COD" : "VNPay"
                        }
                        color={
                          order.phuong_thuc_tt === "tien_mat"
                            ? "orange"
                            : "blue"
                        }
                      />
                    </td>

                    <td className="px-4 py-3 text-sm font-semibold text-[#1a7a4a]">
                      {formatCurrency(order.tong_thanh_toan)}
                    </td>

                    <td className="px-4 py-3">
                      <Badge
                        text={orderStatus.label}
                        color={orderStatus.color}
                      />
                    </td>

                    <td className="px-4 py-3 text-sm text-slate-500">
                      {new Date(order.ngay_tao).toLocaleDateString("vi-VN")}
                    </td>

                    <td className="px-4 py-3">
                      <Btn
                        size="sm"
                        variant="outline"
                        onClick={() => openDetail(order.ma_don_hang)}
                      >
                        Xem
                      </Btn>
                    </td>
                  </tr>
                );
              })}
            </Table>
          )}
        </>
      )}
      <Pagination page={page} total={total} limit={limit} onChange={setPage} />

      {selectedId && detail ? (
        <OrderDetailModal
          detail={detail}
          orderId={selectedId}
          onClose={() => {
            setSelectedId(null);
            setDetail(null);
          }}
          onAdvanceStatus={handleAdvanceStatus}
          onCancel={handleCancel}
        />
      ) : null}
    </div>
  );
}
