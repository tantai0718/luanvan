const subscriptionModel = require("../models/subscriptionModel");
const orderModel = require("../models/orderModel");
const db = require("../config/db");
const mapStatus = (dbStatus) =>
  dbStatus === "hoan_thanh" ? "hoan_tat" : dbStatus;

const BANKING_INFO = {
  bank_name: process.env.BANK_BANK_NAME || 'MB Bank',
  bank_short_name: process.env.BANK_SHORT_NAME || 'MB',
  account_number: process.env.BANK_ACCOUNT_NUMBER || '2210118072003',
  account_holder: process.env.BANK_ACCOUNT_HOLDER || 'Vo Ngoc Tan Tai',
};

function getBankingInfo(amount, orderId) {
  const addInfo = `TT${orderId}`;
  const qrUrl = `https://qr.sepay.vn/img?acc=${BANKING_INFO.account_number}&bank=${BANKING_INFO.bank_short_name}&amount=${amount}&des=${encodeURIComponent(addInfo)}`;
  return { ...BANKING_INFO, qr_url: qrUrl, amount, noi_dung_chuyen_khoan: addInfo };
}

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
      loai_tien_coc,
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

    const { tienGiam, mienPhiShip, appliedPromotions } = await orderModel.tinhUuDaiTuDong(tongHang, soLuong, 'dinh_ky');

    const giaDuKien = soLuong > 0
      ? Math.round((tongHang - tienGiam) / soLuong)
      : giaBan;

    const chuKy = ["hang_tuan", "hai_tuan", "hang_thang"].includes(
      tan_suat_giao,
    )
      ? tan_suat_giao
      : "hang_tuan";
    const soLanGiao = Number(so_ky_giao) >= 2 ? Number(so_ky_giao) : 4;
    const isBanking = phuong_thuc_tt === "banking";

    const subscription = await subscriptionModel.createSubscription({
      mand,
      masp,
      so_luong: soLuong,
      gia_du_kien: giaDuKien,
      chu_ky: chuKy,
      dia_chi_giao,
      phuong_thuc_tt: phuong_thuc_tt || "tien_mat",
      ngay_bat_dau: ngay_bat_dau || new Date(),
      so_lan_giao: soLanGiao,
      ghi_chu: ghi_chu || null,
    });

    const response = {
      message: "Đăng ký giao định kỳ thành công",
      subscription: mapSubscription(subscription),
    };

    if (isBanking) {
      const phiShip = mienPhiShip ? 0 : 30000;
      const tongTienKy = tongHang - tienGiam + phiShip;
      let tienCoc = 0;
      if (loai_tien_coc === "30") {
        tienCoc = Math.round(tongTienKy * 0.3);
      } else {
        tienCoc = tongTienKy;
      }

      const nguoiDung = await db.query(
        'SELECT ho_ten, email, sdt FROM nguoi_dung WHERE mand = ?', [mand]
      );
      const nd = nguoiDung[0]?.[0] || {};

      const [dhResult] = await db.query(
        `INSERT INTO don_hang
           (mand, tien_giam, ten_nguoi_nhan, email_nguoi_nhan, sdt_nguoi_nhan,
            loai_don_hang, tong_tien, tong_da_thanh_toan, tien_coc, trang_thai,
            trang_thai_thanh_toan, dia_chi_giao, ghi_chu, ngay_dat, ngay_giao_du_kien)
         VALUES (?, ?, ?, ?, ?, 'dinh_ky', ?, 0, ?, 'cho_xac_nhan', 'chua_thanh_toan', ?, ?, NOW(), ?)`,
        [
          mand,
          tienGiam,
          nd.ho_ten || "",
          nd.email || "",
          nd.sdt || "",
          tongTienKy,
          tienCoc,
          dia_chi_giao,
          ghi_chu || null,
          subscription.ngay_bat_dau,
        ],
      );
      const madh = dhResult.insertId;
      const promotionModel = require("../models/promotionModel");
      await promotionModel.saveOrderPromotions(madh, appliedPromotions);

      await db.query(
        `INSERT INTO chi_tiet_don_hang (madh, masp, so_luong, don_gia, thanh_tien)
         VALUES (?, ?, ?, ?, ?)`,
        [madh, masp, soLuong, giaBan, tongHang],
      );

      await db.query(
        `INSERT INTO thanh_toan (madh, so_tien, phuong_thuc, trang_thai, ngay_thanh_toan)
         VALUES (?, ?, 'chuyen_khoan', 'cho_thanh_toan', NOW())`,
        [madh, tienCoc],
      );

      response.banking_info = getBankingInfo(tienCoc, madh);
      response.banking_info.tien_coc = tienCoc;
      response.banking_info.tong_tien = tongTienKy;
      response.banking_info.con_lai = tongTienKy - tienCoc;
      response.order_id = madh;
    }

    res.status(201).json(response);
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

exports.adminGetSummary = async (req, res) => {
  try {
    await subscriptionModel.ensureSubscriptionTable();
    const rows = await subscriptionModel.getSubscriptionSummary();
    const summary = rows.map(r => ({
      ngay_giao: r.ngay_giao,
      masp: r.masp,
      ten_san_pham: r.ten_san_pham,
      don_vi: r.don_vi,
      hinh_san_pham: r.hinh_san_pham || null,
      tong_so_luong: Number(r.tong_so_luong || 0),
      so_don: Number(r.so_don || 0),
    }));
    res.json({ summary });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.adminGetSummaryDetail = async (req, res) => {
  try {
    const { ngay, masp } = req.query;
    if (!ngay || !masp) {
      return res.status(400).json({ message: "Thiếu ngày hoặc mã sản phẩm." });
    }
    const rows = await subscriptionModel.getSubscriptionSummaryDetail(ngay, masp);
    const items = rows.map(r => ({
      ma_dang_ky: r.madk,
      ten_nguoi_mua: r.ho_ten,
      so_dien_thoai: r.sdt,
      dia_chi_giao: r.dia_chi_giao,
      trang_thai: mapStatus(r.trang_thai),
      so_luong: r.so_luong,
      gia_du_kien: Number(r.gia_du_kien || 0),
      so_ky_giao: r.so_lan_giao,
      so_ky_da_giao: r.so_lan_da_giao,
      tan_suat_giao: r.chu_ky,
    }));
    res.json({ items });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

