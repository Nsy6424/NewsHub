# Sy's News – Hướng dẫn cài đặt và triển khai

Dự án tin tức xây dựng bằng Next.js, Tailwind CSS, Prisma (PostgreSQL), JWT Auth và API routes.

## Công nghệ chính
- Next.js 14 (App Router)
- Tailwind CSS v4
- Prisma ORM + PostgreSQL
- JWT, HTTP-only Cookie, RBAC (reader/author)
- Upload ảnh (multipart/form-data) lưu trong `public/uploads`

## Yêu cầu hệ thống
- Node.js >= 18
- npm >= 9
- PostgreSQL (local hoặc dịch vụ cloud)
- Windows/macOS/Linux đều được (dự án hiện phát triển trên Windows)

## Cấu trúc thư mục (rút gọn)
```
myweb/
  app/
    api/                # API routes (auth, articles, categories, users, upload, my-articles)
    author/             # Trang tác giả (dashboard, new, edit)
    auth/               # Đăng nhập/Đăng ký
    page.tsx            # Trang chủ
  prisma/
    schema.prisma       # Lược đồ DB
    migrations/         # Lịch sử migration
  public/
    uploads/            # Ảnh upload (tự tạo khi chạy upload)
  next.config.ts
  postcss.config.mjs
  package.json
  tsconfig.json
```

## Thiết lập nhanh
1) Cài dependencies
```bash
cd myweb
npm install
```

2) Tạo file môi trường `.env`
```bash
# Kết nối PostgreSQL
DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DBNAME?schema=public"

# JWT cho xác thực
JWT_SECRET="một_chuỗi_bí_mật_dài_và_ngẫu_nhiên"

# (Tùy chọn) Thư mục upload ảnh – mặc định dùng public/uploads
# UPLOAD_DIR="D:/Project_GIS/myweb/public/uploads"
```

3) Áp dụng schema vào DB
```bash
npx prisma migrate deploy    # dùng cho môi trường đã có migrations
# hoặc trong dev:
npx prisma migrate dev
```

4) Chạy development
```bash
npm run dev
# Mặc định chạy ở http://localhost:3000
```

5) Build & chạy production (local)
```bash
npm run build
npm run start
```

## Đăng nhập/Phân quyền
- Đăng ký ở `/auth/register` (role: Độc giả/ Tác giả)
- Đăng nhập ở `/auth/login`
- Sau đăng nhập:
  - author → chuyển đến `/author`
  - reader → chuyển đến `/`
- Cookie: `token` (HTTP-only, chứa JWT)

## Upload ảnh
- Endpoint: `POST /api/upload`
- Form-data: `file` (input type=file)
- Ảnh sẽ nằm tại `public/uploads`. Cần đảm bảo thư mục tồn tại hoặc để API tự tạo.
- `next.config.ts` đã cho phép `localhost`, `source.unsplash.com`, `images.unsplash.com` cho `next/image`.

## API chính (tóm tắt)
- Auth
  - `POST /api/auth/register` – đăng ký (yêu cầu mật khẩu: >=6 ký tự, 1 chữ hoa, 1 ký tự đặc biệt)
  - `POST /api/auth/login` – đăng nhập (đặt cookie `token`)
  - `POST /api/auth/logout` – đăng xuất (xóa cookie `token`)
  - `GET /api/auth/me` – thông tin user hiện tại

- Articles
  - `GET /api/articles` – danh sách bài viết (hỗ trợ `search`, `page`, `limit`); trả về `featured` (priority>3, tối đa 2) và `latest` (12 bài mới nhất theo `created_at`)
  - `POST /api/articles` – tạo bài (role author)
  - `GET /api/articles/[id]` – chi tiết
  - `PUT /api/articles/[id]` – cập nhật (role author + owner)
  - `DELETE /api/articles/[id]` – xóa (role author + owner)

- My Articles (author)
  - `GET /api/my-articles` – bài của tác giả hiện tại; filter `category`, `search`; sort theo `priority desc`, sau đó `published_at desc`

- Categories
  - `GET /api/categories` – danh mục (kèm `_count.articles`)
  - `POST /api/categories` – tạo danh mục

- Users (quản trị/tiện ích)
  - `GET /api/users` – list users (search, role, pagination, kèm article count)
  - `GET /api/users/[id]` – chi tiết user (validate UUID)
  - `DELETE /api/users/[id]` – xóa user (validate UUID)

## Hướng dẫn test nhanh bằng Postman
1) Auth
   - POST `/api/auth/register` với `name`, `email`, `password`, `role`
   - POST `/api/auth/login` lấy cookie `token`

2) Tạo bài viết (author)
   - POST `/api/articles` với JSON: `title, summary, content, image_url, category_id, priority`
   - Cookie: `token` (HTTP-only) – Postman tự quản lý nếu bật cookie jar

3) Upload ảnh
   - POST `/api/upload` → Body: form-data → key `file` (File)

## Lỗi phổ biến & cách khắc phục
- next/image unconfigured host: kiểm tra `next.config.ts` đã có `source.unsplash.com`, `images.unsplash.com`, `localhost`.
- Cảnh báo `fill` + parent `position`: đảm bảo phần tử cha có `relative|absolute|fixed` hoặc dùng `width/height` + `object-cover`.
- 500 khi format ngày: đã chuẩn hóa trong API, nếu tự sửa, tránh gọi `toISOString()` trên `null`.
- Vòng lặp redirect: middleware đã xử lý `publicRoutes` và cookie `token`. Giữ đúng tên cookie.

## Gợi ý triển khai (deployment)
- Sử dụng dịch vụ DB (Railway, Supabase, Neon, RDS,...)
- Thiết lập biến môi trường như `.env` (đặc biệt `DATABASE_URL`, `JWT_SECRET`)
- Build `npm run build` và chạy `npm run start` sau khi cài dependencies
- Đảm bảo quyền ghi cho thư mục `public/uploads` nếu dùng upload local

## Gợi ý Git (tùy chọn)
```bash
cd myweb
git init
git add .
git commit -m "chore: init Sy's News"
git branch -M main
git remote add origin <your_repo_url>
git push -u origin main
```

## Ghi chú Windows
- Đường dẫn Windows dùng `\\` hoặc string raw trong script (Python). Trong dự án, API upload đã xử lý tên file thân thiện.

---
Nếu gặp vấn đề trong quá trình cài đặt/chạy, hãy tạo issue kèm log lỗi để được hỗ trợ nhanh.


