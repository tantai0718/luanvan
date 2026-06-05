const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../config/auth');

const auth = (req, res, next) => {
  const authorization = req.headers.authorization;

  if (!authorization || !authorization.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Chưa đăng nhập.' });
  }

  try {
    req.user = jwt.verify(authorization.split(' ')[1], JWT_SECRET);
    return next();
  } catch {
    return res.status(401).json({ message: 'Token không hợp lệ hoặc đã hết hạn.' });
  }
};

const role = (...roles) => (req, res, next) => {
  const map = { admin: 'quan_tri', buyer: 'nguoi_mua' };
  const allowed = roles.map(value => map[value] || value);

  if (!allowed.includes(req.user?.vai_tro)) {
    return res.status(403).json({ message: 'Không có quyền thực hiện thao tác này.' });
  }

  return next();
};

module.exports = { auth, role };
