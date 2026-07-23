const db = require('../config/db');

const mapArticle = row => ({
  ma_bai_viet: row.mabv,
  madm: row.madm,
  mand: row.mand,
  tieu_de: row.tieu_de,
  tom_tat: row.tom_tat || '',
  noi_dung: row.noi_dung,
  hinh_anh: row.hinh_anh,
  ten_danh_muc: row.ten_danh_muc || '',
  ho_ten: row.ho_ten || '',
  trang_thai: row.trang_thai,
  luot_xem: row.luot_xem || 0,
  ngay_tao: row.ngay_tao,
});

const SELECT_JOIN = `bv.*, dm.ten_danh_muc, nd.ho_ten FROM bai_viet bv
  LEFT JOIN danh_muc dm ON bv.madm = dm.madm
  LEFT JOIN nguoi_dung nd ON bv.mand = nd.mand`;

exports.listPublic = async ({ q = '', the_loai = '', page = 1, limit = 12 } = {}) => {
  const conditions = ['bv.trang_thai = 1'];
  const params = [];
  if (q) { conditions.push('(bv.tieu_de LIKE ? OR bv.tom_tat LIKE ?)'); params.push(`%${q}%`, `%${q}%`); }
  if (the_loai) { conditions.push('bv.madm = ?'); params.push(Number(the_loai)); }
  const where = `WHERE ${conditions.join(' AND ')}`;
  const [[{ total }]] = await db.query(`SELECT COUNT(*) AS total FROM bai_viet bv ${where}`, params);
  const offset = (page - 1) * limit;
  const [rows] = await db.query(`SELECT ${SELECT_JOIN} ${where} ORDER BY bv.ngay_tao DESC LIMIT ? OFFSET ?`, [...params, limit, offset]);
  return { items: rows.map(mapArticle), total, page, limit };
};

exports.getById = async id => {
  const [[row]] = await db.query(`SELECT ${SELECT_JOIN} WHERE bv.mabv = ?`, [id]);
  return row ? mapArticle(row) : null;
};

exports.incrementViews = async id => {
  await db.query('UPDATE bai_viet SET luot_xem = luot_xem + 1 WHERE mabv = ?', [id]);
};

exports.adminList = async ({ q = '', the_loai = '', trang_thai = '', page = 1, limit = 20 } = {}) => {
  const conditions = [];
  const params = [];
  if (q) { conditions.push('(bv.tieu_de LIKE ? OR bv.tom_tat LIKE ?)'); params.push(`%${q}%`, `%${q}%`); }
  if (the_loai) { conditions.push('bv.madm = ?'); params.push(Number(the_loai)); }
  if (trang_thai !== '') { conditions.push('bv.trang_thai = ?'); params.push(Number(trang_thai)); }
  const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
  const [[{ total }]] = await db.query(`SELECT COUNT(*) AS total FROM bai_viet bv ${where}`, params);
  const offset = (page - 1) * limit;
  const [rows] = await db.query(`SELECT ${SELECT_JOIN} ${where} ORDER BY bv.ngay_tao DESC LIMIT ? OFFSET ?`, [...params, limit, offset]);
  return { items: rows.map(mapArticle), total, page, limit };
};

exports.create = async ({ tieu_de, tom_tat, noi_dung, hinh_anh, madm, mand }) => {
  const [result] = await db.query(
    'INSERT INTO bai_viet (tieu_de, tom_tat, noi_dung, hinh_anh, madm, mand) VALUES (?, ?, ?, ?, ?, ?)',
    [tieu_de, tom_tat || '', noi_dung, hinh_anh || null, madm || 4, mand || 1]
  );
  return { ma_bai_viet: result.insertId };
};

exports.update = async (id, { tieu_de, tom_tat, noi_dung, hinh_anh, madm, trang_thai }) => {
  const fields = [];
  const params = [];
  if (tieu_de !== undefined) { fields.push('tieu_de = ?'); params.push(tieu_de); }
  if (tom_tat !== undefined) { fields.push('tom_tat = ?'); params.push(tom_tat); }
  if (noi_dung !== undefined) { fields.push('noi_dung = ?'); params.push(noi_dung); }
  if (hinh_anh !== undefined) { fields.push('hinh_anh = ?'); params.push(hinh_anh || null); }
  if (madm !== undefined) { fields.push('madm = ?'); params.push(madm); }
  if (trang_thai !== undefined) { fields.push('trang_thai = ?'); params.push(trang_thai); }
  if (!fields.length) return;
  params.push(id);
  await db.query(`UPDATE bai_viet SET ${fields.join(', ')} WHERE mabv = ?`, params);
};

exports.remove = async id => {
  await db.query('DELETE FROM bai_viet WHERE mabv = ?', [id]);
};
