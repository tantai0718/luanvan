const express = require('express');
const router  = express.Router();
const db      = require('../config/db');
const { auth, role } = require('../middlewares/auth');

router.get('/', auth, role('admin'), async (req, res) => {
    try {
        const [[{ tong_tk }]] = await db.query(`SELECT COUNT(*) AS tong_tk FROM nguoi_dung`);
        const [[{ tong_sp }]] = await db.query(`SELECT COUNT(*) AS tong_sp FROM san_pham WHERE trang_thai = 1`);
        const [[{ tong_dh }]] = await db.query(`SELECT COUNT(*) AS tong_dh FROM don_hang`);

        // Doanh thu từ đơn hàng thường / đặt trước
        const [[{ doanh_thu_don_hang }]] = await db.query(
            `SELECT COALESCE(SUM(tong_tien),0) AS doanh_thu_don_hang 
             FROM don_hang WHERE trang_thai = 'da_giao'`
        );

        // Doanh thu từ các kỳ đã giao của gói đăng ký định kỳ
        const [[{ doanh_thu_dinh_ky }]] = await db.query(
            `SELECT COALESCE(SUM(so_lan_da_giao * gia_du_kien * so_luong), 0) AS doanh_thu_dinh_ky
             FROM dang_ky_san_pham
             WHERE loai_dang_ky = 'dinh_ky'`
        );

        const doanh_thu = Number(doanh_thu_don_hang) + Number(doanh_thu_dinh_ky);

        const [gan_day] = await db.query(`
            SELECT madh AS ma_don_hang, ten_nguoi_nhan AS ten_nguoi_mua,
                   tong_tien, trang_thai, ngay_dat AS ngay_tao
            FROM don_hang ORDER BY ngay_dat DESC LIMIT 5
        `);

        const [top_sp] = await db.query(`
            SELECT sp.ten_san_pham, sp.gia_ban, SUM(ct.so_luong) AS so_luong_ban
            FROM chi_tiet_don_hang ct
            JOIN san_pham sp ON sp.masp = ct.masp
            GROUP BY sp.masp
            ORDER BY so_luong_ban DESC LIMIT 5
        `);

        res.json({ tong_tk, tong_sp, tong_dh, doanh_thu, gan_day, top_sp });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;