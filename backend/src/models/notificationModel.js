const db = require('../config/db');

// ── Cá nhân (giữ nguyên như cũ) ──────────────────────────────────
async function createNotification({ mand, tieu_de, noi_dung, loai = 'he_thong' }) {
    const [result] = await db.query(
        `INSERT INTO thong_bao (mand, tieu_de, noi_dung, loai, da_doc, ngay_tao)
         VALUES (?, ?, ?, ?, 0, NOW())`,
        [mand, tieu_de, noi_dung, loai]
    );
    return result.insertId;
}

async function getByUser(mand) {
    const [rows] = await db.query(
        `SELECT matb, tieu_de, noi_dung, loai, da_doc, ngay_tao
         FROM thong_bao WHERE mand = ? ORDER BY ngay_tao DESC LIMIT 50`,
        [mand]
    );
    return rows;
}

async function countUnread(mand) {
    const [[{ count }]] = await db.query(
        `SELECT COUNT(*) AS count FROM thong_bao WHERE mand = ? AND da_doc = 0`,
        [mand]
    );
    return Number(count);
}

async function markAsRead(matb, mand) {
    await db.query(`UPDATE thong_bao SET da_doc = 1 WHERE matb = ? AND mand = ?`, [matb, mand]);
}

async function markAllAsRead(mand) {
    await db.query(`UPDATE thong_bao SET da_doc = 1 WHERE mand = ? AND da_doc = 0`, [mand]);
}

// ── Lịch sử thông báo đơn hàng (loai = 'don_hang', gắn user) ─────
async function adminGetOrderHistory({ q = '', page = 1, limit = 20 } = {}) {
    const conditions = [`tb.loai = 'don_hang'`, `tb.mand IS NOT NULL`];
    const params = [];
    if (q) {
        conditions.push('(tb.tieu_de LIKE ? OR nd.ho_ten LIKE ? OR nd.email LIKE ?)');
        params.push(`%${q}%`, `%${q}%`, `%${q}%`);
    }
    const where = `WHERE ${conditions.join(' AND ')}`;

    const [[{ total }]] = await db.query(
        `SELECT COUNT(*) AS total FROM thong_bao tb JOIN nguoi_dung nd ON nd.mand = tb.mand ${where}`,
        params
    );

    const offset = (Number(page) - 1) * Number(limit);
    const [rows] = await db.query(
        `SELECT tb.matb, tb.tieu_de, tb.noi_dung, tb.da_doc, tb.ngay_tao, nd.ho_ten, nd.email
         FROM thong_bao tb
         JOIN nguoi_dung nd ON nd.mand = tb.mand
         ${where}
         ORDER BY tb.ngay_tao DESC
         LIMIT ? OFFSET ?`,
        [...params, Number(limit), offset]
    );
    return { notifications: rows, total: Number(total) };
}

// ── Thông báo chung (mand = NULL, có ảnh + bật/tắt) ──────────────
async function createGlobalNotification({ tieu_de, noi_dung, loai = 'khuyen_mai', hinh_anh = null }) {
    const [result] = await db.query(
        `INSERT INTO thong_bao (mand, tieu_de, noi_dung, loai, hinh_anh, kich_hoat, da_doc, ngay_tao)
         VALUES (NULL, ?, ?, ?, ?, 0, 0, NOW())`,
        [tieu_de, noi_dung, loai, hinh_anh]
    );
    return result.insertId;
}

async function updateGlobalNotification(matb, { tieu_de, noi_dung, loai, hinh_anh }) {
    await db.query(
        `UPDATE thong_bao SET tieu_de = ?, noi_dung = ?, loai = ?, hinh_anh = ?
         WHERE matb = ? AND mand IS NULL`,
        [tieu_de, noi_dung, loai, hinh_anh, matb]
    );
}

async function toggleGlobalNotification(matb) {
    await db.query(
        `UPDATE thong_bao SET kich_hoat = 1 - kich_hoat WHERE matb = ? AND mand IS NULL`,
        [matb]
    );
}

async function deleteGlobalNotification(matb) {
    await db.query(`DELETE FROM thong_bao WHERE matb = ? AND mand IS NULL`, [matb]);
}

// Public — chỉ lấy thông báo đang bật
async function getActiveGlobalNotifications() {
    const [rows] = await db.query(
        `SELECT matb, tieu_de, noi_dung, loai, hinh_anh, ngay_tao
         FROM thong_bao
         WHERE mand IS NULL AND kich_hoat = 1
         ORDER BY ngay_tao DESC`
    );
    return rows;
}

// Admin — lấy tất cả (kể cả đang tắt) để quản lý
async function adminGetAllGlobal() {
    const [rows] = await db.query(
        `SELECT matb, tieu_de, noi_dung, loai, hinh_anh, kich_hoat, ngay_tao
         FROM thong_bao
         WHERE mand IS NULL
         ORDER BY ngay_tao DESC`
    );
    return rows;
}

module.exports = {
    createNotification, getByUser, countUnread, markAsRead, markAllAsRead,
    adminGetOrderHistory,createGlobalNotification, updateGlobalNotification, toggleGlobalNotification,
    deleteGlobalNotification, getActiveGlobalNotifications, adminGetAllGlobal,
};