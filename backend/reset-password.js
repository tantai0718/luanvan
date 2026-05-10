// ================================================
// CHẠY FILE NÀY TRƯỚC KHI ĐĂNG NHẬP
// Lệnh: node reset-password.js
// ================================================
require('dotenv').config();
const bcrypt = require('bcryptjs');
const mysql  = require('mysql2/promise');

async function main() {
  console.log('\n🔄 Đang kết nối MySQL...');

  const db = await mysql.createConnection({
    host:     process.env.DB_HOST     || 'localhost',
    port:     Number(process.env.DB_PORT) || 3306,
    user:     process.env.DB_USER     || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME     || 'cho_nong_san_sach',
    charset:  'utf8mb4',
  });

  console.log('✅ Kết nối MySQL thành công!');
  console.log('🔐 Đang tạo hash bcrypt cho "matkhau123"...');

  const hash = await bcrypt.hash('matkhau123', 10);
  console.log('✅ Hash mới:', hash);

  const [result] = await db.execute('UPDATE tai_khoan SET mat_khau = ?', [hash]);
  console.log(`\n✅ Đã reset mật khẩu cho ${result.affectedRows} tài khoản!`);

  // Hiển thị tài khoản đã reset
  const [accounts] = await db.execute('SELECT ho_ten, email, vai_tro FROM tai_khoan');
  console.log('\n📋 Danh sách tài khoản:');
  accounts.forEach(a => console.log(`   ${a.vai_tro.padEnd(12)} | ${a.email.padEnd(30)} | ${a.ho_ten}`));

  console.log('\n🎉 Tất cả tài khoản dùng mật khẩu: matkhau123');
  console.log('👉 Bây giờ hãy đăng nhập!\n');

  await db.end();
}

main().catch(e => {
  console.error('\n❌ Lỗi:', e.message);
  if (e.code === 'ECONNREFUSED') console.error('   MySQL chưa chạy hoặc sai host/port');
  if (e.code === 'ER_ACCESS_DENIED_ERROR') console.error('   Sai username/password MySQL trong .env');
  if (e.code === 'ER_BAD_DB_ERROR') console.error('   Database không tồn tại — hãy import file SQL trước');
  process.exit(1);
});
