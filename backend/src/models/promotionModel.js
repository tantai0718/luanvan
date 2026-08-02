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

async function ensurePromotionTables() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS khuyen_mai (
      makm INT AUTO_INCREMENT PRIMARY KEY,
      ten_km VARCHAR(150) NOT NULL,
      loai_uu_dai ENUM('giam_theo_so_luong','mien_phi_ship') NOT NULL,
      dieu_kien_toi_thieu DECIMAL(15,2) NOT NULL,
      phan_tram_giam DECIMAL(5,2) DEFAULT NULL,
      gia_tri_giam_toi_da DECIMAL(15,2) DEFAULT NULL,
      ap_dung_cho ENUM('tat_ca','thuong_va_dat_truoc','dinh_ky') NOT NULL DEFAULT 'tat_ca',
      trang_thai TINYINT(1) NOT NULL DEFAULT '1'
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  await db.query(`
    CREATE TABLE IF NOT EXISTS don_hang_khuyen_mai (
      madhkm INT AUTO_INCREMENT PRIMARY KEY,
      madh INT NOT NULL,
      makm INT NOT NULL,
      tien_giam_ap_dung DECIMAL(15,2) DEFAULT NULL,
      UNIQUE KEY uq_dh_km (madh, makm),
      FOREIGN KEY (madh) REFERENCES don_hang(madh) ON DELETE CASCADE,
      FOREIGN KEY (makm) REFERENCES khuyen_mai(makm) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
  `);

  try {
    const [promos] = await db.query("SELECT makm, ten_km, phan_tram_giam, loai_uu_dai FROM khuyen_mai");
    for (const p of promos) {
      const formatted = formatPromoTitle(p.ten_km, p.phan_tram_giam, p.loai_uu_dai);
      if (formatted !== p.ten_km) {
        await db.query("UPDATE khuyen_mai SET ten_km = ? WHERE makm = ?", [formatted, p.makm]);
      }
    }
  } catch (err) {
    // silent fallback
  }
}

async function getActivePromotions() {
  await ensurePromotionTables();
  const [rows] = await db.query(
    "SELECT * FROM khuyen_mai WHERE trang_thai = 1 ORDER BY makm ASC"
  );
  return rows.map(r => ({
    ...r,
    ten_km: formatPromoTitle(r.ten_km, r.phan_tram_giam, r.loai_uu_dai),
  }));
}

