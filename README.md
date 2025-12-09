# ContentCore Backend API

Backend API được xây dựng với **Elysia.js** và **MongoDB**, sử dụng **Bun** runtime.

## 🚀 Yêu cầu

- **Bun** >= 1.0.0 ([Cài đặt Bun](https://bun.sh))
- **MongoDB** >= 6.0

## 📦 Cài đặt

```bash
# Cài đặt dependencies
bun install
```

## ⚙️ Cấu hình

Sao chép file `.env.example` thành `.env` và điều chỉnh các giá trị:

```env
MONGODB_URI=mongodb://localhost:27017
DATABASE_NAME=contentcore
PORT=3000
CORS_ORIGIN=*
```

## 🏃 Chạy dự án

```bash
# Development mode (với auto-reload)
bun run dev

# Production mode
bun run start
```

Server sẽ chạy tại `http://localhost:3000`

## 📚 Cấu trúc dự án

```
ContentCore/
├── src/
│   ├── models/
│   │   └── base.model.ts          # Base model interface
│   ├── repositories/
│   │   └── base.repository.ts     # Base CRUD repository
│   ├── services/
│   │   └── base.service.ts        # Base service layer
│   ├── config/
│   │   └── database.ts            # MongoDB configuration
│   └── index.ts                   # Main entry point
├── .env                           # Environment variables
├── package.json
└── tsconfig.json
```

## 🎯 Base Components

### Base Model

Tất cả models đều extends từ `BaseModel` với các trường:
- `_id`: MongoDB ObjectId
- `createAt`: Timestamp khi tạo
- `updateAt`: Timestamp khi cập nhật

### Base Repository

CRUD operations:
- `create(data)` - Tạo document mới
- `findById(id)` - Tìm theo ID
- `findAll(filter, options)` - Lấy danh sách
- `findOne(filter)` - Tìm một document
- `count(filter)` - Đếm documents
- `update(id, data)` - Cập nhật document
- `delete(id)` - Xóa document
- `deleteMany(filter)` - Xóa nhiều documents

### Base Service

Business logic layer wrapping repository operations.

## 📖 Ví dụ sử dụng

### 1. Tạo Model

```typescript
// src/models/user.model.ts
import { BaseModel } from "./base.model";

export interface User extends BaseModel {
  name: string;
  email: string;
  age?: number;
}
```

### 2. Tạo Repository

```typescript
// src/repositories/user.repository.ts
import { BaseRepository } from "./base.repository";
import { User } from "../models/user.model";
import { getDatabase } from "../config/database";

export class UserRepository extends BaseRepository<User> {
  constructor() {
    const db = getDatabase();
    super(db.collection<User>("users"));
  }

  // Thêm custom methods nếu cần
  async findByEmail(email: string): Promise<User | null> {
    return await this.findOne({ email });
  }
}
```

### 3. Tạo Service

```typescript
// src/services/user.service.ts
import { BaseService } from "./base.service";
import { User } from "../models/user.model";
import { UserRepository } from "../repositories/user.repository";

export class UserService extends BaseService<User> {
  constructor() {
    super(new UserRepository());
  }

  // Thêm business logic nếu cần
  async getUserByEmail(email: string): Promise<User | null> {
    const repo = this.repository as UserRepository;
    return await repo.findByEmail(email);
  }
}
```

### 4. Sử dụng trong Routes

```typescript
// src/index.ts
import { UserService } from "./services/user.service";

const userService = new UserService();

app
  .get("/api/users", async () => {
    return await userService.findAll();
  })
  .get("/api/users/:id", async ({ params }) => {
    return await userService.findById(params.id);
  })
  .post("/api/users", async ({ body }) => {
    return await userService.create(body);
  })
  .put("/api/users/:id", async ({ params, body }) => {
    return await userService.update(params.id, body);
  })
  .delete("/api/users/:id", async ({ params }) => {
    const deleted = await userService.delete(params.id);
    return { success: deleted };
  });
```

## 🔌 API Endpoints

### Health Check
```
GET /health
```

Response:
```json
{
  "status": "ok",
  "timestamp": "2025-12-09T13:00:00.000Z",
  "service": "ContentCore Backend"
}
```

### Root
```
GET /
```

Response:
```json
{
  "name": "ContentCore Backend API",
  "version": "1.0.0",
  "description": "Backend API built with Elysia.js and MongoDB",
  "endpoints": {
    "health": "/health",
    "api": "/api"
  }
}
```

## 🛠️ CORS Configuration

CORS đã được cấu hình với:
- Origin: Theo `CORS_ORIGIN` trong `.env` (mặc định: `*`)
- Methods: `GET`, `POST`, `PUT`, `PATCH`, `DELETE`, `OPTIONS`
- Headers: `Content-Type`, `Authorization`
- Credentials: `true`

## 📝 License

MIT
# ContentCore
