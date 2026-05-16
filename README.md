# 🌱 Chợ Nông Sản Sạch

## ▶️ CÁCH CHẠY (làm theo đúng thứ tự)

### BƯỚC 1 — Import database
Mở **MySQL Workbench** → File → Open SQL Script → chọn `cho_nong_san_sach.sql` → chạy (Ctrl+Shift+Enter)

### BƯỚC 2 — Tạo file .env
```
cd backend
copy .env.example .env
```
Mở file `.env` vừa tạo, sửa dòng `DB_PASSWORD=` thành mật khẩu MySQL của bạn.
Ví dụ nếu MySQL không có mật khẩu thì giữ nguyên `DB_PASSWORD=`

### BƯỚC 3 — Cài thư viện
Mở terminal tại thư mục gốc (nơi có file package.json này):
```
npm install
npm run install:all
```

### BƯỚC 4 — Reset mật khẩu (QUAN TRỌNG - bắt buộc làm 1 lần)
```
cd backend
node reset-password.js
```
Phải thấy: ✅ Đã reset mật khẩu cho 10 tài khoản!
```
cd ..
```

### BƯỚC 5 — Chạy ứng dụng
```
npm run dev
```
Mở trình duyệt:
- 🌐 Frontend: http://localhost:3000
- 🔌 Backend:  http://localhost:5000

---

## 🔑 Tài khoản đăng nhập (sau khi chạy reset-password.js)
| Vai trò   | Email                   | Mật khẩu   |
|-----------|-------------------------|------------|
| Admin     | admin@chonongsan.vn     | matkhau123 |
| Nông dân  | hung.tran@gmail.com     | matkhau123 |
| Người mua | tuan.vo@gmail.com       | matkhau123 |
