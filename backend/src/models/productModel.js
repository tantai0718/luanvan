const db = require('../config/db');

const mapProduct = (row) => ({
    ma_san_pham: row.masp,
    ten_san_pham: row.ten_san_pham,
    mo_ta: row.mo_ta || '',
    gia_ban: Number(row.gia_ban || 0),
    don_vi: row.don_vi || 'kg',
    ton_kho: Number(row.so_luong_ton || 0),
    tinh_thanh: row.khu_vuc || '',
    khu_vuc: row.khu_vuc || '',
    ngay_tao: row.ngay_tao || null,
    ma_danh_muc: row.madm,
    ten_danh_muc: row.ten_danh_muc || '',
    ten_nong_trai: '',
    diem_danh_gia: Number(row.diem_danh_gia || 0),
    tong_danh_gia: Number(row.tong_danh_gia || 0),
    hinh_chinh: row.hinh_chinh ? `/upload/${row.hinh_chinh}` : null,
    images: row.hinh_chinh ? [`/upload/${row.hinh_chinh}`] : [],
});

async function listProducts({ q = '', category = '', sort = 'moi_nhat', inStock = '', page = 1, limit = 12 } = {}) {
    const conditions = ['sp.trang_thai = 1'];
    const params = [];

    if (q) { conditions.push('sp.ten_san_pham LIKE ?'); params.push(`%${q}%`); }
    if (category) { conditions.push('sp.madm = ?'); params.push(Number(category)); }
    if (inStock === '1') { conditions.push('sp.so_luong_ton > 0'); }

    const where = `WHERE ${conditions.join(' AND ')}`;
    const sortMap = {
        moi_nhat: 'sp.masp DESC',
        gia_tang: 'sp.gia_ban ASC',
        gia_giam: 'sp.gia_ban DESC',
        ban_chay: 'tong_danh_gia DESC',
        danh_gia: 'diem_danh_gia DESC',
    };
    const orderBy = `ORDER BY ${sortMap[sort] || sortMap.moi_nhat}`;

    const [[{ total }]] = await db.query(
        `SELECT COUNT(*) AS total FROM san_pham sp ${where}`, params
    );

    const offset = (Number(page) - 1) * Number(limit);
    const [rows] = await db.query(
        `SELECT
       sp.*,
       dm.ten_danh_muc,
       COALESCE(avg_r.diem,    0) AS diem_danh_gia,
       COALESCE(avg_r.so_luot, 0) AS tong_danh_gia,
       hav.duong_dan              AS hinh_chinh
     FROM san_pham sp
     LEFT JOIN danh_muc dm ON dm.madm = sp.madm
     LEFT JOIN (
       SELECT masp, AVG(so_sao) AS diem, COUNT(*) AS so_luot
       FROM danh_gia GROUP BY masp
     ) avg_r ON avg_r.masp = sp.masp
     LEFT JOIN hinh_anh_video hav
       ON hav.masp = sp.masp AND hav.la_chinh = 1 AND hav.loai = 'hinh_anh'
     ${where} ${orderBy}
     LIMIT ? OFFSET ?`,
        [...params, Number(limit), offset]
    );

    return { products: rows.map(mapProduct), total: Number(total) };
}

async function getProductById(id) {
    const [rows] = await db.query(
        `SELECT
       sp.*,
       dm.ten_danh_muc,
       COALESCE(avg_r.diem,    0) AS diem_danh_gia,
       COALESCE(avg_r.so_luot, 0) AS tong_danh_gia,
       hav.duong_dan              AS hinh_chinh
     FROM san_pham sp
     LEFT JOIN danh_muc dm ON dm.madm = sp.madm
     LEFT JOIN (
       SELECT masp, AVG(so_sao) AS diem, COUNT(*) AS so_luot
       FROM danh_gia GROUP BY masp
     ) avg_r ON avg_r.masp = sp.masp
     LEFT JOIN hinh_anh_video hav
       ON hav.masp = sp.masp AND hav.la_chinh = 1 AND hav.loai = 'hinh_anh'
     WHERE sp.masp = ?`,
        [id]
    );
    if (!rows[0]) return null;

    const [media] = await db.query(
        `SELECT duong_dan, loai, thumbnail, thu_tu, la_chinh
     FROM hinh_anh_video WHERE masp = ? ORDER BY thu_tu`,
        [id]
    );

    const imageUrls = media.map(m => `/upload/${m.duong_dan}`);
    return { ...mapProduct(rows[0]), images: imageUrls, con_hoat_dong: rows[0].trang_thai === 1 };
}

