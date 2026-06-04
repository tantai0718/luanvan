const express = require('express');
const fs = require('fs/promises');
const path = require('path');
const router = express.Router();
const db = require('../config/db');
const { auth, role } = require('../middlewares/auth');
const authCtrl = require('../controllers/authController');

const toAppStatus = status => ({
  cho_xac_nhan: 'cho_xac_nhan',
  dang_giao: 'dang_giao',
  hoan_thanh: 'da_giao',
  huy: 'da_huy',
}[status] || status || 'cho_xac_nhan');

const toDbStatus = status => ({
  cho_xac_nhan: 'cho_xac_nhan',
  da_xac_nhan: 'cho_xac_nhan',
  dang_giao: 'dang_giao',
  da_giao: 'hoan_thanh',
  da_huy: 'huy',
}[status] || status);

const paymentToDb = method => (method === 'tien_mat' ? 'tien_mat' : 'banking');
const paymentStatusToApp = status => (status === 'da_thanh_toan' ? 'da_tt' : 'chua_tt');
const uploadDir = path.join(__dirname, '..', '..', 'upload', 'products');

const apiBaseUrl = () => {
  const configured = process.env.API_PUBLIC_URL || process.env.SERVER_URL;
  if (configured) return configured.replace(/\/$/, '');
  return `http://localhost:${process.env.PORT || 5000}`;
};

const saveDataUrlImage = async value => {
  const match = /^data:image\/(png|jpe?g|webp|gif);base64,([a-zA-Z0-9+/=\r\n]+)$/.exec(value || '');
  if (!match) return value;

  const ext = match[1].replace('jpeg', 'jpg');
  const buffer = Buffer.from(match[2].replace(/\s/g, ''), 'base64');
  const fileName = `product-${Date.now()}-${Math.random().toString(16).slice(2)}.${ext}`;
  await fs.mkdir(uploadDir, { recursive: true });
  await fs.writeFile(path.join(uploadDir, fileName), buffer);
  return `${apiBaseUrl()}/upload/products/${fileName}`;
};

const normalizeStoredProductImages = async values => {
  const images = Array.isArray(values) ? values.filter(Boolean) : [];
  const stored = [];
  for (const image of images) {
    stored.push(await saveDataUrlImage(image));
  }
  return stored;
};

const normalizeImagePath = value => {
  if (!value) return null;
  if (value.startsWith('data:image/') || value.startsWith('http://') || value.startsWith('https://')) return value;
  return null;
};

const imagesFromGroup = value => (value ? value.split('||').map(normalizeImagePath).filter(Boolean) : []);

const productSelect = `
  SELECT sp.masp AS ma_san_pham,
         sp.madm AS ma_danh_muc,
         sp.ten_san_pham,
         NULL AS duong_dan,
         NULL AS mo_ta,
         sp.gia_ban,
         sp.don_vi,
         sp.so_luong_ton AS ton_kho,
         sp.trang_thai AS con_hoat_dong,
         0 AS so_luong_ban,
         COALESCE(AVG(dg.so_sao), 0) AS diem_danh_gia,
         COUNT(dg.madg) AS tong_danh_gia,
         sp.ngay_tao,
         sp.khu_vuc AS tinh_thanh,
         sp.khu_vuc AS ten_nong_trai,
         'Quan tri vien' AS ten_nong_dan,
         dm.ten_danh_muc,
         '' AS bieu_tuong,
         GROUP_CONCAT(CASE WHEN hav.loai = 'hinh_anh' THEN hav.duong_dan END ORDER BY hav.la_chinh DESC, hav.thu_tu SEPARATOR '||') AS image_paths
  FROM san_pham sp
  LEFT JOIN danh_muc dm ON dm.madm = sp.madm
  LEFT JOIN hinh_anh_video hav ON hav.masp = sp.masp
  LEFT JOIN danh_gia dg ON dg.masp = sp.masp
`;

const mapProduct = product => ({
  ...product,
  hinh_anh: null,
  images: imagesFromGroup(product.image_paths),
});

const mapOrder = order => ({
  ma_don_hang: order.madh,
  ma_nguoi_mua: order.mand,
  giam_gia: order.tien_giam || 0,
  tong_tien_hang: Number(order.tong_tien || 0) + Number(order.tien_giam || 0),
  phi_van_chuyen: 0,
  tong_thanh_toan: order.tong_tien || 0,
  phuong_thuc_tt: order.phuong_thuc_tt || 'tien_mat',
  trang_thai_tt: paymentStatusToApp(order.trang_thai_thanh_toan),
  trang_thai: toAppStatus(order.trang_thai),
  dia_chi_giao: order.dia_chi_giao,
  ghi_chu: order.ghi_chu || null,
  loai_don: order.loai_don_hang || 'thuong',
  ngay_giao_du_kien: order.ngay_giao,
  ngay_tao: order.ngay_dat,
  ngay_cap_nhat: order.ngay_giao || order.ngay_dat,
  ghi_chu_khuyen_mai: order.ten_km || null,
  ten_nguoi_mua: order.ten_nguoi_mua,
  so_dien_thoai: order.so_dien_thoai,
});

