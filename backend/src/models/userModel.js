const db = require("../config/db");

async function findByEmail(email) {
  const [rows] = await db.query(
    `SELECT nd.*, vt.ten_vai_tro
     FROM nguoi_dung nd
     LEFT JOIN vai_tro vt ON vt.mavt = nd.mavt
     WHERE TRIM(LOWER(nd.email)) = ?
     LIMIT 1`,
    [email],
  );
  return rows[0] || null;
}

async function findById(id) {
  const [rows] = await db.query(
    `SELECT nd.*, vt.ten_vai_tro
     FROM nguoi_dung nd
     LEFT JOIN vai_tro vt ON vt.mavt = nd.mavt
     WHERE nd.mand = ?
     LIMIT 1`,
    [id],
  );
  return rows[0] || null;
}

async function createUser({ ho_ten, email, mat_khau, sdt, mavt = 2 }) {
  const [result] = await db.query(
    "INSERT INTO nguoi_dung (mavt, ho_ten, email, mat_khau, sdt, trang_thai) VALUES (?, ?, ?, ?, ?, ?)",
    [mavt, ho_ten, email, mat_khau, sdt || null, 1],
  );
  return { mand: result.insertId, ho_ten, email, mavt };
}

async function updatePassword(mand, hash) {
  await db.query("UPDATE nguoi_dung SET mat_khau = ? WHERE mand = ?", [
    hash,
    mand,
  ]);
}

module.exports = { findByEmail, findById, createUser, updatePassword };
