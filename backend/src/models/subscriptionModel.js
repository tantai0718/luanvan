const db = require("../config/db");
const promotionModel = require("./promotionModel");

async function ensureSubscriptionTable() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS dang_ky_san_pham (
      madk            INT AUTO_INCREMENT PRIMARY KEY,
      mand            INT NOT NULL,
      masp            INT NOT NULL,
      loai_dang_ky    ENUM('dat_truoc','dinh_ky'),
      so_luong        INT,
      gia_du_kien     DECIMAL(12,2),
      chu_ky          ENUM('hang_tuan','hai_tuan','hang_thang'),
      dia_chi_giao    TEXT,
      phuong_thuc_tt  ENUM('tien_mat','banking','vnpay') NOT NULL DEFAULT 'tien_mat',
      ngay_bat_dau    DATETIME,
      ngay_giao_tiep_theo DATETIME,
      ngay_ket_thuc   DATETIME,
      so_lan_giao     INT,
      so_lan_da_giao  INT,
      trang_thai      ENUM('dang_hoat_dong','tam_dung','hoan_thanh','da_huy') NOT NULL DEFAULT 'dang_hoat_dong',
      ghi_chu         TEXT,
      FOREIGN KEY (mand) REFERENCES nguoi_dung(mand) ON DELETE CASCADE,
      FOREIGN KEY (masp) REFERENCES san_pham(masp) ON DELETE CASCADE
    )
  `);
}

async function getProductInfo(masp) {
  const [rows] = await db.query(
    `SELECT masp, gia_ban, don_vi, ten_san_pham, trang_thai,
            han_su_dung, ngay_san_xuat, so_ngay_can_han, phan_tram_giam_can_han
     FROM san_pham WHERE masp = ? LIMIT 1`,
    [masp],
  );
  return rows[0] || null;
}

async function productExists(masp) {
  const [rows] = await db.query(
    `SELECT masp FROM san_pham WHERE masp = ? AND trang_thai = 1 LIMIT 1`,
    [masp],
  );
  return rows.length > 0;
}

async function subscriptionExists(mand, masp) {
  const [rows] = await db.query(
    `SELECT madk FROM dang_ky_san_pham
     WHERE mand = ? AND masp = ? AND loai_dang_ky = 'dinh_ky'
       AND trang_thai IN ('dang_hoat_dong','tam_dung')
     LIMIT 1`,
    [mand, masp],
  );
  return rows.length > 0;
}

function calcNextDeliveryDate(fromDate, chuKy) {
  const date = new Date(fromDate);
  if (chuKy === "hang_tuan") {
    date.setDate(date.getDate() + 7);
  } else if (chuKy === "hai_tuan") {
    date.setDate(date.getDate() + 14);
  } else {
    date.setMonth(date.getMonth() + 1);
  }
  return date;
}

async function createSubscription({
  mand,
  masp,
  so_luong,
  gia_du_kien,
  chu_ky,
  dia_chi_giao,
  phuong_thuc_tt,
  ngay_bat_dau,
  so_lan_giao,
  ghi_chu = null,
}) {
  const startDate = ngay_bat_dau ? new Date(ngay_bat_dau) : new Date();
  const nextDelivery = calcNextDeliveryDate(startDate, chu_ky);

  const [result] = await db.query(
    `INSERT INTO dang_ky_san_pham
      (mand, masp, loai_dang_ky, so_luong, gia_du_kien, chu_ky,
       dia_chi_giao, phuong_thuc_tt, ngay_bat_dau, ngay_giao_tiep_theo,
       so_lan_giao, so_lan_da_giao, trang_thai, ghi_chu)
     VALUES (?, ?, 'dinh_ky', ?, ?, ?, ?, ?, ?, ?, ?, 0, 'dang_hoat_dong', ?)`,
    [
      mand,
      masp,
      so_luong,
      gia_du_kien,
      chu_ky,
      dia_chi_giao,
      phuong_thuc_tt,
      startDate,
      nextDelivery,
      so_lan_giao,
      ghi_chu,
    ],
  );

  return getSubscriptionById(result.insertId);
}

const SELECT_FIELDS = `
  dk.madk, dk.mand, dk.masp, dk.loai_dang_ky,
  dk.so_luong, dk.gia_du_kien, dk.chu_ky,
  dk.dia_chi_giao, dk.phuong_thuc_tt,
  dk.ngay_bat_dau, dk.ngay_giao_tiep_theo, dk.ngay_ket_thuc,
  dk.so_lan_giao, dk.so_lan_da_giao,
  dk.trang_thai, dk.ghi_chu,
  sp.ten_san_pham, sp.gia_ban, sp.don_vi,
  nd.ho_ten, nd.email, nd.sdt,
  hav.duong_dan AS hinh_chinh,
  dh.madh AS order_id, dh.tong_tien AS order_tong_tien,
  COALESCE(first_dh.tien_coc, 0) AS order_tien_coc, dh.trang_thai_thanh_toan AS order_trang_thai_tt
