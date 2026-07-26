const db = require('../config/db');

function removeDiacritics(str = '') {
    return str
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd');
}

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
    han_su_dung: row.han_su_dung || null,
    so_ngay_can_han: row.so_ngay_can_han != null ? Number(row.so_ngay_can_han) : 3,
    phan_tram_giam_can_han: row.phan_tram_giam_can_han != null ? Number(row.phan_tram_giam_can_han) : 0,
    trang_thai_hsd: row.trang_thai_hsd || 'con_han',
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

async function listCategories() {
    const [rows] = await db.query(
        `SELECT madm, madm AS id, ten_danh_muc, ten_danh_muc AS name, mo_ta, loai FROM danh_muc WHERE trang_thai = 1`
    );
    return rows;
}

async function createProduct({ madm, ten_san_pham, gia_ban, so_luong_ton, don_vi, khu_vuc, mo_ta = '', han_su_dung = null, so_ngay_can_han = 3, phan_tram_giam_can_han = 0 }) {
    const [result] = await db.query(
        `INSERT INTO san_pham (madm, ten_san_pham, gia_ban, so_luong_ton, don_vi, khu_vuc, mo_ta, han_su_dung, so_ngay_can_han, phan_tram_giam_can_han, trang_thai_hsd, trang_thai, ngay_tao)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'con_han', 1, NOW())`,
        [madm, ten_san_pham, gia_ban, so_luong_ton || 0, don_vi, khu_vuc, mo_ta, han_su_dung || null, so_ngay_can_han, phan_tram_giam_can_han]
    );
    return result.insertId;
}

async function updateProduct(masp, fields) {
    const allowed = ['ten_san_pham', 'gia_ban', 'so_luong_ton', 'don_vi', 'khu_vuc', 'madm', 'mo_ta', 'han_su_dung', 'so_ngay_can_han', 'phan_tram_giam_can_han', 'trang_thai_hsd'];
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

async function listAllProducts({ q = '', category = '' } = {}) {
    const conditions = ['1=1']; 
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
            con_hoat_dong: r.trang_thai === 1, 
        })),
    };
    
}

async function getActiveSeasons() {
    const [rows] = await db.query(
        `SELECT mamv, ten_mua FROM mua_vu WHERE trang_thai = 1`
    );
    return rows;
}
 

async function findProductsForChat({ keywords = [], seasonIds = [], currentMonthFallback = false } = {}, limit = 8) {
    if (!keywords.length && !seasonIds.length && currentMonthFallback) {
        const month = new Date().getMonth() + 1;
        const [rows] = await db.query(
            `SELECT DISTINCT sp.masp, sp.ten_san_pham, sp.gia_ban, sp.don_vi,
                    spmv.gia_du_kien,
                    hav.duong_dan AS hinh_anh
             FROM san_pham_mua_vu spmv
             JOIN mua_vu mv ON mv.mamv = spmv.mamv AND mv.trang_thai = 1
             JOIN san_pham sp ON sp.masp = spmv.masp AND sp.trang_thai = 1
             LEFT JOIN hinh_anh_video hav ON hav.masp = sp.masp AND hav.la_chinh = 1
             WHERE (mv.qua_nam = 0 AND ? BETWEEN mv.thang_bat_dau AND mv.thang_ket_thuc)
                OR (mv.qua_nam = 1 AND (? >= mv.thang_bat_dau OR ? <= mv.thang_ket_thuc))
             LIMIT ?`,
            [month, month, month, limit]
        );
        return rows;
    }

    if (!keywords.length && !seasonIds.length) return [];

    const [rows] = await db.query(
        `SELECT DISTINCT sp.masp, sp.ten_san_pham, sp.gia_ban, sp.don_vi,
                spmv.mamv, spmv.gia_du_kien,
                hav.duong_dan AS hinh_anh
         FROM san_pham sp
         LEFT JOIN san_pham_mua_vu spmv ON spmv.masp = sp.masp
         LEFT JOIN hinh_anh_video hav ON hav.masp = sp.masp AND hav.la_chinh = 1
         WHERE sp.trang_thai = 1`
    );

    const normalizedKeywords = keywords.map(removeDiacritics).filter(Boolean);
    const seasonIdSet = new Set(seasonIds);

    const matched = new Map();
    for (const row of rows) {
        const nameNormalized = removeDiacritics(row.ten_san_pham || '');
        const paddedName = ` ${nameNormalized} `;

        const matchesKeyword = normalizedKeywords.some((kw) => paddedName.includes(` ${kw} `));
        const matchesSeason = row.mamv != null && seasonIdSet.has(row.mamv);

        if (!matchesKeyword && !matchesSeason) continue;

        const existing = matched.get(row.masp);
        if (!existing || (matchesSeason && existing.gia_du_kien == null)) {
            matched.set(row.masp, row);
        }
        if (matched.size >= limit && !matched.has(row.masp)) break;
    }

    return Array.from(matched.values());
}
async function searchProductsForChat(keyword, limit = 6) {
    if (!keyword) return [];
    return findProductsForChat({ keywords: [keyword] }, limit);
}

module.exports = {
    listProducts, listAllProducts, getProductById,
    listCategories, createProduct, updateProduct, toggleProduct,
    searchProductsForChat, getActiveSeasons, findProductsForChat,
};