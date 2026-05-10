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

const createWarehouseLocationTable = async connection => {
  await connection.query(`
    CREATE TABLE IF NOT EXISTS vi_tri_kho_hang (
      ma_vi_tri INT AUTO_INCREMENT PRIMARY KEY,
      ma_kho INT NOT NULL,
      ma_vi_tri_code VARCHAR(40) NOT NULL,
      ten_vi_tri VARCHAR(120) NOT NULL,
      mo_ta VARCHAR(255) NULL,
      con_su_dung TINYINT(1) NOT NULL DEFAULT 1,
      ngay_tao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      UNIQUE KEY uniq_warehouse_location (ma_kho, ma_vi_tri_code)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
  `);
};

const seedWarehouseLocations = async connection => {
  const [warehouses] = await connection.query('SELECT ma_kho FROM kho_hang');

  for (const warehouse of warehouses) {
    const [existing] = await connection.query(
      'SELECT ma_vi_tri FROM vi_tri_kho_hang WHERE ma_kho = ? LIMIT 1',
      [warehouse.ma_kho]
    );

    if (existing.length) continue;

    const values = [];
    const params = [];

    ['A', 'B', 'C'].forEach(shelf => {
      [1, 2].forEach(level => {
        [1, 2, 3, 4].forEach(slot => {
          const code = `${shelf}-${level}-${String(slot).padStart(2, '0')}`;
          const label = `Kệ ${shelf} - Tầng ${level} - Ô ${String(slot).padStart(2, '0')}`;
          values.push('(?, ?, ?, ?)');
          params.push(warehouse.ma_kho, code, label, `Vị trí chuẩn ${label}`);
        });
      });
    });

    if (values.length) {
      await connection.query(
        `INSERT INTO vi_tri_kho_hang (ma_kho, ma_vi_tri_code, ten_vi_tri, mo_ta) VALUES ${values.join(', ')}`,
        params
      );
    }
  }
};

const ensureWarehouseSchema = async () => {
  const connection = await pool.getConnection();

  try {
    await addColumnIfMissing(connection, 'ton_kho', 'han_su_dung', 'DATE NULL');
    await addColumnIfMissing(connection, 'ton_kho', 'vi_tri_kho', 'VARCHAR(120) NULL');
    await addColumnIfMissing(connection, 'ton_kho', 'ngay_nhap_kho', 'DATETIME NULL');
    await addColumnIfMissing(connection, 'chi_tiet_hoa_don', 'han_su_dung', 'DATE NULL');
    await addColumnIfMissing(connection, 'chi_tiet_hoa_don', 'vi_tri_kho', 'VARCHAR(120) NULL');
    await createWarehouseLocationTable(connection);
    await seedWarehouseLocations(connection);
  } finally {
    connection.release();
  }
};

pool
  .getConnection()
  .then(async connection => {
    console.log('Ket noi MySQL thanh cong.');
    connection.release();
    await ensureWarehouseSchema();
  })
  .catch(error => {
    console.error('Ket noi MySQL that bai:', error.message);
    console.error('Kiem tra lai file .env: DB_HOST, DB_USER, DB_PASSWORD, DB_NAME');
  });

module.exports = pool;