`;

const JOINS = `
  FROM dang_ky_san_pham dk
  JOIN san_pham sp ON sp.masp = dk.masp
  JOIN nguoi_dung nd ON nd.mand = dk.mand
  LEFT JOIN hinh_anh_video hav
    ON hav.masp = sp.masp AND hav.la_chinh = 1 AND hav.loai = 'hinh_anh'
  LEFT JOIN (
    SELECT dh1.* FROM don_hang dh1
    INNER JOIN (
      SELECT madk, MAX(madh) AS max_madh FROM don_hang
      WHERE loai_don_hang = 'dinh_ky' GROUP BY madk
    ) latest ON dh1.madh = latest.max_madh
  ) dh ON dh.madk = dk.madk
  LEFT JOIN (
    SELECT madk, MAX(tien_coc) AS tien_coc FROM don_hang
    WHERE loai_don_hang = 'dinh_ky' GROUP BY madk
  ) first_dh ON first_dh.madk = dk.madk
`;

async function getUserSubscriptions(mand) {
  const [rows] = await db.query(
    `SELECT ${SELECT_FIELDS} ${JOINS}
     WHERE dk.mand = ? AND dk.loai_dang_ky = 'dinh_ky'
     ORDER BY dk.ngay_bat_dau DESC`,
    [mand],
  );
  return rows;
}

async function getAllSubscriptions() {
  const [rows] = await db.query(
    `SELECT ${SELECT_FIELDS} ${JOINS}
     WHERE dk.loai_dang_ky = 'dinh_ky'
     ORDER BY dk.ngay_bat_dau DESC`,
  );
  return rows;
}

async function getSubscriptionById(madk) {
  const [rows] = await db.query(
    `SELECT ${SELECT_FIELDS} ${JOINS}
     WHERE dk.madk = ? LIMIT 1`,
    [madk],
  );
  return rows[0] || null;
}

async function cancelSubscription(madk, mand) {
  const [result] = await db.query(
    `UPDATE dang_ky_san_pham
     SET trang_thai = 'da_huy', ngay_ket_thuc = NOW()
     WHERE madk = ? AND mand = ?`,
    [madk, mand],
  );
  return result.affectedRows > 0;
}

async function deliverSubscription(madk) {
  const current = await getSubscriptionById(madk);
  if (!current) return null;

  // KIEM TRA TON KHO TRUOC TIEN - chan ngay neu khong du hang
  const [[spBefore]] = await db.query(
    'SELECT so_luong_ton FROM san_pham WHERE masp = ?', [current.masp]
  );
  const tonKhoHienTai = spBefore ? Number(spBefore.so_luong_ton) : 0;
  const soLuongCan = Number(current.so_luong || 0);

  if (tonKhoHienTai < soLuongCan) {
    const err = new Error(
      tonKhoHienTai <= 0
        ? `Không thể ghi nhận giao hàng: sản phẩm "${current.ten_san_pham}" đã hết hàng trong kho. Vui lòng nhập thêm hàng trước khi giao.`
        : `Không thể ghi nhận giao hàng: sản phẩm "${current.ten_san_pham}" chỉ còn ${tonKhoHienTai} ${current.don_vi || 'đơn vị'} trong kho, không đủ ${soLuongCan} theo đăng ký. Vui lòng nhập thêm hàng trước khi giao.`
    );
    err.isStockError = true;
    throw err;
  }

  const newDelivered = Number(current.so_lan_da_giao || 0) + 1;
  const isDone = newDelivered >= Number(current.so_lan_giao || 0);

  const nextDelivery = isDone
    ? current.ngay_giao_tiep_theo
    : calcNextDeliveryDate(current.ngay_giao_tiep_theo, current.chu_ky);

  await db.query(
    `UPDATE dang_ky_san_pham
     SET so_lan_da_giao = ?,
         ngay_giao_tiep_theo = ?,
         trang_thai = ?
     WHERE madk = ?`,
    [newDelivered, nextDelivery, isDone ? "hoan_thanh" : current.trang_thai, madk],
  );

  await db.query(
    `UPDATE san_pham SET so_luong_ton = so_luong_ton - ? WHERE masp = ?`,
    [current.so_luong, current.masp]
  );

  await createDeliveryOrder(current, newDelivered);

  // Van giu canh bao cho KY TIEP THEO (khong lien quan ky hien tai vua giao)
  const [[spAfter]] = await db.query('SELECT so_luong_ton FROM san_pham WHERE masp = ?', [current.masp]);
  const tonKhoConLai = spAfter ? Number(spAfter.so_luong_ton) : 0;

  let stockWarning = null;
  if (!isDone && tonKhoConLai < soLuongCan) {
    stockWarning = {
      ton_kho_con_lai: tonKhoConLai,
      so_luong_can: soLuongCan,
      ten_san_pham: current.ten_san_pham,
      message: tonKhoConLai <= 0
        ? `Sản phẩm "${current.ten_san_pham}" đã hết hàng trong kho! Vui lòng nhập thêm hàng trước kỳ giao tiếp theo.`
        : `Sản phẩm "${current.ten_san_pham}" chỉ còn ${tonKhoConLai} ${current.don_vi || 'đơn vị'} trong kho, không đủ cho kỳ giao tiếp theo (cần ${soLuongCan}). Vui lòng nhập thêm hàng.`,
    };
  }

  const updated = await getSubscriptionById(madk);
  return { subscription: updated, stockWarning };
}


async function createDeliveryOrder(subscription, kyThu) {
  const soLuong = Number(subscription.so_luong || 0);
  const donGiaGoc = Number(subscription.gia_ban || 0);
  const tongHangGoc = donGiaGoc * soLuong;

  const { tienGiam, mienPhiShip } = await promotionModel.tinhUuDaiTuDong(
    tongHangGoc,
    soLuong,
    'dinh_ky',
  );

  const phiShip = mienPhiShip ? 0 : 30000;

  // Nếu là kỳ cuối cùng, đối trừ khoản cọc ban đầu vào tổng tiền kỳ cuối
  const isLastCycle = Number(kyThu) >= Number(subscription.so_lan_giao || 0);
  let tienCocDeducted = 0;
  if (isLastCycle && Number(subscription.order_tien_coc || 0) > 0) {
    tienCocDeducted = Number(subscription.order_tien_coc);
  }

  const tongTien = Math.max(0, tongHangGoc - tienGiam + phiShip - tienCocDeducted);

  const [[sp]] = await db.query(
    `SELECT han_su_dung FROM san_pham WHERE masp = ?`,
    [subscription.masp],
  );

  const [dhResult] = await db.query(
    `INSERT INTO don_hang
      (mand, madk, tien_giam, ten_nguoi_nhan, email_nguoi_nhan, sdt_nguoi_nhan,
       loai_don_hang, tong_tien, tong_da_thanh_toan, tien_coc, trang_thai,
       trang_thai_thanh_toan, dia_chi_giao, ghi_chu, ngay_dat,
       ngay_giao_du_kien, ngay_giao_thuc_te)
     VALUES (?, ?, ?, ?, ?, ?, 'dinh_ky', ?, ?, ?, 'da_giao', 'da_thanh_toan', ?, ?, NOW(), NOW(), NOW())`,
    [
      subscription.mand,
      subscription.madk,
      tienGiam,
      subscription.ho_ten || '',
      subscription.email || '',
      subscription.sdt || '',
      tongTien,
      tongTien,
      tienCocDeducted,
      subscription.dia_chi_giao,
      `Giao kỳ ${kyThu}/${subscription.so_lan_giao} - ${subscription.ten_san_pham}`,
    ],
  );
  const madh = dhResult.insertId;

  await db.query(
    `INSERT INTO chi_tiet_don_hang (madh, masp, so_luong, don_gia, thanh_tien, han_su_dung_luc_ban)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [madh, subscription.masp, soLuong, donGiaGoc, tongHangGoc, sp?.han_su_dung || null],
  );

  await db.query(
    `INSERT INTO thanh_toan (madh, so_tien, phuong_thuc, trang_thai, ngay_thanh_toan)
     VALUES (?, ?, ?, 'da_thanh_toan', NOW())`,
    [madh, tongTien, subscription.phuong_thuc_tt === 'banking' ? 'banking' : 'tien_mat'],
  );

  return madh;
}