async function getReviews(masp) {
    const [rows] = await db.query(
        `SELECT dg.madg, dg.so_sao,
            dg.binh_luan     AS noi_dung,
            dg.ngay_danh_gia AS ngay_tao,
            nd.ho_ten        AS ten_nguoi_mua
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

async function listCategories() {
    const [rows] = await db.query(
        `SELECT madm AS id, ten_danh_muc AS name, mo_ta FROM danh_muc WHERE trang_thai = 1`
    );
    return rows;
}

async function createProduct({ madm, ten_san_pham, gia_ban, so_luong_ton, don_vi, khu_vuc }) {
    const [result] = await db.query(
        `INSERT INTO san_pham (madm, ten_san_pham, gia_ban, so_luong_ton, don_vi, khu_vuc, trang_thai, ngay_tao)
     VALUES (?, ?, ?, ?, ?, ?, 1, NOW())`,
        [madm, ten_san_pham, gia_ban, so_luong_ton || 0, don_vi, khu_vuc]
    );
    return result.insertId;
}

async function updateProduct(masp, fields) {
    const allowed = ['ten_san_pham', 'gia_ban', 'so_luong_ton', 'don_vi', 'khu_vuc', 'madm'];
    const sets = [], params = [];
    for (const key of allowed) {
        if (fields[key] !== undefined) { sets.push(`${key} = ?`); params.push(fields[key]); }
    }
    if (!sets.length) return;
    params.push(masp);
    await db.query(`UPDATE san_pham SET ${sets.join(', ')} WHERE masp = ?`, params);
}

async function toggleProduct(masp) {
    await db.query('UPDATE san_pham SET trang_thai = 1 - trang_thai WHERE masp = ?', [masp]);
}
// Dành riêng cho admin — lấy TẤT CẢ sản phẩm kể cả đang ẩn
async function listAllProducts({ q = '', category = '' } = {}) {
    const conditions = ['1=1'];  // không filter trang_thai
    const params = [];
    if (q) { conditions.push('sp.ten_san_pham LIKE ?'); params.push(`%${q}%`); }
    if (category) { conditions.push('sp.madm = ?'); params.push(Number(category)); }

    const where = `WHERE ${conditions.join(' AND ')}`;
    const [rows] = await db.query(
        `SELECT
       sp.*,
       dm.ten_danh_muc,
       COALESCE(avg_r.diem,    0) AS diem_danh_gia,
       COALESCE(avg_r.so_luot, 0) AS tong_danh_gia,
       hav.duong_dan              AS hinh_chinh
     FROM san_pham sp
     LEFT JOIN danh_muc dm ON dm.madm = sp.madm
     LEFT JOIN (
       SELECT masp, AVG(so_sao) AS diem, COUNT(*) AS so_luot
       FROM danh_gia GROUP BY masp
     ) avg_r ON avg_r.masp = sp.masp
     LEFT JOIN hinh_anh_video hav
       ON hav.masp = sp.masp AND hav.la_chinh = 1 AND hav.loai = 'hinh_anh'
     ${where}
     ORDER BY sp.masp DESC`,
        params
    );
    return {
        products: rows.map(r => ({
            ...mapProduct(r),
            con_hoat_dong: r.trang_thai === 1,  // chuyển trang_thai → con_hoat_dong cho frontend
        })),
    };
}
module.exports = {
    listProducts, listAllProducts, getProductById, getReviews, createReview,
    listCategories, createProduct, updateProduct, toggleProduct,
};
