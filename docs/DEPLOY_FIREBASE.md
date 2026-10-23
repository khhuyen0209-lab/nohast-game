# Deploy lên Firebase Hosting (tự động qua GitHub Actions)

File: `.github/workflows/deloy-firebase.yml` (tên bắt buộc — spec §39, nằm đúng trong `.github/workflows/` để GitHub Actions nhận diện).

## Các bước một lần
1. Đẩy repo lên GitHub: `https://github.com/khhuyen0209-lab/nohast-game.git`
2. Firebase Console → Project Settings → Service accounts → **Generate new private key** → tải JSON.
3. GitHub repo → **Settings → Secrets and variables → Actions → New repository secret**:
   - `FIREBASE_SERVICE_ACCOUNT`: dán **toàn bộ nội dung JSON** của service account.
   - `FIREBASE_PROJECT_ID`: `nohast-galaxy-c6c9f`
4. (Tùy chọn) Settings → Variables → Actions: `VITE_API_URL` = `https://nohast-game.onrender.com` (runtime cũng có `client/public/config.js` nên không bắt buộc).
5. Push commit lên nhánh `main` → workflow tự chạy: checkout → Node 20 → `npm ci` → `npm run build` → verify `client/dist/index.html` → deploy lên channel `live`.
6. Build thất bại → workflow dừng, KHÔNG deploy (spec §39). Log lỗi hiển thị trong Actions tab.

## Deploy thủ công (nếu cần)
```bash
npm install -g firebase-tools
firebase login
firebase deploy --only hosting   # dùng firebase.json ở root (public: client/dist)
firebase deploy --only firestore:rules,firestore:indexes
```

## URL sau deploy
- `https://nohast-galaxy-c6c9f.web.app`
- `https://nohast-galaxy-c6c9f.firebaseapp.com`

Nếu đổi project ID: sửa `.firebaserc`, `FIREBASE_PROJECT_ID` secret, và `CORS_ORIGINS` trên Render.
