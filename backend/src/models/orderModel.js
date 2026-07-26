const db = require("../config/db");
const promotionModel = require("./promotionModel");

async function tinhUuDaiTuDong(tongTien, tongSoLuong, loai_don) {
  return await promotionModel.tinhUuDaiTuDong(tongTien, tongSoLuong, loai_don);
}

const PAYMENT_METHOD_MAP = { tien_mat: 'tien_mat', banking: 'banking', vnpay: 'vnpay' };

function mapPaymentMethod(method) {
  return PAYMENT_METHOD_MAP[method] || 'tien_mat';
}

async function createOrder({
  mand,
  dia_chi_giao,
  phuong_thuc = "tien_mat",
  ghi_chu = "",
  nguoi_dung,
  ten_nguoi_nhan = '',
  sdt_nguoi_nhan = '',
}) {
  const [[gh]] = await db.query("SELECT magh FROM gio_hang WHERE mand = ?", [
    mand,
  ]);
  if (!gh) throw new Error("Gio hang trong.");

  const [items] = await db.query(
    `SELECT ctgh.masp, ctgh.so_luong, sp.gia_ban, sp.ten_san_pham, sp.so_luong_ton, sp.han_su_dung
     FROM chi_tiet_gio_hang ctgh
     JOIN san_pham sp ON sp.masp = ctgh.masp
     WHERE ctgh.magh = ?`,
    [gh.magh],
  );
  if (!items.length) throw new Error("Gio hang trong.");
  for (const item of items) {
    if (item.so_luong > item.so_luong_ton)
      throw new Error(
        `"${item.ten_san_pham}" chi con ${item.so_luong_ton} trong kho.`,
      );
  }
  const tongHang = items.reduce(
    (s, i) => s + Number(i.gia_ban) * i.so_luong,
    0,
  );
  const totalQty = items.reduce((s, i) => s + i.so_luong, 0);
  const { tienGiam, mienPhiShip, appliedPromotions } = await promotionModel.tinhUuDaiTuDong(tongHang, totalQty, 'thuong');
  
  const tien_giam = tienGiam;
  const phi_ship = mienPhiShip ? 0 : 30000;
  const tong_tien = tongHang - tien_giam + phi_ship;
  const isBanking = phuong_thuc === "banking";

  const [dhResult] = await db.query(
    `INSERT INTO don_hang
    (
      mand,
      tien_giam,
      ten_nguoi_nhan,
      email_nguoi_nhan,
      sdt_nguoi_nhan,
      loai_don_hang,
      tong_tien,
      tong_da_thanh_toan,
      trang_thai,
      trang_thai_thanh_toan,
      dia_chi_giao,
      ghi_chu,
      ngay_dat,
      ngay_giao_du_kien
    )
    VALUES
    (
      ?, ?, ?, ?, ?,
      'thuong',
      ?,
      ?,
      'cho_xac_nhan',
      ?,
      ?,
      ?,
      NOW(),
      DATE_ADD(NOW(), INTERVAL 2 DAY)
    )`,
    [
      mand,
      tien_giam,
      ten_nguoi_nhan || nguoi_dung?.ho_ten || "",
      nguoi_dung?.email || "",
      sdt_nguoi_nhan || nguoi_dung?.sdt || "",
      tong_tien,
      isBanking ? 0 : tong_tien,
      "chua_thanh_toan",
      dia_chi_giao,
      ghi_chu || null,
    ],
  );
  const madh = dhResult.insertId;
  await promotionModel.saveOrderPromotions(madh, appliedPromotions);

  const ctValues = items.map((i) => [
    madh,
    i.masp,
    i.so_luong,
    i.gia_ban,
    Number(i.gia_ban) * i.so_luong,
    i.han_su_dung || null,
  ]);
  await db.query(
    "INSERT INTO chi_tiet_don_hang (madh, masp, so_luong, don_gia, thanh_tien, han_su_dung_luc_ban) VALUES ?",
    [ctValues],
  );
  await db.query(
    `INSERT INTO thanh_toan (madh, so_tien, phuong_thuc, trang_thai, ngay_thanh_toan)
     VALUES (?, ?, ?, ?, NOW())`,
     [madh, tong_tien, mapPaymentMethod(phuong_thuc), "cho_thanh_toan"],
  );
  for (const item of items) {
    await db.query(
      "UPDATE san_pham SET so_luong_ton = so_luong_ton - ? WHERE masp = ?",
      [item.so_luong, item.masp],
    );
  }

  await db.query("DELETE FROM chi_tiet_gio_hang WHERE magh = ?", [gh.magh]);

  return { madh, tong_tien };
}

