const express  = require('express');
const router   = express.Router();
const db       = require('../config/db');
const { auth, role } = require('../middlewares/auth');
const authCtrl = require('../controllers/authController');
const { parseImages, serializeImages } = require('../utils/images');

const createWarehouseInvoiceNumber = (type, warehouseId) =>
  `HD-${type === 'nhap_kho' ? 'NK' : 'XK'}-${warehouseId}-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

async function syncStockAlert(conn, maKho, maSanPham) {
  const [[product]] = await conn.query(
    'SELECT ton_kho, ton_kho_toi_thieu FROM san_pham WHERE ma_san_pham=?',
    [maSanPham]
  );

  if (!product) return;

  if (Number(product.ton_kho) <= Number(product.ton_kho_toi_thieu || 0)) {
    await conn.query(
      `INSERT INTO canh_bao_kho (ma_san_pham, ma_kho, ton_hien_tai, ton_toi_thieu)
       VALUES (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE ton_hien_tai=?, ton_toi_thieu=?, da_xu_ly=0`,
      [
        maSanPham,
        maKho,
        product.ton_kho,
        product.ton_kho_toi_thieu,
        product.ton_kho,
        product.ton_kho_toi_thieu,
      ]
    );
  } else {
    await conn.query(
      'UPDATE canh_bao_kho SET ton_hien_tai=?, ton_toi_thieu=?, da_xu_ly=1, ngay_xu_ly=NOW() WHERE ma_san_pham=? AND ma_kho=?',
      [product.ton_kho, product.ton_kho_toi_thieu, maSanPham, maKho]
    );
  }
}

async function createAutoWarehouseIssueInvoices(conn, orderId, items, actorId) {
  const allocationsByWarehouse = new Map();

  for (const item of items) {
    const [stockRows] = await conn.query(
      'SELECT ma_kho, so_luong, han_su_dung, vi_tri_kho FROM ton_kho WHERE ma_san_pham=? AND so_luong>0 ORDER BY han_su_dung IS NULL, han_su_dung ASC, so_luong DESC, ma_kho ASC',
      [item.ma_san_pham]
    );

    let remaining = Number(item.so_luong);

    for (const stockRow of stockRows) {
      if (remaining <= 0) break;

      const allocated = Math.min(remaining, Number(stockRow.so_luong));
      remaining -= allocated;

      await conn.query(
        'UPDATE ton_kho SET so_luong=so_luong-? WHERE ma_kho=? AND ma_san_pham=?',
        [allocated, stockRow.ma_kho, item.ma_san_pham]
      );

      if (!allocationsByWarehouse.has(stockRow.ma_kho)) {
        allocationsByWarehouse.set(stockRow.ma_kho, []);
      }

      allocationsByWarehouse.get(stockRow.ma_kho).push({
        ...item,
        so_luong: allocated,
        thanh_tien: allocated * Number(item.gia_ban),
        han_su_dung: stockRow.han_su_dung,
        vi_tri_kho: stockRow.vi_tri_kho,
      });
    }

    if (stockRows.length > 0 && remaining > 0) {
      throw new Error(`Tá»“n kho trong cÃ¡c kho khÃ´ng Ä‘á»§ cho sáº£n pháº©m "${item.ten_san_pham}"`);
    }
  }

  for (const [maKho, warehouseItems] of allocationsByWarehouse.entries()) {
    const tongTien = warehouseItems.reduce((sum, item) => sum + Number(item.thanh_tien || 0), 0);
    const [invoice] = await conn.query(
      `INSERT INTO hoa_don
        (so_hoa_don, loai_hoa_don, ma_kho, ma_nong_dan, ma_don_hang, nguoi_tao, tong_tien, ghi_chu)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        createWarehouseInvoiceNumber('xuat_kho', maKho),
        'xuat_kho',
        maKho,
        null,
        orderId,
        actorId,
        tongTien,
        `Xuáº¥t kho tá»± Ä‘á»™ng tá»« Ä‘Æ¡n hÃ ng #${orderId}`,
      ]
    );

    for (const item of warehouseItems) {
      await conn.query(
        `INSERT INTO chi_tiet_hoa_don
          (ma_hoa_don, ma_san_pham, ten_san_pham, so_luong, don_vi, don_gia, thanh_tien, han_su_dung, vi_tri_kho)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          invoice.insertId,
          item.ma_san_pham,
          item.ten_san_pham,
          item.so_luong,
          item.don_vi,
          item.gia_ban,
          item.thanh_tien,
          item.han_su_dung || null,
          item.vi_tri_kho || null,
        ]
      );

      const [[currentStock]] = await conn.query(
        'SELECT so_luong FROM ton_kho WHERE ma_kho=? AND ma_san_pham=?',
        [maKho, item.ma_san_pham]
      );

      const tonSau = Number(currentStock?.so_luong || 0);
      const tonTruoc = tonSau + Number(item.so_luong);

      await conn.query(
        `INSERT INTO lich_su_kho
          (ma_kho, ma_san_pham, ma_hoa_don, loai_phieu, so_luong, ton_truoc, ton_sau)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [maKho, item.ma_san_pham, invoice.insertId, 'xuat_kho', item.so_luong, tonTruoc, tonSau]
      );

      await syncStockAlert(conn, maKho, item.ma_san_pham);
    }

    await conn.query(
      "UPDATE hoa_don SET trang_thai='da_xac_nhan', ngay_xac_nhan=NOW() WHERE ma_hoa_don=?",
      [invoice.insertId]
    );
  }
}

