# Xử lý lỗi thường gặp

## Client hiển thị "Lỗi tải dữ liệu" / 401
- Kiểm tra đã đăng nhập chưa. Token hết hạn → tự refresh khi gọi API; nếu vẫn lỗi, đăng xuất và đăng nhập lại.
- Kiểm tra `client/public/config.js`: `API_URL` trỏ đúng Render service.

## Render: server crash lúc khởi động
- Log Render → nếu lỗi `Thiếu biến môi trường bắt buộc: FIREBASE_PRIVATE_KEY` → thiếu secret env. Đặt `FIREBASE_CLIENT_EMAIL` + `FIREBASE_PRIVATE_KEY` trong Render Environment.
- Private key phải dán nguyên (gồm `-----BEGIN PRIVATE KEY-----`). Nếu copy bị mất xuống dòng, server báo `error:0909006C:PEM routines`. Khắc phục: dán lại nguyên văn từ JSON.
- Muốn chạy không cần Firebase: đặt `MEMORY_STORE=1` (chỉ dev/test).

## Firebase Hosting deploy thất bại trong Actions
- Kiểm tra secret `FIREBASE_SERVICE_ACCOUNT` (dán nguyên JSON, không cắt bớt) và `FIREBASE_PROJECT_ID`.
- Kiểm tra `client/package-lock.json` tồn tại (workflow dùng `npm ci`).
- Log Actions → bước "Build client" nếu TypeScript lỗi → sửa lỗi type rồi push lại.

## WebSocket không kết nối
- Render free plan: lần đầu sau khi ngủ chậm. Đợi ~30s hoặc refresh.
- Kiểm tra URL: `wss://<render-domain>/ws`.

## Dữ liệu mất sau khi restart server
- Chỉ xảy ra khi `MEMORY_STORE=1`. Production dùng Firestore → dữ liệu bền vững.

## Tên dịch vụ bị trùng trên Render/Firebase
- Render: đổi `name` trong `render.yaml`, cập nhật `API_URL` trong `client/public/config.js`.
- Firebase: project ID không đổi sau khi tạo; nếu cần project khác, đổi `.firebaserc` + secret `FIREBASE_PROJECT_ID` + `CORS_ORIGINS`.

## Build client bị lỗi "Cannot find module '../../../shared/...'"
- Đảm bảo chạy `npm install` trong `client/` (tsconfig include `../shared`). Shared là TypeScript thuần, không cần build riêng.
