const db = require('../config/db');

async function applyPromoCode(maCode, tongTien) {
    if (!maCode) return { makm: null, tien_giam: 0 };
    const [[km]] = await db.query(
        `SELECT * FROM khuyen_mai
     WHERE ma_code = ? AND trang_thai = 1
       AND NOW() BETWEEN ngay_bat_dau AND ngay_ket_thuc
       AND (so_luong IS NULL OR da_su_dung < so_luong)
       AND (so_luong_toi_thieu IS NULL OR ? >= so_luong_toi_thieu)`,
        [maCode, tongTien]
    );
    if (!km) throw new Error(`Ma giam gia "${maCode}" khong hop le hoac da het luot.`);
    let tien_giam = 0;
    if (km.loai_khuyen_mai === 'phan_tram') {
        tien_giam = Math.round(tongTien * Number(km.phan_tram_giam) / 100);
        if (km.gia_tri_giam_toi_da) tien_giam = Math.min(tien_giam, Number(km.gia_tri_giam_toi_da));
    } else {
        tien_giam = Number(km.gia_tri_giam_toi_da || 0);
    }
    return { makm: km.makm, tien_giam };
}

async function createOrder({ mand, dia_chi_giao, phuong_thuc = 'tien_mat', ma_code = '', nguoi_dung }) {
    // Buoc 1: Lay gio hang
    const [[gh]] = await db.query('SELECT magh FROM gio_hang WHERE mand = ?', [mand]);
    if (!gh) throw new Error('Gio hang trong.');

    const [items] = await db.query(
        `SELECT ctgh.masp, ctgh.so_luong, sp.gia_ban, sp.ten_san_pham, sp.so_luong_ton
     FROM chi_tiet_gio_hang ctgh
     JOIN san_pham sp ON sp.masp = ctgh.masp
     WHERE ctgh.magh = ?`,
        [gh.magh]
    );
    if (!items.length) throw new Error('Gio hang trong.');

    // Buoc 2: Kiem tra ton kho
    for (const item of items) {
        if (item.so_luong > item.so_luong_ton)
            throw new Error(`"${item.ten_san_pham}" chi con ${item.so_luong_ton} trong kho.`);
    }

    // Buoc 3: Tinh tien
    const tongHang = items.reduce((s, i) => s + Number(i.gia_ban) * i.so_luong, 0);
    const phi_ship = tongHang >= 500000 ? 0 : 30000;
    const { makm, tien_giam } = await applyPromoCode(ma_code, tongHang);
    const tong_tien = tongHang - tien_giam + phi_ship;

    // Buoc 4: Tao don hang
    const [dhResult] = await db.query(
        `INSERT INTO don_hang
       (mand, makm, tien_giam, ten_nguoi_nhan, email_nguoi_nhan, sdt_nguoi_nhan,
        loai_don_hang, tong_tien, tong_da_thanh_toan, trang_thai,
        trang_thai_thanh_toan, dia_chi_giao, ngay_dat)
     VALUES (?, ?, ?, ?, ?, ?, 'thuong', ?, 0, 'cho_xac_nhan', 'chua_thanh_toan', ?, NOW())`,
        [mand, makm, tien_giam,
            nguoi_dung?.ho_ten || '', nguoi_dung?.email || '', nguoi_dung?.sdt || '',
            tong_tien, dia_chi_giao]
    );
    const madh = dhResult.insertId;

    // Buoc 5: Luu chi tiet don
    const ctValues = items.map(i => [madh, i.masp, i.so_luong, i.gia_ban, Number(i.gia_ban) * i.so_luong]);
    await db.query(
        'INSERT INTO chi_tiet_don_hang (madh, masp, so_luong, don_gia, thanh_tien) VALUES ?',
        [ctValues]
    );

    // Buoc 6: Tao ban ghi thanh toan
    await db.query(
        `INSERT INTO thanh_toan (madh, so_tien, phuong_thuc, trang_thai, ngay_thanh_toan)
     VALUES (?, ?, ?, 'cho_thanh_toan', NOW())`,
        [madh, tong_tien, phuong_thuc]
    );

    // Buoc 7: Tru ton kho
    for (const item of items) {
        await db.query(
            'UPDATE san_pham SET so_luong_ton = so_luong_ton - ? WHERE masp = ?',
            [item.so_luong, item.masp]
        );
    }

    // Buoc 8: Tang luot dung ma KM
    if (makm) {
        await db.query('UPDATE khuyen_mai SET da_su_dung = da_su_dung + 1 WHERE makm = ?', [makm]);
    }

    // Buoc 9: Xoa gio hang
    await db.query('DELETE FROM chi_tiet_gio_hang WHERE magh = ?', [gh.magh]);

    return { madh, tong_tien };
}

async function getOrdersByUser(mand) {
    const [rows] = await db.query(
        `SELECT madh, loai_don_hang, tong_tien, tien_giam, trang_thai,
            trang_thai_thanh_toan, dia_chi_giao, ngay_dat, ngay_giao
     FROM don_hang WHERE mand = ? ORDER BY ngay_dat DESC`,
        [mand]
    );
    return rows;
}

