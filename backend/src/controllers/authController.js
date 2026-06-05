const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const { JWT_SECRET, isBcryptHash } = require('../config/auth');

const roleFromUser = user => {
  if (user.vai_tro) return user.vai_tro;
  if (Number(user.mavt) === 1 || String(user.ten_vai_tro || '').toLowerCase().includes('admin')) {
    return 'quan_tri';
  }
  return 'nguoi_mua';
};

const mapRole = value => (value === 'quan_tri' ? 'admin' : 'buyer');

const fmtUser = user => {
  const vai_tro = roleFromUser(user);
  return {
    id: user.mand,
    name: user.ho_ten,
    email: user.email,
    phone: user.sdt || '',
    avatar: '',
    address: user.dia_chi || '',
    vai_tro,
    role: mapRole(vai_tro),
  };
};

const findUserByEmail = async email => {
  const [rows] = await db.query(
    `SELECT nd.*, vt.ten_vai_tro
     FROM nguoi_dung nd
     LEFT JOIN vai_tro vt ON vt.mavt = nd.mavt
     WHERE TRIM(LOWER(nd.email)) = ?
     LIMIT 1`,
    [email]
  );
  return rows[0] || null;
};

exports.register = async (req, res) => {
  try {
    const { ho_ten, email, so_dien_thoai, mat_khau } = req.body;
    const cleanName = (ho_ten || '').trim();
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanPhone = (so_dien_thoai || '').trim();

    if (!cleanName || !cleanEmail || !mat_khau) {
      return res.status(400).json({ message: 'Vui long dien day du thong tin.' });
    }

    if (mat_khau.length < 6) {
      return res.status(400).json({ message: 'Mat khau phai co it nhat 6 ky tu.' });
    }

    if (await findUserByEmail(cleanEmail)) {
      return res.status(400).json({ message: 'Email da duoc su dung.' });
    }

    const hash = await bcrypt.hash(mat_khau, 10);
    await db.query(
      'INSERT INTO nguoi_dung (mavt, ho_ten, email, mat_khau, sdt, dia_chi, trang_thai) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [2, cleanName, cleanEmail, hash, cleanPhone || null, null, 1]
    );

    return res.status(201).json({ message: 'Dang ky thanh cong.' });
  } catch (error) {
    console.error('[register]', error);
    return res.status(500).json({ message: `Loi server: ${error.message}` });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, mat_khau } = req.body;
    const cleanEmail = (email || '').trim().toLowerCase();

    if (!cleanEmail || !mat_khau) {
      return res.status(400).json({ message: 'Vui long nhap email va mat khau.' });
    }

    const user = await findUserByEmail(cleanEmail);
    if (!user) {
      return res.status(400).json({ message: 'Email hoac mat khau khong dung.' });
    }

    if (!user.trang_thai) {
      return res.status(403).json({ message: 'Tai khoan da bi khoa.' });
    }

    const password = user.mat_khau || '';
    const match = isBcryptHash(password)
      ? await bcrypt.compare(mat_khau, password)
      : password === mat_khau;

    if (!match) {
      return res.status(400).json({ message: 'Email hoac mat khau khong dung.' });
    }

    if (!isBcryptHash(password)) {
      const upgradedHash = await bcrypt.hash(mat_khau, 10);
      await db.query('UPDATE nguoi_dung SET mat_khau = ? WHERE mand = ?', [upgradedHash, user.mand]);
    }

    const vai_tro = roleFromUser(user);
    const token = jwt.sign({ id: user.mand, vai_tro }, JWT_SECRET, { expiresIn: '24h' });
    return res.json({ token, user: fmtUser(user) });
  } catch (error) {
    console.error('[login]', error);
    return res.status(500).json({ message: `Loi server: ${error.message}` });
  }
};

exports.me = async (req, res) => {
  try {
    const [rows] = await db.query(
      `SELECT nd.*, vt.ten_vai_tro
       FROM nguoi_dung nd
       LEFT JOIN vai_tro vt ON vt.mavt = nd.mavt
       WHERE nd.mand = ?
       LIMIT 1`,
      [req.user.id]
    );

    if (!rows.length) {
      return res.status(404).json({ message: 'Khong tim thay tai khoan.' });
    }

    return res.json({ user: fmtUser(rows[0]) });
  } catch (error) {
    return res.status(500).json({ message: `Loi server: ${error.message}` });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { ho_ten, so_dien_thoai, dia_chi } = req.body;
    await db.query(
      'UPDATE nguoi_dung SET ho_ten = ?, sdt = ?, dia_chi = ? WHERE mand = ?',
      [ho_ten, so_dien_thoai, dia_chi, req.user.id]
    );
    return res.json({ message: 'Cap nhat thong tin thanh cong.' });
  } catch (error) {
    return res.status(500).json({ message: `Loi server: ${error.message}` });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { mat_khau_cu, mat_khau_moi } = req.body;
    const [rows] = await db.query('SELECT mat_khau FROM nguoi_dung WHERE mand = ?', [req.user.id]);
    const oldPassword = rows[0]?.mat_khau || '';
    const validOldPassword = isBcryptHash(oldPassword)
      ? await bcrypt.compare(mat_khau_cu, oldPassword)
      : oldPassword === mat_khau_cu;

    if (!validOldPassword) {
      return res.status(400).json({ message: 'Mat khau cu khong dung.' });
    }

    const hash = await bcrypt.hash(mat_khau_moi, 10);
    await db.query('UPDATE nguoi_dung SET mat_khau = ? WHERE mand = ?', [hash, req.user.id]);
    return res.json({ message: 'Doi mat khau thanh cong.' });
  } catch (error) {
    return res.status(500).json({ message: `Loi server: ${error.message}` });
  }
};
