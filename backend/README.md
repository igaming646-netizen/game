# Eternal Chronicles — Backend (Node.js / Express)

Backend xác thực thật (đăng ký/đăng nhập bằng bcrypt + JWT) và xử lý
server-side cho các hành động có random (alchemy, enhance) để chống cheat.

## Cài đặt & chạy LOCAL (chỉ dùng để bạn tự test trên máy mình)

```bash
cd ec-backend
npm install
cp .env.example .env     # rồi sửa JWT_SECRET cho riêng bạn
npm start
```

Server chạy ở `http://localhost:3001`.

⚠️ **Quan trọng:** chạy theo cách này thì **chỉ máy bạn truy cập được**,
và server **tắt ngay khi bạn đóng terminal/VSCode**. Để nhiều người ở
nhiều máy khác nhau dùng được game, bạn phải deploy lên 1 server thật,
chạy 24/7, có địa chỉ public — xem mục bên dưới.

## Deploy thật (để nhiều máy/nhiều người dùng được, chạy 24/7)

Khuyến nghị dùng **Railway** (có free tier, hỗ trợ ổ đĩa lưu trữ bền vững
— dữ liệu KHÔNG bị mất khi redeploy, khác với nhiều host free khác).

### Bước 1 — Tạo project trên Railway
1. Vào https://railway.app, đăng nhập bằng GitHub
2. **New Project → Deploy from GitHub repo** → chọn repo của bạn
3. Vào **Settings → Root Directory** → đặt thành `backend`
   (giống hệt khái niệm Root Directory bên Vercel)

### Bước 2 — Thêm ổ đĩa lưu trữ bền vững (Volume)
1. Trong project Railway, vào tab **Volumes → New Volume**
2. Mount path: `/data`
3. Vào **Variables**, thêm biến: `DB_FILE_PATH=/data/db.json`
   (code đã hỗ trợ sẵn biến này, xem `db.js`)

### Bước 3 — Thêm các biến môi trường còn lại
Trong **Variables**, thêm:
```
JWT_SECRET=<chuỗi ngẫu nhiên dài, tự nghĩ ra>
JWT_EXPIRES_IN=7d
ADMIN_PASSWORD=admin123
```
(Railway tự cấp `PORT`, không cần khai báo)

### Bước 4 — Lấy URL public
Railway tự cấp 1 domain dạng `https://xxx.up.railway.app`. Copy URL này.

### Bước 5 — Trỏ frontend vào URL mới
Sửa file `frontend/js/game.js`:
```js
API_BASE: 'https://xxx.up.railway.app/api',
```
Commit + push lên GitHub → Vercel tự deploy lại frontend với URL backend mới.

Từ giờ, **bất kỳ ai vào link Vercel của bạn cũng đăng nhập/chơi được**,
không cần máy bạn bật VSCode nữa — vì backend chạy trên Railway 24/7.

## Cấu trúc

```
ec-backend/
  server.js              # entrypoint Express
  db.js                  # lớp lưu trữ (hiện dùng file JSON, dễ thay Postgres/SQLite sau)
  middleware/auth.js      # xác thực JWT
  routes/auth.js          # POST /api/auth/register, /api/auth/login
  routes/player.js        # GET/PUT /api/player/me, POST /api/player/alchemy, /enhance
  utils/gameRules.js      # logic random server-side (alchemy + enhance ported từ crafting.js)
  data/db.json            # "database" dạng file JSON
```

## API

### `POST /api/auth/register`
Body: `{ username, password, confirmPassword }`
→ `{ token, state }`

### `POST /api/auth/login`
Body: `{ username, password }` (username `admin` dùng password trong `.env`)
→ `{ token, state }`

### `GET /api/player/me` (cần header `Authorization: Bearer <token>`)
→ `{ state }`

### `PUT /api/player/me`
Body: `{ state }` — lưu state chung (chỉ dùng cho dữ liệu không cần validate, vd: zone đang chọn, UI prefs)

### `POST /api/player/alchemy`
Body: `{ recipe: 'common_to_uncommon' | 'uncommon_to_rare' | 'rare_to_legendary' }`
→ server tự roll tỷ lệ thành công, KHÔNG tin client.

### `POST /api/player/enhance`
Body: `{ slot, useProtection }`
→ server tự roll % nâng cấp trang bị.

## Kết nối với frontend (game hiện tại)

Frontend (`game/js/game.js`) hiện đang lưu mọi thứ qua `localStorage`. Để
chuyển sang dùng backend này, cần sửa các điểm sau (mình chưa đụng vào để
bạn xem trước kiến trúc, làm bước tiếp theo nếu bạn đồng ý):

1. `Game.handleLogin()` / `handleRegister()` → gọi `fetch('/api/auth/login')`
   thay vì kiểm tra password trong `localStorage`. Lưu `token` trả về vào
   `localStorage` (token thì lưu local được, đây không phải dữ liệu nhạy cảm
   như password).
2. `Game.save()` → gọi `PUT /api/player/me` thay vì `localStorage.setItem`.
3. `Game.loadAccount()` → gọi `GET /api/player/me` (kèm token) thay vì đọc
   `localStorage`.
4. `Crafting.alchemyAction()` / `Crafting.enhance()` → gọi
   `POST /api/player/alchemy` / `/enhance` thay vì `Math.random()` ngay
   trên client, rồi cập nhật `State` bằng `state` trả về từ server.
5. Mọi route trong `routes/player.js` đều yêu cầu header:
   `Authorization: Bearer <token>`

## Bước tiếp theo (chưa làm trong bản này)

- Migrate gacha pull (partners.js) và dungeon sweep (game.js) sang server
  theo đúng pattern của alchemy/enhance ở trên — đây là 2 chỗ roll thưởng
  quan trọng nhất còn lại.
- Thay `db.js` (file JSON) bằng PostgreSQL/SQLite thật khi cần scale.
- Thêm rate-limiting (vd: `express-rate-limit`) để chống brute-force login.
- Triển khai (deploy) lên Railway/Render/Fly.io hoặc VPS riêng.
