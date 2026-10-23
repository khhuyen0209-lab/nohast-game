# Deploy backend lên Render

File: `render.yaml` (Blueprint). Service name: `nohast-game`, URL: `https://nohast-game.onrender.com`.

## Các bước
1. Render Dashboard → **New → Blueprint** (hoặc Web Service) → chọn repo `khhuyen0209-lab/nohast-game`.
2. Render đọc `render.yaml`: rootDir=`server`, build=`npm install && npm run build`, start=`npm start`, health check=`/api/health`.
3. Trong phần Environment, đặt 2 secret (đã khai báo `sync: false`, KHÔNG có giá trị trong file):
   - `FIREBASE_CLIENT_EMAIL`: từ JSON service account (field `client_email`)
   - `FIREBASE_PRIVATE_KEY`: dán nguyên private key (gồm `-----BEGIN PRIVATE KEY-----` và `\n`; Render tự xử lý)
4. Các biến còn lại đã có giá trị mặc định trong `render.yaml` (có thể sửa).
5. Deploy. Kiểm tra: `https://nohast-game.onrender.com/api/health` phải trả `{"status":"ok",...}`.

## Lưu ý
- Plan free Render ngủ khi không có traffic → request đầu tiên chậm ~30s. Client nên retry.
- Nếu tên `nohast-game` bị trùng: đổi `name` trong `render.yaml`, rồi cập nhật `API_URL` trong `client/public/config.js` và `VITE_API_URL` (nếu dùng).
- Server không lưu state trong RAM làm nguồn chính; khởi động lại đọc từ Firestore (spec §45). Chỉ memory store (dev) là mất dữ liệu.
- WebSocket chạy cùng port Express (`/ws`), Render hỗ trợ.
