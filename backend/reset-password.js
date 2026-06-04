require('dotenv').config();
const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');

async function main() {
  console.log('Dang ket noi MySQL...');

  const db = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'cho_nong_san',
    charset: 'utf8mb4',
  });

  const password = process.argv[2] || '123456';
  const hash = await bcrypt.hash(password, 10);
  const [result] = await db.execute('UPDATE nguoi_dung SET mat_khau = ?', [hash]);

  const [accounts] = await db.execute(
    `SELECT nd.ho_ten, nd.email, vt.ten_vai_tro
     FROM nguoi_dung nd
     LEFT JOIN vai_tro vt ON vt.mavt = nd.mavt
     ORDER BY nd.mand`
  );

  console.log(`Da reset mat khau cho ${result.affectedRows} tai khoan.`);
  console.log(`Mat khau moi: ${password}`);
  console.log('Danh sach tai khoan:');
  accounts.forEach(account => {
    console.log(`- ${(account.ten_vai_tro || 'User').padEnd(8)} | ${account.email} | ${account.ho_ten}`);
  });

  await db.end();
}

main().catch(error => {
  console.error('Loi:', error.message);
  if (error.code === 'ECONNREFUSED') console.error('MySQL/WampServer chua chay hoac sai host/port.');
  if (error.code === 'ER_ACCESS_DENIED_ERROR') console.error('Sai DB_USER/DB_PASSWORD trong backend/.env.');
  if (error.code === 'ER_BAD_DB_ERROR') console.error('Chua import database cho_nong_san.sql.');
  process.exit(1);
});
