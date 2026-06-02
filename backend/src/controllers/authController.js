const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const { JWT_SECRET, isBcryptHash } = require('../config/auth');

const mapRole = value => (value === 'quan_tri' ? 'admin' : 'buyer');

const fmtUser = tk => ({
  id: tk.ma_tai_khoan,
  name: tk.ho_ten,
  email: tk.email,
  phone: tk.so_dien_thoai || '',
  avatar: tk.anh_dai_dien || '',
  address: tk.dia_chi || '',
  vai_tro: tk.vai_tro,
  role: mapRole(tk.vai_tro),
});

exports.register = async (req, res) => {
  try {
    const { ho_ten, email, so_dien_thoai, mat_khau } = req.body;
    const cleanName = (ho_ten || '').trim();
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanPhone = (so_dien_thoai || '').trim();

    if (!cleanName || !cleanEmail || !mat_khau) {
      return res.status(400).json({ message: 'Vui lòng điền đầy đủ thông tin.' });
    }

    if (mat_khau.length < 6) {
      return res.status(400).json({ message: 'Mật khẩu phải có ít nhất 6 ký tự.' });
    }

    const [existedUsers] = await db.query(
      'SELECT ma_tai_khoan FROM tai_khoan WHERE TRIM(LOWER(email)) = ?',
      [cleanEmail]
    );

    if (existedUsers.length > 0) {
      return res.status(400).json({ message: 'Email đã được sử dụng.' });
    }

    const hash = await bcrypt.hash(mat_khau, 10);
    await db.query(
      'INSERT INTO tai_khoan (ho_ten, email, so_dien_thoai, mat_khau, vai_tro) VALUES (?, ?, ?, ?, ?)',
      [cleanName, cleanEmail, cleanPhone || null, hash, 'nguoi_mua']
    );

    return res.status(201).json({ message: 'Đăng ký thành công.' });
  } catch (error) {
    console.error('[register]', error);
    return res.status(500).json({ message: `Lỗi server: ${error.message}` });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, mat_khau } = req.body;
    const cleanEmail = (email || '').trim().toLowerCase();

    if (!cleanEmail || !mat_khau) {
      return res.status(400).json({ message: 'Vui lòng nhập email và mật khẩu.' });
    }

    const [rows] = await db.query(
      'SELECT * FROM tai_khoan WHERE TRIM(LOWER(email)) = ?',
      [cleanEmail]
    );

    if (rows.length === 0) {
      return res.status(400).json({ message: 'Email hoặc mật khẩu không đúng.' });
    }

    const tk = rows[0];

    if (tk.vai_tro === 'nong_dan') {
      return res.status(403).json({
        message: 'Hệ thống hiện không còn hỗ trợ vai trò nông dân. Vui lòng liên hệ quản trị viên.',
      });
    }

    if (!tk.con_hoat_dong) {
      return res.status(403).json({ message: 'Tài khoản đã bị khóa.' });
    }

    let match = false;

    try {
      if (isBcryptHash(tk.mat_khau)) {
        match = await bcrypt.compare(mat_khau, tk.mat_khau);
      } else {
        match = tk.mat_khau === mat_khau;

        if (match) {
          const upgradedHash = await bcrypt.hash(mat_khau, 10);
          await db.query(
            'UPDATE tai_khoan SET mat_khau = ? WHERE ma_tai_khoan = ?',
            [upgradedHash, tk.ma_tai_khoan]
          );
        }
      }
    } catch (hashError) {
      console.error('[login] password error:', hashError.message);
      return res.status(500).json({ message: 'Không thể xử lý mật khẩu của tài khoản này.' });
    }

    if (!match) {
      return res.status(400).json({ message: 'Email hoặc mật khẩu không đúng.' });
    }

    const token = jwt.sign(
      { id: tk.ma_tai_khoan, vai_tro: tk.vai_tro },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    return res.json({ token, user: fmtUser(tk) });
  } catch (error) {
    console.error('[login]', error);
    return res.status(500).json({ message: `Lỗi server: ${error.message}` });
  }
};

exports.me = async (req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT * FROM tai_khoan WHERE ma_tai_khoan = ?',
      [req.user.id]
    );

    if (!rows.length) {
      return res.status(404).json({ message: 'Không tìm thấy tài khoản.' });
    }

    if (rows[0].vai_tro === 'nong_dan') {
      return res.status(403).json({
        message: 'Tài khoản này không còn được hỗ trợ trong phiên bản hiện tại.',
      });
    }

    return res.json({ user: fmtUser(rows[0]) });
  } catch (error) {
    return res.status(500).json({ message: 'Lỗi server.' });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const { ho_ten, so_dien_thoai, dia_chi } = req.body;

    await db.query(
      'UPDATE tai_khoan SET ho_ten = ?, so_dien_thoai = ?, dia_chi = ? WHERE ma_tai_khoan = ?',
      [ho_ten, so_dien_thoai, dia_chi, req.user.id]
    );

    return res.json({ message: 'Cập nhật thông tin thành công.' });
  } catch (error) {
    return res.status(500).json({ message: 'Lỗi server.' });
  }
};

exports.changePassword = async (req, res) => {
  try {
    const { mat_khau_cu, mat_khau_moi } = req.body;
    const [rows] = await db.query(
      'SELECT mat_khau FROM tai_khoan WHERE ma_tai_khoan = ?',
      [req.user.id]
    );

    const oldPassword = rows[0]?.mat_khau || '';
    const validOldPassword = isBcryptHash(oldPassword)
      ? await bcrypt.compare(mat_khau_cu, oldPassword)
      : oldPassword === mat_khau_cu;

    if (!validOldPassword) {
      return res.status(400).json({ message: 'Mật khẩu cũ không đúng.' });
    }

    const hash = await bcrypt.hash(mat_khau_moi, 10);
    await db.query(
      'UPDATE tai_khoan SET mat_khau = ? WHERE ma_tai_khoan = ?',
      [hash, req.user.id]
    );

    return res.json({ message: 'Đổi mật khẩu thành công.' });
  } catch (error) {
    return res.status(500).json({ message: 'Lỗi server.' });
  }
};