async function restoreWarehouseStockForOrder(conn, orderId) {
  const [invoices] = await conn.query(
    "SELECT * FROM hoa_don WHERE ma_don_hang=? AND loai_hoa_don='xuat_kho' AND trang_thai='da_xac_nhan'",
    [orderId]
  );

  for (const invoice of invoices) {
    const [items] = await conn.query(
      'SELECT * FROM chi_tiet_hoa_don WHERE ma_hoa_don=?',
      [invoice.ma_hoa_don]
    );

    for (const item of items) {
      const [existing] = await conn.query(
        'SELECT so_luong FROM ton_kho WHERE ma_kho=? AND ma_san_pham=?',
        [invoice.ma_kho, item.ma_san_pham]
      );

      const tonTruoc = Number(existing[0]?.so_luong || 0);
      const tonSau = tonTruoc + Number(item.so_luong);

      if (!existing.length) {
        await conn.query(
          'INSERT INTO ton_kho (ma_kho, ma_san_pham, so_luong, han_su_dung, vi_tri_kho, ngay_nhap_kho) VALUES (?, ?, ?, ?, ?, NOW())',
          [invoice.ma_kho, item.ma_san_pham, item.so_luong, item.han_su_dung || null, item.vi_tri_kho || null]
        );
      } else {
        await conn.query(
          'UPDATE ton_kho SET so_luong=?, han_su_dung=COALESCE(?, han_su_dung), vi_tri_kho=COALESCE(?, vi_tri_kho), ngay_nhap_kho=NOW() WHERE ma_kho=? AND ma_san_pham=?',
          [tonSau, item.han_su_dung || null, item.vi_tri_kho || null, invoice.ma_kho, item.ma_san_pham]
        );
      }

      await conn.query(
        `INSERT INTO lich_su_kho
          (ma_kho, ma_san_pham, ma_hoa_don, loai_phieu, so_luong, ton_truoc, ton_sau)
         VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [invoice.ma_kho, item.ma_san_pham, invoice.ma_hoa_don, 'nhap_kho', item.so_luong, tonTruoc, tonSau]
      );

      await syncStockAlert(conn, invoice.ma_kho, item.ma_san_pham);
    }

    await conn.query(
      "UPDATE hoa_don SET trang_thai='da_huy', ghi_chu=CONCAT(COALESCE(ghi_chu, ''), ?) WHERE ma_hoa_don=?",
      [` | HoÃ n kho do há»§y Ä‘Æ¡n #${orderId}`, invoice.ma_hoa_don]
    );
  }
}

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// AUTH
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
router.post('/auth/register',        authCtrl.register);
router.post('/auth/login',           authCtrl.login);
router.get ('/auth/me',              auth, authCtrl.me);
router.put ('/auth/profile',         auth, authCtrl.updateProfile);
router.put ('/auth/change-password', auth, authCtrl.changePassword);

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// DANH Má»¤C
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
router.get('/categories', async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT ma_danh_muc AS id, ten_danh_muc AS name, bieu_tuong AS icon, duong_dan AS slug FROM danh_muc WHERE con_hoat_dong=1 ORDER BY thu_tu'
    );
    res.json({ categories: rows });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// Sáº¢N PHáº¨M
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
router.get('/products', async (req, res) => {
  try {
    const { q, category, sort = 'moi_nhat', page = 1, limit = 12, min_price, max_price, province, in_stock } = req.query;
    const offset = (page - 1) * limit;
    const params = [];
    let where = 'WHERE sp.con_hoat_dong = 1 AND tk.con_hoat_dong = 1';

    if (q) {
      where += ' AND (sp.ten_san_pham LIKE ? OR sp.mo_ta LIKE ?)';
      params.push(`%${q}%`, `%${q}%`);
    }
    if (category) { where += ' AND sp.ma_danh_muc = ?'; params.push(category); }
    if (min_price !== undefined && min_price !== '') { where += ' AND sp.gia_ban >= ?'; params.push(Number(min_price)); }
    if (max_price !== undefined && max_price !== '') { where += ' AND sp.gia_ban <= ?'; params.push(Number(max_price)); }
    if (province) { where += ' AND nd.tinh_thanh = ?'; params.push(province); }
    if (String(in_stock) === '1') { where += ' AND sp.ton_kho > 0'; }

    const ordMap = {
      moi_nhat: 'sp.ngay_tao DESC',
      gia_tang: 'sp.gia_ban ASC',
      gia_giam: 'sp.gia_ban DESC',
      ban_chay: 'sp.so_luong_ban DESC',
      danh_gia: 'sp.diem_danh_gia DESC',
    };
    const ord = ordMap[sort] || ordMap.moi_nhat;

    const sql = `
      SELECT sp.ma_san_pham, sp.ten_san_pham, sp.gia_ban, sp.don_vi,
             sp.ton_kho, sp.ton_kho_toi_thieu, sp.so_luong_ban,
             sp.diem_danh_gia, sp.tong_danh_gia, sp.hinh_anh, sp.con_hoat_dong,
             nd.ma_nong_dan, nd.ten_nong_trai, nd.tinh_thanh,
             tk.ho_ten AS ten_nong_dan,
             dm.ten_danh_muc, dm.bieu_tuong
      FROM san_pham sp
      JOIN nong_dan  nd ON nd.ma_nong_dan  = sp.ma_nong_dan
      JOIN tai_khoan tk ON tk.ma_tai_khoan = nd.ma_tai_khoan
      JOIN danh_muc  dm ON dm.ma_danh_muc  = sp.ma_danh_muc
      ${where}
      ORDER BY ${ord}
      LIMIT ? OFFSET ?
    `;
    const [products] = await db.query(sql, [...params, +limit, +offset]);
    const [[{ total }]] = await db.query(
      `SELECT COUNT(*) AS total FROM san_pham sp
       JOIN nong_dan nd ON nd.ma_nong_dan=sp.ma_nong_dan
       JOIN tai_khoan tk ON tk.ma_tai_khoan=nd.ma_tai_khoan
       ${where}`, params
    );

    products.forEach(p => {
      p.images = parseImages(p.hinh_anh);
    });

    res.json({ products, total, page: +page, limit: +limit });
  } catch (e) { console.error(e); res.status(500).json({ message: e.message }); }
});

router.get('/products/:id', async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT sp.*,
             nd.ten_nong_trai, nd.tinh_thanh, nd.gioi_thieu, nd.da_xac_minh,
             tk.ho_ten AS ten_nong_dan, tk.so_dien_thoai AS sdt_nd,
             dm.ten_danh_muc, dm.bieu_tuong
      FROM san_pham sp
      JOIN nong_dan  nd ON nd.ma_nong_dan  = sp.ma_nong_dan
      JOIN tai_khoan tk ON tk.ma_tai_khoan = nd.ma_tai_khoan
      JOIN danh_muc  dm ON dm.ma_danh_muc  = sp.ma_danh_muc
      WHERE sp.ma_san_pham = ? AND sp.con_hoat_dong = 1
    `, [req.params.id]);

    if (!rows.length) return res.status(404).json({ message: 'KhÃ´ng tÃ¬m tháº¥y sáº£n pháº©m' });
    const p = rows[0];
    p.images = parseImages(p.hinh_anh);
    res.json({ product: p });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.post('/products', auth, role('farmer'), async (req, res) => {
  try {
    const { ten_san_pham, mo_ta, gia_ban, don_vi, ton_kho = 0, ma_danh_muc, hinh_anh = [], ton_kho_toi_thieu = 10 } = req.body;
    const [f] = await db.query('SELECT ma_nong_dan FROM nong_dan WHERE ma_tai_khoan=?', [req.user.id]);
    if (!f.length) return res.status(403).json({ message: 'Báº¡n chÆ°a cÃ³ há»“ sÆ¡ nÃ´ng dÃ¢n' });
    const slug = ten_san_pham.toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[Ä‘Ä]/g, 'd').replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '') + '-' + Date.now();
    const [r] = await db.query(
      'INSERT INTO san_pham (ma_nong_dan,ma_danh_muc,ten_san_pham,duong_dan,mo_ta,gia_ban,don_vi,ton_kho,ton_kho_toi_thieu,hinh_anh) VALUES (?,?,?,?,?,?,?,?,?,?)',
      [f[0].ma_nong_dan, ma_danh_muc, ten_san_pham, slug, mo_ta, gia_ban, don_vi, ton_kho, ton_kho_toi_thieu, serializeImages(hinh_anh)]
    );
    res.status(201).json({ message: 'Táº¡o sáº£n pháº©m thÃ nh cÃ´ng', ma_san_pham: r.insertId });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.put('/products/:id', auth, role('farmer'), async (req, res) => {
  try {
    const { ten_san_pham, mo_ta, gia_ban, don_vi, ton_kho, ma_danh_muc, hinh_anh = [], ton_kho_toi_thieu } = req.body;
    await db.query(
      'UPDATE san_pham SET ten_san_pham=?,mo_ta=?,gia_ban=?,don_vi=?,ton_kho=?,ma_danh_muc=?,hinh_anh=?,ton_kho_toi_thieu=? WHERE ma_san_pham=?',
      [ten_san_pham, mo_ta, gia_ban, don_vi, ton_kho, ma_danh_muc, serializeImages(hinh_anh), ton_kho_toi_thieu, req.params.id]
    );
    res.json({ message: 'Cáº­p nháº­t thÃ nh cÃ´ng' });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.patch('/products/:id/toggle', auth, role('farmer', 'admin'), async (req, res) => {
  await db.query('UPDATE san_pham SET con_hoat_dong=NOT con_hoat_dong WHERE ma_san_pham=?', [req.params.id]);
  res.json({ message: 'Cáº­p nháº­t thÃ nh cÃ´ng' });
});

router.delete('/products/:id', auth, role('farmer', 'admin'), async (req, res) => {
  await db.query('DELETE FROM san_pham WHERE ma_san_pham=?', [req.params.id]);
  res.json({ message: 'XoÃ¡ thÃ nh cÃ´ng' });
});

router.get('/farmer/products', auth, role('farmer'), async (req, res) => {
  const [f] = await db.query('SELECT ma_nong_dan FROM nong_dan WHERE ma_tai_khoan=?', [req.user.id]);
  if (!f.length) return res.json({ products: [] });
  const [products] = await db.query(
    'SELECT sp.*,dm.ten_danh_muc FROM san_pham sp JOIN danh_muc dm ON dm.ma_danh_muc=sp.ma_danh_muc WHERE sp.ma_nong_dan=? ORDER BY sp.ngay_tao DESC',
    [f[0].ma_nong_dan]
  );
  products.forEach(p => { p.images = parseImages(p.hinh_anh); });
  res.json({ products });
});

router.get('/farmer/products/low-stock', auth, role('farmer', 'admin'), async (req, res) => {
  const [f] = await db.query('SELECT ma_nong_dan FROM nong_dan WHERE ma_tai_khoan=?', [req.user.id]);
  const [products] = await db.query(
    'SELECT * FROM san_pham WHERE ma_nong_dan=? AND ton_kho<=ton_kho_toi_thieu AND con_hoat_dong=1',
    [f[0]?.ma_nong_dan]
  );
  res.json({ products });
});

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// GIá»Ž HÃ€NG
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
router.get('/cart', auth, role('buyer'), async (req, res) => {
  try {
    const [items] = await db.query(`
      SELECT gh.ma_san_pham AS product_id, gh.so_luong AS quantity,
             sp.ten_san_pham AS name, sp.gia_ban AS price,
             sp.don_vi AS unit, sp.hinh_anh AS images_raw,
             sp.ton_kho AS stock, nd.ten_nong_trai AS farm_name
      FROM gio_hang gh
      JOIN san_pham sp ON sp.ma_san_pham = gh.ma_san_pham
      JOIN nong_dan  nd ON nd.ma_nong_dan  = sp.ma_nong_dan
      WHERE gh.ma_tai_khoan = ?
    `, [req.user.id]);

    const cart = items.map(i => {
      const images = parseImages(i.images_raw);
      return {
        product_id: i.product_id,
        quantity:   i.quantity,
        product: { id: i.product_id, name: i.name, price: i.price, unit: i.unit, images, stock: i.stock, farm_name: i.farm_name },
      };
    });
    res.json({ cart });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.post('/cart', auth, role('buyer'), async (req, res) => {
  try {
    const { product_id, quantity = 1 } = req.body;
    const [p] = await db.query('SELECT ton_kho FROM san_pham WHERE ma_san_pham=? AND con_hoat_dong=1', [product_id]);
    if (!p.length) return res.status(404).json({ message: 'Sáº£n pháº©m khÃ´ng tá»“n táº¡i' });
    if (p[0].ton_kho < quantity) return res.status(400).json({ message: 'KhÃ´ng Ä‘á»§ hÃ ng' });
    await db.query(
      'INSERT INTO gio_hang (ma_tai_khoan,ma_san_pham,so_luong) VALUES (?,?,?) ON DUPLICATE KEY UPDATE so_luong=so_luong+?',
      [req.user.id, product_id, quantity, quantity]
    );
    res.json({ message: 'ÄÃ£ thÃªm vÃ o giá» hÃ ng' });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.put('/cart/:pid', auth, role('buyer'), async (req, res) => {
  await db.query('UPDATE gio_hang SET so_luong=? WHERE ma_tai_khoan=? AND ma_san_pham=?',
    [req.body.quantity, req.user.id, req.params.pid]);
  res.json({ message: 'Cáº­p nháº­t thÃ nh cÃ´ng' });
});

router.delete('/cart/:pid', auth, role('buyer'), async (req, res) => {
  await db.query('DELETE FROM gio_hang WHERE ma_tai_khoan=? AND ma_san_pham=?', [req.user.id, req.params.pid]);
  res.json({ message: 'ÄÃ£ xoÃ¡' });
});

router.delete('/cart', auth, role('buyer'), async (req, res) => {
  await db.query('DELETE FROM gio_hang WHERE ma_tai_khoan=?', [req.user.id]);
  res.json({ message: 'ÄÃ£ xoÃ¡ giá» hÃ ng' });
});

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// ÄÆ N HÃ€NG
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
router.post('/orders', auth, role('buyer'), async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const { dia_chi_giao, ghi_chu, phuong_thuc_tt = 'tien_mat' } = req.body;
    if (!dia_chi_giao) return res.status(400).json({ message: 'Vui lÃ²ng nháº­p Ä‘á»‹a chá»‰ giao hÃ ng' });

    const [cart] = await conn.query(`
      SELECT gh.so_luong, sp.ma_san_pham, sp.gia_ban, sp.ten_san_pham,
             sp.don_vi, sp.hinh_anh, sp.ton_kho, sp.ma_nong_dan
      FROM gio_hang gh JOIN san_pham sp ON sp.ma_san_pham=gh.ma_san_pham
      WHERE gh.ma_tai_khoan=?
    `, [req.user.id]);

    if (!cart.length) return res.status(400).json({ message: 'Giá» hÃ ng trá»‘ng' });
    for (const i of cart)
      if (i.ton_kho < i.so_luong)
        return res.status(400).json({ message: `"${i.ten_san_pham}" khÃ´ng Ä‘á»§ hÃ ng` });

    const tong_tien_hang  = cart.reduce((s, i) => s + i.gia_ban * i.so_luong, 0);
    const phi_van_chuyen  = tong_tien_hang > 500000 ? 0 : 30000;
    const tong_thanh_toan = tong_tien_hang + phi_van_chuyen;

    const [dh] = await conn.query(
      'INSERT INTO don_hang (ma_nguoi_mua,tong_tien_hang,phi_van_chuyen,tong_thanh_toan,dia_chi_giao,ghi_chu,phuong_thuc_tt) VALUES (?,?,?,?,?,?,?)',
      [req.user.id, tong_tien_hang, phi_van_chuyen, tong_thanh_toan, dia_chi_giao, ghi_chu || null, phuong_thuc_tt]
    );
    const ma_don = dh.insertId;

    for (const i of cart) {
      const img = parseImages(i.hinh_anh);
      await conn.query(
        'INSERT INTO chi_tiet_don_hang (ma_don_hang,ma_san_pham,ma_nong_dan,ten_san_pham,hinh_san_pham,don_vi,so_luong,gia_tai_thoi_diem,thanh_tien) VALUES (?,?,?,?,?,?,?,?,?)',
        [ma_don, i.ma_san_pham, i.ma_nong_dan, i.ten_san_pham, img[0] || null, i.don_vi, i.so_luong, i.gia_ban, i.gia_ban * i.so_luong]
      );
      await conn.query('UPDATE san_pham SET ton_kho=ton_kho-?,so_luong_ban=so_luong_ban+? WHERE ma_san_pham=?',
        [i.so_luong, i.so_luong, i.ma_san_pham]);
    }

    await conn.query('DELETE FROM gio_hang WHERE ma_tai_khoan=?', [req.user.id]);
    await conn.query('INSERT INTO thanh_toan (ma_don_hang,phuong_thuc,so_tien) VALUES (?,?,?)',
      [ma_don, phuong_thuc_tt, tong_thanh_toan]);
    await createAutoWarehouseIssueInvoices(conn, ma_don, cart, req.user.id);

    await conn.commit();
    res.status(201).json({ message: 'Äáº·t hÃ ng thÃ nh cÃ´ng!', order: { id: ma_don, tong_thanh_toan } });
  } catch (e) {
    await conn.rollback();
    console.error(e);
    res.status(500).json({ message: e.message });
  } finally { conn.release(); }
});

router.get('/orders', auth, role('buyer'), async (req, res) => {
  const [orders] = await db.query(
    'SELECT * FROM don_hang WHERE ma_nguoi_mua=? ORDER BY ngay_tao DESC', [req.user.id]
  );
  res.json({ orders });
});

router.get('/orders/:id', auth, async (req, res) => {
  const [orders] = await db.query(
    'SELECT dh.*,tk.ho_ten AS ten_nguoi_mua,tk.so_dien_thoai FROM don_hang dh JOIN tai_khoan tk ON tk.ma_tai_khoan=dh.ma_nguoi_mua WHERE dh.ma_don_hang=?',
    [req.params.id]
  );
  if (!orders.length) return res.status(404).json({ message: 'KhÃ´ng tÃ¬m tháº¥y Ä‘Æ¡n hÃ ng' });
  const [items] = await db.query('SELECT * FROM chi_tiet_don_hang WHERE ma_don_hang=?', [req.params.id]);
  res.json({ order: orders[0], items });
});

router.patch('/orders/:id/cancel', auth, role('buyer'), async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const [dh] = await conn.query('SELECT * FROM don_hang WHERE ma_don_hang=? AND ma_nguoi_mua=?', [req.params.id, req.user.id]);
    if (!dh.length) return res.status(404).json({ message: 'Khong tim thay don hang' });
    if (!['cho_xac_nhan', 'da_xac_nhan'].includes(dh[0].trang_thai)) return res.status(400).json({ message: 'Chi huy duoc don dang cho hoac da xac nhan' });
    await conn.query("UPDATE don_hang SET trang_thai='da_huy',ly_do_huy=? WHERE ma_don_hang=?",
      [req.body.ly_do || 'Nguoi mua huy', req.params.id]);
    const [items] = await conn.query('SELECT * FROM chi_tiet_don_hang WHERE ma_don_hang=?', [req.params.id]);
    for (const i of items) {
      await conn.query('UPDATE san_pham SET ton_kho=ton_kho+? WHERE ma_san_pham=?', [i.so_luong, i.ma_san_pham]);
    }
    await restoreWarehouseStockForOrder(conn, req.params.id);
    await conn.commit();
    res.json({ message: 'Huy don thanh cong' });
  } catch (e) {
    await conn.rollback();
    res.status(500).json({ message: e.message });
  } finally {
    conn.release();
  }
});

router.get('/farmer/orders', auth, role('farmer'), async (req, res) => {
  const [f] = await db.query('SELECT ma_nong_dan FROM nong_dan WHERE ma_tai_khoan=?', [req.user.id]);
  const [orders] = await db.query(`
    SELECT DISTINCT dh.*,tk.ho_ten AS ten_nguoi_mua,tk.so_dien_thoai
    FROM don_hang dh
    JOIN chi_tiet_don_hang ct ON ct.ma_don_hang=dh.ma_don_hang
    JOIN tai_khoan tk ON tk.ma_tai_khoan=dh.ma_nguoi_mua
    WHERE ct.ma_nong_dan=? ORDER BY dh.ngay_tao DESC
  `, [f[0]?.ma_nong_dan]);
  res.json({ orders });
});

router.patch('/orders/:id/status', auth, role('farmer', 'admin'), async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const { trang_thai } = req.body;
    const valid = ['da_xac_nhan', 'dang_giao', 'da_giao', 'da_huy'];
    if (!valid.includes(trang_thai)) return res.status(400).json({ message: 'Trang thai khong hop le' });
    const [orders] = await conn.query('SELECT * FROM don_hang WHERE ma_don_hang=?', [req.params.id]);
    if (!orders.length) return res.status(404).json({ message: 'Khong tim thay don hang' });
    const currentStatus = orders[0].trang_thai;
    await conn.query('UPDATE don_hang SET trang_thai=? WHERE ma_don_hang=?', [trang_thai, req.params.id]);
    if (trang_thai === 'da_huy' && currentStatus !== 'da_huy') {
      const [items] = await conn.query('SELECT * FROM chi_tiet_don_hang WHERE ma_don_hang=?', [req.params.id]);
      for (const item of items) {
        await conn.query('UPDATE san_pham SET ton_kho=ton_kho+? WHERE ma_san_pham=?', [item.so_luong, item.ma_san_pham]);
      }
      await restoreWarehouseStockForOrder(conn, req.params.id);
    }
    if (trang_thai === 'da_giao') {
      await conn.query("UPDATE thanh_toan SET trang_thai='thanh_cong',ngay_thanh_toan=NOW() WHERE ma_don_hang=? AND phuong_thuc='tien_mat'", [req.params.id]);
      await conn.query("UPDATE don_hang SET trang_thai_tt='da_tt' WHERE ma_don_hang=? AND phuong_thuc_tt='tien_mat'", [req.params.id]);
    }
    await conn.commit();
    res.json({ message: 'Cap nhat thanh cong' });
  } catch (e) {
    await conn.rollback();
    res.status(500).json({ message: e.message });
  } finally {
    conn.release();
  }
});

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// ÄÃNH GIÃ
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
router.get('/products/:id/reviews', async (req, res) => {
  const [reviews] = await db.query(
    'SELECT dg.*,tk.ho_ten AS ten_nguoi_mua FROM danh_gia dg JOIN tai_khoan tk ON tk.ma_tai_khoan=dg.ma_nguoi_mua WHERE dg.ma_san_pham=? ORDER BY dg.ngay_tao DESC',
    [req.params.id]
  );
  res.json({ reviews });
});

router.post('/reviews', auth, role('buyer'), async (req, res) => {
  try {
    const { ma_san_pham, ma_don_hang, so_sao, noi_dung } = req.body;
    await db.query(
      'INSERT INTO danh_gia (ma_nguoi_mua,ma_san_pham,ma_don_hang,so_sao,noi_dung) VALUES (?,?,?,?,?)',
      [req.user.id, ma_san_pham, ma_don_hang, so_sao, noi_dung]
    );
    const [[avg]] = await db.query('SELECT AVG(so_sao) AS avg,COUNT(*) AS cnt FROM danh_gia WHERE ma_san_pham=?', [ma_san_pham]);
    await db.query('UPDATE san_pham SET diem_danh_gia=?,tong_danh_gia=? WHERE ma_san_pham=?', [avg.avg, avg.cnt, ma_san_pham]);
    res.status(201).json({ message: 'ÄÃ¡nh giÃ¡ thÃ nh cÃ´ng' });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// KHO HÃ€NG
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
router.get('/warehouses', auth, role('admin'), async (req, res) => {
  const [w] = await db.query('SELECT kh.*,tk.ho_ten AS ten_quan_ly FROM kho_hang kh JOIN tai_khoan tk ON tk.ma_tai_khoan=kh.ma_quan_ly WHERE kh.con_hoat_dong=1');
  res.json({ warehouses: w });
});

const getWarehouseLocationByLabel = async (warehouseId, label, conn = db) => {
  if (!label) return null;
  const [rows] = await conn.query(
    `SELECT ma_vi_tri, ma_vi_tri_code, ten_vi_tri
     FROM vi_tri_kho_hang
     WHERE ma_kho = ?
       AND con_su_dung = 1
       AND (ten_vi_tri = ? OR ma_vi_tri_code = ?)
     LIMIT 1`,
    [warehouseId, label, label]
  );
  return rows[0] || null;
};

router.get('/warehouses/:id/locations', auth, role('admin'), async (req, res) => {
  const [locations] = await db.query(
    `SELECT ma_vi_tri, ma_vi_tri_code, ten_vi_tri, mo_ta
     FROM vi_tri_kho_hang
     WHERE ma_kho = ?
       AND con_su_dung = 1
     ORDER BY ten_vi_tri ASC`,
    [req.params.id]
  );

  res.json({ locations });
});

router.get('/warehouses/:id/stock', auth, role('admin'), async (req, res) => {
  const [s] = await db.query(`
    SELECT tk2.*,sp.ten_san_pham AS product_name,sp.don_vi AS unit,
           sp.ton_kho_toi_thieu AS min_stock,
           CASE WHEN tk2.so_luong<=sp.ton_kho_toi_thieu THEN 1 ELSE 0 END AS is_low_stock
    FROM ton_kho tk2 JOIN san_pham sp ON sp.ma_san_pham=tk2.ma_san_pham
    WHERE tk2.ma_kho=?
    ORDER BY tk2.han_su_dung IS NULL, tk2.han_su_dung ASC, sp.ten_san_pham ASC
  `, [req.params.id]);
  res.json({ stock: s });
});

router.patch('/warehouses/:warehouseId/stock/:productId', auth, role('admin'), async (req, res) => {
  const { han_su_dung, vi_tri_kho, ngay_nhap_kho } = req.body;

  const [existing] = await db.query(
    'SELECT ma_kho, ma_san_pham FROM ton_kho WHERE ma_kho=? AND ma_san_pham=? LIMIT 1',
    [req.params.warehouseId, req.params.productId]
  );

  if (!existing.length) {
    return res.status(404).json({ message: 'Khong tim thay dong ton kho can cap nhat' });
  }

  if (vi_tri_kho) {
    const location = await getWarehouseLocationByLabel(req.params.warehouseId, vi_tri_kho);
    if (!location) {
      return res.status(400).json({ message: 'Vi tri kho khong hop le voi kho da chon' });
    }
  }

  await db.query(
    `UPDATE ton_kho
     SET han_su_dung=?,
         vi_tri_kho=?,
         ngay_nhap_kho=?
     WHERE ma_kho=? AND ma_san_pham=?`,
    [
      han_su_dung || null,
      vi_tri_kho?.trim() || null,
      ngay_nhap_kho || null,
      req.params.warehouseId,
      req.params.productId,
    ]
  );

  res.json({ message: 'Cap nhat thong tin ton kho thanh cong' });
});

router.get('/invoices', auth, role('admin'), async (req, res) => {
  const [inv] = await db.query(`
    SELECT hd.*,kh.ten_kho AS warehouse_name,tk.ho_ten AS created_by_name
    FROM hoa_don hd
    JOIN kho_hang kh ON kh.ma_kho=hd.ma_kho
    JOIN tai_khoan tk ON tk.ma_tai_khoan=hd.nguoi_tao
    ORDER BY hd.ngay_tao DESC
  `);
  res.json({ invoices: inv });
});

router.get('/invoices/:id', auth, role('admin'), async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT hd.*, kh.ten_kho AS warehouse_name, kh.dia_diem AS warehouse_location,
             tk.ho_ten AS created_by_name, tk.email AS created_by_email
      FROM hoa_don hd
      JOIN kho_hang kh ON kh.ma_kho = hd.ma_kho
      JOIN tai_khoan tk ON tk.ma_tai_khoan = hd.nguoi_tao
      WHERE hd.ma_hoa_don = ?
    `, [req.params.id]);

    if (!rows.length) {
      return res.status(404).json({ message: 'Khong tim thay hoa don' });
    }

    const [items] = await db.query(`
      SELECT ct.*, sp.ton_kho AS tong_ton_toan_he_thong, sp.ton_kho_toi_thieu
      FROM chi_tiet_hoa_don ct
      LEFT JOIN san_pham sp ON sp.ma_san_pham = ct.ma_san_pham
      WHERE ct.ma_hoa_don = ?
      ORDER BY ct.ma_chi_tiet
    `, [req.params.id]);

    res.json({ invoice: rows[0], items });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.post('/invoices', auth, role('admin'), async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const { loai_hoa_don, ma_kho, ma_nong_dan, ma_don_hang, ghi_chu, items } = req.body;
    for (const item of items || []) {
      if (item.vi_tri_kho) {
        const location = await getWarehouseLocationByLabel(ma_kho, item.vi_tri_kho, conn);
        if (!location) {
          await conn.rollback();
          return res.status(400).json({ message: `Vi tri kho khong hop le cho san pham ${item.ten_san_pham}` });
        }
      }
    }
    const so_hoa_don = `HD-${loai_hoa_don === 'nhap_kho' ? 'NK' : 'XK'}-${Date.now()}`;
    const tong_tien  = items.reduce((s, i) => s + i.so_luong * i.don_gia, 0);
    const [hd] = await conn.query(
      'INSERT INTO hoa_don (so_hoa_don,loai_hoa_don,ma_kho,ma_nong_dan,ma_don_hang,nguoi_tao,tong_tien,ghi_chu) VALUES (?,?,?,?,?,?,?,?)',
      [so_hoa_don, loai_hoa_don, ma_kho, ma_nong_dan || null, ma_don_hang || null, req.user.id, tong_tien, ghi_chu]
    );
    for (const i of items)
      await conn.query(
        'INSERT INTO chi_tiet_hoa_don (ma_hoa_don,ma_san_pham,ten_san_pham,so_luong,don_vi,don_gia,thanh_tien,han_su_dung,vi_tri_kho) VALUES (?,?,?,?,?,?,?,?,?)',
        [hd.insertId, i.ma_san_pham, i.ten_san_pham, i.so_luong, i.don_vi, i.don_gia, i.so_luong * i.don_gia, i.han_su_dung || null, i.vi_tri_kho || null]
      );
    await conn.commit();
    res.status(201).json({ message: 'Táº¡o hoÃ¡ Ä‘Æ¡n thÃ nh cÃ´ng', ma_hoa_don: hd.insertId });
  } catch (e) { await conn.rollback(); res.status(500).json({ message: e.message }); }
  finally { conn.release(); }
});

