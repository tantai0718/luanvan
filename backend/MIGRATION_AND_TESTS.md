# Migration & Testing Guide (Auth + Banners)

This document explains how to run the backend and test the minimal MVC endpoints kept: Auth (register/login/me) and Banner (list + admin CRUD).

Prerequisites

- Node.js installed
- MySQL accessible with database `cho_nong_san` (or set `DB_NAME`)

Environment variables (create `.env` in `backend/`):

- `DB_HOST` (default: `localhost`)
- `DB_PORT` (default: `3306`)
- `DB_USER`
- `DB_PASSWORD`
- `DB_NAME` (default: `cho_nong_san`)
- `JWT_SECRET` (recommended long random string)
- `PORT` (default: `5000`)
- `CLIENT_URL` (optional, used for CORS)

Start server

```bash
cd backend
npm install
npm start
```

Base API path: `http://localhost:5000/api`

Auth endpoints

- POST `/api/auth/register` — body: `{ "ho_ten": "Tên", "email": "a@b.c", "so_dien_thoai": "090...", "mat_khau": "password" }`
- POST `/api/auth/login` — body: `{ "email": "a@b.c", "mat_khau": "password" }` → returns `{ token, user }`
- GET `/api/auth/me` — header: `Authorization: Bearer <token>`

cURL examples

# Register

```bash
curl -s -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"ho_ten":"Test User","email":"test.user@example.com","so_dien_thoai":"0900000000","mat_khau":"secret123"}'
```

# Login

```bash
curl -s -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test.user@example.com","mat_khau":"secret123"}'
```

# Get profile (replace <TOKEN> with returned token)

```bash
curl -s http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer <TOKEN>"
```

Banner endpoints

- GET `/api/banners` — public, returns active banners
- POST `/api/banners` — admin only; body: `{ "title": "...", "description": "...", "image": "<data-url-or-url>", "order": 1, "active": true }` and requires `Authorization` header
- PUT `/api/banners/:id` — admin only, same body shape as POST
- PATCH `/api/banners/:id/toggle` — admin only
- DELETE `/api/banners/:id` — admin only

cURL examples

# List banners

```bash
curl -s http://localhost:5000/api/banners
```

# Create banner (admin): using image URL

```bash
curl -s -X POST http://localhost:5000/api/banners \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -d '{"title":"Promo","description":"Khuyen mai","image":"https://example.com/banner.png","order":1,"active":true}'
```

# Update banner

```bash
curl -s -X PUT http://localhost:5000/api/banners/123 \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ADMIN_TOKEN>" \
  -d '{"title":"Updated","description":"...","image":"https://example.com/new.png","order":2,"active":true}'
```

# Toggle banner

```bash
curl -s -X PATCH http://localhost:5000/api/banners/123/toggle \
  -H "Authorization: Bearer <ADMIN_TOKEN>"
```

# Delete banner

```bash
curl -s -X DELETE http://localhost:5000/api/banners/123 \
  -H "Authorization: Bearer <ADMIN_TOKEN>"
```

Notes

- The server accepts `image` as a data URL (e.g., `data:image/png;base64,...`) or an HTTP(S) URL. If a data URL is given, the server will save it under `upload/banners` and return a URL.
- Admin actions require accounts with the `quan_tri` role. Use the existing database to set `mavt=1` for an admin user, or register and update the DB directly.
- If you removed other routes, `routes/index.js` now mounts only `/auth` and `/banners`.

If you want, I can also add a minimal Postman collection file next.
