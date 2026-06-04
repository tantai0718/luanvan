const mysql = require('mysql2/promise');
require('dotenv').config();

const database = process.env.DB_NAME || 'cho_nong_san';

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

pool
  .getConnection()
  .then(connection => {
    console.log('Ket noi MySQL thanh cong.');
    connection.release();
  })
  .catch(error => {
    console.error('Ket noi MySQL that bai:', error.message);
    console.error('Kiem tra lai file .env: DB_HOST, DB_USER, DB_PASSWORD, DB_NAME');
  });

module.exports = pool;
