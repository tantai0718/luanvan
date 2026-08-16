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
    const expiry = new Date(hanSuDung);
    const expiryDay = new Date(expiry.getFullYear(), expiry.getMonth(), expiry.getDate());
    const daysLeft = Math.round((expiryDay - today) / (1000 * 60 * 60 * 24));

    if (daysLeft < 0) return 'het_han';
    if (daysLeft <= Number(soNgayCanHan != null ? soNgayCanHan : 3)) return 'can_han';
    return 'con_han';
}

// kiểm tra tháng chỉ định có nằm trong khoảng mùa vụ hay không (xử lý cả trường hợp mùa vắt qua năm mới)
function isMonthInSeasonRange(month, thangBatDau, thangKetThuc, quaNam) {
    if (thangBatDau == null || thangKetThuc == null) return false;
    if (quaNam) {
        return month >= thangBatDau || month <= thangKetThuc;
    }
    return month >= thangBatDau && month <= thangKetThuc;
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

    if (q) {
        conditions.push('(sp.ten_san_pham LIKE ? OR sp.mo_ta LIKE ?)');
        params.push(`%${q}%`, `%${q}%`);
    }
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

async function autoHideExpiredProducts() {
    try {
        const now = new Date();
        const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
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
    if (q) {
        conditions.push('(sp.ten_san_pham LIKE ? OR sp.mo_ta LIKE ?)');
        params.push(`%${q}%`, `%${q}%`);
    }
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
        `SELECT mamv, ten_mua, thang_bat_dau, thang_ket_thuc, qua_nam, mo_ta FROM mua_vu WHERE trang_thai = 1`
    );
    return rows;
}

// Lấy TẤT CẢ mùa vụ đang áp dụng có chứa 1 tháng chỉ định.
async function getSeasonsByMonth(month) {
    const seasons = await getActiveSeasons();
    return seasons.filter(s =>
        isMonthInSeasonRange(month, s.thang_bat_dau, s.thang_ket_thuc, s.qua_nam)
    );
}

 
async function findProductsForChat({ keywords = [], seasonIds = [], targetMonth = null, isFutureQuery = false } = {}, limit = 8) {
    const currentMonth = new Date().getMonth() + 1;

    // Đã có ý định rõ ràng về tháng/mùa -> chế độ nghiêm ngặt, không dùng từ khoá tự do
    const strictSeasonMode = targetMonth != null || isFutureQuery;

    const [rows] = await db.query(
        `SELECT DISTINCT sp.masp, sp.ten_san_pham, sp.mo_ta, sp.gia_ban, sp.don_vi, sp.so_luong_ton,
                spmv.mamv, spmv.gia_du_kien,
                mv.thang_bat_dau, mv.thang_ket_thuc, mv.qua_nam, mv.ten_mua,
                hav.duong_dan AS hinh_anh
         FROM san_pham sp
         LEFT JOIN san_pham_mua_vu spmv ON spmv.masp = sp.masp
         LEFT JOIN mua_vu mv ON mv.mamv = spmv.mamv AND mv.trang_thai = 1
         LEFT JOIN hinh_anh_video hav ON hav.masp = sp.masp AND hav.la_chinh = 1
         WHERE sp.trang_thai = 1`
    );

    const normalizedKeywords = keywords.map(removeDiacritics).filter(Boolean);
    const seasonIdSet = new Set(seasonIds);

    const matched = new Map();
    for (const row of rows) {
        const nameNormalized = removeDiacritics(row.ten_san_pham || '');
        const descNormalized = removeDiacritics(row.mo_ta || '');
        const fullTextPadded = ` ${nameNormalized} ${descNormalized} `;

        // Trong chế độ nghiêm ngặt (đã biết rõ tháng/mùa), KHÔNG xét match theo từ khoá tự do
        const matchesKeyword = !strictSeasonMode && normalizedKeywords.some((kw) => fullTextPadded.includes(kw));
        const matchesSeason = row.mamv != null && seasonIdSet.has(row.mamv);

        let matchesTargetMonth = false;
        if (targetMonth != null && row.mamv != null) {
            matchesTargetMonth = isMonthInSeasonRange(targetMonth, row.thang_bat_dau, row.thang_ket_thuc, row.qua_nam);
        }

        // Câu hỏi "sắp tới có gì" mà chưa nêu tháng cụ thể -> lấy sản phẩm thuộc mùa
        // có tháng bắt đầu SAU tháng hiện tại (mùa kế tiếp gần nhất)
        let matchesFutureSeason = false;
        let futureDistance = null;
        if (isFutureQuery && targetMonth == null && row.mamv != null) {
            // ví dụ đang tháng 12 thì mùa bắt đầu tháng 1 có khoảng cách 1 tháng.
            const startMonth = Number(row.thang_bat_dau);
            if (startMonth >= 1 && startMonth <= 12) {
                futureDistance = (startMonth - currentMonth + 12) % 12;
                matchesFutureSeason = futureDistance > 0;
            }
        }

        if (!matchesKeyword && !matchesSeason && !matchesTargetMonth && !matchesFutureSeason) continue;

        let trangThaiMuaVu = 'thuong';
        const conHang = Number(row.so_luong_ton) > 0;
        if (row.mamv != null) {
            if (conHang) {
                trangThaiMuaVu = 'dang_ban';
            } else {
                const isCurrentlyInSeason = isMonthInSeasonRange(currentMonth, row.thang_bat_dau, row.thang_ket_thuc, row.qua_nam);

                if (isFutureQuery) {
                    trangThaiMuaVu = 'sap_toi';
                } else if (targetMonth != null) {
                    trangThaiMuaVu = targetMonth === currentMonth && isCurrentlyInSeason ? 'dang_ban' : 'sap_toi';
                } else {
                    trangThaiMuaVu = isCurrentlyInSeason ? 'dang_ban' : 'sap_toi';
                }
            }
        }
        row.trang_thai_mua_vu = trangThaiMuaVu;
        row.futureDistance = futureDistance;

        const isHighPriority = matchesTargetMonth || matchesSeason || matchesFutureSeason;
        row.isHighPriority = isHighPriority;

        const existing = matched.get(row.masp);
        if (
            !existing ||
            (isFutureQuery && targetMonth == null && futureDistance != null &&
                (existing.futureDistance == null || futureDistance < existing.futureDistance)) ||
            (isHighPriority && !existing.isHighPriority)
        ) {
            matched.set(row.masp, row);
        }
    }

    let resultList = Array.from(matched.values());

    // Với câu hỏi chung "sắp tới có mùa nào", chỉ trả về MÙA KẾ TIẾP GẦN NHẤT,
    // không trả về mùa đang diễn ra hoặc tất cả mùa của các tháng sau đó.
    if (isFutureQuery && targetMonth == null) {
        const distances = resultList
            .map(row => row.futureDistance)
            .filter(distance => distance != null && distance > 0);
        if (distances.length) {
            const nearestDistance = Math.min(...distances);
            resultList = resultList.filter(row => row.futureDistance === nearestDistance);
        }
    }

    resultList.sort((a, b) =>
        (a.futureDistance ?? Number.MAX_SAFE_INTEGER) - (b.futureDistance ?? Number.MAX_SAFE_INTEGER) ||
        (b.isHighPriority ? 1 : 0) - (a.isHighPriority ? 1 : 0)
    );
    return resultList.slice(0, limit);
}

async function searchProductsForChat(keyword, limit = 6) {
    if (!keyword) return [];
    return findProductsForChat({ keywords: [keyword] }, limit);
}

module.exports = {
    listProducts, listAllProducts, getProductById,
    listCategories, createProduct, updateProduct, toggleProduct,
    searchProductsForChat, getActiveSeasons, getSeasonsByMonth, findProductsForChat,
    calculateHsdStatus, autoHideExpiredProducts,
};
