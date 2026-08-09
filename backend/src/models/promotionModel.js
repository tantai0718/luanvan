const db = require("../config/db");

function formatPromoTitle(ten_km, phan_tram_giam, loai_uu_dai) {
  if (!ten_km) return '';
  if (loai_uu_dai === 'giam_theo_so_luong' && phan_tram_giam != null) {
    const pct = Number(phan_tram_giam);
    if (pct > 0) {
      if (/Giảm\s+\d+(?:\.\d+)?%/i.test(ten_km)) {
        return ten_km.replace(/Giảm\s+\d+(?:\.\d+)?%/i, `Giảm ${pct}%`);
      } else if (/\d+(?:\.\d+)?%/.test(ten_km)) {
        return ten_km.replace(/\d+(?:\.\d+)?%/, `${pct}%`);
      }
    }
  }
  return ten_km;
}

async function getActivePromotions() {
  const [rows] = await db.query(
    `SELECT * FROM khuyen_mai WHERE trang_thai = 1 AND loai_ap_dung = 'tu_dong' ORDER BY makm ASC`
  );
  return rows.map(r => ({
    ...r,
    ten_km: formatPromoTitle(r.ten_km, r.phan_tram_giam, r.loai_uu_dai),
  }));
}

// Đếm số lần 1 tài khoản đã dùng đúng mã code này (dựa vào đơn hàng đã tạo)
async function countUserCodeUsage(mand, makm) {
  if (!mand || !makm) return 0;
  const [[{ count }]] = await db.query(
    `SELECT COUNT(*) AS count
     FROM don_hang_khuyen_mai dhkm
     JOIN don_hang dh ON dh.madh = dhkm.madh
     WHERE dh.mand = ? AND dhkm.makm = ?`,
    [mand, makm]
  );
  return Number(count);
}

// Tìm 1 mã code, kiểm tra còn hiệu lực chung (thời gian, tổng lượt dùng)
async function findValidCode(maCode) {
  if (!maCode || !maCode.trim()) return { promo: null, error: null };
  const [[promo]] = await db.query(
    `SELECT * FROM khuyen_mai WHERE ma_code = ? AND loai_ap_dung = 'nhap_ma' LIMIT 1`,
    [maCode.trim().toUpperCase()]
  );
  if (!promo) return { promo: null, error: 'Mã giảm giá không tồn tại.' };
  if (!promo.trang_thai) return { promo: null, error: 'Mã giảm giá đã bị tắt.' };
  const now = new Date();
  if (promo.ngay_bat_dau && now < new Date(promo.ngay_bat_dau)) {
    return { promo: null, error: 'Mã giảm giá chưa tới thời gian áp dụng.' };
  }
  if (promo.ngay_ket_thuc && now > new Date(promo.ngay_ket_thuc)) {
    return { promo: null, error: 'Mã giảm giá đã hết hạn.' };
  }
  if (promo.so_luong_toi_da != null && Number(promo.da_su_dung || 0) >= Number(promo.so_luong_toi_da)) {
    return { promo: null, error: 'Mã giảm giá đã hết lượt sử dụng.' };
  }
  return {
    promo: { ...promo, ten_km: formatPromoTitle(promo.ten_km, promo.phan_tram_giam, promo.loai_uu_dai) },
    error: null,
  };
}

function calcDiscountAmount(promo, tongTien) {
  let discount = Math.round(tongTien * (Number(promo.phan_tram_giam || 0) / 100));
  if (promo.gia_tri_giam_toi_da && Number(promo.gia_tri_giam_toi_da) > 0) {
    discount = Math.min(discount, Number(promo.gia_tri_giam_toi_da));
  }
  return discount;
}

function isPromoMatchOrderType(promo, loai_don) {
  const apDung = promo.ap_dung_cho;
  return (
    apDung === 'tat_ca' ||
    (apDung === 'thuong_va_dat_truoc' && ['thuong', 'dat_truoc', 'thuong_va_dat_truoc'].includes(loai_don)) ||
    (apDung === 'dinh_ky' && loai_don === 'dinh_ky')
  );
}

/**
 * Tính khuyến mãi cho đơn hàng — Option A:
 * - Ưu đãi tự động (loai_ap_dung = 'tu_dong') và Mã code (loai_ap_dung = 'nhap_ma') KHÔNG cộng dồn.
 * - Hệ thống tự chọn mức giảm CAO HƠN giữa 2 bên.
 * - Mỗi tài khoản chỉ được dùng 1 mã code tối đa `gioi_han_moi_user` lần.
 * - Miễn phí ship tính riêng, không tham gia so sánh.
 */
