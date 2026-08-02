const db = require('../config/db');

function removeDiacritics(str = '') {
    return str
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/đ/g, 'd');
}

function formatDateOnly(value) {
    if (!value) return null;
    if (typeof value === 'string') return value.slice(0, 10);
    const y = value.getFullYear();
    const m = String(value.getMonth() + 1).padStart(2, '0');
    const d = String(value.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}
function calculateHsdStatus(hanSuDung, soNgayCanHan, ngaySanXuat = null) {
    if (!hanSuDung) return 'con_han';
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const nsx = ngaySanXuat ? new Date(ngaySanXuat) : null;
    const nsxDay = nsx ? new Date(nsx.getFullYear(), nsx.getMonth(), nsx.getDate()) : null;
    const refDate = (nsxDay && nsxDay > today) ? nsxDay : today;
    const expiry = new Date(hanSuDung);
    const expiryDay = new Date(expiry.getFullYear(), expiry.getMonth(), expiry.getDate());
    const daysLeft = Math.round((expiryDay - refDate) / (1000 * 60 * 60 * 24));

    if (daysLeft < 0) return 'het_han';
    if (daysLeft <= Number(soNgayCanHan != null ? soNgayCanHan : 3)) return 'can_han';
    return 'con_han';
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
    han_su_dung: formatDateOnly(row.han_su_dung),
    ngay_san_xuat: formatDateOnly(row.ngay_san_xuat),
    so_ngay_can_han: row.so_ngay_can_han != null ? Number(row.so_ngay_can_han) : 3,
    phan_tram_giam_can_han: row.phan_tram_giam_can_han != null ? Number(row.phan_tram_giam_can_han) : 0,
    trang_thai_hsd: calculateHsdStatus(row.han_su_dung, row.so_ngay_can_han, row.ngay_san_xuat),
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

async function createProduct({ madm, ten_san_pham, gia_ban, so_luong_ton, don_vi, khu_vuc, mo_ta = '', han_su_dung = null, ngay_san_xuat = null, so_ngay_can_han = 3, phan_tram_giam_can_han = 0 }) {
    const trang_thai_hsd = calculateHsdStatus(han_su_dung, so_ngay_can_han, ngay_san_xuat);
    const trang_thai = trang_thai_hsd === 'het_han' ? 0 : 1;
    const [result] = await db.query(
        `INSERT INTO san_pham (madm, ten_san_pham, gia_ban, so_luong_ton, don_vi, khu_vuc, mo_ta, han_su_dung, ngay_san_xuat, so_ngay_can_han, phan_tram_giam_can_han, trang_thai_hsd, trang_thai, ngay_tao)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
        [madm, ten_san_pham, gia_ban, so_luong_ton || 0, don_vi, khu_vuc, mo_ta, han_su_dung || null, ngay_san_xuat || null, so_ngay_can_han, phan_tram_giam_can_han, trang_thai_hsd, trang_thai]
    );
    return result.insertId;
}

async function updateProduct(masp, fields) {
    if (fields.han_su_dung !== undefined || fields.so_ngay_can_han !== undefined || fields.ngay_san_xuat !== undefined) {
        const [[current]] = await db.query('SELECT han_su_dung, ngay_san_xuat, so_ngay_can_han, trang_thai FROM san_pham WHERE masp = ?', [masp]);
        const hsd = fields.han_su_dung !== undefined ? fields.han_su_dung : current?.han_su_dung;
        const nsx = fields.ngay_san_xuat !== undefined ? fields.ngay_san_xuat : current?.ngay_san_xuat;
        const snch = fields.so_ngay_can_han !== undefined ? fields.so_ngay_can_han : current?.so_ngay_can_han;
        fields.trang_thai_hsd = calculateHsdStatus(hsd, snch, nsx);
        // Nếu hết hạn và đang hiển thị → tự ẩn
        if (fields.trang_thai_hsd === 'het_han' && fields.trang_thai === undefined) {
            fields.trang_thai = 0;
        }
    }
    const allowed = ['ten_san_pham', 'gia_ban', 'so_luong_ton', 'don_vi', 'khu_vuc', 'madm', 'mo_ta', 'han_su_dung', 'ngay_san_xuat', 'so_ngay_can_han', 'phan_tram_giam_can_han', 'trang_thai_hsd', 'trang_thai'];
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

// Tự động ẩn các sản phẩm đã hết hạn sử dụng
async function autoHideExpiredProducts() {
    try {
        const now = new Date();
        const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
        // Lấy các sản phẩm có han_su_dung đã qua, đang hiển thị (trang_thai=1)
        const [rows] = await db.query(
            `SELECT masp, han_su_dung, ngay_san_xuat, so_ngay_can_han FROM san_pham
             WHERE trang_thai = 1 AND han_su_dung IS NOT NULL AND DATE(han_su_dung) < ?`,
            [today]
        );
        let hiddenCount = 0;
        for (const row of rows) {
            const status = calculateHsdStatus(row.han_su_dung, row.so_ngay_can_han, row.ngay_san_xuat);
            if (status === 'het_han') {
                await db.query(
                    `UPDATE san_pham SET trang_thai = 0, trang_thai_hsd = 'het_han' WHERE masp = ?`,
                    [row.masp]
                );
                hiddenCount++;
            }
        }
        if (hiddenCount > 0) {
            console.log(`[Auto-hide] Đã ẩn ${hiddenCount} sản phẩm hết hạn sử dụng.`);
        }
        return hiddenCount;
    } catch (err) {
        console.error('[Auto-hide] Lỗi khi tự động ẩn sản phẩm hết hạn:', err.message);
        return 0;
    }
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
    calculateHsdStatus, autoHideExpiredProducts,
};