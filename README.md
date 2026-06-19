# Eternal Chronicles — Full Project (Frontend + Backend)

```
eternal-chronicles-full/
  frontend/     ← game web (index.html, css/, js/) — mở bằng trình duyệt
  backend/      ← server Node.js/Express — xử lý đăng nhập/đăng ký thật + chống cheat
```

## Cách chạy (cần cài Node.js trước: https://nodejs.org)

### Bước 1 — Chạy backend
```bash
cd backend
npm install
cp .env.example .env
npm start
```
Backend chạy ở `http://localhost:3001`. **Phải chạy bước này trước**, để cửa sổ terminal này mở luôn (đừng tắt).

⚠️ Cách chạy này **chỉ dùng để bạn tự test trên máy mình** — máy khác sẽ
không truy cập được, và tắt terminal/VSCode là server tắt theo, dữ liệu
không đồng bộ. Để deploy thật (nhiều người, nhiều máy, chạy 24/7, dữ liệu
không mất), xem hướng dẫn deploy Railway chi tiết trong `backend/README.md`.

### Bước 2 — Mở frontend
Mở 1 terminal/cửa sổ khác, hoặc đơn giản hơn:
- Mở trực tiếp file `frontend/index.html` bằng trình duyệt (double-click), HOẶC
- Nếu trình duyệt báo lỗi CORS/file://, dùng 1 server tĩnh đơn giản:
  ```bash
  cd frontend
  npx serve .
  ```
  rồi mở link nó in ra (vd `http://localhost:3000`)

### Bước 3 — Thử
- Đăng ký tài khoản mới (nút "Create New Account") hoặc đăng nhập `admin` / `admin123`
- Nếu backend không chạy, màn login sẽ báo lỗi kết nối — quay lại Bước 1 kiểm tra terminal backend còn chạy không

## Frontend gọi backend ở đâu trong code?

File `frontend/js/game.js`, dòng đầu class `Game`:
```js
API_BASE: 'http://localhost:3001/api',
```
Nếu sau này deploy backend lên server thật (Railway/Render/VPS...), chỉ cần đổi giá trị này thành URL thật, ví dụ:
```js
API_BASE: 'https://your-backend-domain.com/api',
```

## Những gì đã chuyển sang server (chống cheat)
- Đăng ký / đăng nhập (bcrypt + JWT, không còn lưu password ở trình duyệt)
- Luyện kim (alchemy) — tỷ lệ thành công roll ở server
- Cường hóa trang bị (enhance) — tỷ lệ thành công roll ở server

## Chưa chuyển (vẫn chạy client-side, làm tiếp theo nếu cần)
- Gacha pull (quay pet/companion) — `frontend/js/partners.js`
- Dungeon sweep reward — `frontend/js/game.js` (hàm `sweepDungeon`)
- Combat damage calculation — `frontend/js/combat.js`

Theo đúng pattern trong `backend/utils/gameRules.js` (xem `performAlchemy`,
`performEnhance`) để port các phần còn lại khi cần.
