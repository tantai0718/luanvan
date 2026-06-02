const express  = require('express');
const router   = express.Router();
const db       = require('../config/db');
const { auth, role } = require('../middlewares/auth');
const authCtrl = require('../controllers/authController');
const { parseImages, serializeImages } = require('../utils/images');
const {
  createVnpayPaymentUrl,
  getClientIp,
  hasVnpayConfig,
  orderIdFromTxnRef,
  verifyVnpayParams,
} = require('../utils/vnpay');

const addDays = (dateString, days) => {
  const date = new Date(dateString);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
};

const nextDeliveryDate = (startDate, frequency) => {
  if (frequency === 'hai_tuan') return addDays(startDate, 14);
  if (frequency === 'hang_thang') {
    const date = new Date(startDate);
    date.setMonth(date.getMonth() + 1);
    return date.toISOString().slice(0, 10);
  }
  return addDays(startDate, 7);
};

const frontendUrl = path => `${process.env.CLIENT_URL || 'http://localhost:3000'}${path}`;

router.get('/', (req, res) => {
  res.json({ message: 'Cho Nong San API dang chay.', version: '1.0.0' });
});

const getCompletedOrderCount = async (conn, buyerId) => {
  const [[row]] = await conn.query(
    "SELECT COUNT(*) AS total FROM don_hang WHERE ma_nguoi_mua=? AND trang_thai='da_giao'",
    [buyerId]
  );
  return Number(row?.total || 0);
};

const calculateOrderPromotion = async (conn, buyerId, subtotal, totalQuantity) => {
  const safeSubtotal = Number(subtotal || 0);
  const safeQuantity = Number(totalQuantity || 0);
  const completedOrders = await getCompletedOrderCount(conn, buyerId);
  const discounts = [];

  if (safeQuantity >= 10) {
    discounts.push({
      code: 'BULK_QUANTITY',
      label: 'Mua tu 10 san pham',
      rate: 0.05,
      amount: Math.round(safeSubtotal * 0.05),
    });
  }

  if (completedOrders >= 3) {
    discounts.push({
      code: 'LOYAL_CUSTOMER',
      label: 'Khach hang mua nhieu lan',
      rate: 0.07,
      amount: Math.round(safeSubtotal * 0.07),
    });
  }

  return {
    completedOrders,
    discountAmount: discounts.reduce((sum, discount) => sum + discount.amount, 0),
    discounts,
    note: discounts.map(discount => `${discount.label}: ${Math.round(discount.rate * 100)}%`).join('; ') || null,
  };
};

const createOrderVnpayPaymentUrl = (req, order) =>
  createVnpayPaymentUrl({
    orderId: order.ma_don_hang || order.id,
    amount: order.tong_thanh_toan,
    ipAddr: getClientIp(req),
  });

