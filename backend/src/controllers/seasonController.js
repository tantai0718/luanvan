const db = require('../config/db');

exports.list = async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT mv.*,
                    COUNT(spmv.maspmv) AS so_san_pham
             FROM mua_vu mv
             LEFT JOIN san_pham_mua_vu spmv ON spmv.mamv = mv.mamv
             GROUP BY mv.mamv
             ORDER BY mv.mamv`
        );
        res.json({ seasons: rows });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.listProducts = async (req, res) => {
    try {
        const [rows] = await db.query(
            `SELECT spmv.maspmv, spmv.masp, spmv.so_luong_du_kien, spmv.so_luong_thuc_te,
                    spmv.gia_du_kien, spmv.ghi_chu,
                    sp.ten_san_pham, sp.gia_ban, sp.don_vi,
                    hav.duong_dan AS hinh_chinh
             FROM san_pham_mua_vu spmv
             JOIN san_pham sp ON sp.masp = spmv.masp
             LEFT JOIN hinh_anh_video hav
               ON hav.masp = sp.masp AND hav.la_chinh = 1 AND hav.loai = 'hinh_anh'
             WHERE spmv.mamv = ?
             ORDER BY spmv.maspmv DESC`,
            [req.params.id]
        );
        const products = rows.map(r => ({
            maspmv: r.maspmv,
            masp: r.masp,
            ten_san_pham: r.ten_san_pham,
            gia_ban: Number(r.gia_ban || 0),
            don_vi: r.don_vi,
            so_luong_du_kien: r.so_luong_du_kien,
            so_luong_thuc_te: r.so_luong_thuc_te,
            gia_du_kien: r.gia_du_kien !== null ? Number(r.gia_du_kien) : null,
            ghi_chu: r.ghi_chu || '',
            hinh_anh: r.hinh_chinh ? `/upload/${r.hinh_chinh}` : null,
        }));
        res.json({ products });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.create = async (req, res) => {
    try {
        const { ten_mua, thang_bat_dau, thang_ket_thuc, qua_nam, mo_ta = '' } = req.body;

        if (!ten_mua?.trim()) return res.status(400).json({ message: 'Tên mùa vụ không được để trống.' });
        if (!thang_bat_dau || !thang_ket_thuc) return res.status(400).json({ message: 'Vui lòng chọn tháng bắt đầu và kết thúc.' });

        const [result] = await db.query(
            `INSERT INTO mua_vu (ten_mua, thang_bat_dau, thang_ket_thuc, qua_nam, mo_ta, trang_thai)
             VALUES (?, ?, ?, ?, ?, 1)`,
            [ten_mua.trim(), Number(thang_bat_dau), Number(thang_ket_thuc), qua_nam ? 1 : 0, mo_ta]
        );
        res.status(201).json({ message: 'Tạo mùa vụ thành công', id: result.insertId });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

exports.update = async (req, res) => {
    try {
        const { ten_mua, thang_bat_dau, thang_ket_thuc, qua_nam, mo_ta } = req.body;
        await db.query(
            `UPDATE mua_vu
             SET ten_mua = ?, thang_bat_dau = ?, thang_ket_thuc = ?, qua_nam = ?, mo_ta = ?
             WHERE mamv = ?`,
            [ten_mua, Number(thang_bat_dau), Number(thang_ket_thuc), qua_nam ? 1 : 0, mo_ta || '', req.params.id]
        );
        res.json({ message: 'Cập nhật mùa vụ thành công' });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

exports.toggle = async (req, res) => {
    try {
        await db.query('UPDATE mua_vu SET trang_thai = 1 - trang_thai WHERE mamv = ?', [req.params.id]);
        res.json({ message: 'Đã thay đổi trạng thái mùa vụ' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.remove = async (req, res) => {
    try {
        const [[{ count }]] = await db.query(
            'SELECT COUNT(*) AS count FROM san_pham_mua_vu WHERE mamv = ?',
            [req.params.id]
        );
        if (count > 0) {
            return res.status(400).json({ message: `Mùa vụ còn ${count} sản phẩm đang gắn, hãy gỡ hết trước khi xóa.` });
        }
        await db.query('DELETE FROM mua_vu WHERE mamv = ?', [req.params.id]);
        res.json({ message: 'Đã xóa mùa vụ' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};

exports.addProduct = async (req, res) => {
    try {
        const { masp, so_luong_du_kien, gia_du_kien, ghi_chu = '' } = req.body;
        if (!masp) return res.status(400).json({ message: 'Vui lòng chọn sản phẩm.' });

        const [result] = await db.query(
            `INSERT INTO san_pham_mua_vu (masp, mamv, so_luong_du_kien, gia_du_kien, ghi_chu)
             VALUES (?, ?, ?, ?, ?)
             ON DUPLICATE KEY UPDATE
               so_luong_du_kien = VALUES(so_luong_du_kien),
               gia_du_kien = VALUES(gia_du_kien),
               ghi_chu = VALUES(ghi_chu)`,
            [masp, req.params.id, so_luong_du_kien || null, gia_du_kien || null, ghi_chu]
        );
        res.status(201).json({ message: 'Đã gắn sản phẩm vào mùa vụ', id: result.insertId });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
};

exports.removeProduct = async (req, res) => {
    try {
        await db.query(
            'DELETE FROM san_pham_mua_vu WHERE mamv = ? AND masp = ?',
            [req.params.id, req.params.masp]
        );
        res.json({ message: 'Đã gỡ sản phẩm khỏi mùa vụ' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
};