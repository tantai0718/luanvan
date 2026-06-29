const db = require('../config/db');

async function list(req, res) {
    try {
        const [rows] = await db.query(
            `SELECT dm.*,
              COUNT(sp.masp) AS so_san_pham
       FROM danh_muc dm
       LEFT JOIN san_pham sp ON sp.madm = dm.madm AND sp.trang_thai = 1
       GROUP BY dm.madm
       ORDER BY dm.madm`
        );
        const categories = rows.map(r => ({
            ma_danh_muc: r.madm,
            ten_danh_muc: r.ten_danh_muc,
            mo_ta: r.mo_ta || '',
            bieu_tuong: '🥬',   // mặc định vì DB không có cột này
            duong_dan: '',
            thu_tu: 0,
            con_hoat_dong: r.trang_thai,
            so_san_pham: Number(r.so_san_pham || 0),
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
        const { ten_danh_muc, mo_ta = '' } = req.body;
        if (!ten_danh_muc?.trim()) return res.status(400).json({ message: 'Ten danh muc khong duoc de trong.' });
        const [result] = await db.query(
            `INSERT INTO danh_muc (ten_danh_muc, mo_ta, trang_thai) VALUES (?, ?, 1)`,
            [ten_danh_muc.trim(), mo_ta]
        );
        res.status(201).json({ message: 'Tao danh muc thanh cong', id: result.insertId });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
}

async function update(req, res) {
    try {
        const { ten_danh_muc, mo_ta } = req.body;
        await db.query(
            `UPDATE danh_muc SET ten_danh_muc = ?, mo_ta = ? WHERE madm = ?`,
            [ten_danh_muc, mo_ta || '', req.params.id]
        );
        res.json({ message: 'Cap nhat danh muc thanh cong' });
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
        res.json({ message: 'Da thay doi trang thai danh muc' });
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
        if (count > 0) return res.status(400).json({ message: `Danh muc con ${count} san pham dang ban, khong the xoa.` });
        await db.query('DELETE FROM danh_muc WHERE madm = ?', [req.params.id]);
        res.json({ message: 'Da xoa danh muc' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}

module.exports = { list, listProducts, create, update, toggle, remove };