async function createPreorder({
  mand,
  masp,
  so_luong,
  gia_ban,
  ngay_giao_du_kien,
  dia_chi_giao,
  phuong_thuc = "tien_mat",
  ghi_chu = "",
  nguoi_dung,
  ten_nguoi_nhan = '',
  sdt_nguoi_nhan = '',
  tien_coc = 0,
}) {
  const [[sp]] = await db.query(
    "SELECT ten_san_pham, han_su_dung FROM san_pham WHERE masp = ? AND trang_thai = 1",
    [masp],
  );
  if (!sp) throw new Error("Sản phẩm không tồn tại hoặc đã ngừng bán");

  const tong_hang = gia_ban * so_luong;
  const { tienGiam, mienPhiShip, appliedPromotions } = await promotionModel.tinhUuDaiTuDong(tong_hang, so_luong, 'dat_truoc');
  const tien_giam = tienGiam;
  const phi_ship = mienPhiShip ? 0 : 30000;
  const tong_tien = tong_hang - tien_giam + phi_ship;
  const isBanking = phuong_thuc === "banking";
  const actualDeposit = Math.min(Number(tien_coc) || 0, tong_tien);

  const [dhResult] = await db.query(
    `INSERT INTO don_hang
       (mand, tien_giam, ten_nguoi_nhan, email_nguoi_nhan, sdt_nguoi_nhan,
        loai_don_hang, tong_tien, tong_da_thanh_toan, tien_coc, trang_thai,
        trang_thai_thanh_toan, dia_chi_giao, ghi_chu, ngay_giao_du_kien, ngay_dat)
     VALUES (?, ?, ?, ?, ?, 'dat_truoc', ?, ?, ?, 'cho_xac_nhan', ?, ?, ?,
        CASE
          WHEN ? IS NULL THEN DATE_ADD(NOW(), INTERVAL 7 DAY)
          WHEN ? < DATE_ADD(NOW(), INTERVAL 3 DAY) THEN DATE_ADD(NOW(), INTERVAL 3 DAY)
          WHEN ? > DATE_ADD(NOW(), INTERVAL 60 DAY) THEN DATE_ADD(NOW(), INTERVAL 60 DAY)
          ELSE ?
        END,
        NOW())`,
    [
      mand,
      tien_giam,
      ten_nguoi_nhan || nguoi_dung?.ho_ten || "",
      nguoi_dung?.email || "",
      sdt_nguoi_nhan || nguoi_dung?.sdt || "",
      tong_tien,
      isBanking ? 0 : tong_tien,
      actualDeposit,
      isBanking ? "chua_thanh_toan" : "da_thanh_toan",
      dia_chi_giao,
      ghi_chu || null,
      ngay_giao_du_kien || null,
      ngay_giao_du_kien || null,
      ngay_giao_du_kien || null,
      ngay_giao_du_kien || null,
    ],
  );
  const madh = dhResult.insertId;
  await promotionModel.saveOrderPromotions(madh, appliedPromotions);

  await db.query(
    "INSERT INTO chi_tiet_don_hang (madh, masp, so_luong, don_gia, thanh_tien, han_su_dung_luc_ban) VALUES (?, ?, ?, ?, ?, ?)",
    [madh, masp, so_luong, gia_ban, tong_hang, sp.han_su_dung || null],
  );

  await db.query(
    `INSERT INTO thanh_toan (madh, so_tien, phuong_thuc, trang_thai, ngay_thanh_toan)
     VALUES (?, ?, ?, ?, NOW())`,
     [madh, tong_tien, mapPaymentMethod(phuong_thuc), isBanking ? "cho_thanh_toan" : "da_thanh_toan"],
  );

  return { madh, tong_tien, tien_coc: actualDeposit };
}

async function getOrdersByUser(mand) {
  const [rows] = await db.query(
    `SELECT madh, loai_don_hang, tong_tien, tien_giam, tien_coc, trang_thai,
            trang_thai_thanh_toan, dia_chi_giao, ghi_chu, ngay_dat,ngay_giao_du_kien,ngay_giao_thuc_te
     FROM don_hang WHERE mand = ? ORDER BY ngay_dat DESC`,
    [mand],
  );
  return rows;
}