router.patch('/invoices/:id/confirm', auth, role('admin'), async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const [hdRows] = await conn.query('SELECT * FROM hoa_don WHERE ma_hoa_don=?', [req.params.id]);
    if (!hdRows.length || hdRows[0].trang_thai !== 'nhap')
      return res.status(400).json({ message: 'HoÃ¡ Ä‘Æ¡n khÃ´ng há»£p lá»‡ hoáº·c Ä‘Ã£ xÃ¡c nháº­n' });
    const hd = hdRows[0];
    const [items] = await conn.query('SELECT * FROM chi_tiet_hoa_don WHERE ma_hoa_don=?', [hd.ma_hoa_don]);

    for (const item of items) {
      const [tk] = await conn.query('SELECT so_luong FROM ton_kho WHERE ma_kho=? AND ma_san_pham=?', [hd.ma_kho, item.ma_san_pham]);
      const ton_truoc = tk[0]?.so_luong || 0;
      const ton_sau   = hd.loai_hoa_don === 'nhap_kho' ? ton_truoc + item.so_luong : ton_truoc - item.so_luong;

      if (!tk.length)
        await conn.query(
          'INSERT INTO ton_kho (ma_kho,ma_san_pham,so_luong,han_su_dung,vi_tri_kho,ngay_nhap_kho) VALUES (?,?,?,?,?,NOW())',
          [hd.ma_kho, item.ma_san_pham, item.so_luong, item.han_su_dung || null, item.vi_tri_kho || null]
        );
      else
        await conn.query(
          'UPDATE ton_kho SET so_luong=?, han_su_dung=COALESCE(?, han_su_dung), vi_tri_kho=COALESCE(?, vi_tri_kho), ngay_nhap_kho=COALESCE(ngay_nhap_kho, NOW()) WHERE ma_kho=? AND ma_san_pham=?',
          [ton_sau, item.han_su_dung || null, item.vi_tri_kho || null, hd.ma_kho, item.ma_san_pham]
        );

      if (hd.loai_hoa_don === 'nhap_kho')
        await conn.query('UPDATE san_pham SET ton_kho=ton_kho+? WHERE ma_san_pham=?', [item.so_luong, item.ma_san_pham]);

      await conn.query(
        'INSERT INTO lich_su_kho (ma_kho,ma_san_pham,ma_hoa_don,loai_phieu,so_luong,ton_truoc,ton_sau) VALUES (?,?,?,?,?,?,?)',
        [hd.ma_kho, item.ma_san_pham, hd.ma_hoa_don, hd.loai_hoa_don, item.so_luong, ton_truoc, ton_sau]
      );

      const [sp] = await conn.query('SELECT ton_kho,ton_kho_toi_thieu FROM san_pham WHERE ma_san_pham=?', [item.ma_san_pham]);
      if (sp[0] && sp[0].ton_kho <= sp[0].ton_kho_toi_thieu)
        await conn.query(
          'INSERT INTO canh_bao_kho (ma_san_pham,ma_kho,ton_hien_tai,ton_toi_thieu) VALUES (?,?,?,?) ON DUPLICATE KEY UPDATE ton_hien_tai=?,da_xu_ly=0',
          [item.ma_san_pham, hd.ma_kho, sp[0].ton_kho, sp[0].ton_kho_toi_thieu, sp[0].ton_kho]
        );
    }

    await conn.query("UPDATE hoa_don SET trang_thai='da_xac_nhan',ngay_xac_nhan=NOW() WHERE ma_hoa_don=?", [hd.ma_hoa_don]);
    await conn.commit();
    res.json({ message: 'XÃ¡c nháº­n hoÃ¡ Ä‘Æ¡n thÃ nh cÃ´ng!' });
  } catch (e) { await conn.rollback(); console.error(e); res.status(500).json({ message: e.message }); }
  finally { conn.release(); }
});