async function tinhUuDaiTuDong(tongTien, tongSoLuong, loai_don = 'thuong', maCode = '', mand = null) {
  // 1. Ưu đãi tự động (giảm theo số lượng)
  const [autoRows] = await db.query(
    `SELECT * FROM khuyen_mai
     WHERE trang_thai = 1 AND loai_ap_dung = 'tu_dong' AND loai_uu_dai = 'giam_theo_so_luong'`
  );
  let autoPromo = null;
  let autoDiscount = 0;
  for (const promo of autoRows) {
    if (!isPromoMatchOrderType(promo, loai_don)) continue;
    const minVal = Number(promo.dieu_kien_toi_thieu || 0);
    if (tongSoLuong >= minVal) {
      const discount = calcDiscountAmount(promo, tongTien);
      if (discount > autoDiscount) {
        autoDiscount = discount;
        autoPromo = promo;
      }
    }
  }

  // 2. Mã code (nếu khách nhập)
  let codePromo = null;
  let codeDiscount = 0;
  let codeError = null;
  if (maCode && maCode.trim()) {
    const { promo, error } = await findValidCode(maCode);
    if (error) {
      codeError = error;
    } else if (promo && !isPromoMatchOrderType(promo, loai_don)) {
      codeError = 'Mã giảm giá không áp dụng cho loại đơn hàng này.';
    } else if (promo) {
      // Kiểm tra giới hạn theo từng tài khoản
      if (mand) {
        const usedCount = await countUserCodeUsage(mand, promo.makm);
        if (usedCount >= Number(promo.gioi_han_moi_user || 1)) {
          codeError = 'Bạn đã sử dụng hết lượt cho mã giảm giá này.';
        }
      }
      if (!codeError) {
        const minVal = Number(promo.dieu_kien_toi_thieu || 0);
        if (tongTien >= minVal) {
          codeDiscount = calcDiscountAmount(promo, tongTien);
          codePromo = promo;
        } else {
          codeError = `Đơn hàng cần tối thiểu ${minVal.toLocaleString('vi-VN')}đ để dùng mã này.`;
        }
      }
    }
  }

  // 3. So sánh, chọn bên cao hơn — KHÔNG cộng dồn
  let tienGiam = 0;
  let chosenPromo = null;
  let compareMessage = null;

  if (codePromo && autoPromo) {
    if (codeDiscount >= autoDiscount) {
      tienGiam = codeDiscount;
      chosenPromo = codePromo;
      compareMessage = `Đã áp dụng mã ${codePromo.ma_code} (Giảm ${Number(codePromo.phan_tram_giam)}%). Hệ thống đã tự chọn ưu đãi cao nhất cho bạn!`;
    } else {
      tienGiam = autoDiscount;
      chosenPromo = autoPromo;
      compareMessage = `Ưu đãi tự động (Giảm ${Number(autoPromo.phan_tram_giam)}%) hiện tốt hơn mã này. Hệ thống đã giữ lại mức giảm cao nhất cho bạn!`;
    }
  } else if (codePromo) {
    tienGiam = codeDiscount;
    chosenPromo = codePromo;
    compareMessage = `Đã áp dụng mã ${codePromo.ma_code} (Giảm ${Number(codePromo.phan_tram_giam)}%).`;
  } else if (autoPromo) {
    tienGiam = autoDiscount;
    chosenPromo = autoPromo;
  }

  const appliedList = chosenPromo ? [chosenPromo.ten_km] : [];
  const appliedPromotions = chosenPromo
    ? [{ makm: chosenPromo.makm, ten_km: chosenPromo.ten_km, tien_giam_ap_dung: tienGiam }]
    : [];

  // 4. Miễn phí ship — tách riêng, luôn xét độc lập
  const [shipRows] = await db.query(
    `SELECT * FROM khuyen_mai
     WHERE trang_thai = 1 AND loai_ap_dung = 'tu_dong' AND loai_uu_dai = 'mien_phi_ship'`
  );
  let mienPhiShip = false;
  for (const promo of shipRows) {
    if (!isPromoMatchOrderType(promo, loai_don)) continue;
    const minVal = Number(promo.dieu_kien_toi_thieu || 0);
    if ((tongTien - tienGiam) >= minVal) {
      mienPhiShip = true;
      appliedList.push(promo.ten_km);
      appliedPromotions.push({ makm: promo.makm, ten_km: promo.ten_km, tien_giam_ap_dung: 30000 });
    }
  }

  return {
    tienGiam,
    mienPhiShip,
    appliedList,
    appliedPromotions,
    usedCode: codePromo ? codePromo.ma_code : null,
    codeError,
    compareMessage,
  };
}

async function saveOrderPromotions(madh, appliedPromotions) {
  if (!appliedPromotions || !appliedPromotions.length) return;
  for (const promo of appliedPromotions) {
    await db.query(
      `INSERT INTO don_hang_khuyen_mai (madh, makm, tien_giam_ap_dung)
       VALUES (?, ?, ?)
       ON DUPLICATE KEY UPDATE tien_giam_ap_dung = VALUES(tien_giam_ap_dung)`,
      [madh, promo.makm, promo.tien_giam_ap_dung]
    );
  }
}

// Tăng lượt dùng TỔNG của mã code sau khi đơn hàng đặt thành công
async function incrementCodeUsage(makm) {
  if (!makm) return;
  await db.query(
    `UPDATE khuyen_mai SET da_su_dung = da_su_dung + 1 WHERE makm = ?`,
    [makm]
  );
}

