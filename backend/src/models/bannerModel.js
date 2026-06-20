const db = require("../config/db");

async function ensureBannerTable() {
  await db.query(`
    CREATE TABLE IF NOT EXISTS banner (
      mabn INT AUTO_INCREMENT PRIMARY KEY,
      mand INT NOT NULL,
      hinh_anh VARCHAR(255) NOT NULL,
      thu_tu_hien_thi INT NOT NULL DEFAULT 1,
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

async function getAllBanners() {
  const [rows] = await db.query(
    `SELECT * FROM banner ORDER BY thu_tu_hien_thi ASC, mabn DESC`,
  );
  return rows;
}

async function createBanner({ mand, hinh_anh, thu_tu = 1, trang_thai = 1 }) {
  const [result] = await db.query(
    `INSERT INTO banner (mand, hinh_anh, thu_tu_hien_thi, trang_thai, ngay_tao)
     VALUES (?, ?, ?, ?, NOW())`,
    [mand, hinh_anh, Number(thu_tu) || 1, trang_thai ? 1 : 0],
  );
  return result.insertId;
}

async function updateBanner(id, { hinh_anh, thu_tu = 1, trang_thai = 1 }) {
  await db.query(
    `UPDATE banner SET hinh_anh=?, thu_tu_hien_thi=?, trang_thai=? WHERE mabn=?`,
    [hinh_anh, Number(thu_tu) || 1, trang_thai ? 1 : 0, id],
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
  getAllBanners,
  createBanner,
  updateBanner,
  toggleBanner,
  deleteBanner,
};