async function getOrderById(madh, mand = null) {
  const cond = mand ? "AND dh.mand = ?" : "";
  const params = mand ? [madh, mand] : [madh];
  const [[dh]] = await db.query(
    `SELECT dh.*, tt.phuong_thuc, tt.trang_thai AS trang_thai_tt, tt.ngay_thanh_toan, tt.hinh_anh_chuyen_khoan, tt.ma_giao_dich
     FROM don_hang dh
     LEFT JOIN thanh_toan tt ON tt.madh = dh.madh
     WHERE dh.madh = ? ${cond}`,
    params,
  );
  if (!dh) return null;
  const [items] = await db.query(
    `SELECT ct.mactdh AS ma_chi_tiet, ct.madh, ct.masp, ct.so_luong, ct.don_gia, ct.thanh_tien, ct.han_su_dung_luc_ban, sp.ten_san_pham, hav.duong_dan AS hinh_san_pham
     FROM chi_tiet_don_hang ct
     JOIN san_pham sp ON sp.masp = ct.masp
     LEFT JOIN hinh_anh_video hav
        ON hav.masp = sp.masp AND hav.la_chinh = 1 AND hav.loai = 'hinh_anh'
     WHERE ct.madh = ?`,
    [madh],
  );
  const [khuyenMai] = await db.query(
    `SELECT dhkm.makm, km.ten_km, km.loai_uu_dai, dhkm.tien_giam_ap_dung
     FROM don_hang_khuyen_mai dhkm
     JOIN khuyen_mai km ON km.makm = dhkm.makm
     WHERE dhkm.madh = ?`,
    [madh],
  );
  return { ...dh, items, khuyen_mai: khuyenMai };
}

async function cancelOrder(madh, mand) {
  const [[dh]] = await db.query(
    "SELECT trang_thai FROM don_hang WHERE madh = ? AND mand = ?",
    [madh, mand],
  );
  if (!dh) throw new Error("Khong tim thay don hang.");
  if (dh.trang_thai !== "cho_xac_nhan")
    throw new Error("Chi co the huy don dang cho xac nhan.");
  const [items] = await db.query(
    "SELECT masp, so_luong FROM chi_tiet_don_hang WHERE madh = ?",
    [madh],
  );
  for (const item of items) {
    await db.query(
      "UPDATE san_pham SET so_luong_ton = so_luong_ton + ? WHERE masp = ?",
      [item.so_luong, item.masp],
    );
  }
  await db.query("UPDATE don_hang SET trang_thai = 'da_huy' WHERE madh = ?", [
    madh,
  ]);
  await db.query(
    "UPDATE thanh_toan SET trang_thai = 'that_bai' WHERE madh = ?",
    [madh],
  );
}

const STATUS_MESSAGES = {
  da_xac_nhan: madh => ({
    tieu_de: 'Đơn hàng đã được xác nhận',
    noi_dung: `Đơn hàng #${madh} của bạn đã được xác nhận và đang chuẩn bị giao.`,
  }),
  dang_giao: madh => ({
    tieu_de: 'Đơn hàng đang được giao',
    noi_dung: `Đơn hàng #${madh} đang trên đường giao đến bạn.`,
  }),
  da_giao: madh => ({
    tieu_de: 'Đơn hàng đã giao thành công',
    noi_dung: `Đơn hàng #${madh} đã giao thành công. Cảm ơn bạn đã mua sắm tại Chợ Nông Sản!`,
  }),
  da_huy: madh => ({
    tieu_de: 'Đơn hàng đã bị hủy',
    noi_dung: `Đơn hàng #${madh} đã bị hủy. Liên hệ shop nếu bạn cần hỗ trợ thêm.`,
  }),
};

async function updateOrderStatus(madh, trang_thai) {
  const valid = [
    "cho_xac_nhan",
    "da_xac_nhan",
    "dang_giao",
    "da_giao",
    "da_huy",
  ];
  if (!valid.includes(trang_thai)) throw new Error("Trang thai khong hop le.");

  const [[dh]] = await db.query("SELECT mand FROM don_hang WHERE madh = ?", [madh]);

  await db.query("UPDATE don_hang SET trang_thai = ? WHERE madh = ?", [
    trang_thai,
    madh,
  ]);

  if (trang_thai === "da_giao") {
    await db.query(
      `UPDATE don_hang
       SET trang_thai_thanh_toan='da_thanh_toan', ngay_giao_thuc_te=NOW()
       WHERE madh=?`,
      [madh],
    );
  }

  if (dh && STATUS_MESSAGES[trang_thai]) {
    const { tieu_de, noi_dung } = STATUS_MESSAGES[trang_thai](madh);
    await createNotification({ mand: dh.mand, tieu_de, noi_dung, loai: 'don_hang' });
  }
}