async function getAllPromotions() {
  const [rows] = await db.query("SELECT * FROM khuyen_mai ORDER BY makm DESC");
  return rows.map(r => ({
    ...r,
    ten_km: formatPromoTitle(r.ten_km, r.phan_tram_giam, r.loai_uu_dai),
  }));
}

async function getPromotionById(makm) {
  const [[row]] = await db.query("SELECT * FROM khuyen_mai WHERE makm = ?", [makm]);
  if (!row) return null;
  return {
    ...row,
    ten_km: formatPromoTitle(row.ten_km, row.phan_tram_giam, row.loai_uu_dai),
  };
}

async function createPromotion({
  ten_km,
  ma_code,
  loai_uu_dai,
  loai_ap_dung,
  dieu_kien_toi_thieu,
  phan_tram_giam,
  gia_tri_giam_toi_da,
  ap_dung_cho,
  ngay_bat_dau,
  ngay_ket_thuc,
  so_luong_toi_da,
  gioi_han_moi_user,
  trang_thai = 1,
}) {
  const finalTenKm = formatPromoTitle(ten_km, phan_tram_giam, loai_uu_dai);
  const normalizedCode = ma_code && ma_code.trim() ? ma_code.trim().toUpperCase() : null;
  const finalLoaiApDung = normalizedCode ? 'nhap_ma' : (loai_ap_dung || 'tu_dong');
  const [result] = await db.query(
    `INSERT INTO khuyen_mai
      (ten_km, ma_code, loai_uu_dai, loai_ap_dung, dieu_kien_toi_thieu, phan_tram_giam,
       gia_tri_giam_toi_da, ap_dung_cho, ngay_bat_dau, ngay_ket_thuc, so_luong_toi_da, gioi_han_moi_user, trang_thai)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      finalTenKm,
      normalizedCode,
      loai_uu_dai,
      finalLoaiApDung,
      dieu_kien_toi_thieu,
      phan_tram_giam || null,
      gia_tri_giam_toi_da || null,
      ap_dung_cho || 'tat_ca',
      ngay_bat_dau || null,
      ngay_ket_thuc || null,
      so_luong_toi_da || null,
      gioi_han_moi_user !== undefined ? Number(gioi_han_moi_user) : 1,
      trang_thai,
    ]
  );
  return await getPromotionById(result.insertId);
}

async function updatePromotion(makm, {
  ten_km,
  ma_code,
  loai_uu_dai,
  loai_ap_dung,
  dieu_kien_toi_thieu,
  phan_tram_giam,
  gia_tri_giam_toi_da,
  ap_dung_cho,
  ngay_bat_dau,
  ngay_ket_thuc,
  so_luong_toi_da,
  gioi_han_moi_user,
  trang_thai,
}) {
  const finalTenKm = formatPromoTitle(ten_km, phan_tram_giam, loai_uu_dai);
  const normalizedCode = ma_code !== undefined ? (ma_code && ma_code.trim() ? ma_code.trim().toUpperCase() : null) : undefined;
  const finalLoaiApDung = loai_ap_dung || (normalizedCode ? 'nhap_ma' : 'tu_dong');
  await db.query(
    `UPDATE khuyen_mai
     SET ten_km = ?,
         ma_code = ?,
         loai_uu_dai = ?,
         loai_ap_dung = ?,
         dieu_kien_toi_thieu = ?,
         phan_tram_giam = ?,
         gia_tri_giam_toi_da = ?,
         ap_dung_cho = ?,
         ngay_bat_dau = ?,
         ngay_ket_thuc = ?,
         so_luong_toi_da = ?,
         gioi_han_moi_user = ?,
         trang_thai = ?
     WHERE makm = ?`,
    [
      finalTenKm,
      normalizedCode,
      loai_uu_dai,
      finalLoaiApDung,
      dieu_kien_toi_thieu,
      phan_tram_giam !== undefined ? phan_tram_giam : null,
      gia_tri_giam_toi_da !== undefined ? gia_tri_giam_toi_da : null,
      ap_dung_cho,
      ngay_bat_dau || null,
      ngay_ket_thuc || null,
      so_luong_toi_da || null,
      gioi_han_moi_user !== undefined ? Number(gioi_han_moi_user) : 1,
      trang_thai,
      makm,
    ]
  );
  return await getPromotionById(makm);
}

async function togglePromotionStatus(makm) {
  await db.query(
    "UPDATE khuyen_mai SET trang_thai = IF(trang_thai = 1, 0, 1) WHERE makm = ?",
    [makm]
  );
  return await getPromotionById(makm);
}

async function deletePromotion(makm) {
  const [result] = await db.query("DELETE FROM khuyen_mai WHERE makm = ?", [makm]);
  return result.affectedRows > 0;
}

module.exports = {
  getActivePromotions,
  getAllPromotions,
  getPromotionById,
  createPromotion,
  updatePromotion,
  togglePromotionStatus,
  deletePromotion,
  tinhUuDaiTuDong,
  saveOrderPromotions,
  findValidCode,
  incrementCodeUsage,
  countUserCodeUsage,
};