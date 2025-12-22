# Zenith Social YouTube Manager - Backend API

Backend API được xây dựng với **ElysiaJS** và **Bun** để quản lý các API liên quan đến database và scheduled jobs.

## 🚀 Tính năng

- ✅ **Posts Management**: CRUD operations cho posts
- ✅ **Auto-Publishing**: Tự động publish scheduled posts lên YouTube mỗi 10 giây
- ✅ **User Management**: Quản lý user profiles
- ✅ **Keywords Management**: Quản lý keywords và tags
- ✅ **Prisma Integration**: Sử dụng Prisma ORM với MongoDB
- ✅ **Swagger Documentation**: API docs tự động tại `/swagger`
- ✅ **CORS Support**: Hỗ trợ CORS cho frontend

## 📋 Yêu cầu

- Bun >= 1.0.0
- MongoDB (local hoặc cloud)
- Node.js >= 18 (optional, vì dùng Bun)

## 🛠️ Cài đặt

```bash
# Cài đặt dependencies
bun install

# Generate Prisma Client
bun run db:generate

# (Optional) Push schema to database
bun run db:push
```

## ⚙️ Cấu hình

File `.env` cần có các biến sau:

```env
# Server
PORT=5444

# Cron Secret (để bảo vệ cron endpoints)
CRON_SECRET="your-secret-key-here"

# Google OAuth (cho YouTube API)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# JWT Secret
JWT_SECRET="your-jwt-secret-key"
```

**Lưu ý**: `DATABASE_URL` được load tự động từ project cha thông qua Prisma symlink.

## 🏃 Chạy server

```bash
# Development mode (với hot reload)
bun run dev

# Production mode
bun run start
```

Server sẽ chạy tại: `http://localhost:5444`

## 📚 API Documentation

Sau khi server chạy, truy cập Swagger docs tại:
```
http://localhost:5444/swagger
```

## 🔄 Auto-Scheduler

Backend tự động chạy một scheduler mỗi **10 giây** để:
- Kiểm tra các posts có `status = 'scheduled'` và `scheduledAt <= now`
- Tự động upload video lên YouTube
- Cập nhật status thành `published`

### Scheduler Endpoints

```bash
# Start scheduler (tự động start khi server khởi động)
POST /api/cron/start-scheduler
Authorization: Bearer <CRON_SECRET>

# Stop scheduler
POST /api/cron/stop-scheduler
Authorization: Bearer <CRON_SECRET>

# Manual trigger publish
GET /api/cron/publish-scheduled
Authorization: Bearer <CRON_SECRET>
```

## 📡 API Endpoints

### Posts
- `GET /api/posts?userId=<userId>&status=<status>` - Lấy danh sách posts
- `POST /api/posts` - Tạo post mới
- `GET /api/posts/:id` - Lấy chi tiết post
- `PATCH /api/posts/:id` - Cập nhật post
- `DELETE /api/posts/:id` - Xóa post

### User
- `GET /api/user?email=<email>` - Lấy thông tin user
- `PATCH /api/user` - Cập nhật user profile

### Keywords
- `GET /api/keywords?userId=<userId>` - Lấy danh sách keywords
- `POST /api/keywords` - Tạo keyword mới
- `DELETE /api/keywords/:id` - Xóa keyword

### Cron Jobs
- `GET /api/cron/publish-scheduled` - Trigger publish scheduled posts
- `POST /api/cron/publish-scheduled` - Trigger publish (POST method)
- `POST /api/cron/start-scheduler` - Start auto-scheduler
- `POST /api/cron/stop-scheduler` - Stop auto-scheduler

## 🗂️ Cấu trúc thư mục

```
backend-api/
├── src/
│   ├── routes/          # API routes
│   │   ├── posts.ts     # Posts CRUD
│   │   ├── cron.ts      # Cron jobs & scheduler
│   │   ├── user.ts      # User management
│   │   └── keywords.ts  # Keywords management
│   ├── utils/           # Utilities
│   │   └── prisma.ts    # Prisma client
│   └── index.ts         # Main application
├── prisma/              # Symlink to parent prisma/
├── .env                 # Environment variables
├── package.json
└── README.md
```

## 🔗 Integration với Frontend

Frontend Next.js có thể gọi API backend thông qua:

```typescript
// Example: Fetch posts
const response = await fetch('http://localhost:5444/api/posts?userId=123');
const data = await response.json();
```

## 🐛 Debug

Xem logs trong console khi server chạy:
- `[CRON]` prefix cho scheduler logs
- Mỗi 10 giây sẽ check scheduled posts
- Chi tiết về upload, errors, và skipped posts

## 📝 Scripts

```json
{
  "dev": "bun run --watch src/index.ts",
  "start": "bun run src/index.ts",
  "db:generate": "prisma generate",
  "db:push": "prisma db push"
}
```

## 🤝 Contributing

1. Tạo feature branch
2. Commit changes
3. Push và tạo Pull Request

## 📄 License

MIT