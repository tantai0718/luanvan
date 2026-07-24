const express = require('express');
const router  = express.Router();
const db      = require('../config/db');
const { auth, role } = require('../middlewares/auth');

router.get('/', auth, role('admin'), async (req, res) => {
    try {
        const [[{ tong_tk }]] = await db.query(`SELECT COUNT(*) AS tong_tk FROM nguoi_dung`);
        const [[{ tong_sp }]] = await db.query(`SELECT COUNT(*) AS tong_sp FROM san_pham WHERE trang_thai = 1`);
        const [[{ tong_dh }]] = await db.query(`SELECT COUNT(*) AS tong_dh FROM don_hang`);

        // Doanh thu tổng (mọi thời gian) — đơn hàng + định kỳ
        const [[{ doanh_thu_don_hang }]] = await db.query(
            `SELECT COALESCE(SUM(tong_tien),0) AS doanh_thu_don_hang 
             FROM don_hang WHERE trang_thai = 'da_giao'`
        );
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

        // Doanh thu theo tháng (6 tháng gần nhất) — gộp đơn hàng thường + đơn định kỳ (quy về tháng bắt đầu)
        const [doanh_thu_theo_thang] = await db.query(`
            SELECT thang,
                   SUM(doanh_thu) AS doanh_thu,
                   SUM(so_don) AS so_don
            FROM (
                SELECT DATE_FORMAT(ngay_dat, '%Y-%m') AS thang,
                       CASE WHEN trang_thai = 'da_giao' THEN tong_tien ELSE 0 END AS doanh_thu,
                       1 AS so_don
                FROM don_hang
                WHERE ngay_dat >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)

                UNION ALL

                SELECT DATE_FORMAT(ngay_bat_dau, '%Y-%m') AS thang,
                       (so_lan_da_giao * gia_du_kien * so_luong) AS doanh_thu,
                       1 AS so_don
                FROM dang_ky_san_pham
                WHERE loai_dang_ky = 'dinh_ky'
                  AND ngay_bat_dau >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
            ) AS gop
            GROUP BY thang
            ORDER BY thang ASC
        `);

        const [phan_bo_trang_thai] = await db.query(`
            SELECT trang_thai, COUNT(*) AS so_luong
            FROM don_hang
            GROUP BY trang_thai
        `);

        res.json({
            tong_tk, tong_sp, tong_dh, doanh_thu, gan_day, top_sp,
            doanh_thu_theo_thang, phan_bo_trang_thai,
        });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
});

module.exports = router;