async function getOrderById(madh, mand = null) {
    const cond = mand ? 'AND dh.mand = ?' : '';
    const params = mand ? [madh, mand] : [madh];
    const [[dh]] = await db.query(
        `SELECT dh.*, tt.phuong_thuc, tt.trang_thai AS trang_thai_tt, tt.ngay_thanh_toan
     FROM don_hang dh
     LEFT JOIN thanh_toan tt ON tt.madh = dh.madh
     WHERE dh.madh = ? ${cond}`,
        params
    );
    if (!dh) return null;
    const [items] = await db.query(
        `SELECT ct.*, sp.ten_san_pham, hav.duong_dan AS hinh_chinh
     FROM chi_tiet_don_hang ct
     JOIN san_pham sp ON sp.masp = ct.masp
     LEFT JOIN hinh_anh_video hav
       ON hav.masp = sp.masp AND hav.la_chinh = 1 AND hav.loai = 'hinh_anh'
     WHERE ct.madh = ?`,
        [madh]
    );
    return { ...dh, items };
}

async function cancelOrder(madh, mand) {
    const [[dh]] = await db.query(
        'SELECT trang_thai FROM don_hang WHERE madh = ? AND mand = ?', [madh, mand]
    );
    if (!dh) throw new Error('Khong tim thay don hang.');
    if (dh.trang_thai !== 'cho_xac_nhan') throw new Error('Chi co the huy don dang cho xac nhan.');
    const [items] = await db.query('SELECT masp, so_luong FROM chi_tiet_don_hang WHERE madh = ?', [madh]);
    for (const item of items) {
        await db.query('UPDATE san_pham SET so_luong_ton = so_luong_ton + ? WHERE masp = ?', [item.so_luong, item.masp]);
    }
    await db.query("UPDATE don_hang SET trang_thai = 'huy' WHERE madh = ?", [madh]);
    await db.query("UPDATE thanh_toan SET trang_thai = 'that_bai' WHERE madh = ?", [madh]);
}

async function updateOrderStatus(madh, trang_thai) {
    const valid = ['cho_xac_nhan', 'dang_giao', 'hoan_thanh', 'huy'];
    if (!valid.includes(trang_thai)) throw new Error('Trang thai khong hop le.');
    await db.query('UPDATE don_hang SET trang_thai = ? WHERE madh = ?', [trang_thai, madh]);
    if (trang_thai === 'hoan_thanh') {
        await db.query("UPDATE thanh_toan SET trang_thai = 'da_thanh_toan', ngay_thanh_toan = NOW() WHERE madh = ?", [madh]);
        await db.query("UPDATE don_hang SET trang_thai_thanh_toan = 'da_thanh_toan', ngay_giao = NOW() WHERE madh = ?", [madh]);
    }
}

async function getAllOrders({ page = 1, limit = 20, trang_thai = '' } = {}) {
    const cond = trang_thai ? 'WHERE dh.trang_thai = ?' : '';
    const params = trang_thai ? [trang_thai] : [];
    const [[{ total }]] = await db.query(`SELECT COUNT(*) AS total FROM don_hang dh ${cond}`, params);
    const offset = (Number(page) - 1) * Number(limit);
    const [rows] = await db.query(
        `SELECT dh.madh, dh.tong_tien, dh.tien_giam, dh.trang_thai, dh.trang_thai_thanh_toan,
            dh.ngay_dat, dh.ten_nguoi_nhan, dh.sdt_nguoi_nhan
     FROM don_hang dh ${cond} ORDER BY dh.ngay_dat DESC LIMIT ? OFFSET ?`,
        [...params, Number(limit), offset]
    );
    return { orders: rows, total: Number(total) };
}

function mapOrder(row) {
    return {
        ma_don_hang: row.madh,
        id: row.madh,
        loai_don: row.loai_don_hang,
        tong_thanh_toan: Number(row.tong_tien || 0),
        tong_da_thanh_toan: Number(row.tong_da_thanh_toan || 0),
        giam_gia: Number(row.tien_giam || 0),
        trang_thai: row.trang_thai,
        trang_thai_tt: row.trang_thai_thanh_toan === 'da_thanh_toan' ? 'da_tt' : 'chua_tt',
        trang_thai_thanh_toan: row.trang_thai_thanh_toan,
        dia_chi_giao: row.dia_chi_giao,
        ngay_tao: row.ngay_dat,
        ngay_giao_du_kien: row.ngay_giao,
        ten_nguoi_nhan: row.ten_nguoi_nhan,
        sdt_nguoi_nhan: row.sdt_nguoi_nhan,
        phuong_thuc_tt: row.phuong_thuc,
    };
}

module.exports = { createOrder, getOrdersByUser, getOrderById, cancelOrder, updateOrderStatus, getAllOrders, mapOrder };