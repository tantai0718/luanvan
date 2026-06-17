const db = require("../config/db");

async function ensureBannerTable() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS banner (
      mabn INT AUTO_INCREMENT PRIMARY KEY,
      mand INT NOT NULL,
      tieu_de VARCHAR(150) NULL,
      hinh_anh VARCHAR(255) NOT NULL,
      mo_ta VARCHAR(500) NULL,
      vi_tri ENUM('top','middle','bottom') NULL DEFAULT 'top',
      thu_tu_hien_thi INT NOT NULL DEFAULT 1,
      ngay_bat_dau DATETIME NULL,
      ngay_ket_thuc DATETIME NULL,
      trang_thai TINYINT(1) NOT NULL DEFAULT 1,
      ngay_tao DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);
}

async function getActiveBanners() {
  const [rows] = await db.query(
    `SELECT * FROM banner WHERE trang_thai = 1 ORDER BY thu_tu_hien_thi ASC, mabn DESC`,
  );
  return rows;
}

async function createBanner({
  mand,
  tieu_de,
  hinh_anh,
  mo_ta,
  vi_tri = "top",
  thu_tu = 1,
  trang_thai = 1,
}) {
  const [result] = await db.query(
    `INSERT INTO banner (mand, tieu_de, hinh_anh, mo_ta, vi_tri, thu_tu_hien_thi, trang_thai, ngay_tao)
     VALUES (?, ?, ?, ?, ?, ?, ?, NOW())`,
    [
      mand,
      tieu_de || null,
      hinh_anh,
      mo_ta || null,
      vi_tri,
      Number(thu_tu) || 1,
      trang_thai ? 1 : 0,
    ],
  );
  return result.insertId;
}

async function updateBanner(
  id,
  { tieu_de, hinh_anh, mo_ta, thu_tu = 1, trang_thai = 1 },
) {
  await db.query(
    `UPDATE banner SET tieu_de=?, hinh_anh=?, mo_ta=?, thu_tu_hien_thi=?, trang_thai=? WHERE mabn=?`,
    [
      tieu_de || null,
      hinh_anh,
      mo_ta || null,
      Number(thu_tu) || 1,
      trang_thai ? 1 : 0,
      id,
    ],
  );
}

async function toggleBanner(id) {
  await db.query("UPDATE banner SET trang_thai = NOT trang_thai WHERE mabn=?", [
    id,
  ]);
}

async function deleteBanner(id) {
  await db.query("DELETE FROM banner WHERE mabn=?", [id]);
}

module.exports = {
  ensureBannerTable,
  getActiveBanners,
  createBanner,
  updateBanner,
  toggleBanner,
  deleteBanner,
};
