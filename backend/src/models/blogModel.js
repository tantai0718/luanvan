const db = require('../config/db');

const mapPost = row => ({
  mabv: row.mabv,
  madm: row.madm,
  mand: row.mand,
  tieu_de: row.tieu_de,
  tom_tat: row.tom_tat || '',
  noi_dung: row.noi_dung,
  hinh_anh: row.hinh_anh,
  ten_danh_muc: row.ten_danh_muc || '',
  ho_ten: row.ho_ten || '',
  luot_xem: row.luot_xem || 0,
  trang_thai: row.trang_thai,
  ngay_tao: row.ngay_tao,
});

const SELECT_JOIN = `bv.*, dm.ten_danh_muc, nd.ho_ten FROM bai_viet bv
  LEFT JOIN danh_muc dm ON bv.madm = dm.madm
  LEFT JOIN nguoi_dung nd ON bv.mand = nd.mand`;

exports.getAllPosts = async ({ page = 1, limit = 6, madm = '' } = {}) => {
  const conditions = ['bv.trang_thai = 1'];
  const params = [];
  if (madm) { conditions.push('bv.madm = ?'); params.push(Number(madm)); }
  const where = `WHERE ${conditions.join(' AND ')}`;
  const [[{ total }]] = await db.query(`SELECT COUNT(*) AS total FROM bai_viet bv ${where}`, params);
  const offset = (page - 1) * limit;
  const [rows] = await db.query(`SELECT ${SELECT_JOIN} ${where} ORDER BY bv.ngay_tao DESC LIMIT ? OFFSET ?`, [...params, limit, offset]);
  return { posts: rows.map(mapPost), total };
};

exports.getPostById = async (id) => {
  const [[row]] = await db.query(`SELECT ${SELECT_JOIN} WHERE bv.mabv = ? AND bv.trang_thai = 1`, [id]);
  return row ? mapPost(row) : null;
};

exports.incrementViews = async (id) => {
  await db.query('UPDATE bai_viet SET luot_xem = luot_xem + 1 WHERE mabv = ?', [id]);
};

exports.getRelated = async (madm, excludeMabv, limit = 3) => {
  const [rows] = await db.query(
    `SELECT ${SELECT_JOIN} WHERE bv.madm = ? AND bv.mabv != ? AND bv.trang_thai = 1 ORDER BY bv.ngay_tao DESC LIMIT ?`,
    [madm, excludeMabv, limit]
  );
  return rows.map(mapPost);
};

exports.getCategories = async () => {
  const [rows] = await db.query("SELECT madm AS slug, ten_danh_muc AS ten_dm FROM danh_muc WHERE loai = 'bai_viet' AND trang_thai = 1 ORDER BY ten_danh_muc");
  return rows;
};

exports.adminList = async ({ q = '', madm = '', trang_thai = '', page = 1, limit = 50 } = {}) => {
  const conditions = [];
  const params = [];
  if (q) { conditions.push('(bv.tieu_de LIKE ? OR bv.tom_tat LIKE ?)'); params.push(`%${q}%`, `%${q}%`); }
  if (madm) { conditions.push('bv.madm = ?'); params.push(Number(madm)); }
  if (trang_thai !== '') { conditions.push('bv.trang_thai = ?'); params.push(Number(trang_thai)); }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const [[{ total }]] = await db.query(`SELECT COUNT(*) AS total FROM bai_viet bv ${where}`, params);
  const offset = (page - 1) * limit;
  const [rows] = await db.query(`SELECT ${SELECT_JOIN} ${where} ORDER BY bv.ngay_tao DESC LIMIT ? OFFSET ?`, [...params, limit, offset]);
  return { posts: rows.map(mapPost), total };
};

exports.adminGetById = async (mabv) => {
  const [[row]] = await db.query(`SELECT ${SELECT_JOIN} WHERE bv.mabv = ?`, [mabv]);
  return row ? mapPost(row) : null;
};

exports.create = async ({ tieu_de, tom_tat, noi_dung, hinh_anh, madm, mand, trang_thai }) => {
  const [result] = await db.query(
    'INSERT INTO bai_viet (tieu_de, tom_tat, noi_dung, hinh_anh, madm, mand, trang_thai) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [tieu_de, tom_tat || '', noi_dung, hinh_anh || null, madm || 5, mand || 1, trang_thai !== undefined ? trang_thai : 1]
  );
  return { mabv: result.insertId };
};

exports.update = async (mabv, data) => {
  const fields = [];
  const params = [];
  const allowed = ['tieu_de', 'tom_tat', 'noi_dung', 'hinh_anh', 'madm', 'mand', 'trang_thai'];
  for (const key of allowed) {
    if (data[key] !== undefined) {
      fields.push(`${key} = ?`);
      params.push(data[key]);
    }
  }
  if (!fields.length) return;
  params.push(mabv);
  await db.query(`UPDATE bai_viet SET ${fields.join(', ')} WHERE mabv = ?`, params);
};

exports.remove = async (mabv) => {
  await db.query('UPDATE bai_viet SET trang_thai = 0 WHERE mabv = ?', [mabv]);
};
