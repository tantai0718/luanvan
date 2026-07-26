# Cho Nong San - He thong ban nong san truc tuyen

## Cau truc du an

```
luanvan/
├── backend/          # Node.js + Express API
├── frontend/         # React + Tailwind CSS
├── cho_nong_san.sql  # Database schema
└── upload/           # Uploaded images
```

## Cach chay voi database moi

### 1. Import database

Mo WampServer/hoac MySQL Workbench, import file:

```
cho_nong_san.sql
```

File nay tao database `cho_nong_san`.

### 2. Cau hinh backend

File `backend/.env` da duoc dat san:


### 3. Cai thu vien

```bash
cd backend && npm install
cd ../frontend && npm install
cd ..
```

### 4. Reset mat khau tai khoan mau

```bash
cd backend
node reset-password.js
```

Mat khau mac dinh la `123456`.

### 5. Chay ung dung

```bash
# Terminal 1 - Backend
cd backend
npm run dev

# Terminal 2 - Frontend
cd frontend
npm start
```

Frontend: http://localhost:3000
Backend: http://localhost:5000

### 6. Thanh toan QR (Sepay webhook - tuy chon)

```bash
ngrok http 5000
```

Copy URL public vao dashboard Sepay lam webhook URL:
```
https://<ngrok-url>/api/webhook/sepay
```

## Tai khoan mau

| Vai tro   | Email                     | Mat khau |
|-----------|---------------------------|----------|
| Admin     | minhgiau.admin@gmail.com  | 123456   |
| Nguoi mua | thimua.user@gmail.com     | 123456   |
| Nguoi mua | vankhach.user@gmail.com   | 123456   |

## Cong nghe

- **Backend**: Node.js, Express, MySQL2, JWT, Socket.IO
- **Frontend**: React, React Router, Tailwind CSS, Recharts
- **Database**: MySQL 8.4 (WAMP)
- **Thanh toan**: Sepay webhook (QR chuyen khoan)
- **Anh upload**: Base64 / file upload