const getOrCreateCartId = async (conn, userId) => {
  const [rows] = await conn.query('SELECT magh FROM gio_hang WHERE mand=? LIMIT 1', [userId]);
  if (rows.length) return rows[0].magh;
  const [result] = await conn.query('INSERT INTO gio_hang (mand, ngay_tao) VALUES (?, NOW())', [userId]);
  return result.insertId;
};

router.get('/', (req, res) => {
  res.json({ message: 'Cho Nong San API dang chay voi database cho_nong_san.', version: '2.0.0' });
});

router.post('/auth/register', authCtrl.register);
router.post('/auth/login', authCtrl.login);
router.get('/auth/me', auth, authCtrl.me);
router.put('/auth/profile', auth, authCtrl.updateProfile);
router.put('/auth/change-password', auth, authCtrl.changePassword);

router.get('/categories', async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT madm AS id, ten_danh_muc AS name, '' AS icon, CAST(madm AS CHAR) AS slug
       FROM danh_muc
       WHERE trang_thai = 1
       ORDER BY madm`
    );
    res.json({ categories: rows });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/products', async (req, res) => {
  try {
    const { q, category, sort = 'moi_nhat', page = 1, limit = 12, in_stock } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    const params = [];
    let where = 'WHERE sp.trang_thai = 1';

    if (q) {
      where += ' AND sp.ten_san_pham LIKE ?';
      params.push(`%${q}%`);
    }
    if (category) {
      where += ' AND sp.madm = ?';
      params.push(category);
    }
    if (String(in_stock) === '1') {
      where += ' AND sp.so_luong_ton > 0';
    }

    const orderMap = {
      moi_nhat: 'sp.ngay_tao DESC',
      gia_tang: 'sp.gia_ban ASC',
      gia_giam: 'sp.gia_ban DESC',
      ban_chay: 'sp.masp DESC',
      danh_gia: 'diem_danh_gia DESC',
    };

    const [products] = await db.query(
      `${productSelect}
       ${where}
       GROUP BY sp.masp
       ORDER BY ${orderMap[sort] || orderMap.moi_nhat}
       LIMIT ? OFFSET ?`,
      [...params, Number(limit), offset]
    );
    const [[{ total }]] = await db.query(`SELECT COUNT(*) AS total FROM san_pham sp ${where}`, params);
    res.json({ products: products.map(mapProduct), total, page: Number(page), limit: Number(limit) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/products/:id', async (req, res) => {
  try {
    const [rows] = await db.query(
      `${productSelect}
       WHERE sp.masp = ? AND sp.trang_thai = 1
       GROUP BY sp.masp
       LIMIT 1`,
      [req.params.id]
    );
    if (!rows.length) return res.status(404).json({ message: 'Khong tim thay san pham.' });
    res.json({ product: mapProduct(rows[0]) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/admin/products', auth, role('admin'), async (req, res) => {
  try {
    const { q = '' } = req.query;
    const params = [];
    let where = 'WHERE 1=1';
    if (q) {
      where += ' AND sp.ten_san_pham LIKE ?';
      params.push(`%${q}%`);
    }
    const [products] = await db.query(
      `${productSelect}
       ${where}
       GROUP BY sp.masp
       ORDER BY sp.ngay_tao DESC`,
      params
    );
    res.json({ products: products.map(mapProduct) });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/products', auth, role('admin'), async (req, res) => {
  const conn = await db.getConnection();
  try {
    const { ten_san_pham, gia_ban, don_vi, ton_kho = 0, ma_danh_muc, hinh_anh = [] } = req.body;
    await conn.beginTransaction();
    const [result] = await conn.query(
      `INSERT INTO san_pham (madm, ten_san_pham, gia_ban, so_luong_ton, don_vi, khu_vuc, trang_thai, ngay_tao)
       VALUES (?, ?, ?, ?, ?, ?, 1, NOW())`,
      [ma_danh_muc, ten_san_pham, gia_ban, ton_kho, don_vi, 'Toan quoc']
    );
    const images = await normalizeStoredProductImages(hinh_anh);
    for (const [index, image] of images.entries()) {
      await conn.query(
        `INSERT INTO hinh_anh_video (masp, duong_dan, loai, thumbnail, thu_tu, la_chinh, ngay_tao)
         VALUES (?, ?, 'hinh_anh', ?, ?, ?, NOW())`,
        [result.insertId, image, image, index + 1, index === 0 ? 1 : 0]
      );
    }
    await conn.commit();
    res.status(201).json({ message: 'Tao san pham thanh cong.', ma_san_pham: result.insertId });
  } catch (error) {
    await conn.rollback();
    res.status(500).json({ message: error.message });
  } finally {
    conn.release();
  }
});

router.put('/products/:id', auth, role('admin'), async (req, res) => {
  const conn = await db.getConnection();
  try {
    const { ten_san_pham, gia_ban, don_vi, ton_kho, ma_danh_muc, hinh_anh = [] } = req.body;
    await conn.beginTransaction();
    await conn.query(
      `UPDATE san_pham
       SET ten_san_pham=?, gia_ban=?, don_vi=?, so_luong_ton=?, madm=?
       WHERE masp=?`,
      [ten_san_pham, gia_ban, don_vi, ton_kho, ma_danh_muc, req.params.id]
    );
    await conn.query('DELETE FROM hinh_anh_video WHERE masp=?', [req.params.id]);
    const images = await normalizeStoredProductImages(hinh_anh);
    for (const [index, image] of images.entries()) {
      await conn.query(
        `INSERT INTO hinh_anh_video (masp, duong_dan, loai, thumbnail, thu_tu, la_chinh, ngay_tao)
         VALUES (?, ?, 'hinh_anh', ?, ?, ?, NOW())`,
        [req.params.id, image, image, index + 1, index === 0 ? 1 : 0]
      );
    }
    await conn.commit();
    res.json({ message: 'Cap nhat san pham thanh cong.' });
  } catch (error) {
    await conn.rollback();
    res.status(500).json({ message: error.message });
  } finally {
    conn.release();
  }
});

router.patch('/products/:id/toggle', auth, role('admin'), async (req, res) => {
  await db.query('UPDATE san_pham SET trang_thai = NOT trang_thai WHERE masp = ?', [req.params.id]);
  res.json({ message: 'Da cap nhat trang thai san pham.' });
});

router.delete('/products/:id', auth, role('admin'), async (req, res) => {
  await db.query('DELETE FROM hinh_anh_video WHERE masp=?', [req.params.id]);
  await db.query('DELETE FROM san_pham WHERE masp=?', [req.params.id]);
  res.json({ message: 'Da xoa san pham.' });
});

router.get('/cart', auth, role('buyer'), async (req, res) => {
  try {
    const cartId = await getOrCreateCartId(db, req.user.id);
    const [items] = await db.query(
      `SELECT ct.masp AS product_id, ct.so_luong AS quantity,
              sp.ten_san_pham AS name, sp.gia_ban AS price, sp.don_vi AS unit,
              sp.so_luong_ton AS stock, sp.khu_vuc AS farm_name,
              GROUP_CONCAT(CASE WHEN hav.loai='hinh_anh' THEN hav.duong_dan END ORDER BY hav.la_chinh DESC, hav.thu_tu SEPARATOR '||') AS image_paths
       FROM chi_tiet_gio_hang ct
       JOIN san_pham sp ON sp.masp = ct.masp
       LEFT JOIN hinh_anh_video hav ON hav.masp = sp.masp
       WHERE ct.magh = ?
       GROUP BY ct.mactgh`,
      [cartId]
    );
    const cart = items.map(item => ({
      product_id: item.product_id,
      quantity: item.quantity,
      product: {
        id: item.product_id,
        name: item.name,
        price: item.price,
        unit: item.unit,
        images: imagesFromGroup(item.image_paths),
        stock: item.stock,
        farm_name: item.farm_name || 'Farm2Table',
      },
    }));
    const subtotal = cart.reduce((sum, item) => sum + Number(item.quantity) * Number(item.product.price || 0), 0);
    const totalQuantity = cart.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
    const shipping = subtotal > 500000 ? 0 : 30000;
    res.json({
      cart,
      summary: {
        subtotal,
        totalQuantity,
        shipping,
        discountAmount: 0,
        discounts: [],
        completedOrders: 0,
        total: subtotal + shipping,
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.post('/cart', auth, role('buyer'), async (req, res) => {
  const conn = await db.getConnection();
  try {
    const { product_id, quantity = 1 } = req.body;
    await conn.beginTransaction();
    const [[product]] = await conn.query('SELECT so_luong_ton FROM san_pham WHERE masp=? AND trang_thai=1', [product_id]);
    if (!product) {
      await conn.rollback();
      return res.status(404).json({ message: 'San pham khong ton tai.' });
    }
    if (Number(product.so_luong_ton) < Number(quantity)) {
      await conn.rollback();
      return res.status(400).json({ message: 'Khong du hang.' });
    }
    const cartId = await getOrCreateCartId(conn, req.user.id);
    const [existingItems] = await conn.query(
      'SELECT mactgh FROM chi_tiet_gio_hang WHERE magh=? AND masp=? LIMIT 1',
      [cartId, product_id]
    );
    if (existingItems.length) {
      await conn.query('UPDATE chi_tiet_gio_hang SET so_luong = so_luong + ? WHERE mactgh=?', [quantity, existingItems[0].mactgh]);
    } else {
      await conn.query('INSERT INTO chi_tiet_gio_hang (magh, masp, so_luong) VALUES (?, ?, ?)', [cartId, product_id, quantity]);
    }
    await conn.commit();
    res.json({ message: 'Da them vao gio hang.' });
  } catch (error) {
    await conn.rollback();
    res.status(500).json({ message: error.message });
  } finally {
    conn.release();
  }
});

router.put('/cart/:pid', auth, role('buyer'), async (req, res) => {
  const cartId = await getOrCreateCartId(db, req.user.id);
  await db.query('UPDATE chi_tiet_gio_hang SET so_luong=? WHERE magh=? AND masp=?', [req.body.quantity, cartId, req.params.pid]);
  res.json({ message: 'Cap nhat thanh cong.' });
});

router.delete('/cart/:pid', auth, role('buyer'), async (req, res) => {
  const cartId = await getOrCreateCartId(db, req.user.id);
  await db.query('DELETE FROM chi_tiet_gio_hang WHERE magh=? AND masp=?', [cartId, req.params.pid]);
  res.json({ message: 'Da xoa.' });
});

router.delete('/cart', auth, role('buyer'), async (req, res) => {
  const cartId = await getOrCreateCartId(db, req.user.id);
  await db.query('DELETE FROM chi_tiet_gio_hang WHERE magh=?', [cartId]);
  res.json({ message: 'Da xoa gio hang.' });
});

router.post('/orders', auth, role('buyer'), async (req, res) => {
  const conn = await db.getConnection();
  try {
    const { dia_chi_giao, ghi_chu, phuong_thuc_tt = 'tien_mat' } = req.body;
    if (!dia_chi_giao?.trim()) return res.status(400).json({ message: 'Vui long nhap dia chi giao hang.' });
    await conn.beginTransaction();
    const cartId = await getOrCreateCartId(conn, req.user.id);
    const [cart] = await conn.query(
      `SELECT ct.so_luong, sp.masp, sp.gia_ban, sp.ten_san_pham, sp.so_luong_ton
       FROM chi_tiet_gio_hang ct
       JOIN san_pham sp ON sp.masp = ct.masp
       WHERE ct.magh=?`,
      [cartId]
    );
    if (!cart.length) {
      await conn.rollback();
      return res.status(400).json({ message: 'Gio hang trong.' });
    }
    for (const item of cart) {
      if (Number(item.so_luong_ton) < Number(item.so_luong)) {
        await conn.rollback();
        return res.status(400).json({ message: `"${item.ten_san_pham}" khong du hang.` });
      }
    }
    const [[buyer]] = await conn.query('SELECT ho_ten,email,sdt FROM nguoi_dung WHERE mand=?', [req.user.id]);
    const subtotal = cart.reduce((sum, item) => sum + Number(item.gia_ban) * Number(item.so_luong), 0);
    const shipping = subtotal > 500000 ? 0 : 30000;
    const total = subtotal + shipping;
    const [order] = await conn.query(
      `INSERT INTO don_hang
        (mand, makm, tien_giam, ten_nguoi_nhan, email_nguoi_nhan, sdt_nguoi_nhan, loai_don_hang, tong_tien, tong_da_thanh_toan, trang_thai, trang_thai_thanh_toan, dia_chi_giao, ngay_dat, ngay_giao)
       VALUES (?, NULL, 0, ?, ?, ?, 'thuong', ?, 0, 'cho_xac_nhan', 'chua_thanh_toan', ?, NOW(), NULL)`,
      [req.user.id, buyer?.ho_ten || '', buyer?.email || '', buyer?.sdt || '', total, dia_chi_giao.trim()]
    );
    for (const item of cart) {
      await conn.query(
        'INSERT INTO chi_tiet_don_hang (madh, masp, so_luong, don_gia, thanh_tien) VALUES (?, ?, ?, ?, ?)',
        [order.insertId, item.masp, item.so_luong, item.gia_ban, Number(item.gia_ban) * Number(item.so_luong)]
      );
      await conn.query('UPDATE san_pham SET so_luong_ton = so_luong_ton - ? WHERE masp=?', [item.so_luong, item.masp]);
    }
    await conn.query(
      `INSERT INTO thanh_toan (madh, so_tien, phuong_thuc, trang_thai, ma_giao_dich, loai_thanh_toan, ngay_thanh_toan)
       VALUES (?, ?, ?, 'cho_thanh_toan', NULL, 1, NULL)`,
      [order.insertId, total, paymentToDb(phuong_thuc_tt)]
    );
    await conn.query('DELETE FROM chi_tiet_gio_hang WHERE magh=?', [cartId]);
    await conn.commit();
    res.status(201).json({ message: 'Dat hang thanh cong!', order: { id: order.insertId, tong_thanh_toan: total, ghi_chu }, payment_url: null });
  } catch (error) {
    await conn.rollback();
    res.status(500).json({ message: error.message });
  } finally {
    conn.release();
  }
});

router.post('/orders/preorder', auth, role('buyer'), async (req, res) => {
  const conn = await db.getConnection();
  try {
    const { product_id, quantity = 1, dia_chi_giao, ngay_giao_du_kien, phuong_thuc_tt = 'tien_mat' } = req.body;
    if (!dia_chi_giao?.trim() || !ngay_giao_du_kien) {
      return res.status(400).json({ message: 'Vui long nhap dia chi va ngay giao du kien.' });
    }
    await conn.beginTransaction();
    const [[product]] = await conn.query('SELECT * FROM san_pham WHERE masp=? AND trang_thai=1', [product_id]);
    if (!product) {
      await conn.rollback();
      return res.status(404).json({ message: 'Khong tim thay san pham.' });
    }
    const [[buyer]] = await conn.query('SELECT ho_ten,email,sdt FROM nguoi_dung WHERE mand=?', [req.user.id]);
    const total = Number(product.gia_ban) * Number(quantity);
    const [order] = await conn.query(
      `INSERT INTO don_hang
        (mand, makm, tien_giam, ten_nguoi_nhan, email_nguoi_nhan, sdt_nguoi_nhan, loai_don_hang, tong_tien, tong_da_thanh_toan, trang_thai, trang_thai_thanh_toan, dia_chi_giao, ngay_dat, ngay_giao)
       VALUES (?, NULL, 0, ?, ?, ?, 'dat_truoc', ?, 0, 'cho_xac_nhan', 'chua_thanh_toan', ?, NOW(), ?)`,
      [req.user.id, buyer?.ho_ten || '', buyer?.email || '', buyer?.sdt || '', total, dia_chi_giao.trim(), ngay_giao_du_kien]
    );
    await conn.query(
      'INSERT INTO chi_tiet_don_hang (madh, masp, so_luong, don_gia, thanh_tien) VALUES (?, ?, ?, ?, ?)',
      [order.insertId, product_id, quantity, product.gia_ban, total]
    );
    await conn.query(
      `INSERT INTO thanh_toan (madh, so_tien, phuong_thuc, trang_thai, ma_giao_dich, loai_thanh_toan, ngay_thanh_toan)
       VALUES (?, ?, ?, 'cho_thanh_toan', NULL, 1, NULL)`,
      [order.insertId, total, paymentToDb(phuong_thuc_tt)]
    );
    await conn.commit();
    res.status(201).json({ message: 'Dat truoc thanh cong.', order: { id: order.insertId, tong_thanh_toan: total, loai_don: 'dat_truoc' } });
  } catch (error) {
    await conn.rollback();
    res.status(500).json({ message: error.message });
  } finally {
    conn.release();
  }
});

router.post('/subscriptions', auth, role('buyer'), async (req, res) => {
  try {
    const { product_id, quantity = 1, ghi_chu, ngay_bat_dau, tan_suat_giao = 'hang_tuan', so_ky_giao = 4 } = req.body;
    const [[product]] = await db.query('SELECT gia_ban FROM san_pham WHERE masp=? AND trang_thai=1', [product_id]);
    if (!product) return res.status(404).json({ message: 'Khong tim thay san pham.' });
    const cycles = Math.max(2, Number(so_ky_giao || 4));
    const endDate = new Date(ngay_bat_dau || Date.now());
    endDate.setDate(endDate.getDate() + cycles * (tan_suat_giao === 'hang_thang' ? 30 : 7));
    const [result] = await db.query(
      `INSERT INTO dang_ky_san_pham
        (mand, masp, loai_dang_ky, so_luong, gia_du_kien, chu_ky, ngay_bat_dau, ngay_ket_thuc, so_lan_giao, so_lan_da_giao, trang_thai, ghi_chu)
       VALUES (?, ?, 'dinh_ky', ?, ?, ?, ?, ?, ?, 0, 'dang_hoat_dong', ?)`,
      [req.user.id, product_id, quantity, product.gia_ban, tan_suat_giao === 'hang_thang' ? 'hang_thang' : 'hang_tuan', ngay_bat_dau, endDate, cycles, ghi_chu || null]
    );
    res.status(201).json({ message: 'Dang ky giao dinh ky thanh cong.', subscription: { id: result.insertId, next_delivery_date: ngay_bat_dau } });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/orders', auth, role('buyer'), async (req, res) => {
  const [orders] = await db.query(
    `SELECT dh.*, tt.phuong_thuc AS phuong_thuc_tt, km.ten_km
     FROM don_hang dh
     LEFT JOIN thanh_toan tt ON tt.madh = dh.madh
     LEFT JOIN khuyen_mai km ON km.makm = dh.makm
     WHERE dh.mand=?
     ORDER BY dh.ngay_dat DESC`,
    [req.user.id]
  );
  res.json({ orders: orders.map(mapOrder) });
});

router.get('/orders/:id', auth, async (req, res) => {
  const [orders] = await db.query(
    `SELECT dh.*, nd.ho_ten AS ten_nguoi_mua, nd.sdt AS so_dien_thoai, tt.phuong_thuc AS phuong_thuc_tt, km.ten_km
     FROM don_hang dh
     JOIN nguoi_dung nd ON nd.mand = dh.mand
     LEFT JOIN thanh_toan tt ON tt.madh = dh.madh
     LEFT JOIN khuyen_mai km ON km.makm = dh.makm
     WHERE dh.madh=?`,
    [req.params.id]
  );
  if (!orders.length) return res.status(404).json({ message: 'Khong tim thay don hang.' });
  if (String(orders[0].mand) !== String(req.user.id) && req.user.vai_tro !== 'quan_tri') {
    return res.status(403).json({ message: 'Ban khong co quyen xem don hang nay.' });
  }
  const [items] = await db.query(
    `SELECT ct.mactdh AS ma_chi_tiet, ct.madh AS ma_don_hang, ct.masp AS ma_san_pham,
            sp.ten_san_pham, NULL AS hinh_san_pham, sp.don_vi, ct.so_luong,
            ct.don_gia AS gia_tai_thoi_diem, ct.thanh_tien
     FROM chi_tiet_don_hang ct
     JOIN san_pham sp ON sp.masp = ct.masp
     WHERE ct.madh=?`,
    [req.params.id]
  );
  res.json({ order: mapOrder(orders[0]), items });
});

router.patch('/orders/:id/cancel', auth, role('buyer'), async (req, res) => {
  await db.query("UPDATE don_hang SET trang_thai='huy' WHERE madh=? AND mand=? AND trang_thai IN ('cho_xac_nhan','dang_giao')", [req.params.id, req.user.id]);
  res.json({ message: 'Huy don thanh cong.' });
});

router.patch('/orders/:id/status', auth, role('admin'), async (req, res) => {
  const status = toDbStatus(req.body.trang_thai);
  if (!['cho_xac_nhan', 'dang_giao', 'hoan_thanh', 'huy'].includes(status)) {
    return res.status(400).json({ message: 'Trang thai khong hop le.' });
  }
  await db.query("UPDATE don_hang SET trang_thai=?, ngay_giao=IF(?='hoan_thanh', NOW(), ngay_giao) WHERE madh=?", [status, status, req.params.id]);
  if (status === 'hoan_thanh') {
    await db.query("UPDATE don_hang SET trang_thai_thanh_toan='da_thanh_toan', tong_da_thanh_toan=tong_tien WHERE madh=?", [req.params.id]);
    await db.query("UPDATE thanh_toan SET trang_thai='da_thanh_toan', ngay_thanh_toan=NOW() WHERE madh=?", [req.params.id]);
  }
  res.json({ message: 'Cap nhat thanh cong.' });
});

router.get('/products/:id/reviews', async (req, res) => {
  const [reviews] = await db.query(
    `SELECT dg.madg AS ma_danh_gia, dg.mand AS ma_nguoi_mua, dg.masp AS ma_san_pham,
            NULL AS ma_don_hang, dg.so_sao, dg.binh_luan AS noi_dung,
            dg.ngay_danh_gia AS ngay_tao, nd.ho_ten AS ten_nguoi_mua
     FROM danh_gia dg
     JOIN nguoi_dung nd ON nd.mand = dg.mand
     WHERE dg.masp=?
     ORDER BY dg.ngay_danh_gia DESC`,
    [req.params.id]
  );
  res.json({ reviews });
});

router.post('/reviews', auth, role('buyer'), async (req, res) => {
  const { ma_san_pham, so_sao, noi_dung } = req.body;
  await db.query(
    'INSERT INTO danh_gia (mand, masp, so_sao, binh_luan, ngay_danh_gia) VALUES (?, ?, ?, ?, NOW())',
    [req.user.id, ma_san_pham, so_sao, noi_dung]
  );
  res.status(201).json({ message: 'Danh gia thanh cong.' });
});

router.get('/admin/dashboard', auth, role('admin'), async (req, res) => {
  const [[{ tong_tk }]] = await db.query('SELECT COUNT(*) AS tong_tk FROM nguoi_dung');
  const [[{ tong_sp }]] = await db.query('SELECT COUNT(*) AS tong_sp FROM san_pham');
  const [[{ tong_dh }]] = await db.query('SELECT COUNT(*) AS tong_dh FROM don_hang');
  const [[{ doanh_thu }]] = await db.query("SELECT COALESCE(SUM(tong_tien),0) AS doanh_thu FROM don_hang WHERE trang_thai='hoan_thanh'");
  const [gan_day_raw] = await db.query(
    `SELECT dh.*, nd.ho_ten AS ten_nguoi_mua
     FROM don_hang dh
     JOIN nguoi_dung nd ON nd.mand = dh.mand
     ORDER BY dh.ngay_dat DESC
     LIMIT 5`
  );
  const [top_sp] = await db.query('SELECT ten_san_pham, 0 AS so_luong_ban, gia_ban FROM san_pham ORDER BY masp DESC LIMIT 5');
  res.json({ tong_tk, tong_sp, tong_dh, doanh_thu, gan_day: gan_day_raw.map(mapOrder), top_sp });
});

router.get('/admin/accounts', auth, role('admin'), async (req, res) => {
  const { q, vai_tro, page = 1, limit = 15 } = req.query;
  const offset = (Number(page) - 1) * Number(limit);
  const params = [];
  let where = 'WHERE 1=1';
  if (q) {
    where += ' AND (nd.ho_ten LIKE ? OR nd.email LIKE ?)';
    params.push(`%${q}%`, `%${q}%`);
  }
  if (vai_tro) {
    where += ' AND nd.mavt=?';
    params.push(vai_tro === 'quan_tri' || vai_tro === 'admin' ? 1 : 2);
  }
  const [accounts] = await db.query(
    `SELECT nd.mand AS ma_tai_khoan, nd.ho_ten, nd.email, nd.sdt AS so_dien_thoai,
            CASE WHEN nd.mavt=1 THEN 'quan_tri' ELSE 'nguoi_mua' END AS vai_tro,
            nd.trang_thai AS con_hoat_dong, NULL AS ngay_tao
     FROM nguoi_dung nd ${where}
     ORDER BY nd.mand DESC
     LIMIT ? OFFSET ?`,
    [...params, Number(limit), offset]
  );
  const [[{ total }]] = await db.query(`SELECT COUNT(*) AS total FROM nguoi_dung nd ${where}`, params);
  res.json({ accounts, total });
});

router.patch('/admin/accounts/:id/toggle', auth, role('admin'), async (req, res) => {
  await db.query('UPDATE nguoi_dung SET trang_thai = NOT trang_thai WHERE mand=?', [req.params.id]);
  res.json({ message: 'Cap nhat thanh cong.' });
});

router.get('/admin/orders', auth, role('admin'), async (req, res) => {
  const { trang_thai, page = 1, limit = 15 } = req.query;
  const offset = (Number(page) - 1) * Number(limit);
  const params = [];
  let where = 'WHERE 1=1';
  if (trang_thai) {
    where += ' AND dh.trang_thai=?';
    params.push(toDbStatus(trang_thai));
  }
  const [orders] = await db.query(
    `SELECT dh.*, nd.ho_ten AS ten_nguoi_mua, nd.sdt AS so_dien_thoai, tt.phuong_thuc AS phuong_thuc_tt
     FROM don_hang dh
     JOIN nguoi_dung nd ON nd.mand=dh.mand
     LEFT JOIN thanh_toan tt ON tt.madh=dh.madh
     ${where}
     ORDER BY dh.ngay_dat DESC
     LIMIT ? OFFSET ?`,
    [...params, Number(limit), offset]
  );
  const [[{ total }]] = await db.query(`SELECT COUNT(*) AS total FROM don_hang dh ${where}`, params);
  res.json({ orders: orders.map(mapOrder), total });
});

router.get('/admin/categories', auth, role('admin'), async (req, res) => {
  const [categories] = await db.query(
    `SELECT madm AS ma_danh_muc, ten_danh_muc, '' AS duong_dan, '' AS bieu_tuong,
            madm AS thu_tu, trang_thai AS con_hoat_dong
     FROM danh_muc
     ORDER BY madm`
  );
  res.json({ categories });
});

router.get('/admin/categories/:id/products', auth, role('admin'), async (req, res) => {
  const [products] = await db.query(
    `${productSelect}
     WHERE sp.madm=?
     GROUP BY sp.masp
     ORDER BY sp.ngay_tao DESC`,
    [req.params.id]
  );
  res.json({ products: products.map(mapProduct) });
});

router.post('/admin/categories', auth, role('admin'), async (req, res) => {
  const { ten_danh_muc, con_hoat_dong = 1 } = req.body;
  await db.query('INSERT INTO danh_muc (ten_danh_muc, mo_ta, trang_thai) VALUES (?, ?, ?)', [ten_danh_muc, null, con_hoat_dong]);
  res.status(201).json({ message: 'Tao thanh cong.' });
});

router.put('/admin/categories/:id', auth, role('admin'), async (req, res) => {
  const { ten_danh_muc, con_hoat_dong = 1 } = req.body;
  await db.query('UPDATE danh_muc SET ten_danh_muc=?, trang_thai=? WHERE madm=?', [ten_danh_muc, con_hoat_dong, req.params.id]);
  res.json({ message: 'Cap nhat thanh cong.' });
});

router.patch('/admin/categories/:id/toggle', auth, role('admin'), async (req, res) => {
  await db.query('UPDATE danh_muc SET trang_thai = NOT trang_thai WHERE madm=?', [req.params.id]);
  res.json({ message: 'Cap nhat thanh cong.' });
});

router.delete('/admin/categories/:id', auth, role('admin'), async (req, res) => {
  await db.query('DELETE FROM danh_muc WHERE madm=?', [req.params.id]);
  res.json({ message: 'Xoa thanh cong.' });
});

router.get('/subscriptions', auth, role('buyer'), async (req, res) => {
  const [subscriptions] = await db.query(
    `SELECT dk.madk AS ma_dang_ky, dk.mand AS ma_nguoi_mua, dk.masp AS ma_san_pham,
            dk.so_luong, sp.don_vi, dk.gia_du_kien AS gia_tam_tinh,
            CASE WHEN dk.chu_ky='hang_thang' THEN 'hang_thang' ELSE 'hang_tuan' END AS tan_suat_giao,
            dk.so_lan_giao AS so_ky_giao, dk.so_lan_da_giao AS so_ky_da_giao,
            dk.ngay_bat_dau, dk.ngay_bat_dau AS ngay_giao_tiep_theo,
            NULL AS dia_chi_giao, 'tien_mat' AS phuong_thuc_tt, dk.ghi_chu,
            CASE WHEN dk.trang_thai='hoan_thanh' THEN 'hoan_tat' ELSE dk.trang_thai END AS trang_thai,
            sp.ten_san_pham, sp.khu_vuc AS ten_nong_trai
     FROM dang_ky_san_pham dk
     JOIN san_pham sp ON sp.masp=dk.masp
     WHERE dk.mand=?
     ORDER BY dk.madk DESC`,
    [req.user.id]
  );
  res.json({ subscriptions });
});

router.patch('/subscriptions/:id/cancel', auth, role('buyer'), async (req, res) => {
  await db.query("UPDATE dang_ky_san_pham SET trang_thai='tam_dung' WHERE madk=? AND mand=?", [req.params.id, req.user.id]);
  res.json({ message: 'Da huy dang ky giao dinh ky.' });
});

router.get('/admin/subscriptions', auth, role('admin'), async (req, res) => {
  const [subscriptions] = await db.query(
    `SELECT dk.madk AS ma_dang_ky, dk.mand AS ma_nguoi_mua, dk.masp AS ma_san_pham,
            dk.so_luong, dk.gia_du_kien AS gia_tam_tinh, dk.chu_ky AS tan_suat_giao,
            dk.so_lan_giao AS so_ky_giao, dk.so_lan_da_giao AS so_ky_da_giao,
            dk.ngay_bat_dau, dk.ngay_bat_dau AS ngay_giao_tiep_theo,
            dk.trang_thai, sp.ten_san_pham, nd.ho_ten AS ten_nguoi_mua, sp.khu_vuc AS ten_nong_trai
     FROM dang_ky_san_pham dk
     JOIN san_pham sp ON sp.masp=dk.masp
     JOIN nguoi_dung nd ON nd.mand=dk.mand
     ORDER BY dk.madk DESC`
  );
  res.json({ subscriptions });
});

router.patch('/admin/subscriptions/:id/deliver', auth, role('admin'), async (req, res) => {
  await db.query(
    `UPDATE dang_ky_san_pham
     SET so_lan_da_giao = COALESCE(so_lan_da_giao, 0) + 1,
         trang_thai = IF(COALESCE(so_lan_da_giao, 0) + 1 >= so_lan_giao, 'hoan_thanh', 'dang_hoat_dong')
     WHERE madk=?`,
    [req.params.id]
  );
  res.json({ message: 'Da ghi nhan mot ky giao.' });
});

router.get('/notifications', auth, async (req, res) => {
  const [notifications] = await db.query(
    `SELECT matb AS ma_thong_bao, mand AS ma_tai_khoan, loai AS loai_tb,
            tieu_de, noi_dung, NULL AS du_lieu_them, da_doc, ngay_tao
     FROM thong_bao
     WHERE mand=?
     ORDER BY ngay_tao DESC
     LIMIT 20`,
    [req.user.id]
  );
  res.json({ notifications });
});

router.get('/farmer/orders', auth, (req, res) => res.status(410).json({ message: 'Chuc nang nong dan khong kha dung.' }));
router.get('/farmer/subscriptions', auth, (req, res) => res.status(410).json({ message: 'Chuc nang nong dan khong kha dung.' }));
router.get('/farmer/dashboard', auth, (req, res) => res.status(410).json({ message: 'Chuc nang nong dan khong kha dung.' }));
router.get('/farmer/profile', auth, (req, res) => res.status(410).json({ message: 'Chuc nang nong dan khong kha dung.' }));
router.put('/farmer/profile', auth, (req, res) => res.status(410).json({ message: 'Chuc nang nong dan khong kha dung.' }));
router.get('/admin/farmers', auth, role('admin'), (req, res) => res.status(410).json({ message: 'Chuc nang nong dan khong kha dung.' }));
router.patch('/admin/farmers/:id/verify', auth, role('admin'), (req, res) => res.status(410).json({ message: 'Chuc nang nong dan khong kha dung.' }));
router.delete('/admin/farmers/:id', auth, role('admin'), (req, res) => res.status(410).json({ message: 'Chuc nang nong dan khong kha dung.' }));
router.post('/orders/:id/vnpay-payment', auth, role('buyer'), (req, res) => res.status(503).json({ message: 'DB moi khong co VNPAY; tam thoi dung thanh toan tien mat/banking.' }));
router.get('/payments/vnpay/return', (req, res) => res.redirect(`${process.env.CLIENT_URL || 'http://localhost:3000'}/orders?vnpay=unsupported`));
router.get('/payments/vnpay/ipn', (req, res) => res.json({ RspCode: '99', Message: 'VNPAY khong kha dung voi schema moi.' }));

module.exports = router;
