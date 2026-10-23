# Nohast — Galaxy Sandbox (MVP)

Game sandbox không gian nhiều người chơi. Client (React + Vite + Three.js + PWA) deploy lên **Firebase Hosting**; server (Node + Express + TypeScript + WebSocket + Firebase Admin) deploy lên **Render**. Dữ liệu bền vững trên **Cloud Firestore**.

- Repo đề xuất: `nohast-game`
- Firebase Project: `nohast-galaxy-c6c9f` → Hosting: `https://nohast-galaxy-c6c9f.web.app`
- Render service: `nohast-game` → API: `https://nohast-game.onrender.com`
- Workflow auto-deploy: `.github/workflows/deloy-firebase.yml` (tên bắt buộc theo spec §39)

## Cấu trúc

```
nohast-game/
├── client/            # React + Vite + Three.js + Firebase Auth (PWA)
├── server/            # Express + TS + WebSocket + Firebase Admin (Render)
├── shared/            # types, constants, game-data, validators (dùng chung)
├── firebase/          # firestore.rules, firestore.indexes.json
├── .github/workflows/ # deloy-firebase.yml (auto deploy Hosting)
├── docs/              # ARCHITECTURE, SETUP, DEPLOY_*, DATABASE, GAME_DESIGN, TROUBLESHOOTING
├── firebase.json, .firebaserc, render.yaml, .env.example, package.json
```

## Chạy local (không cần Firebase)

```bash
npm run install:all
# Terminal 1 — server (dùng memory store, không cần credential)
cd server && MEMORY_STORE=1 npm run dev
# Terminal 2 — client
cd client && npm run dev   # http://localhost:5173
```
Ở chế độ memory, đăng ký bất kỳ email/password nào (Firebase Auth vẫn cần project thật — hoặc dùng token dev `dev-token-<uid>` khi test API trực tiếp).

## MVP đã hoàn thành (spec §49)

1. Đăng ký/đăng nhập (Firebase Auth email/password)
2. Tạo hồ sơ chỉ huy + tàu khởi đầu + tài sản ban đầu
3. Buồng lái 3D (Three.js) + bản đồ 2D canvas
4. Di chuyển warp giữa các thiên thể (server tính thời gian & nhiên liệu)
5. Khai thác tài nguyên (laser mining, server xác thực)
6. Giao dịch chợ Nohast (atomic, chống double-spend — spec §25)
7. Quản lý tàu & lắp module (server kiểm tra slot/công suất/giá — spec §11)
8. Trạm cá nhân (tối đa 1, server-enforced — spec §10) + buồng hồi sinh
9. Thủy thủ (tuyển dụng, skill/loyalty)
10. Chat nhiều kênh + presence realtime qua WebSocket (spec §32–33)
11. Dữ liệu lưu Firestore; tải lại khôi phục đúng trạng thái; server restart khôi phục từ Firestore
12. Tiến trình ngoại tuyến (offline progression, giới hạn 7 ngày — spec §8)
13. Giao diện Nohast + trạng thái Nahast-Rules (cấu hình placeholder, rõ ràng là tạm thời — spec §22)
14. Hướng dẫn onboarding + thông báo lỗi rõ ràng
15. PWA (manifest, service worker, khóa ngang có fallback — spec §36–37)

## Chưa triển khai trong MVP (kiến trúc đã sẵn sàng mở rộng)

- Chiến dịch tấn công/ch chiếm Nohast chi tiết, siêu tân tinh Nahast-Rules (có state machine + config)
- Hệ thống chiến đấu PvP/PvE đầy đủ, nghiên cứu công nghệ, thuộc địa, AI phe phái
- Liên minh người chơi, ngoại giao, quản trị dân cư (có data model)
- Nhiều hệ sao, cổng dịch chuyển hoạt động

## Các bước người dùng phải làm lần đầu (spec §44)

1. Đảm bảo Firebase Project `nohast-galaxy-c6c9f` đã bật **Authentication** (email/password) và **Firestore**.
2. Tạo **Service account** (Firebase Console → Project Settings → Service accounts → Generate new private key) → lưu JSON.
3. Trên **Render**: tạo Web Service từ repo, đọc `render.yaml`, đặt 2 secret env: `FIREBASE_CLIENT_EMAIL`, `FIREBASE_PRIVATE_KEY` (dán nguyên private key).
4. Trên **GitHub repo → Settings → Secrets → Actions**: tạo `FIREBASE_SERVICE_ACCOUNT` (dán nguyên JSON service account) và `FIREBASE_PROJECT_ID` = `nohast-galaxy-c6c9f`.
5. Push lên nhánh `main` → workflow `deloy-firebase.yml` tự build & deploy Hosting.
6. Nếu tên dịch vụ bị trùng: đổi tên trong `render.yaml` và `client/public/config.js` (API_URL) — chỉ 2 nơi.

Xem chi tiết trong `docs/DEPLOY_FIREBASE.md`, `docs/DEPLOY_RENDER.md`, `docs/SETUP.md`.
**Biến môi trường**: xem `docs/ENVIRONMENT.md` — đã điền sẵn tất cả giá trị công khai, chỉ còn 2 secret bạn phải tự lấy từ Firebase Console.

## Kiểm thử

```bash
cd server && npm test   # engine, wallet atomic, ownership, limits — không cần Firebase
```

## Bảo mật

- Client KHÔNG ghi Firestore trực tiếp (rules chặn mọi write). Mọi thay đổi tài sản qua server có xác thực ID token.
- Firebase Admin private key chỉ ở server env, không bao giờ trong client/repo/ZIP.
- `client/public/config.js` chỉ chứa Firebase Web config (công khai theo thiết kế).