async function tinhUuDaiTuDong(tongTien, tongSoLuong, loai_don = 'thuong') {
  await ensurePromotionTables();
  const promos = await getActivePromotions();

  let tienGiam = 0;
  let mienPhiShip = false;
  const appliedList = [];
  const appliedPromotions = [];

  for (const promo of promos) {
    const apDung = promo.ap_dung_cho;
    const isMatchOrder =
      apDung === 'tat_ca' ||
      (apDung === 'thuong_va_dat_truoc' && ['thuong', 'dat_truoc', 'thuong_va_dat_truoc'].includes(loai_don)) ||
      (apDung === 'dinh_ky' && loai_don === 'dinh_ky');

    if (!isMatchOrder) continue;

    const minVal = Number(promo.dieu_kien_toi_thieu || 0);

    if (promo.loai_uu_dai === 'giam_theo_so_luong') {
      if (tongSoLuong >= minVal) {
        const pct = Number(promo.phan_tram_giam || 0);
        let discount = Math.round(tongTien * (pct / 100));
        if (promo.gia_tri_giam_toi_da && Number(promo.gia_tri_giam_toi_da) > 0) {
          discount = Math.min(discount, Number(promo.gia_tri_giam_toi_da));
        }
        tienGiam += discount;
        appliedList.push(promo.ten_km);
        appliedPromotions.push({
          makm: promo.makm,
          ten_km: promo.ten_km,
          tien_giam_ap_dung: discount,
        });
      }
    } else if (promo.loai_uu_dai === 'mien_phi_ship') {
      if ((tongTien - tienGiam) >= minVal) {
        mienPhiShip = true;
        appliedList.push(promo.ten_km);
        appliedPromotions.push({
          makm: promo.makm,
          ten_km: promo.ten_km,
          tien_giam_ap_dung: 30000,
        });
      }
    }
  }

  return { tienGiam, mienPhiShip, appliedList, appliedPromotions };
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

async function getAllPromotions() {
  await ensurePromotionTables();
  const [rows] = await db.query("SELECT * FROM khuyen_mai ORDER BY makm DESC");
  return rows.map(r => ({
    ...r,
    ten_km: formatPromoTitle(r.ten_km, r.phan_tram_giam, r.loai_uu_dai),
  }));
}

async function getPromotionById(makm) {
  await ensurePromotionTables();
  const [[row]] = await db.query("SELECT * FROM khuyen_mai WHERE makm = ?", [makm]);
  if (!row) return null;
  return {
    ...row,
    ten_km: formatPromoTitle(row.ten_km, row.phan_tram_giam, row.loai_uu_dai),
  };
}

async function createPromotion({
  ten_km,
  loai_uu_dai,
  dieu_kien_toi_thieu,
  phan_tram_giam,
  gia_tri_giam_toi_da,
  ap_dung_cho,
  trang_thai = 1,
}) {
  await ensurePromotionTables();
  const finalTenKm = formatPromoTitle(ten_km, phan_tram_giam, loai_uu_dai);
  const [result] = await db.query(
    `INSERT INTO khuyen_mai
      (ten_km, loai_uu_dai, dieu_kien_toi_thieu, phan_tram_giam, gia_tri_giam_toi_da, ap_dung_cho, trang_thai)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      finalTenKm,
      loai_uu_dai,
      dieu_kien_toi_thieu,
      phan_tram_giam || null,
      gia_tri_giam_toi_da || null,
      ap_dung_cho || 'tat_ca',
      trang_thai,
    ]
  );
  return await getPromotionById(result.insertId);
}

async function updatePromotion(makm, {
  ten_km,
  loai_uu_dai,
  dieu_kien_toi_thieu,
  phan_tram_giam,
  gia_tri_giam_toi_da,
  ap_dung_cho,
  trang_thai,
}) {
  await ensurePromotionTables();
  const finalTenKm = formatPromoTitle(ten_km, phan_tram_giam, loai_uu_dai);
  await db.query(
    `UPDATE khuyen_mai
     SET ten_km = ?, loai_uu_dai = ?, dieu_kien_toi_thieu = ?,
         phan_tram_giam = ?, gia_tri_giam_toi_da = ?, ap_dung_cho = ?, trang_thai = ?
     WHERE makm = ?`,
    [
      finalTenKm,
      loai_uu_dai,
      dieu_kien_toi_thieu,
      phan_tram_giam !== undefined ? phan_tram_giam : null,
      gia_tri_giam_toi_da !== undefined ? gia_tri_giam_toi_da : null,
      ap_dung_cho,
      trang_thai,
      makm,
    ]
  );
  return await getPromotionById(makm);
}

async function togglePromotionStatus(makm) {
  await ensurePromotionTables();
  await db.query(
    "UPDATE khuyen_mai SET trang_thai = IF(trang_thai = 1, 0, 1) WHERE makm = ?",
    [makm]
  );
  return await getPromotionById(makm);
}

async function deletePromotion(makm) {
  await ensurePromotionTables();
  const [result] = await db.query("DELETE FROM khuyen_mai WHERE makm = ?", [makm]);
  return result.affectedRows > 0;
}

module.exports = {
  ensurePromotionTables,
  getActivePromotions,
  getAllPromotions,
  getPromotionById,
  createPromotion,
  updatePromotion,
  togglePromotionStatus,
  deletePromotion,
  tinhUuDaiTuDong,
  saveOrderPromotions,
};
