const db = require("../config/db");

const roleFromRow = (row) => {
  if (Number(row.mavt) === 1) return "quan_tri";
  const name = String(row.ten_vai_tro || "").toLowerCase();
  return name.includes("admin") ? "quan_tri" : "nguoi_mua";
};

const mapAccount = (row) => ({
  ma_tai_khoan: row.mand,
  ho_ten: row.ho_ten,
  email: row.email,
  so_dien_thoai: row.sdt || "",
  dia_chi: row.dia_chi || "",
  vai_tro: roleFromRow(row),
  ten_vai_tro: row.ten_vai_tro || "",
  con_hoat_dong: Boolean(row.trang_thai),
  ngay_tao: row.ngay_tao || null,
});

const buildFilters = ({ q, vai_tro }) => {
  const where = [];
  const params = [];

  if (q) {
    where.push("(nd.ho_ten LIKE ? OR nd.email LIKE ? OR nd.sdt LIKE ?)");
    const like = `%${q}%`;
    params.push(like, like, like);
  }

  if (vai_tro === "quan_tri") where.push("nd.mavt = 1");
  if (vai_tro === "nguoi_mua") where.push("nd.mavt <> 1");

  return {
    sql: where.length ? `WHERE ${where.join(" AND ")}` : "",
    params,
  };
};

async function listAccounts({ q = "", vai_tro = "", page = 1, limit = 15 } = {}) {
  const currentPage = Math.max(1, Number(page) || 1);
  const currentLimit = Math.min(100, Math.max(1, Number(limit) || 15));
  const offset = (currentPage - 1) * currentLimit;
  const filters = buildFilters({ q, vai_tro });

  const [countRows] = await db.query(
    `SELECT COUNT(*) AS total
     FROM nguoi_dung nd
     LEFT JOIN vai_tro vt ON vt.mavt = nd.mavt
     ${filters.sql}`,
    filters.params,
  );

  const [rows] = await db.query(
    `SELECT nd.*, vt.ten_vai_tro, NULL AS ngay_tao
     FROM nguoi_dung nd
     LEFT JOIN vai_tro vt ON vt.mavt = nd.mavt
     ${filters.sql}
     ORDER BY nd.mand ASC
     LIMIT ? OFFSET ?`,
    [...filters.params, currentLimit, offset],
  );

  return {
    accounts: rows.map(mapAccount),
    total: Number(countRows[0]?.total || 0),
  };
}

async function findAccountById(id) {
  const [rows] = await db.query(
    `SELECT nd.*, vt.ten_vai_tro, NULL AS ngay_tao
     FROM nguoi_dung nd
     LEFT JOIN vai_tro vt ON vt.mavt = nd.mavt
     WHERE nd.mand = ?
     LIMIT 1`,
    [id],
  );
  return rows[0] ? mapAccount(rows[0]) : null;
}

async function toggleAccount(id) {
  await db.query("UPDATE nguoi_dung SET trang_thai = NOT trang_thai WHERE mand = ?", [id]);
}

module.exports = { listAccounts, findAccountById, toggleAccount };