async function getAllOrders({
  page = 1,
  limit = 20,
  trang_thai = "",
  loai_don = "",
  q = "",
} = {}) {
  const conditions = [];
  const params = [];

  if (trang_thai) {
    conditions.push("dh.trang_thai = ?");
    params.push(trang_thai);
  }

  if (loai_don) {
    conditions.push("dh.loai_don_hang = ?");
    params.push(loai_don);
  }

  if (q) {
    const cleaned = q.trim().replace(/^#/, '');
    const isNumeric = /^\d+$/.test(cleaned);

    if (isNumeric) {
        conditions.push("dh.madh = ?");
        params.push(Number(cleaned));
    } else {
        conditions.push("(dh.dia_chi_giao LIKE ? OR dh.ten_nguoi_nhan LIKE ?)");
        params.push(`%${q}%`, `%${q}%`);
    }
}
  const cond = conditions.length > 0 ? "WHERE " + conditions.join(" AND ") : "";
  const [[{ total }]] = await db.query(
    `SELECT COUNT(*) AS total FROM don_hang dh ${cond}`,
    params,
  );
  const offset = (Number(page) - 1) * Number(limit);
  const [rows] = await db.query(
    `SELECT
      dh.madh, dh.loai_don_hang, dh.tong_tien, dh.tien_giam, dh.tong_da_thanh_toan, dh.tien_coc, dh.trang_thai,
      dh.trang_thai_thanh_toan, dh.ngay_dat, dh.ngay_giao_du_kien, dh.ngay_giao_thuc_te,
      dh.dia_chi_giao, dh.ghi_chu, dh.ten_nguoi_nhan, dh.sdt_nguoi_nhan,
      tt.phuong_thuc, tt.hinh_anh_chuyen_khoan, tt.ma_giao_dich
    FROM don_hang dh
    LEFT JOIN thanh_toan tt ON tt.madh = dh.madh
    ${cond}
    ORDER BY dh.ngay_dat DESC
    LIMIT ? OFFSET ?`,
    [...params, Number(limit), offset],
  );
  return { orders: rows, total: Number(total) };
}

function mapOrder(row) {
  return {
    ma_don_hang: row.madh,
    id: row.madh,
    loai_don: row.loai_don_hang,
    tong_thanh_toan: Number(row.tong_tien || 0),
    tong_da_thanh_toan: Number(row.tong_da_thanh_toan || 0),
    tien_coc: Number(row.tien_coc || 0),
    giam_gia: Number(row.tien_giam || 0),
    trang_thai: row.trang_thai,
    trang_thai_tt: row.trang_thai_thanh_toan === "da_thanh_toan" ? "da_tt" : "chua_tt",
    trang_thai_thanh_toan: row.trang_thai_thanh_toan,
    dia_chi_giao: row.dia_chi_giao,
    ghi_chu: row.ghi_chu,
    ngay_tao: row.ngay_dat,
    ngay_giao_du_kien: row.ngay_giao_du_kien,
    ngay_giao_thuc_te: row.ngay_giao_thuc_te,
    ten_nguoi_nhan: row.ten_nguoi_nhan,
    sdt_nguoi_nhan: row.sdt_nguoi_nhan,
    phuong_thuc_tt: row.phuong_thuc,
    hinh_anh_chuyen_khoan: row.hinh_anh_chuyen_khoan || '',
    ma_giao_dich: row.ma_giao_dich || '',
  };
}

async function updatePaymentSuccess(madh, { ma_giao_dich = '', du_lieu_cong = '' }) {
  const [[dh]] = await db.query(
    'SELECT tien_coc FROM don_hang WHERE madh = ?', [madh]
  );
  const depositAmount = dh ? Number(dh.tien_coc || 0) : 0;
  const amountPaid = depositAmount > 0 ? depositAmount : undefined;
  await db.query(
    `UPDATE don_hang SET trang_thai = 'da_xac_nhan',
      trang_thai_thanh_toan = 'da_thanh_toan',
      tong_da_thanh_toan = ? WHERE madh = ?`,
    [amountPaid || 0, madh],
  );
  await db.query(
    `UPDATE thanh_toan SET trang_thai = 'thanh_cong', ma_giao_dich = ?,
      du_lieu_cong = ?, ngay_thanh_toan = NOW() WHERE madh = ?`,
    [ma_giao_dich, du_lieu_cong, madh],
  );
}

async function updateBankingPayment(madh, hinh_anh = '') {
  await db.query(
    `UPDATE thanh_toan SET hinh_anh_chuyen_khoan = ? WHERE madh = ?`,
    [hinh_anh, madh],
  );
}

async function confirmBankingPayment(madh) {
  const [[dh]] = await db.query(
    'SELECT tien_coc FROM don_hang WHERE madh = ?', [madh]
  );
  const depositAmount = dh ? Number(dh.tien_coc || 0) : 0;
  const amountPaid = depositAmount > 0 ? depositAmount : 0;
  await db.query(
    `UPDATE don_hang SET trang_thai_thanh_toan = 'da_thanh_toan',
      tong_da_thanh_toan = ? WHERE madh = ?`,
    [amountPaid, madh],
  );
  await db.query(
    `UPDATE thanh_toan SET trang_thai = 'thanh_cong',
      ngay_thanh_toan = NOW() WHERE madh = ?`,
    [madh],
  );
}

async function createNotification({ mand, tieu_de, noi_dung, loai = 'don_hang' }) {
  await db.query(
    `INSERT INTO thong_bao (mand, tieu_de, noi_dung, loai, da_doc, ngay_tao)
      VALUES (?, ?, ?, ?, 0, NOW())`,
    [mand, tieu_de, noi_dung, loai]
  );
}

// Tổng hợp đơn đặt trước theo ngày giao dự kiến + sản phẩm
async function getPreorderSummary() {
  const [rows] = await db.query(
    `SELECT
        DATE_FORMAT(dh.ngay_giao_du_kien, '%Y-%m-%d') AS ngay_giao,
        ct.masp,
        sp.ten_san_pham,
        sp.don_vi,
        hav.duong_dan AS hinh_san_pham,
        SUM(ct.so_luong) AS tong_so_luong,
        COUNT(DISTINCT dh.madh) AS so_don
      FROM don_hang dh
      JOIN chi_tiet_don_hang ct ON ct.madh = dh.madh
      JOIN san_pham sp ON sp.masp = ct.masp
      LEFT JOIN hinh_anh_video hav
        ON hav.masp = sp.masp AND hav.la_chinh = 1 AND hav.loai = 'hinh_anh'
      WHERE dh.loai_don_hang = 'dat_truoc' AND dh.trang_thai != 'da_huy'
      GROUP BY DATE_FORMAT(dh.ngay_giao_du_kien, '%Y-%m-%d'), ct.masp
      ORDER BY ngay_giao ASC, tong_so_luong DESC`
  );
  return rows;
}

// Chi tiết các đơn hàng cộng dồn thành 1 dòng tổng hợp (theo ngày + sản phẩm)
async function getPreorderSummaryDetail(ngay, masp) {
  const [rows] = await db.query(
    `SELECT
        dh.madh, dh.ten_nguoi_nhan, dh.sdt_nguoi_nhan, dh.dia_chi_giao,
        dh.trang_thai, dh.trang_thai_thanh_toan,
        dh.tong_tien, dh.tong_da_thanh_toan, dh.tien_coc,
        ct.so_luong, ct.don_gia, ct.thanh_tien
      FROM don_hang dh
      JOIN chi_tiet_don_hang ct ON ct.madh = dh.madh
      WHERE dh.loai_don_hang = 'dat_truoc' AND dh.trang_thai != 'da_huy'
        AND DATE(dh.ngay_giao_du_kien) = ? AND ct.masp = ?
      ORDER BY dh.ngay_dat ASC`,
    [ngay, masp],
  );
  return rows;
}

module.exports = {
  createOrder,
  createPreorder,
  getOrdersByUser,
  getOrderById,
  cancelOrder,
  updateOrderStatus,
  getAllOrders,
  mapOrder,
  updatePaymentSuccess,
  updateBankingPayment,
  confirmBankingPayment,
  createNotification,
  getPreorderSummary,
  getPreorderSummaryDetail,
  tinhUuDaiTuDong,
};