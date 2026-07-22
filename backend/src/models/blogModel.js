const db = require('../config/db');

const mapPost = row => ({
  mabv: row.mabv,
  tieu_de: row.tieu_de,
  slug: row.slug,
  mo_ta_ngan: row.mo_ta_ngan || '',
  noi_dung: row.noi_dung,
  hinh_anh: row.hinh_anh,
  danh_muc: row.danh_muc,
  tac_gia: row.tac_gia || 'Ban Bien Tap',
  luot_xem: row.luot_xem || 0,
  trang_thai: row.trang_thai,
  ngay_tao: row.ngay_tao,
  ngay_sua: row.ngay_sua,
});

exports.getAllPosts = async ({ page = 1, limit = 6, danh_muc = '' } = {}) => {
  const conditions = ['trang_thai = 1'];
  const params = [];
  if (danh_muc) { conditions.push('danh_muc = ?'); params.push(danh_muc); }
  const where = `WHERE ${conditions.join(' AND ')}`;
  const [[{ total }]] = await db.query(`SELECT COUNT(*) AS total FROM bai_viet ${where}`, params);
  const offset = (page - 1) * limit;
  const [rows] = await db.query(`SELECT * FROM bai_viet ${where} ORDER BY ngay_tao DESC LIMIT ? OFFSET ?`, [...params, limit, offset]);
  return { posts: rows.map(mapPost), total };
};

exports.getPostBySlug = async (slug) => {
  const [[row]] = await db.query('SELECT * FROM bai_viet WHERE slug = ? AND trang_thai = 1', [slug]);
  return row ? mapPost(row) : null;
};

exports.incrementViews = async (slug) => {
  await db.query('UPDATE bai_viet SET luot_xem = luot_xem + 1 WHERE slug = ?', [slug]);
};

exports.getRelated = async (danh_muc, excludeMabv, limit = 3) => {
  const [rows] = await db.query(
    'SELECT * FROM bai_viet WHERE danh_muc = ? AND mabv != ? AND trang_thai = 1 ORDER BY ngay_tao DESC LIMIT ?',
    [danh_muc, excludeMabv, limit]
  );
  return rows.map(mapPost);
};

exports.getCategories = async () => {
  const [rows] = await db.query('SELECT * FROM danh_muc_bai_viet ORDER BY ten_dm');
  return rows;
};

// Admin
exports.adminList = async ({ q = '', danh_muc = '', trang_thai = '', page = 1, limit = 50 } = {}) => {
  const conditions = [];
  const params = [];
  if (q) { conditions.push('(tieu_de LIKE ? OR mo_ta_ngan LIKE ?)'); params.push(`%${q}%`, `%${q}%`); }
  if (danh_muc) { conditions.push('danh_muc = ?'); params.push(danh_muc); }
  if (trang_thai !== '') { conditions.push('trang_thai = ?'); params.push(Number(trang_thai)); }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const [[{ total }]] = await db.query(`SELECT COUNT(*) AS total FROM bai_viet ${where}`, params);
  const offset = (page - 1) * limit;
  const [rows] = await db.query(`SELECT * FROM bai_viet ${where} ORDER BY ngay_tao DESC LIMIT ? OFFSET ?`, [...params, limit, offset]);
  return { posts: rows.map(mapPost), total };
};

exports.adminGetById = async (mabv) => {
  const [[row]] = await db.query('SELECT * FROM bai_viet WHERE mabv = ?', [mabv]);
  return row ? mapPost(row) : null;
};

exports.create = async ({ tieu_de, slug, mo_ta_ngan, noi_dung, hinh_anh, danh_muc, tac_gia, trang_thai }) => {
  const [result] = await db.query(
    'INSERT INTO bai_viet (tieu_de, slug, mo_ta_ngan, noi_dung, hinh_anh, danh_muc, tac_gia, trang_thai) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
    [tieu_de, slug, mo_ta_ngan || '', noi_dung, hinh_anh || null, danh_muc || null, tac_gia || 'Ban Bien Tap', trang_thai !== undefined ? trang_thai : 1]
  );
  return { mabv: result.insertId };
};

exports.update = async (mabv, data) => {
  const fields = [];
  const params = [];
  const allowed = ['tieu_de', 'slug', 'mo_ta_ngan', 'noi_dung', 'hinh_anh', 'danh_muc', 'tac_gia', 'trang_thai'];
  for (const key of allowed) {
    if (data[key] !== undefined) {
      fields.push(`${key} = ?`);
      params.push(data[key]);
    }
  }
  if (!fields.length) return;
  fields.push('ngay_sua = NOW()');
  params.push(mabv);
  await db.query(`UPDATE bai_viet SET ${fields.join(', ')} WHERE mabv = ?`, params);
};

exports.remove = async (mabv) => {
  await db.query('UPDATE bai_viet SET trang_thai = 0 WHERE mabv = ?', [mabv]);
};
