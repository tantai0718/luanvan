const db = require("../config/db");

const PRODUCT_SELECT = `
  SELECT
    sp.masp,
    sp.madm,
    sp.ten_san_pham,
    sp.gia_ban,
    sp.so_luong_ton,
    sp.don_vi,
    sp.khu_vuc,
    sp.trang_thai,
    sp.ngay_tao,
    dm.ten_danh_muc,
    hav.duong_dan AS image_url,
    hav.thumbnail AS thumbnail_url,
    COALESCE(AVG(dg.so_sao), 0) AS diem_danh_gia,
    COUNT(DISTINCT dg.madg) AS tong_danh_gia
  FROM san_pham sp
  LEFT JOIN danh_muc dm ON dm.madm = sp.madm
  LEFT JOIN hinh_anh_video hav ON hav.masp = sp.masp AND hav.loai = 'hinh_anh'
  LEFT JOIN danh_gia dg ON dg.masp = sp.masp
`;

const GROUP_BY_PRODUCT = `
  GROUP BY
    sp.masp, sp.madm, sp.ten_san_pham, sp.gia_ban, sp.so_luong_ton,
    sp.don_vi, sp.khu_vuc, sp.trang_thai, sp.ngay_tao, dm.ten_danh_muc,
    hav.duong_dan, hav.thumbnail, hav.thu_tu, hav.la_chinh
`;

const sortSql = {
  moi_nhat: "sp.ngay_tao DESC, sp.masp DESC",
  gia_tang: "sp.gia_ban ASC, sp.masp DESC",
  gia_giam: "sp.gia_ban DESC, sp.masp DESC",
  ban_chay: "sp.masp DESC",
  danh_gia: "diem_danh_gia DESC, sp.masp DESC",
};

const mapProductRows = (rows) => {
  const map = new Map();
  for (const row of rows) {
    if (!map.has(row.masp)) {
      map.set(row.masp, {
        ma_san_pham: row.masp,
        ma_danh_muc: row.madm,
        ten_san_pham: row.ten_san_pham,
        mo_ta: "",
        gia_ban: Number(row.gia_ban || 0),
        don_vi: row.don_vi || "",
        ton_kho: Number(row.so_luong_ton || 0),
        ton_kho_toi_thieu: 0,
        tinh_thanh: row.khu_vuc || "",
        khu_vuc: row.khu_vuc || "",
        ten_danh_muc: row.ten_danh_muc || "",
        ten_nong_trai: "",
        ten_nong_dan: "",
        diem_danh_gia: Number(row.diem_danh_gia || 0),
        tong_danh_gia: Number(row.tong_danh_gia || 0),
        con_hoat_dong: Boolean(row.trang_thai),
        ngay_tao: row.ngay_tao,
        images: [],
      });
    }

    const product = map.get(row.masp);
    const image = row.image_url || row.thumbnail_url;
    if (image && !product.images.includes(image)) product.images.push(image);
  }
  return Array.from(map.values());
};

const buildFilters = ({ publicOnly = false, q, category, in_stock }) => {
  const where = [];
  const params = [];

  if (publicOnly) where.push("sp.trang_thai = 1");
  if (q) {
    where.push("(sp.ten_san_pham LIKE ? OR sp.khu_vuc LIKE ? OR dm.ten_danh_muc LIKE ?)");
    const like = `%${q}%`;
    params.push(like, like, like);
  }
  if (category) {
    where.push("sp.madm = ?");
    params.push(Number(category));
  }
  if (in_stock === "1" || in_stock === 1 || in_stock === true) {
    where.push("COALESCE(sp.so_luong_ton, 0) > 0");
  }

  return {
    sql: where.length ? ` WHERE ${where.join(" AND ")}` : "",
    params,
  };
};

async function listProducts(options = {}) {
  const page = Math.max(1, Number(options.page) || 1);
  const limit = Math.min(100, Math.max(1, Number(options.limit) || 12));
  const offset = (page - 1) * limit;
  const filters = buildFilters(options);
  const orderBy = sortSql[options.sort] || sortSql.moi_nhat;

  const [countRows] = await db.query(
    `SELECT COUNT(DISTINCT sp.masp) AS total
     FROM san_pham sp
     LEFT JOIN danh_muc dm ON dm.madm = sp.madm
     ${filters.sql}`,
    filters.params,
  );

  const [rows] = await db.query(
    `${PRODUCT_SELECT}
     ${filters.sql}
     ${GROUP_BY_PRODUCT}
     ORDER BY ${orderBy}, hav.la_chinh DESC, hav.thu_tu ASC
     LIMIT ? OFFSET ?`,
    [...filters.params, limit * 5, offset],
  );

  return {
    products: mapProductRows(rows).slice(0, limit),
    total: Number(countRows[0]?.total || 0),
  };
}