async function getSubscriptionSummary() {
  const [rows] = await db.query(
    `SELECT
        DATE_FORMAT(dk.ngay_giao_tiep_theo, '%Y-%m-%d') AS ngay_giao,
        dk.masp,
        sp.ten_san_pham,
        sp.don_vi,
        hav.duong_dan AS hinh_san_pham,
        SUM(dk.so_luong) AS tong_so_luong,
        COUNT(DISTINCT dk.madk) AS so_don
      FROM dang_ky_san_pham dk
      JOIN san_pham sp ON sp.masp = dk.masp
      LEFT JOIN hinh_anh_video hav
        ON hav.masp = sp.masp AND hav.la_chinh = 1 AND hav.loai = 'hinh_anh'
      WHERE dk.loai_dang_ky = 'dinh_ky' AND dk.trang_thai = 'dang_hoat_dong'
      GROUP BY DATE_FORMAT(dk.ngay_giao_tiep_theo, '%Y-%m-%d'), dk.masp
      ORDER BY ngay_giao ASC, tong_so_luong DESC`
  );
  return rows;
}

async function getSubscriptionSummaryDetail(ngay, masp) {
  const [rows] = await db.query(
    `SELECT
        dk.madk,
        nd.ho_ten,
        nd.sdt,
        dk.dia_chi_giao,
        dk.trang_thai,
        dk.so_luong,
        dk.gia_du_kien,
        dk.so_lan_giao,
        dk.so_lan_da_giao,
        dk.chu_ky
      FROM dang_ky_san_pham dk
      JOIN nguoi_dung nd ON nd.mand = dk.mand
      WHERE dk.loai_dang_ky = 'dinh_ky' AND dk.trang_thai = 'dang_hoat_dong'
        AND DATE(dk.ngay_giao_tiep_theo) = ? AND dk.masp = ?
      ORDER BY dk.ngay_bat_dau ASC`,
    [ngay, masp],
  );
  return rows;
}

module.exports = {
  ensureSubscriptionTable,
  getProductInfo,
  productExists,
  subscriptionExists,
  createSubscription,
  getUserSubscriptions,
  getAllSubscriptions,
  getSubscriptionById,
  cancelSubscription,
  deliverSubscription,
  getSubscriptionSummary,
  getSubscriptionSummaryDetail,
};