router.patch('/invoices/:id/cancel', auth, role('admin'), async (req, res) => {
  await db.query("UPDATE hoa_don SET trang_thai='da_huy' WHERE ma_hoa_don=?", [req.params.id]);
  res.json({ message: 'Huá»· hoÃ¡ Ä‘Æ¡n thÃ nh cÃ´ng' });
});

router.get('/inventory-logs', auth, role('admin'), async (req, res) => {
  const [logs] = await db.query(`
    SELECT ls.*,sp.ten_san_pham AS product_name,kh.ten_kho AS warehouse_name
    FROM lich_su_kho ls
    JOIN san_pham sp ON sp.ma_san_pham=ls.ma_san_pham
    JOIN kho_hang kh ON kh.ma_kho=ls.ma_kho
    ORDER BY ls.ngay_tao DESC LIMIT 200
  `);
  res.json({ logs });
});

router.get('/stock-alerts', auth, role('admin'), async (req, res) => {
  const [alerts] = await db.query(`
    SELECT cb.*,sp.ten_san_pham AS product_name,kh.ten_kho AS warehouse_name
    FROM canh_bao_kho cb
    JOIN san_pham sp ON sp.ma_san_pham=cb.ma_san_pham
    JOIN kho_hang kh ON kh.ma_kho=cb.ma_kho
    ORDER BY cb.da_xu_ly ASC, cb.ngay_tao DESC
  `);
  res.json({ alerts });
});