async function getProductById(id, { publicOnly = false } = {}) {
  const filters = publicOnly ? "AND sp.trang_thai = 1" : "";
  const [rows] = await db.query(
    `${PRODUCT_SELECT}
     WHERE sp.masp = ? ${filters}
     ${GROUP_BY_PRODUCT}
     ORDER BY hav.la_chinh DESC, hav.thu_tu ASC`,
    [id],
  );
  return mapProductRows(rows)[0] || null;
}

async function listCategories({ publicOnly = true } = {}) {
  const [rows] = await db.query(
    `SELECT dm.*, COUNT(sp.masp) AS product_count
     FROM danh_muc dm
     LEFT JOIN san_pham sp ON sp.madm = dm.madm
     ${publicOnly ? "WHERE dm.trang_thai = 1" : ""}
     GROUP BY dm.madm, dm.ten_danh_muc, dm.mo_ta, dm.trang_thai
     ORDER BY dm.madm ASC`,
  );
  return rows.map((row) => ({
    id: row.madm,
    ma_danh_muc: row.madm,
    name: row.ten_danh_muc,
    ten_danh_muc: row.ten_danh_muc,
    description: row.mo_ta || "",
    mo_ta: row.mo_ta || "",
    icon: "",
    slug: "",
    active: Boolean(row.trang_thai),
    con_hoat_dong: Boolean(row.trang_thai),
    product_count: Number(row.product_count || 0),
  }));
}

async function createProduct(product) {
  const [result] = await db.query(
    `INSERT INTO san_pham (madm, ten_san_pham, gia_ban, so_luong_ton, don_vi, khu_vuc, trang_thai, ngay_tao)
     VALUES (?, ?, ?, ?, ?, ?, 1, NOW())`,
    [
      product.ma_danh_muc,
      product.ten_san_pham,
      product.gia_ban,
      product.ton_kho,
      product.don_vi,
      product.khu_vuc || product.tinh_thanh || null,
    ],
  );
  return result.insertId;
}

async function updateProduct(id, product) {
  await db.query(
    `UPDATE san_pham
     SET madm = ?, ten_san_pham = ?, gia_ban = ?, so_luong_ton = ?, don_vi = ?, khu_vuc = ?
     WHERE masp = ?`,
    [
      product.ma_danh_muc,
      product.ten_san_pham,
      product.gia_ban,
      product.ton_kho,
      product.don_vi,
      product.khu_vuc || product.tinh_thanh || null,
      id,
    ],
  );
}

async function replaceProductImages(id, images = []) {
  await db.query("DELETE FROM hinh_anh_video WHERE masp = ? AND loai = 'hinh_anh'", [id]);
  for (const [index, image] of images.entries()) {
    await db.query(
      `INSERT INTO hinh_anh_video (masp, duong_dan, loai, thumbnail, thu_tu, la_chinh, ngay_tao)
       VALUES (?, ?, 'hinh_anh', ?, ?, ?, NOW())`,
      [id, image, image, index + 1, index === 0 ? 1 : 0],
    );
  }
}

async function toggleProduct(id) {
  await db.query("UPDATE san_pham SET trang_thai = NOT trang_thai WHERE masp = ?", [id]);
}

async function deleteProduct(id) {
  await db.query("DELETE FROM hinh_anh_video WHERE masp = ?", [id]);
  await db.query("DELETE FROM san_pham WHERE masp = ?", [id]);
}

async function listReviews(productId) {
  const [rows] = await db.query(
    `SELECT
       dg.madg AS ma_danh_gia,
       dg.mand AS ma_nguoi_mua,
       dg.masp AS ma_san_pham,
       dg.so_sao,
       dg.binh_luan AS noi_dung,
       dg.ngay_danh_gia AS ngay_tao,
       nd.ho_ten AS ten_nguoi_mua
     FROM danh_gia dg
     LEFT JOIN nguoi_dung nd ON nd.mand = dg.mand
     WHERE dg.masp = ?
     ORDER BY dg.ngay_danh_gia DESC, dg.madg DESC`,
    [productId],
  );
  return rows;
}

module.exports = {
  listProducts,
  getProductById,
  listCategories,
  createProduct,
  updateProduct,
  replaceProductImages,
  toggleProduct,
  deleteProduct,
  listReviews,
};
