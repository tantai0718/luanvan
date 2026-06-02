const mysql = require('mysql2/promise');
require('dotenv').config();

const database = process.env.DB_NAME || 'cho_nong_san_sach';

const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database,
  waitForConnections: true,
  connectionLimit: 10,
  charset: 'utf8mb4',
});

const hasColumn = async (connection, tableName, columnName) => {
  const [rows] = await connection.query(
    `SELECT 1
     FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = ?
       AND TABLE_NAME = ?
       AND COLUMN_NAME = ?
     LIMIT 1`,
    [database, tableName, columnName]
  );

  return rows.length > 0;
};

const addColumnIfMissing = async (connection, tableName, columnName, definition) => {
  if (await hasColumn(connection, tableName, columnName)) return;
  await connection.query(`ALTER TABLE ${tableName} ADD COLUMN ${columnName} ${definition}`);
};

const createRecurringSubscriptionTable = async connection => {
  await connection.query(`
    CREATE TABLE IF NOT EXISTS dang_ky_giao_dinh_ky (
      ma_dang_ky INT AUTO_INCREMENT PRIMARY KEY,
      ma_nguoi_mua INT NOT NULL,
      ma_san_pham INT NOT NULL,
      ma_nong_dan INT NULL,
      so_luong INT NOT NULL DEFAULT 1,
      don_vi VARCHAR(30) NULL,
      gia_tam_tinh DECIMAL(12,2) NOT NULL DEFAULT 0,
      tan_suat_giao ENUM('hang_tuan', 'hai_tuan', 'hang_thang') NOT NULL DEFAULT 'hang_tuan',
      so_ky_giao INT NOT NULL DEFAULT 4,
      so_ky_da_giao INT NOT NULL DEFAULT 0,
      ngay_bat_dau DATE NOT NULL,
      ngay_giao_tiep_theo DATE NOT NULL,
      dia_chi_giao TEXT NOT NULL,
      phuong_thuc_tt ENUM('tien_mat', 'vnpay') NOT NULL DEFAULT 'tien_mat',
      ghi_chu VARCHAR(255) NULL,
      trang_thai ENUM('dang_hoat_dong', 'tam_dung', 'da_huy', 'hoan_tat') NOT NULL DEFAULT 'dang_hoat_dong',
      ngay_tao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      ngay_cap_nhat TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      INDEX idx_dkgdk_nguoi_mua (ma_nguoi_mua),
      INDEX idx_dkgdk_san_pham (ma_san_pham),
      INDEX idx_dkgdk_nong_dan (ma_nong_dan)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
};

const ensureApplicationSchema = async () => {
  const connection = await pool.getConnection();

  try {
    await addColumnIfMissing(connection, 'don_hang', 'loai_don', "ENUM('thuong','dat_truoc') NOT NULL DEFAULT 'thuong'");
    await addColumnIfMissing(connection, 'don_hang', 'ngay_giao_du_kien', 'DATE NULL');
    await addColumnIfMissing(connection, 'don_hang', 'ghi_chu_he_thong', 'VARCHAR(255) NULL');
    await addColumnIfMissing(connection, 'don_hang', 'giam_gia', "DECIMAL(14,0) NOT NULL DEFAULT 0");
    await addColumnIfMissing(connection, 'don_hang', 'ghi_chu_khuyen_mai', 'VARCHAR(255) NULL');
    await createRecurringSubscriptionTable(connection);
    await addColumnIfMissing(connection, 'dang_ky_giao_dinh_ky', 'so_ky_da_giao', 'INT NOT NULL DEFAULT 0');
  } finally {
    connection.release();
  }
};

pool
  .getConnection()
  .then(async connection => {
    console.log('Ket noi MySQL thanh cong.');
    connection.release();
    await ensureApplicationSchema();
  })
  .catch(error => {
    console.error('Ket noi MySQL that bai:', error.message);
    console.error('Kiem tra lai file .env: DB_HOST, DB_USER, DB_PASSWORD, DB_NAME');
  });

module.exports = pool;