router.patch('/stock-alerts/:id/resolve', auth, role('admin'), async (req, res) => {
  await db.query('UPDATE canh_bao_kho SET da_xu_ly=1,ngay_xu_ly=NOW() WHERE ma_canh_bao=?', [req.params.id]);
  res.json({ message: 'ÄÃ£ Ä‘Ã¡nh dáº¥u xá»­ lÃ½' });
});

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// DASHBOARD
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
router.get('/admin/dashboard', auth, role('admin'), async (req, res) => {
  try {
    const [[{ tong_tk }]]   = await db.query('SELECT COUNT(*) AS tong_tk FROM tai_khoan');
    const [[{ tong_nd }]]   = await db.query('SELECT COUNT(*) AS tong_nd FROM nong_dan WHERE da_xac_minh=1');
    const [[{ tong_dh }]]   = await db.query('SELECT COUNT(*) AS tong_dh FROM don_hang');
    const [[{ doanh_thu }]] = await db.query("SELECT COALESCE(SUM(tong_thanh_toan),0) AS doanh_thu FROM don_hang WHERE trang_thai='da_giao'");
    const [cho_duyet]       = await db.query('SELECT tk.ho_ten,tk.email,nd.ten_nong_trai,nd.ngay_tao FROM nong_dan nd JOIN tai_khoan tk ON tk.ma_tai_khoan=nd.ma_tai_khoan WHERE nd.da_xac_minh=0 LIMIT 5');
    const [top_sp]          = await db.query('SELECT ten_san_pham,so_luong_ban,gia_ban FROM san_pham ORDER BY so_luong_ban DESC LIMIT 5');
    res.json({ tong_tk, tong_nd, tong_dh, doanh_thu, cho_duyet, top_sp });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.get('/farmer/dashboard', auth, role('farmer'), async (req, res) => {
  try {
    const [f] = await db.query('SELECT ma_nong_dan FROM nong_dan WHERE ma_tai_khoan=?', [req.user.id]);
    const fid = f[0]?.ma_nong_dan;
    const [[{ tong_don }]]  = await db.query('SELECT COUNT(DISTINCT ma_don_hang) AS tong_don FROM chi_tiet_don_hang WHERE ma_nong_dan=?', [fid]);
    const [[{ doanh_thu }]] = await db.query("SELECT COALESCE(SUM(ct.thanh_tien),0) AS doanh_thu FROM chi_tiet_don_hang ct JOIN don_hang dh ON dh.ma_don_hang=ct.ma_don_hang WHERE ct.ma_nong_dan=? AND dh.trang_thai='da_giao'", [fid]);
    const [san_pham]        = await db.query('SELECT ten_san_pham,so_luong_ban,ton_kho,ton_kho_toi_thieu FROM san_pham WHERE ma_nong_dan=? ORDER BY so_luong_ban DESC LIMIT 5', [fid]);
    res.json({ tong_don, doanh_thu, san_pham });
  } catch (e) { res.status(500).json({ message: e.message }); }
});

router.get('/farmer/profile', auth, role('farmer'), async (req, res) => {
  try {
    const [rows] = await db.query(`
      SELECT nd.*, tk.ho_ten, tk.email, tk.so_dien_thoai, tk.dia_chi
      FROM nong_dan nd
      JOIN tai_khoan tk ON tk.ma_tai_khoan = nd.ma_tai_khoan
      WHERE nd.ma_tai_khoan = ?
      LIMIT 1
    `, [req.user.id]);

    if (!rows.length) {
      return res.status(404).json({ message: 'KhÃ´ng tÃ¬m tháº¥y há»“ sÆ¡ nÃ´ng tráº¡i' });
    }

    res.json({ profile: rows[0] });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.put('/farmer/profile', auth, role('farmer'), async (req, res) => {
  try {
    const { ten_nong_trai, gioi_thieu, tinh_thanh, quan_huyen } = req.body;

    await db.query(
      'UPDATE nong_dan SET ten_nong_trai=?, gioi_thieu=?, tinh_thanh=?, quan_huyen=? WHERE ma_tai_khoan=?',
      [ten_nong_trai, gioi_thieu || null, tinh_thanh || null, quan_huyen || null, req.user.id]
    );

    res.json({ message: 'Cáº­p nháº­t há»“ sÆ¡ nÃ´ng tráº¡i thÃ nh cÃ´ng' });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// ADMIN QUáº¢N LÃ
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
router.get('/admin/accounts', auth, role('admin'), async (req, res) => {
  const { q, vai_tro, page = 1, limit = 15 } = req.query;
  const offset = (page - 1) * limit, params = [];
  let where = 'WHERE 1=1';
  if (q) { where += ' AND (ho_ten LIKE ? OR email LIKE ?)'; params.push(`%${q}%`, `%${q}%`); }
  if (vai_tro) { where += ' AND vai_tro=?'; params.push(vai_tro); }
  const [accounts] = await db.query(`SELECT ma_tai_khoan,ho_ten,email,so_dien_thoai,vai_tro,con_hoat_dong,ngay_tao FROM tai_khoan ${where} ORDER BY ngay_tao DESC LIMIT ? OFFSET ?`, [...params, +limit, +offset]);
  const [[{ total }]] = await db.query(`SELECT COUNT(*) AS total FROM tai_khoan ${where}`, params);
  res.json({ accounts, total });
});

router.patch('/admin/accounts/:id/toggle', auth, role('admin'), async (req, res) => {
  await db.query('UPDATE tai_khoan SET con_hoat_dong=NOT con_hoat_dong WHERE ma_tai_khoan=?', [req.params.id]);
  res.json({ message: 'Cáº­p nháº­t thÃ nh cÃ´ng' });
});

router.get('/admin/farmers', auth, role('admin'), async (req, res) => {
  const { q, da_xac_minh } = req.query;
  const params = [];
  let where = 'WHERE 1=1';
  if (q) { where += ' AND (tk.ho_ten LIKE ? OR nd.ten_nong_trai LIKE ?)'; params.push(`%${q}%`, `%${q}%`); }
  if (da_xac_minh !== undefined && da_xac_minh !== '') { where += ' AND nd.da_xac_minh=?'; params.push(da_xac_minh); }
  const [farmers] = await db.query(`SELECT nd.*,tk.ho_ten,tk.email,tk.so_dien_thoai FROM nong_dan nd JOIN tai_khoan tk ON tk.ma_tai_khoan=nd.ma_tai_khoan ${where} ORDER BY nd.da_xac_minh ASC, nd.ngay_tao DESC`, params);
  res.json({ farmers });
});

router.patch('/admin/farmers/:id/verify', auth, role('admin'), async (req, res) => {
  await db.query('UPDATE nong_dan SET da_xac_minh=1,ngay_xac_minh=NOW() WHERE ma_nong_dan=?', [req.params.id]);
  res.json({ message: 'ÄÃ£ duyá»‡t há»“ sÆ¡ nÃ´ng dÃ¢n' });
});

router.get('/admin/orders', auth, role('admin'), async (req, res) => {
  const { trang_thai, page = 1, limit = 15 } = req.query;
  const offset = (page - 1) * limit, params = [];
  let where = 'WHERE 1=1';
  if (trang_thai) { where += ' AND dh.trang_thai=?'; params.push(trang_thai); }
  const [orders] = await db.query(`SELECT dh.*,tk.ho_ten AS ten_nguoi_mua,tk.so_dien_thoai FROM don_hang dh JOIN tai_khoan tk ON tk.ma_tai_khoan=dh.ma_nguoi_mua ${where} ORDER BY dh.ngay_tao DESC LIMIT ? OFFSET ?`, [...params, +limit, +offset]);
  const [[{ total }]] = await db.query(`SELECT COUNT(*) AS total FROM don_hang dh ${where}`, params);
  res.json({ orders, total });
});

router.get('/admin/categories', auth, role('admin'), async (req, res) => {
  const [categories] = await db.query('SELECT * FROM danh_muc ORDER BY thu_tu');
  res.json({ categories });
});

router.get('/admin/categories/:id/products', auth, role('admin'), async (req, res) => {
  const [products] = await db.query(
    `SELECT sp.*,
            dm.ten_danh_muc,
            dm.bieu_tuong,
            nd.ten_nong_trai,
            tk.ho_ten AS ten_nong_dan
     FROM san_pham sp
     LEFT JOIN danh_muc dm ON dm.ma_danh_muc = sp.ma_danh_muc
     LEFT JOIN nong_dan nd ON nd.ma_nong_dan = sp.ma_nong_dan
     LEFT JOIN tai_khoan tk ON tk.ma_tai_khoan = nd.ma_tai_khoan
     WHERE sp.ma_danh_muc = ?
     ORDER BY sp.ngay_tao DESC`,
    [req.params.id]
  );

  res.json({
    products: products.map(product => ({
      ...product,
      images: parseImages(product.hinh_anh),
    })),
  });
});

router.post('/admin/categories', auth, role('admin'), async (req, res) => {
  const { ten_danh_muc, duong_dan, bieu_tuong, thu_tu = 0, con_hoat_dong = 1 } = req.body;
  await db.query('INSERT INTO danh_muc (ten_danh_muc,duong_dan,bieu_tuong,thu_tu,con_hoat_dong) VALUES (?,?,?,?,?)',
    [ten_danh_muc, duong_dan, bieu_tuong, thu_tu, con_hoat_dong]);
  res.status(201).json({ message: 'Táº¡o thÃ nh cÃ´ng' });
});

router.put('/admin/categories/:id', auth, role('admin'), async (req, res) => {
  const { ten_danh_muc, duong_dan, bieu_tuong, thu_tu, con_hoat_dong } = req.body;
  await db.query('UPDATE danh_muc SET ten_danh_muc=?,duong_dan=?,bieu_tuong=?,thu_tu=?,con_hoat_dong=? WHERE ma_danh_muc=?',
    [ten_danh_muc, duong_dan, bieu_tuong, thu_tu, con_hoat_dong, req.params.id]);
  res.json({ message: 'Cáº­p nháº­t thÃ nh cÃ´ng' });
});

router.patch('/admin/categories/:id/toggle', auth, role('admin'), async (req, res) => {
  await db.query('UPDATE danh_muc SET con_hoat_dong=NOT con_hoat_dong WHERE ma_danh_muc=?', [req.params.id]);
  res.json({ message: 'Cáº­p nháº­t thÃ nh cÃ´ng' });
});

router.delete('/admin/categories/:id', auth, role('admin'), async (req, res) => {
  await db.query('DELETE FROM danh_muc WHERE ma_danh_muc=?', [req.params.id]);
  res.json({ message: 'XoÃ¡ thÃ nh cÃ´ng' });
});

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// THÃ”NG BÃO
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
router.get('/notifications', auth, async (req, res) => {
  const [n] = await db.query('SELECT * FROM thong_bao WHERE ma_tai_khoan=? ORDER BY ngay_tao DESC LIMIT 20', [req.user.id]);
  res.json({ notifications: n });
});

module.exports = router;
