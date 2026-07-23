const db = require('../config/db');

async function list(req, res) {
    try {
        const { loai } = req.query;
        let sql = `
            SELECT dm.*,
              COUNT(CASE WHEN sp.masp IS NOT NULL THEN 1 END) AS so_san_pham,
              COUNT(CASE WHEN bv.mabv IS NOT NULL THEN 1 END) AS so_bai_viet
            FROM danh_muc dm
            LEFT JOIN san_pham sp ON sp.madm = dm.madm AND sp.trang_thai = 1
            LEFT JOIN bai_viet bv ON bv.madm = dm.madm AND bv.trang_thai = 1
        `;
        const params = [];
        if (loai) { sql += ' WHERE dm.loai = ?'; params.push(loai); }
        sql += ' GROUP BY dm.madm ORDER BY dm.madm';
        const [rows] = await db.query(sql, params);
        const categories = rows.map(r => ({
            ma_danh_muc: r.madm,
            ten_danh_muc: r.ten_danh_muc,
            mo_ta: r.mo_ta || '',
            loai: r.loai || 'san_pham',
            con_hoat_dong: r.trang_thai,
            so_san_pham: Number(r.so_san_pham || 0),
            so_bai_viet: Number(r.so_bai_viet || 0),
        }));
        res.json({ categories });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

async function listProducts(req, res) {
    try {
        const [rows] = await db.query(
            `SELECT sp.*, dm.ten_danh_muc, hav.duong_dan AS hinh_chinh
       FROM san_pham sp
       LEFT JOIN danh_muc dm ON dm.madm = sp.madm
       LEFT JOIN hinh_anh_video hav
         ON hav.masp = sp.masp AND hav.la_chinh = 1 AND hav.loai = 'hinh_anh'
       WHERE sp.madm = ?
       ORDER BY sp.masp DESC`,
            [req.params.id]
        );
        const products = rows.map(r => ({
            ma_san_pham: r.masp,
            ten_san_pham: r.ten_san_pham,
            gia_ban: Number(r.gia_ban || 0),
            don_vi: r.don_vi || 'kg',
            ton_kho: Number(r.so_luong_ton || 0),
            ten_danh_muc: r.ten_danh_muc || '',
            con_hoat_dong: r.trang_thai,
            images: r.hinh_chinh ? [`/upload/${r.hinh_chinh}`] : [],
        }));
        res.json({ products });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

async function create(req, res) {
    try {
        const { ten_danh_muc, mo_ta = '', loai = 'san_pham' } = req.body;
        if (!ten_danh_muc?.trim()) return res.status(400).json({ message: 'Tên danh mục không được để trống.' });
        if (!['san_pham', 'bai_viet'].includes(loai)) return res.status(400).json({ message: 'Loại danh mục không hợp lệ.' });
        const [result] = await db.query(
            `INSERT INTO danh_muc (ten_danh_muc, mo_ta, loai, trang_thai) VALUES (?, ?, ?, 1)`,
            [ten_danh_muc.trim(), mo_ta, loai]
        );
        res.status(201).json({ message: 'Tạo danh mục thành công', id: result.insertId });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
}

async function update(req, res) {
    try {
        const { ten_danh_muc, mo_ta, loai } = req.body;
        const fields = ['ten_danh_muc = ?', 'mo_ta = ?'];
        const params = [ten_danh_muc, mo_ta || ''];
        if (loai) { fields.push('loai = ?'); params.push(loai); }
        params.push(req.params.id);
        await db.query(`UPDATE danh_muc SET ${fields.join(', ')} WHERE madm = ?`, params);
        res.json({ message: 'Cập nhật danh mục thành công' });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
}

async function toggle(req, res) {
    try {
        await db.query(
            'UPDATE danh_muc SET trang_thai = 1 - trang_thai WHERE madm = ?',
            [req.params.id]
        );
        res.json({ message: 'Đã thay đổi trạng thái danh mục' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

async function remove(req, res) {
    try {
        const [[{ count }]] = await db.query(
            'SELECT COUNT(*) AS count FROM san_pham WHERE madm = ? AND trang_thai = 1',
            [req.params.id]
        );
        if (count > 0) return res.status(400).json({ message: `Danh mục còn ${count} sản phẩm đang bán, không thể xóa.` });
        await db.query('DELETE FROM danh_muc WHERE madm = ?', [req.params.id]);
        res.json({ message: 'Đã xóa danh mục' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

module.exports = { list, listProducts, create, update, toggle, remove };
