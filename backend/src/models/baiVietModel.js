const db = require('../config/db');

const mapArticle = row => ({
  ma_bai_viet: row.mabv,
  tieu_de: row.tieu_de,
  tom_tat: row.mo_ta_ngan || '',
  noi_dung: row.noi_dung,
  hinh_anh: row.hinh_anh,
  the_loai: row.danh_muc,
  trang_thai: row.trang_thai,
  luot_xem: row.luot_xem || 0,
  ngay_dang: row.ngay_tao,
  ngay_tao: row.ngay_tao,
  ngay_cap_nhat: row.ngay_sua,
});

exports.listPublic = async ({ q = '', the_loai = '', page = 1, limit = 12 } = {}) => {
  const conditions = ['trang_thai = 1'];
  const params = [];
  if (q) { conditions.push('(tieu_de LIKE ? OR mo_ta_ngan LIKE ?)'); params.push(`%${q}%`, `%${q}%`); }
  if (the_loai) { conditions.push('danh_muc = ?'); params.push(the_loai); }
  const where = `WHERE ${conditions.join(' AND ')}`;
  const [[{ total }]] = await db.query(`SELECT COUNT(*) AS total FROM bai_viet ${where}`, params);
  const offset = (page - 1) * limit;
  const [rows] = await db.query(`SELECT * FROM bai_viet ${where} ORDER BY ngay_tao DESC LIMIT ? OFFSET ?`, [...params, limit, offset]);
  return { items: rows.map(mapArticle), total, page, limit };
};

exports.getById = async id => {
  const [[row]] = await db.query('SELECT * FROM bai_viet WHERE mabv = ?', [id]);
  return row ? mapArticle(row) : null;
};

exports.incrementViews = async id => {
  await db.query('UPDATE bai_viet SET luot_xem = luot_xem + 1 WHERE mabv = ?', [id]);
};

exports.adminList = async ({ q = '', the_loai = '', trang_thai = '', page = 1, limit = 20 } = {}) => {
  const conditions = [];
  const params = [];
  if (q) { conditions.push('(tieu_de LIKE ? OR mo_ta_ngan LIKE ?)'); params.push(`%${q}%`, `%${q}%`); }
  if (the_loai) { conditions.push('danh_muc = ?'); params.push(the_loai); }
  if (trang_thai !== '') { conditions.push('trang_thai = ?'); params.push(Number(trang_thai)); }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const [[{ total }]] = await db.query(`SELECT COUNT(*) AS total FROM bai_viet ${where}`, params);
  const offset = (page - 1) * limit;
  const [rows] = await db.query(`SELECT * FROM bai_viet ${where} ORDER BY ngay_tao DESC LIMIT ? OFFSET ?`, [...params, limit, offset]);
  return { items: rows.map(mapArticle), total, page, limit };
};

exports.create = async ({ tieu_de, tom_tat, noi_dung, hinh_anh, the_loai }) => {
  const slug = tieu_de.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const [result] = await db.query(
    'INSERT INTO bai_viet (tieu_de, slug, mo_ta_ngan, noi_dung, hinh_anh, danh_muc) VALUES (?, ?, ?, ?, ?, ?)',
    [tieu_de, slug, tom_tat || '', noi_dung, hinh_anh || null, the_loai || null]
  );
  return { ma_bai_viet: result.insertId };
};

exports.update = async (id, { tieu_de, tom_tat, noi_dung, hinh_anh, the_loai, trang_thai }) => {
  const fields = [];
  const params = [];
  if (tieu_de !== undefined) { fields.push('tieu_de = ?'); params.push(tieu_de); }
  if (tom_tat !== undefined) { fields.push('mo_ta_ngan = ?'); params.push(tom_tat); }
  if (noi_dung !== undefined) { fields.push('noi_dung = ?'); params.push(noi_dung); }
  if (hinh_anh !== undefined) { fields.push('hinh_anh = ?'); params.push(hinh_anh || null); }
  if (the_loai !== undefined) { fields.push('danh_muc = ?'); params.push(the_loai); }
  if (trang_thai !== undefined) { fields.push('trang_thai = ?'); params.push(trang_thai); }
  if (!fields.length) return;
  fields.push('ngay_sua = NOW()');
  params.push(id);
  await db.query(`UPDATE bai_viet SET ${fields.join(', ')} WHERE mabv = ?`, params);
};

exports.remove = async id => {
  await db.query('DELETE FROM bai_viet WHERE mabv = ?', [id]);
};
