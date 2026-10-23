# Biến môi trường cần thiết — Nohast (đã điền giá trị cụ thể)

Dự án dùng Firebase Project `nohast-galaxy-c6c9f` và Render service `nohast-game`.
Các giá trị dưới đây đã được điền sẵn theo thông tin bạn cung cấp. **Chỉ còn 2 biến bí mật (secret) bạn phải tự lấy từ Firebase Console và dán vào.**

---

## A. Trên Render (Environment Variables của service `nohast-game`)

| Biến | Giá trị | Ghi chú |
|---|---|---|
| `PORT` | `10000` | Render tự inject, có thể bỏ qua |
| `NODE_ENV` | `production` | |
| `CORS_ORIGINS` | `https://nohast-galaxy-c6c9f.web.app,https://nohast-galaxy-c6c9f.firebaseapp.com,http://localhost:5173` | Các origin được gọi API |
| `FRONTEND_URL` | `https://nohast-galaxy-c6c9f.web.app` | |
| `API_URL` | `https://nohast-game.onrender.com` | |
| `FIREBASE_PROJECT_ID` | `nohast-galaxy-c6c9f` | |
| `RATE_LIMIT_PER_MINUTE` | `120` | (tùy chọn) |
| `CHAT_RATE_PER_MIN` | `20` | (tùy chọn) |
| **`FIREBASE_CLIENT_EMAIL`** | *bạn phải điền* | Xem mục C bên dưới |
| **`FIREBASE_PRIVATE_KEY`** | *bạn phải điền* | Xem mục C bên dưới |

> Nếu thiếu `FIREBASE_PRIVATE_KEY`, server tự động chạy chế độ `MEMORY_STORE` (dữ liệu trong RAM, mất khi restart) và log cảnh báo. Đây là chế độ dev, không dùng cho production.

---

## B. Trên GitHub (Settings → Secrets and variables → Actions)

Để workflow `.github/workflows/deloy-firebase.yml` tự deploy Firebase Hosting:

| Secret | Giá trị |
|---|---|
| `FIREBASE_PROJECT_ID` | `nohast-galaxy-c6c9f` |
| **`FIREBASE_SERVICE_ACCOUNT`** | *toàn bộ nội dung JSON của service account* (xem mục C) |

Không cần `GITHUB_TOKEN` (tự động có sẵn).

---

## C. Lấy 2 giá trị bí mật (chỉ làm 1 lần)

1. Mở **Firebase Console** → project `nohast-galaxy-c6c9f` → **Project Settings** (bánh răng) → tab **Service accounts**.
2. Bấm **Generate new private key** → tải file JSON về (ví dụ `nohast-galaxy-c6c9f-firebase-adminsdk-xxxxx.json`).
3. Mở file JSON đó:
   - `FIREBASE_CLIENT_EMAIL` = giá trị của field `"client_email"` (dạng `firebase-adminsdk-xxxxx@nohast-galaxy-c6c9f.iam.gserviceaccount.com`).
   - `FIREBASE_PRIVATE_KEY` = giá trị của field `"private_key"` **dán nguyên cả chuỗi** (gồm `-----BEGIN PRIVATE KEY-----...-----END PRIVATE KEY-----\n`). Render tự xử lý ký tự `\n`.
   - `FIREBASE_SERVICE_ACCOUNT` (GitHub Secret) = **toàn bộ nội dung file JSON** dán nguyên vào.
4. **KHÔNG** commit file JSON này vào repo, **KHÔNG** để nó trong ZIP, **KHÔNG** dán vào frontend. Nó chỉ nằm ở Render Environment và GitHub Secrets.

---

## D. Frontend (công khai, không phải secret)

File `client/public/config.js` đã chứa sẵn Firebase Web config (công khai theo thiết kế) và `API_URL`. Nếu sau này đổi tên Render service hoặc Firebase project, chỉ cần sửa file này — không cần build lại.

```js
window.__NOHAST_CONFIG__ = {
  API_URL: 'https://nohast-game.onrender.com',
  FIREBASE: {
    apiKey: 'AIzaSyBSjkUtnSAe9KJiRyO7HA5CwQhJACOxP5Q',
    authDomain: 'nohast-galaxy-c6c9f.firebaseapp.com',
    projectId: 'nohast-galaxy-c6c9f',
    storageBucket: 'nohast-galaxy-c6c9f.firebasestorage.app',
    messagingSenderId: '899103073859',
    appId: '1:899103073859:web:9140c65c85e053cb9916f6',
  },
  HOSTING_URLS: [
    'https://nohast-galaxy-c6c9f.web.app',
    'https://nohast-galaxy-c6c9f.firebaseapp.com',
  ],
};
```

---

## E. Chạy local (dev, không cần secret)

```bash
cd server && MEMORY_STORE=1 npm run dev     # terminal 1, cổng 10000
cd client && npm run dev                     # terminal 2, cổng 5173
```
Ở chế độ `MEMORY_STORE=1`, server không cần Firebase credential. Đăng nhập vẫn cần Firebase Auth (project thật) — hoặc test API trực tiếp với header `Authorization: Bearer dev-token-<uid>`.

---

## F. Kiểm tra sau khi deploy

- Server health: `https://nohast-game.onrender.com/api/health` → `{"status":"ok",...}`
- Server config: `https://nohast-game.onrender.com/api/config`
- Frontend: `https://nohast-galaxy-c6c9f.web.app`
- Nếu server log báo `MISSING_FIREBASE_PRIVATE_KEY` → bạn chưa đặt secret ở Render.
