# Hướng dẫn cài đặt & chạy thử

## Yêu cầu
- Node.js ≥ 20
- Firebase Project (đã tạo: `nohast-galaxy-c6c9f`) với Authentication (email/password) + Firestore (Native mode)

## Chạy local nhanh (không cần credential)
```bash
npm run install:all
# Server với memory store (dữ liệu trong RAM)
cd server && MEMORY_STORE=1 npm run dev
# Client (terminal khác)
cd client && npm run dev
```
Mở http://localhost:5173. Lưu ý: Firebase Auth vẫn cần project thật để đăng nhập; để test API không cần UI, dùng header `Authorization: Bearer dev-token-<uid>` (chỉ hoạt động khi MEMORY_STORE=1).

## Chạy local với Firebase thật
1. Tạo service account JSON, đặt vào `server/.env` (xem `.env.example`):
   ```
   FIREBASE_PROJECT_ID=nohast-galaxy-c6c9f
   FIREBASE_CLIENT_EMAIL=...
   FIREBASE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n
   ```
2. `cd server && npm run dev` (không cần MEMORY_STORE).
3. Deploy firestore rules: `firebase deploy --only firestore:rules` (cài Firebase CLI, `firebase login`).

## Build production
```bash
npm run build   # build server (tsc) + client (vite)
cd server && npm start   # chạy server tại :10000
```
