# Cho Nong San

## Cach chay voi database moi

### 1. Import database
Mo WampServer/phpMyAdmin hoac MySQL Workbench, import file:

```text
cho_nong_san.sql
```

File nay tao database `cho_nong_san`.

### 2. Cau hinh backend
File `backend/.env` da duoc dat san:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=
DB_NAME=cho_nong_san
```

Neu MySQL cua ban co mat khau, sua `DB_PASSWORD`.

### 3. Cai thu vien

```bash
npm install
npm run install:all
```

### 4. Reset mat khau tai khoan mau

```bash
cd backend
node reset-password.js
cd ..
```

Mat khau mac dinh sau khi reset la `123456`.

### 5. Chay ung dung

```bash
npm run dev
```

Frontend: http://localhost:3000
Backend: http://localhost:5000

<<<<<<< HEAD
## 🔑 Tài khoản đăng nhập (sau khi chạy reset-password.js)
| Vai trò   | Email                   | Mật khẩu   |
|-----------|-------------------------|------------|
| Admin     | admin@chonongsan.vn     | 123456     |
| Người mua | tuan.vo@gmail.com       | 123456     |
=======
## Tai khoan mau sau khi reset password

| Vai tro | Email | Mat khau |
|---|---|---|
| Admin | minhgiau.admin@gmail.com | 123456 |
| User | thimua.user@gmail.com | 123456 |
| User | vankhach.user@gmail.com | 123456 |
>>>>>>> codex/update-marketplace-erd