async function handleVnpayResult(rawParams) {
  const verification = verifyVnpayParams(rawParams);
  const params = verification.params;
  const orderId = orderIdFromTxnRef(params.vnp_TxnRef);

  if (!verification.valid) {
    return { ok: false, code: '97', orderId, message: 'Chu ky VNPAY khong hop le.' };
  }

  if (!orderId) {
    return { ok: false, code: '01', orderId: null, message: 'Ma don hang VNPAY khong hop le.' };
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const [orders] = await conn.query(
      `SELECT dh.ma_don_hang, dh.tong_thanh_toan, dh.phuong_thuc_tt, dh.trang_thai_tt,
              tt.trang_thai AS payment_status
       FROM don_hang dh
       LEFT JOIN thanh_toan tt ON tt.ma_don_hang = dh.ma_don_hang
       WHERE dh.ma_don_hang = ?
       LIMIT 1`,
      [orderId]
    );
    const order = orders[0];

    if (!order || order.phuong_thuc_tt !== 'vnpay') {
      await conn.rollback();
      return { ok: false, code: '01', orderId, message: 'Khong tim thay don VNPAY.' };
    }

    if (Number(params.vnp_Amount) !== Number(order.tong_thanh_toan) * 100) {
      await conn.rollback();
      return { ok: false, code: '04', orderId, message: 'So tien VNPAY khong khop.' };
    }

    const paid = order.trang_thai_tt === 'da_tt' || order.payment_status === 'thanh_cong';
    const success = params.vnp_ResponseCode === '00' && params.vnp_TransactionStatus === '00';
    const gatewayData = JSON.stringify(params);

    if (paid) {
      await conn.commit();
      return { ok: true, code: '02', orderId, paid: true, message: 'Don hang da thanh toan.' };
    }

    await conn.query(
      `UPDATE thanh_toan
       SET ma_giao_dich = ?,
           du_lieu_cong = ?,
           trang_thai = ?,
           ngay_thanh_toan = ?
       WHERE ma_don_hang = ? AND phuong_thuc = 'vnpay'`,
      [
        params.vnp_TransactionNo && params.vnp_TransactionNo !== '0' ? params.vnp_TransactionNo : null,
        gatewayData,
        success ? 'thanh_cong' : 'that_bai',
        success ? new Date() : null,
        orderId,
      ]
    );

    if (success) {
      await conn.query("UPDATE don_hang SET trang_thai_tt='da_tt' WHERE ma_don_hang=?", [orderId]);
    }

    await conn.commit();
    return {
      ok: success,
      code: success ? '00' : params.vnp_ResponseCode || '99',
      orderId,
      paid: success,
      message: success ? 'Thanh toan VNPAY thanh cong.' : 'VNPAY chua xac nhan thanh toan.',
    };
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
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
    const {
      q,
      category,
      sort = 'moi_nhat',
      page = 1,
      limit = 12,
      min_price,
      max_price,
      province,
      in_stock,
    } = req.query;
    const offset = (page - 1) * limit;
    const params = [];
    let where = 'WHERE sp.con_hoat_dong = 1';

    if (q) {
      where += ' AND (sp.ten_san_pham LIKE ? OR sp.mo_ta LIKE ?)';
      params.push(`%${q}%`, `%${q}%`);
    }
    if (category) {
      where += ' AND sp.ma_danh_muc = ?';
      params.push(category);
    }
    if (min_price !== undefined && min_price !== '') {
      where += ' AND sp.gia_ban >= ?';
      params.push(Number(min_price));
    }
    if (max_price !== undefined && max_price !== '') {
      where += ' AND sp.gia_ban <= ?';
      params.push(Number(max_price));
    }
    if (province) {
      where += ' AND nd.tinh_thanh = ?';
      params.push(province);
    }
    if (String(in_stock) === '1') {
      where += ' AND sp.ton_kho > 0';
    }

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
             sp.ton_kho, sp.so_luong_ban,
             sp.diem_danh_gia, sp.tong_danh_gia, sp.hinh_anh, sp.con_hoat_dong,
             sp.ma_nong_dan,
             COALESCE(nd.ten_nong_trai, 'Cửa hàng Nông Sản Việt') AS ten_nong_trai,
             nd.tinh_thanh,
             COALESCE(tk.ho_ten, 'Quản trị viên') AS ten_nong_dan,
             dm.ten_danh_muc, dm.bieu_tuong
      FROM san_pham sp
      LEFT JOIN nong_dan nd ON nd.ma_nong_dan = sp.ma_nong_dan
      LEFT JOIN tai_khoan tk ON tk.ma_tai_khoan = nd.ma_tai_khoan
      JOIN danh_muc dm ON dm.ma_danh_muc = sp.ma_danh_muc
      ${where}
      ORDER BY ${ord}
      LIMIT ? OFFSET ?
    `;
    const [products] = await db.query(sql, [...params, +limit, +offset]);
    const [[{ total }]] = await db.query(
      `SELECT COUNT(*) AS total
       FROM san_pham sp
       LEFT JOIN nong_dan nd ON nd.ma_nong_dan = sp.ma_nong_dan
       LEFT JOIN tai_khoan tk ON tk.ma_tai_khoan = nd.ma_tai_khoan
       ${where}`,
      params
    );

    products.forEach(product => {
      product.images = parseImages(product.hinh_anh);
    });

    res.json({ products, total, page: +page, limit: +limit });
  } catch (e) {
    console.error(e);
    res.status(500).json({ message: e.message });
  }
});

router.get('/products/:id', async (req, res) => {
  try {
    const [rows] = await db.query(
      `
      SELECT sp.*,
             COALESCE(nd.ten_nong_trai, 'Cửa hàng Nông Sản Việt') AS ten_nong_trai,
             nd.tinh_thanh,
             COALESCE(nd.gioi_thieu, 'Sản phẩm được quản lý tập trung bởi quản trị viên để đảm bảo thông tin nhất quán và nguồn hàng rõ ràng.') AS gioi_thieu,
             COALESCE(nd.da_xac_minh, 1) AS da_xac_minh,
             COALESCE(tk.ho_ten, 'Quản trị viên') AS ten_nong_dan,
             COALESCE(tk.so_dien_thoai, '') AS sdt_nd,
             dm.ten_danh_muc, dm.bieu_tuong
      FROM san_pham sp
      LEFT JOIN nong_dan nd ON nd.ma_nong_dan = sp.ma_nong_dan
      LEFT JOIN tai_khoan tk ON tk.ma_tai_khoan = nd.ma_tai_khoan
      JOIN danh_muc dm ON dm.ma_danh_muc = sp.ma_danh_muc
      WHERE sp.ma_san_pham = ? AND sp.con_hoat_dong = 1
    `,
      [req.params.id]
    );

    if (!rows.length) {
      return res.status(404).json({ message: 'Không tìm thấy sản phẩm.' });
    }

    const product = rows[0];
    product.images = parseImages(product.hinh_anh);
    res.json({ product });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.get('/admin/products', auth, role('admin'), async (req, res) => {
  try {
    const { q = '' } = req.query;
    const params = [];
    let where = 'WHERE 1=1';

    if (q) {
      where += ' AND (sp.ten_san_pham LIKE ? OR sp.mo_ta LIKE ?)';
      params.push(`%${q}%`, `%${q}%`);
    }

    const [products] = await db.query(
      `
      SELECT sp.*,
             dm.ten_danh_muc,
             dm.bieu_tuong,
             COALESCE(nd.ten_nong_trai, 'Cửa hàng Nông Sản Việt') AS ten_nong_trai,
             COALESCE(tk.ho_ten, 'Quản trị viên') AS ten_nong_dan
      FROM san_pham sp
      LEFT JOIN danh_muc dm ON dm.ma_danh_muc = sp.ma_danh_muc
      LEFT JOIN nong_dan nd ON nd.ma_nong_dan = sp.ma_nong_dan
      LEFT JOIN tai_khoan tk ON tk.ma_tai_khoan = nd.ma_tai_khoan
      ${where}
      ORDER BY sp.ngay_tao DESC
    `,
      params
    );

    res.json({
      products: products.map(product => ({
        ...product,
        images: parseImages(product.hinh_anh),
      })),
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.post('/products', auth, role('admin'), async (req, res) => {
  try {
    const {
      ten_san_pham,
      mo_ta,
      gia_ban,
      don_vi,
      ton_kho = 0,
      ma_danh_muc,
      hinh_anh = [],
    } = req.body;
    const slug = ten_san_pham
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[đĐ]/g, 'd')
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '') + `-${Date.now()}`;

    const [result] = await db.query(
      `INSERT INTO san_pham
        (ma_nong_dan, ma_danh_muc, ten_san_pham, duong_dan, mo_ta, gia_ban, don_vi, ton_kho, hinh_anh)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [null, ma_danh_muc, ten_san_pham, slug, mo_ta, gia_ban, don_vi, ton_kho, serializeImages(hinh_anh)]
    );

    res.status(201).json({ message: 'Tạo sản phẩm thành công.', ma_san_pham: result.insertId });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.put('/products/:id', auth, role('admin'), async (req, res) => {
  try {
    const {
      ten_san_pham,
      mo_ta,
      gia_ban,
      don_vi,
      ton_kho,
      ma_danh_muc,
      hinh_anh = [],
    } = req.body;

    await db.query(
      `UPDATE san_pham
       SET ten_san_pham=?, mo_ta=?, gia_ban=?, don_vi=?, ton_kho=?, ma_danh_muc=?, hinh_anh=?
       WHERE ma_san_pham=?`,
      [ten_san_pham, mo_ta, gia_ban, don_vi, ton_kho, ma_danh_muc, serializeImages(hinh_anh), req.params.id]
    );

    res.json({ message: 'Cập nhật sản phẩm thành công.' });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.patch('/products/:id/toggle', auth, role('admin'), async (req, res) => {
  await db.query('UPDATE san_pham SET con_hoat_dong = NOT con_hoat_dong WHERE ma_san_pham = ?', [req.params.id]);
  res.json({ message: 'Đã cập nhật trạng thái sản phẩm.' });
});

router.delete('/products/:id', auth, role('admin'), async (req, res) => {
  await db.query('DELETE FROM san_pham WHERE ma_san_pham = ?', [req.params.id]);
  res.json({ message: 'Đã xóa sản phẩm.' });
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
             sp.ton_kho AS stock,
             COALESCE(nd.ten_nong_trai, 'Cửa hàng Nông Sản Việt') AS farm_name
      FROM gio_hang gh
      JOIN san_pham sp ON sp.ma_san_pham = gh.ma_san_pham
      LEFT JOIN nong_dan nd ON nd.ma_nong_dan = sp.ma_nong_dan
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
    const subtotal = cart.reduce((sum, item) => sum + Number(item.quantity) * Number(item.product?.price || 0), 0);
    const totalQuantity = cart.reduce((sum, item) => sum + Number(item.quantity || 0), 0);
    const promotion = await calculateOrderPromotion(db, req.user.id, subtotal, totalQuantity);
    const shipping = subtotal > 500000 ? 0 : 30000;

    res.json({
      cart,
      summary: {
        subtotal,
        totalQuantity,
        shipping,
        discountAmount: promotion.discountAmount,
        discounts: promotion.discounts,
        completedOrders: promotion.completedOrders,
        total: Math.max(0, subtotal - promotion.discountAmount) + shipping,
      },
    });
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
  const { phuong_thuc_tt = 'tien_mat' } = req.body;
  if (!['tien_mat', 'vnpay'].includes(phuong_thuc_tt)) {
    return res.status(400).json({ message: 'Phuong thuc thanh toan khong hop le' });
  }
  if (phuong_thuc_tt === 'vnpay' && !hasVnpayConfig()) {
    return res.status(503).json({ message: 'Chua cau hinh tai khoan VNPAY cho website.' });
  }

  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const { dia_chi_giao, ghi_chu } = req.body;
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
    const tong_so_luong = cart.reduce((s, i) => s + Number(i.so_luong || 0), 0);
    const promotion = await calculateOrderPromotion(conn, req.user.id, tong_tien_hang, tong_so_luong);
    const giam_gia = promotion.discountAmount;
    const phi_van_chuyen  = tong_tien_hang > 500000 ? 0 : 30000;
    const tong_thanh_toan = Math.max(0, tong_tien_hang - giam_gia) + phi_van_chuyen;

    const [dh] = await conn.query(
      'INSERT INTO don_hang (ma_nguoi_mua,tong_tien_hang,phi_van_chuyen,giam_gia,tong_thanh_toan,dia_chi_giao,ghi_chu,phuong_thuc_tt,loai_don,ghi_chu_khuyen_mai) VALUES (?,?,?,?,?,?,?,?,?,?)',
      [req.user.id, tong_tien_hang, phi_van_chuyen, giam_gia, tong_thanh_toan, dia_chi_giao, ghi_chu || null, phuong_thuc_tt, 'thuong', promotion.note]
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
    await conn.commit();
    const order = { id: ma_don, tong_thanh_toan, giam_gia, khuyen_mai: promotion.discounts };
    const payment_url = phuong_thuc_tt === 'vnpay' ? createOrderVnpayPaymentUrl(req, order) : null;
    res.status(201).json({ message: 'Äáº·t hÃ ng thÃ nh cÃ´ng!', order, payment_url });
  } catch (e) {
    await conn.rollback();
    console.error(e);
    res.status(500).json({ message: e.message });
  } finally { conn.release(); }
});

router.get('/payments/vnpay/return', async (req, res) => {
  try {
    const result = await handleVnpayResult(req.query);
    if (!result.orderId) {
      return res.redirect(frontendUrl('/orders?vnpay=invalid'));
    }

    const paymentResult = result.paid ? 'success' : 'failed';
    res.redirect(frontendUrl(`/orders/${result.orderId}?vnpay=${paymentResult}&code=${result.code}`));
  } catch (error) {
    console.error(error);
    res.redirect(frontendUrl('/orders?vnpay=error'));
  }
});

router.get('/payments/vnpay/ipn', async (req, res) => {
  try {
    const result = await handleVnpayResult(req.query);
    res.json({ RspCode: result.code, Message: result.message });
  } catch (error) {
    console.error(error);
    res.json({ RspCode: '99', Message: 'Loi cap nhat ket qua VNPAY.' });
  }
});

router.post('/orders/preorder', auth, role('buyer'), async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const {
      product_id,
      quantity = 1,
      dia_chi_giao,
      ghi_chu,
      phuong_thuc_tt = 'tien_mat',
      ngay_giao_du_kien,
    } = req.body;

    if (!product_id || Number(quantity) <= 0) {
      return res.status(400).json({ message: 'Thông tin đặt trước chưa hợp lệ' });
    }

    if (!dia_chi_giao?.trim()) {
      return res.status(400).json({ message: 'Vui lòng nhập địa chỉ giao hàng' });
    }

    if (!ngay_giao_du_kien) {
      return res.status(400).json({ message: 'Vui lòng chọn ngày giao dự kiến' });
    }

    const today = new Date().toISOString().slice(0, 10);
    if (ngay_giao_du_kien <= today) {
      return res.status(400).json({ message: 'Ngày giao dự kiến phải sau ngày hiện tại' });
    }

    const [products] = await conn.query(
      `SELECT sp.ma_san_pham, sp.ten_san_pham, sp.gia_ban, sp.don_vi, sp.hinh_anh, sp.ma_nong_dan
       FROM san_pham sp
       WHERE sp.ma_san_pham=? AND sp.con_hoat_dong=1`,
      [product_id]
    );

    if (!products.length) {
      return res.status(404).json({ message: 'Không tìm thấy sản phẩm để đặt trước' });
    }

    const product = products[0];
    const qty = Number(quantity);
    const tong_tien_hang = Number(product.gia_ban) * qty;
    const promotion = await calculateOrderPromotion(conn, req.user.id, tong_tien_hang, qty);
    const giam_gia = promotion.discountAmount;
    const phi_van_chuyen = tong_tien_hang > 500000 ? 0 : 30000;
    const tong_thanh_toan = Math.max(0, tong_tien_hang - giam_gia) + phi_van_chuyen;

    const [dh] = await conn.query(
      `INSERT INTO don_hang
        (ma_nguoi_mua,tong_tien_hang,phi_van_chuyen,giam_gia,tong_thanh_toan,dia_chi_giao,ghi_chu,phuong_thuc_tt,loai_don,ngay_giao_du_kien,ghi_chu_he_thong,ghi_chu_khuyen_mai)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        req.user.id,
        tong_tien_hang,
        phi_van_chuyen,
        giam_gia,
        tong_thanh_toan,
        dia_chi_giao.trim(),
        ghi_chu || null,
        phuong_thuc_tt,
        'dat_truoc',
        ngay_giao_du_kien,
        `Đơn đặt trước cho ngày ${ngay_giao_du_kien}`,
        promotion.note,
      ]
    );

    const img = parseImages(product.hinh_anh);
    await conn.query(
      `INSERT INTO chi_tiet_don_hang
        (ma_don_hang,ma_san_pham,ma_nong_dan,ten_san_pham,hinh_san_pham,don_vi,so_luong,gia_tai_thoi_diem,thanh_tien)
       VALUES (?,?,?,?,?,?,?,?,?)`,
      [dh.insertId, product.ma_san_pham, product.ma_nong_dan, product.ten_san_pham, img[0] || null, product.don_vi, qty, product.gia_ban, tong_tien_hang]
    );

    await conn.query(
      'INSERT INTO thanh_toan (ma_don_hang,phuong_thuc,so_tien) VALUES (?,?,?)',
      [dh.insertId, phuong_thuc_tt, tong_thanh_toan]
    );

    await conn.commit();
    res.status(201).json({
      message: 'Đặt trước thành công',
      order: { id: dh.insertId, tong_thanh_toan, giam_gia, khuyen_mai: promotion.discounts, loai_don: 'dat_truoc' },
    });
  } catch (e) {
    await conn.rollback();
    res.status(500).json({ message: e.message });
  } finally {
    conn.release();
  }
});

router.post('/subscriptions', auth, role('buyer'), async (req, res) => {
  try {
    const {
      product_id,
      quantity = 1,
      dia_chi_giao,
      ghi_chu,
      phuong_thuc_tt = 'tien_mat',
      ngay_bat_dau,
      tan_suat_giao = 'hang_tuan',
      so_ky_giao = 4,
    } = req.body;

    if (!product_id || Number(quantity) <= 0) {
      return res.status(400).json({ message: 'Thông tin đăng ký chưa hợp lệ' });
    }

    if (!dia_chi_giao?.trim() || !ngay_bat_dau) {
      return res.status(400).json({ message: 'Vui lòng nhập đủ địa chỉ và ngày bắt đầu' });
    }

    const validFrequencies = ['hang_tuan', 'hai_tuan', 'hang_thang'];
    if (!validFrequencies.includes(tan_suat_giao)) {
      return res.status(400).json({ message: 'Tần suất giao không hợp lệ' });
    }

    const [products] = await db.query(
      `SELECT ma_san_pham, ten_san_pham, gia_ban, don_vi, ma_nong_dan
       FROM san_pham
       WHERE ma_san_pham=? AND con_hoat_dong=1`,
      [product_id]
    );

    if (!products.length) {
      return res.status(404).json({ message: 'Không tìm thấy sản phẩm để đăng ký giao định kỳ' });
    }

    const product = products[0];
    const qty = Number(quantity);
    const cycles = Math.max(2, Number(so_ky_giao || 4));

    const [result] = await db.query(
      `INSERT INTO dang_ky_giao_dinh_ky
        (ma_nguoi_mua,ma_san_pham,ma_nong_dan,so_luong,don_vi,gia_tam_tinh,tan_suat_giao,so_ky_giao,ngay_bat_dau,ngay_giao_tiep_theo,dia_chi_giao,phuong_thuc_tt,ghi_chu)
       VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
      [
        req.user.id,
        product.ma_san_pham,
        product.ma_nong_dan,
        qty,
        product.don_vi,
        Number(product.gia_ban),
        tan_suat_giao,
        cycles,
        ngay_bat_dau,
        ngay_bat_dau,
        dia_chi_giao.trim(),
        phuong_thuc_tt,
        ghi_chu || null,
      ]
    );

    res.status(201).json({
      message: 'Đăng ký giao định kỳ thành công',
      subscription: { id: result.insertId, next_delivery_date: ngay_bat_dau },
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.get('/orders', auth, role('buyer'), async (req, res) => {
  const [orders] = await db.query(
    'SELECT * FROM don_hang WHERE ma_nguoi_mua=? ORDER BY ngay_tao DESC', [req.user.id]
  );
  res.json({ orders });
});

router.post('/orders/:id/vnpay-payment', auth, role('buyer'), async (req, res) => {
  if (!hasVnpayConfig()) {
    return res.status(503).json({ message: 'Chua cau hinh tai khoan VNPAY cho website.' });
  }

  const [orders] = await db.query(
    `SELECT ma_don_hang, tong_thanh_toan, phuong_thuc_tt, trang_thai_tt, trang_thai
     FROM don_hang
     WHERE ma_don_hang=? AND ma_nguoi_mua=?
     LIMIT 1`,
    [req.params.id, req.user.id]
  );
  const order = orders[0];

  if (!order || order.phuong_thuc_tt !== 'vnpay') {
    return res.status(404).json({ message: 'Khong tim thay don hang thanh toan VNPAY.' });
  }
  if (order.trang_thai === 'da_huy') {
    return res.status(400).json({ message: 'Don hang da huy khong the thanh toan.' });
  }
  if (order.trang_thai_tt === 'da_tt') {
    return res.status(400).json({ message: 'Don hang da duoc thanh toan.' });
  }

  res.json({ payment_url: createOrderVnpayPaymentUrl(req, order) });
});

router.get('/subscriptions', auth, role('buyer'), async (req, res) => {
  const [subscriptions] = await db.query(
    `SELECT dk.*, sp.ten_san_pham, sp.hinh_anh,
            COALESCE(nd.ten_nong_trai, 'Cửa hàng Nông Sản Việt') AS ten_nong_trai
     FROM dang_ky_giao_dinh_ky dk
     JOIN san_pham sp ON sp.ma_san_pham = dk.ma_san_pham
     LEFT JOIN nong_dan nd ON nd.ma_nong_dan = dk.ma_nong_dan
     WHERE dk.ma_nguoi_mua=?
     ORDER BY dk.ngay_tao DESC`,
    [req.user.id]
  );
  subscriptions.forEach(item => {
    item.images = parseImages(item.hinh_anh);
  });
  res.json({ subscriptions });
});

router.patch('/subscriptions/:id/cancel', auth, role('buyer'), async (req, res) => {
  const [result] = await db.query(
    `UPDATE dang_ky_giao_dinh_ky
     SET trang_thai='da_huy'
     WHERE ma_dang_ky=? AND ma_nguoi_mua=? AND trang_thai IN ('dang_hoat_dong','tam_dung')`,
    [req.params.id, req.user.id]
  );
  if (!result.affectedRows) {
    return res.status(404).json({ message: 'Không tìm thấy đăng ký phù hợp để hủy' });
  }
  res.json({ message: 'Đã hủy đăng ký giao định kỳ' });
});

router.get('/orders/:id', auth, async (req, res) => {
  const [orders] = await db.query(
    `SELECT dh.*, tk.ho_ten AS ten_nguoi_mua, tk.so_dien_thoai
     FROM don_hang dh
     JOIN tai_khoan tk ON tk.ma_tai_khoan = dh.ma_nguoi_mua
     WHERE dh.ma_don_hang = ?`,
    [req.params.id]
  );
  if (!orders.length) return res.status(404).json({ message: 'Không tìm thấy đơn hàng.' });
  const order = orders[0];
  const isOwner = String(order.ma_nguoi_mua) === String(req.user.id);
  const isAdmin = req.user.vai_tro === 'quan_tri';
  if (!isOwner && !isAdmin) {
    return res.status(403).json({ message: 'Bạn không có quyền xem đơn hàng này.' });
  }
  const [items] = await db.query('SELECT * FROM chi_tiet_don_hang WHERE ma_don_hang=?', [req.params.id]);
  res.json({ order, items });
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
    await conn.commit();
    res.json({ message: 'Huy don thanh cong' });
  } catch (e) {
    await conn.rollback();
    res.status(500).json({ message: e.message });
  } finally {
    conn.release();
  }
});

router.get('/farmer/orders', auth, async (req, res) => {
  res.status(410).json({ message: 'Chức năng nông dân đã được gỡ khỏi hệ thống.' });
});

router.get('/farmer/subscriptions', auth, async (req, res) => {
  res.status(410).json({ message: 'Chức năng nông dân đã được gỡ khỏi hệ thống.' });
});

router.patch('/orders/:id/status', auth, role('admin'), async (req, res) => {
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
// DASHBOARD
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
router.get('/admin/dashboard', auth, role('admin'), async (req, res) => {
  try {
    const [[{ tong_tk }]] = await db.query(
      "SELECT COUNT(*) AS tong_tk FROM tai_khoan WHERE vai_tro <> 'nong_dan'"
    );
    const [[{ tong_sp }]] = await db.query('SELECT COUNT(*) AS tong_sp FROM san_pham');
    const [[{ tong_dh }]] = await db.query('SELECT COUNT(*) AS tong_dh FROM don_hang');
    const [[{ doanh_thu }]] = await db.query(
      "SELECT COALESCE(SUM(tong_thanh_toan),0) AS doanh_thu FROM don_hang WHERE trang_thai='da_giao'"
    );
    const [gan_day] = await db.query(
      `SELECT dh.ma_don_hang, dh.ngay_tao, dh.trang_thai, dh.tong_thanh_toan, tk.ho_ten AS ten_nguoi_mua
       FROM don_hang dh
       JOIN tai_khoan tk ON tk.ma_tai_khoan = dh.ma_nguoi_mua
       ORDER BY dh.ngay_tao DESC
       LIMIT 5`
    );
    const [top_sp] = await db.query(
      'SELECT ten_san_pham, so_luong_ban, gia_ban FROM san_pham ORDER BY so_luong_ban DESC LIMIT 5'
    );
    res.json({ tong_tk, tong_sp, tong_dh, doanh_thu, gan_day, top_sp });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
});

router.get('/farmer/dashboard', auth, async (req, res) => {
  res.status(410).json({ message: 'Chức năng nông dân đã được gỡ khỏi hệ thống.' });
});

router.get('/farmer/profile', auth, async (req, res) => {
  res.status(410).json({ message: 'Chức năng nông dân đã được gỡ khỏi hệ thống.' });
});

router.put('/farmer/profile', auth, async (req, res) => {
  res.status(410).json({ message: 'Chức năng nông dân đã được gỡ khỏi hệ thống.' });
});

// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
// ADMIN QUáº¢N LÃ
// â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•
router.get('/admin/accounts', auth, role('admin'), async (req, res) => {
  const { q, vai_tro, page = 1, limit = 15 } = req.query;
  const offset = (page - 1) * limit, params = [];
  let where = "WHERE vai_tro <> 'nong_dan'";
  if (q) { where += ' AND (ho_ten LIKE ? OR email LIKE ?)'; params.push(`%${q}%`, `%${q}%`); }
  if (vai_tro && vai_tro !== 'nong_dan') { where += ' AND vai_tro=?'; params.push(vai_tro); }
  const [accounts] = await db.query(`SELECT ma_tai_khoan,ho_ten,email,so_dien_thoai,vai_tro,con_hoat_dong,ngay_tao FROM tai_khoan ${where} ORDER BY ngay_tao DESC LIMIT ? OFFSET ?`, [...params, +limit, +offset]);
  const [[{ total }]] = await db.query(`SELECT COUNT(*) AS total FROM tai_khoan ${where}`, params);
  res.json({ accounts, total });
});

router.patch('/admin/accounts/:id/toggle', auth, role('admin'), async (req, res) => {
  await db.query('UPDATE tai_khoan SET con_hoat_dong=NOT con_hoat_dong WHERE ma_tai_khoan=?', [req.params.id]);
  res.json({ message: 'Cáº­p nháº­t thÃ nh cÃ´ng' });
});

router.get('/admin/farmers', auth, role('admin'), async (req, res) => {
  res.status(410).json({ message: 'Khu vực quản lý nông dân đã được gỡ khỏi hệ thống.' });
});

router.patch('/admin/farmers/:id/verify', auth, role('admin'), async (req, res) => {
  res.status(410).json({ message: 'Khu vực quản lý nông dân đã được gỡ khỏi hệ thống.' });
});

router.delete('/admin/farmers/:id', auth, role('admin'), async (req, res) => {
  res.status(410).json({ message: 'Khu vực quản lý nông dân đã được gỡ khỏi hệ thống.' });
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

router.get('/admin/subscriptions', auth, role('admin'), async (req, res) => {
  const [subscriptions] = await db.query(
    `SELECT dk.*, sp.ten_san_pham,
            COALESCE(nd.ten_nong_trai, 'Cửa hàng Nông Sản Việt') AS ten_nong_trai,
            buyer.ho_ten AS ten_nguoi_mua
     FROM dang_ky_giao_dinh_ky dk
     JOIN san_pham sp ON sp.ma_san_pham = dk.ma_san_pham
     LEFT JOIN nong_dan nd ON nd.ma_nong_dan = dk.ma_nong_dan
     JOIN tai_khoan buyer ON buyer.ma_tai_khoan = dk.ma_nguoi_mua
     ORDER BY dk.ngay_tao DESC`
  );
  res.json({ subscriptions });
});

router.patch('/admin/subscriptions/:id/deliver', auth, role('admin'), async (req, res) => {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();

    const [subscriptions] = await conn.query(
      `SELECT *
       FROM dang_ky_giao_dinh_ky
       WHERE ma_dang_ky=? AND trang_thai IN ('dang_hoat_dong','tam_dung')
       FOR UPDATE`,
      [req.params.id]
    );

    if (!subscriptions.length) {
      await conn.rollback();
      return res.status(404).json({ message: 'Khong tim thay dang ky dang hoat dong.' });
    }

    const subscription = subscriptions[0];
    const deliveredCycles = Math.min(
      Number(subscription.so_ky_giao),
      Number(subscription.so_ky_da_giao || 0) + 1
    );
    const completed = deliveredCycles >= Number(subscription.so_ky_giao);
    const nextDate = completed
      ? subscription.ngay_giao_tiep_theo
      : nextDeliveryDate(subscription.ngay_giao_tiep_theo, subscription.tan_suat_giao);

    await conn.query(
      `UPDATE dang_ky_giao_dinh_ky
       SET so_ky_da_giao=?,
           ngay_giao_tiep_theo=?,
           trang_thai=?
       WHERE ma_dang_ky=?`,
      [deliveredCycles, nextDate, completed ? 'hoan_tat' : 'dang_hoat_dong', req.params.id]
    );

    await conn.commit();
    res.json({
      message: completed ? 'Da hoan tat dang ky giao dinh ky.' : 'Da ghi nhan mot ky giao.',
      subscription: {
        id: Number(req.params.id),
        so_ky_da_giao: deliveredCycles,
        so_ky_giao: Number(subscription.so_ky_giao),
        ngay_giao_tiep_theo: nextDate,
        trang_thai: completed ? 'hoan_tat' : 'dang_hoat_dong',
      },
    });
  } catch (e) {
    await conn.rollback();
    res.status(500).json({ message: e.message });
  } finally {
    conn.release();
  }
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
