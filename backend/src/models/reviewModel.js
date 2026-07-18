const db = require('../config/db');

async function getReviewsByProduct(masp) {
    const [rows] = await db.query(
        `SELECT dg.madg, dg.so_sao,
            dg.binh_luan      AS noi_dung,
            dg.ngay_danh_gia  AS ngay_tao,
            dg.phan_hoi,
            dg.ngay_phan_hoi,
            nd.ho_ten         AS ten_nguoi_mua
     FROM danh_gia dg
     LEFT JOIN nguoi_dung nd ON nd.mand = dg.mand
     WHERE dg.masp = ?
     ORDER BY dg.ngay_danh_gia DESC`,
        [masp]
    );
    return rows;
}

async function createReview({ masp, mand, so_sao, binh_luan = '' }) {
    const [result] = await db.query(
        `INSERT INTO danh_gia (mand, masp, so_sao, binh_luan, ngay_danh_gia)
     VALUES (?, ?, ?, ?, NOW())`,
        [mand, masp, Math.min(5, Math.max(1, Number(so_sao))), binh_luan]
    );
    return result.insertId;
}

async function listAllReviews({ q = '', star = '', replied = '', page = 1, limit = 10 } = {}) {
    const conditions = ['1=1'];
    const params = [];

    if (q) { conditions.push('(sp.ten_san_pham LIKE ? OR nd.ho_ten LIKE ? OR dg.binh_luan LIKE ?)'); params.push(`%${q}%`, `%${q}%`, `%${q}%`); }
    if (star) { conditions.push('dg.so_sao = ?'); params.push(Number(star)); }
    if (replied === '1') conditions.push('dg.phan_hoi IS NOT NULL');
    if (replied === '0') conditions.push('dg.phan_hoi IS NULL');

    const where = `WHERE ${conditions.join(' AND ')}`;

    const [[{ total }]] = await db.query(
        `SELECT COUNT(*) AS total
     FROM danh_gia dg
     LEFT JOIN san_pham sp ON sp.masp = dg.masp
     LEFT JOIN nguoi_dung nd ON nd.mand = dg.mand
     ${where}`, params
    );

    const offset = (Number(page) - 1) * Number(limit);
    const [rows] = await db.query(
        `SELECT dg.madg, dg.so_sao,
            dg.binh_luan     AS noi_dung,
            dg.ngay_danh_gia AS ngay_tao,
            dg.phan_hoi,
            dg.ngay_phan_hoi,
            nd.ho_ten        AS ten_nguoi_mua,
            sp.masp          AS ma_san_pham,
            sp.ten_san_pham,
            hav.duong_dan    AS hinh_san_pham
     FROM danh_gia dg
     LEFT JOIN san_pham sp ON sp.masp = dg.masp
     LEFT JOIN nguoi_dung nd ON nd.mand = dg.mand
     LEFT JOIN hinh_anh_video hav
       ON hav.masp = sp.masp AND hav.la_chinh = 1 AND hav.loai = 'hinh_anh'
     ${where}
     ORDER BY dg.ngay_danh_gia DESC
     LIMIT ? OFFSET ?`,
        [...params, Number(limit), offset]
    );

    return {
        reviews: rows.map(r => ({
            ...r,
            hinh_san_pham: r.hinh_san_pham ? `/upload/${r.hinh_san_pham}` : null,
        })),
        total: Number(total),
    };
}

async function replyReview(madg, phan_hoi) {
    await db.query(
        `UPDATE danh_gia SET phan_hoi = ?, ngay_phan_hoi = NOW() WHERE madg = ?`,
        [phan_hoi, madg]
    );
}

async function deleteReply(madg) {
    await db.query(
        `UPDATE danh_gia SET phan_hoi = NULL, ngay_phan_hoi = NULL WHERE madg = ?`,
        [madg]
    );
}

module.exports = {
    getReviewsByProduct, createReview, listAllReviews, replyReview, deleteReply,
};