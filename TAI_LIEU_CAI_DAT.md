# TÀI LIỆU HƯỚNG DẪN CÀI ĐẶT

**Hệ thống:** Chợ Nông Sản — Hệ thống bán nông sản trực tuyến
**Phiên bản:** 1.0.0

---

## 1. YÊU CẦU HỆ THỐNG

| Thành phần | Yêu cầu |
|---|---|
| Hệ điều hành | Windows 10/11 (hoặc Linux/macOS) |
| Node.js | ≥ 18 (khuyến nghị 20.x LTS) |
| MySQL | 8.x (khuyến nghị dùng WAMP/XAMPP) |
| Trình duyệt | Chrome, Edge, Firefox mới nhất |
| Mạng | Có internet (nếu dùng Chat AI, QR thanh toán) |

---

## 2. CẤU TRÚC DỰ ÁN

```
luanvan/
├── backend/            # Node.js + Express API (cổng 5000)
├── frontend/           # React + Tailwind CSS (cổng 3000)
├── cho_nong_san.sql    # File database schema
└── package.json        # Script chạy cả backend + frontend
```

---

## 3. CÀI ĐẶT MÔI TRƯỜNG

### 3.1. Cài đặt Node.js
- Tải Node.js LTS tại: https://nodejs.org
- Cài đặt theo mặc định (tích hợp sẵn npm).

### 3.2. Cài đặt MySQL
- Cách 1: **WAMP Server** (khuyến nghị cho Windows) — tải tại https://www.wampserver.com
- Cách 2: **MySQL Community Server** — tải tại https://dev.mysql.com/downloads/mysql
- Cách 3: **XAMPP** — tải tại https://www.apachefriends.org

---

## 4. IMPORT DATABASE

1. Khởi động MySQL (mở WAMP/XAMPP, nhấn Start).
2. Mở **phpMyAdmin** (WAMP: http://localhost/phpmyadmin) hoặc **MySQL Workbench**.
3. Tạo database mới tên `cho_nong_san` (utf8mb4).
4. Import file `cho_nong_san.sql`:
   - **phpMyAdmin**: tab *Import* → Chọn file → *Go*.
   - **MySQL Workbench**: *File* → *Open SQL Script* → chạy script.
5. Kiểm tra các bảng đã được tạo (nguoi_dung, san_pham, don_hang, ...).

> File script tự tạo database nếu chưa tồn tại. Nếu lỗi, hãy tạo database trước rồi import.

---

## 5. CẤU HÌNH BACKEND

### 5.1. Tạo file `.env`

Sao chép file mẫu:

```bash
cd backend
copy .env.example .env        # Windows
# cp .env.example .env        # Linux/macOS
```

### 5.2. Các biến môi trường

```ini
# Cổng chạy API
PORT=5000

# Địa chỉ frontend (để CORS)
CLIENT_URL=http://localhost:3000

# Khóa bí mật mã hóa JWT (nên đổi)
JWT_SECRET=chuoi_bi_mat_bat_ky

# Kết nối MySQL
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=            # để trống nếu WAMP dùng root không mật khẩu
DB_NAME=cho_nong_san
```

### 5.3. Các biến tùy chọn (chức năng mở rộng)

```ini
# Chat AI (Google Gemini) — lấy key tại https://aistudio.google.com/apikey
GEMINI_API_KEY=...

# Thông tin tài khoản ngân hàng nhận thanh toán QR (VietQR)
BANK_BANK_NAME=MB Bank
BANK_SHORT_NAME=MB
BANK_ACCOUNT_NUMBER=...
BANK_ACCOUNT_HOLDER=...

# Khóa bí mật webhook Sepay (để xác thực webhook)
SEPAY_WEBHOOK_SECRET=...
```

> Không cấu hình GEMINI_API_KEY thì Chat AI sẽ không hoạt động, các chức năng khác vẫn chạy bình thường.

---

## 6. CÀI ĐẶT THƯ VIỆN

Mở terminal tại thư mục gốc `luanvan/`:

```bash
npm install        # cài concurrently ở root
npm run install:all
```

Hoặc cài từng phần:

```bash
cd backend
npm install

cd ../frontend
npm install
```

---

## 7. RESET MẬT KHẨU TÀI KHOẢN MẪU

```bash
cd backend
node reset-password.js
```

Mật khẩu mặc định của tất cả tài khoản mẫu: **`123456`**

| Vai trò | Email |
|---|---|
| Admin | minhgiau.admin@gmail.com |
| Người mua | thimua.user@gmail.com |
| Người mua | vankhach.user@gmail.com |

---

## 8. CHẠY ỨNG DỤNG

### Cách 1: Chạy đồng thời (từ thư mục gốc)

```bash
npm run dev
```

### Cách 2: Chạy 2 terminal riêng

```bash
# Terminal 1 - Backend
cd backend
npm run dev
# hoặc npm start

# Terminal 2 - Frontend
cd frontend
npm start
```

### Kiểm tra

| Ứng dụng | Địa chỉ |
|---|---|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:5000 |
| Kiểm tra API | http://localhost:5000/ |

---

## 9. CÀI ĐẶT THANH TOÁN QR (SEPAY WEBHOOK) — TÙY CHỌN

Dùng khi cần test thanh toán QR chuyển khoản ngân hàng:

```bash
ngrok http 5000
```

Sao chép URL public (ví dụ `https://abc123.ngrok.app`) vào dashboard **Sepay** tại mục *Webhook*:

```
https://<ngrok-url>/api/webhook/sepay
```

Cài đặt bí mật webhook `SEPAY_WEBHOOK_SECRET` trong `.env` phải khớp với giá trị cấu hình trên Sepay.

---

## 10. XỬ LÝ SỰ CỐ THƯỜNG GẶP

| Lỗi | Nguyên nhân | Cách khắc phục |
|---|---|---|
| `Ket noi MySQL that bai` | Sai DB_HOST/DB_USER/DB_PASSWORD | Kiểm tra lại `.env`, chắc chắn MySQL đã chạy |
| `Unknown database 'cho_nong_san'` | Chưa import database | Import lại `cho_nong_san.sql` |
| `EADDRINUSE: port 5000` | Cổng 5000 đang bị chiếm | Đóng tiến trình cũ hoặc đổi PORT trong `.env` |
| CORS error khi gọi API | CLIENT_URL sai | Đặt `CLIENT_URL=http://localhost:3000` |
| Đăng nhập bị lỗi 401 | Mật khẩu cũ bị reset | Chạy lại `node reset-password.js` |
| Ảnh sản phẩm không hiện | Thiếu thư mục `upload` | Chắc chắn backend đang chạy ở cổng 5000 |
| Chat AI không phản hồi | Thiếu GEMINI_API_KEY | Cấu hình key trong `.env` và khởi động lại backend |
