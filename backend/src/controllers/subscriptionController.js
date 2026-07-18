const subscriptionModel = require("../models/subscriptionModel");
const mapStatus = (dbStatus) =>
  dbStatus === "hoan_thanh" ? "hoan_tat" : dbStatus;

const mapSubscription = (subscription) => ({
  ma_dang_ky: subscription.madk,
  id: subscription.madk,
  user_id: subscription.mand,
  product_id: subscription.masp,
  start_date: subscription.ngay_bat_dau,
  end_date: subscription.ngay_ket_thuc,
  status: mapStatus(subscription.trang_thai),
  trang_thai: mapStatus(subscription.trang_thai),
  notes: subscription.ghi_chu,
  ghi_chu: subscription.ghi_chu,
  ten_san_pham: subscription.ten_san_pham,
  ten_nguoi_mua: subscription.ho_ten,
  so_dien_thoai: subscription.sdt,
  don_vi: subscription.don_vi,
  gia_tam_tinh: Number(subscription.gia_du_kien ?? subscription.gia_ban),
  hinh_san_pham: subscription.hinh_chinh,

  so_luong: Number(subscription.so_luong || 0),
  so_ky_giao: Number(subscription.so_lan_giao || 0),
  so_ky_da_giao: Number(subscription.so_lan_da_giao || 0),
  tan_suat_giao: subscription.chu_ky || "hang_tuan",
  dia_chi_giao: subscription.dia_chi_giao,
  phuong_thuc_tt: subscription.phuong_thuc_tt,
  ngay_giao_tiep_theo:
    subscription.ngay_giao_tiep_theo || subscription.ngay_bat_dau,

  product: {
    name: subscription.ten_san_pham,
    price: Number(subscription.gia_ban),
    unit: subscription.don_vi,
    image: subscription.hinh_chinh,
  },
  user: {
    name: subscription.ho_ten,
    email: subscription.email,
    phone: subscription.sdt,
  },
});

exports.create = async (req, res) => {
  try {
    await subscriptionModel.ensureSubscriptionTable();

    const {
      ma_san_pham,
      product_id,
      quantity,
      tan_suat_giao,
      so_ky_giao,
      ngay_bat_dau,
      dia_chi_giao,
      phuong_thuc_tt,
      ghi_chu,
    } = req.body;

    const masp = ma_san_pham || product_id;
    const mand = req.user.id;

    if (!masp) {
      return res.status(400).json({ message: "Thiếu mã sản phẩm" });
    }
    if (!dia_chi_giao) {
      return res.status(400).json({ message: "Thiếu địa chỉ giao hàng" });
    }

    const product = await subscriptionModel.getProductInfo(masp);
    if (!product || !product.trang_thai) {
      return res.status(404).json({ message: "Sản phẩm không tồn tại" });
    }

    const alreadySubscribed = await subscriptionModel.subscriptionExists(
      mand,
      masp,
    );
    if (alreadySubscribed) {
      return res
        .status(400)
        .json({ message: "Bạn đã có đăng ký định kỳ đang hoạt động cho sản phẩm này" });
    }

    const soLuong = Number(quantity) > 0 ? Number(quantity) : 1;

    const giaBan = Number(product.gia_ban);
    const tongHang = giaBan * soLuong;
    const tienGiam = soLuong >= 10 ? Math.round(tongHang * 0.05) : 0;
    const giaDuKien = soLuong >= 10
      ? giaBan - Math.round(giaBan * 0.05)  // giá mỗi đơn vị sau giảm
      : giaBan;
    const chuKy = ["hang_tuan", "hai_tuan", "hang_thang"].includes(
      tan_suat_giao,
    )
      ? tan_suat_giao
      : "hang_tuan";
    const soLanGiao = Number(so_ky_giao) >= 2 ? Number(so_ky_giao) : 4;

    const subscription = await subscriptionModel.createSubscription({
      mand,
      masp,
      so_luong: soLuong,
      gia_du_kien: giaDuKien,
      chu_ky: chuKy,
      dia_chi_giao,
      phuong_thuc_tt: "tien_mat",
      ngay_bat_dau: ngay_bat_dau || new Date(),
      so_lan_giao: soLanGiao,
      ghi_chu: ghi_chu || null,
    });

    res.status(201).json({
      message: "Đăng ký giao định kỳ thành công",
      subscription: mapSubscription(subscription),
    });
  } catch (error) {
    console.error("[createSubscription]", error);
    res.status(500).json({ message: error.message });
  }
};

// GET /api/subscriptions - Lấy danh sách subscription của user
exports.getAll = async (req, res) => {
  try {
    await subscriptionModel.ensureSubscriptionTable();

    const subscriptions = await subscriptionModel.getUserSubscriptions(
      req.user.id,
    );
    res.json({
      subscriptions: subscriptions.map(mapSubscription),
    });
  } catch (error) {
    console.error("[getUserSubscriptions]", error);
    res.status(500).json({ message: error.message });
  }
};


exports.cancel = async (req, res) => {
  try {
    await subscriptionModel.ensureSubscriptionTable();

    const madk = req.params.id;
    const mand = req.user.id;

    const subscription = await subscriptionModel.getSubscriptionById(madk);
    if (!subscription) {
      return res.status(404).json({ message: "Đăng ký không tồn tại" });
    }

    if (subscription.mand !== mand && req.user.vai_tro !== "quan_tri") {
      return res
        .status(403)
        .json({ message: "Không có quyền thực hiện thao tác này" });
    }

    if (subscription.trang_thai === "da_huy") {
      return res.status(400).json({ message: "Đăng ký đã được hủy" });
    }

    await subscriptionModel.cancelSubscription(madk, subscription.mand);

    res.json({ message: "Đã hủy đăng ký" });
  } catch (error) {
    console.error("[cancelSubscription]", error);
    res.status(500).json({ message: error.message });
  }
};

exports.adminGetAll = async (req, res) => {
  try {
    await subscriptionModel.ensureSubscriptionTable();

    const subscriptions = await subscriptionModel.getAllSubscriptions();
    res.json({
      subscriptions: subscriptions.map(mapSubscription),
    });
  } catch (error) {
    console.error("[adminGetAllSubscriptions]", error);
    res.status(500).json({ message: error.message });
  }
};

exports.adminDeliver = async (req, res) => {
  try {
    await subscriptionModel.ensureSubscriptionTable();

    const madk = req.params.id;

    const subscription = await subscriptionModel.getSubscriptionById(madk);
    if (!subscription) {
      return res.status(404).json({ message: "Đăng ký không tồn tại" });
    }

    if (subscription.trang_thai === "da_huy") {
      return res
        .status(400)
        .json({ message: "Không thể giao - đăng ký đã bị hủy" });
    }

    if (subscription.trang_thai === "hoan_thanh") {
      return res
        .status(400)
        .json({ message: "Đăng ký đã hoàn tất tất cả các kỳ giao" });
    }

    const updatedSubscription =
      await subscriptionModel.deliverSubscription(madk);

    res.json({
      message: "Đã ghi nhận giao hàng cho kỳ này",
      subscription: mapSubscription(updatedSubscription),
    });
  } catch (error) {
    console.error("[adminDeliverSubscription]", error);
    res.status(500).json({ message: error.message });
  }
};