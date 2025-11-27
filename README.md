# Next.js Full Stack Template

这是一个基于 Next.js 16 的全栈项目模板，采用三层架构设计，集成了以下技术栈：

## 技术栈

- **前端框架**: Next.js 16 (App Router)
- **样式**: Tailwind CSS 4
- **国际化**: next-intl (支持英文和中文)
- **数据库**: PostgreSQL + Drizzle ORM
- **身份验证**: NextAuth.js v4 (Auth.js)
- **API**: tRPC (类型安全的 API)
- **UI 组件**: Radix UI + shadcn/ui
- **状态管理**: TanStack Query (React Query)
- **图标**: Tabler Icons

## 功能特性

1. ✅ 多语言支持 (英文/中文)
2. ✅ 用户认证系统 (注册/登录/密码重置)
3. ✅ 类型安全的 API (tRPC)
4. ✅ 数据库管理 (Drizzle ORM + PostgreSQL)
5. ✅ 路由保护 (未登录用户重定向到首页)
6. ✅ 三层架构 (Repository/Service/Controller)
7. ✅ 通用 CRUD 组件 (搜索/表单/分页/增删改查)
8. ✅ 用户管理 (增删改查/状态切换/密码修改)
9. ✅ 设置页面 (账号信息/密码修改)

## 文档

- [快速开始指南](./docs/QUICK_START.md) - 详细的安装和配置步骤，包含完整示例
- [架构文档](./docs/ARCHITECTURE.md) - 三层架构详细说明和数据流向
- [Cursor 规则](./.cursorrules) - 编码规范和 AI 助手提示

## 快速开始

### 1. 安装依赖

```bash
pnpm install
```

### 2. 配置环境变量

复制 `.env.example` 到 `.env` 并填写必要的配置：

```bash
cp .env.example .env
```

需要配置：
- `DATABASE_URL`: PostgreSQL 数据库连接字符串
- `AUTH_SECRET`: NextAuth.js 密钥 (可以使用 `openssl rand -base64 32` 生成)
- `AUTH_URL`: 应用 URL
- `NEXT_PUBLIC_APP_URL`: 公共应用 URL

### 3. 设置数据库

运行数据库迁移：

```bash
pnpm db:generate  # 生成迁移文件
pnpm db:push      # 推送 schema 到数据库
```

或者使用 Drizzle Studio 查看数据库：

```bash
pnpm db:studio
```

### 4. 启动开发服务器

```bash
pnpm dev
```

应用将在 `http://localhost:3220` 启动。

## 项目结构

```
├── app/                          # Next.js App Router
│   ├── [locale]/                # 国际化路由
│   │   ├── dashboard/           # Dashboard 页面
│   │   │   ├── users/          # 用户管理页面
│   │   │   └── settings/       # 设置页面
│   │   ├── login/              # 登录页面
│   │   └── register/           # 注册页面
│   └── api/                     # API 路由
│       ├── auth/                # NextAuth.js 路由
│       └── trpc/                # tRPC 路由
├── components/                   # React 组件
│   ├── common/                  # 通用组件
│   │   ├── crud-table.tsx      # CRUD 表格组件
│   │   └── toolbar-with-filters.tsx  # 工具栏组件
│   ├── dashboard/               # Dashboard 组件
│   └── user/                    # 用户相关组件
├── lib/                         # 工具库
│   ├── auth/                    # Auth.js 配置
│   ├── db/                      # 数据库配置和 schema
│   └── trpc/                    # tRPC 客户端配置
├── server/                      # 服务器端代码
│   ├── controllers/             # 控制器层 (路由处理)
│   ├── services/                # 服务层 (业务逻辑)
│   ├── repositories/            # 仓储层 (数据访问)
│   └── trpc/                    # tRPC 服务器配置和路由
└── i18n/                        # 国际化配置
    └── locales/                 # 翻译文件 (zh.json, en.json)
```

## 架构设计

### 三层架构

项目采用经典的三层架构模式，确保代码的可维护性和可测试性：

#### 1. Repository 层 (数据访问层)
- **位置**: `server/repositories/`
- **职责**: 封装所有数据库操作，提供数据访问接口
- **示例**: `UserRepository` 负责用户相关的数据库操作

```typescript
// server/repositories/user.repository.ts
export class UserRepositoryImpl implements UserRepository {
  async findById(id: string): Promise<UserEntity | null>
  async findAll(params: FindUsersParams): Promise<{ users: UserEntity[]; total: number }>
  async create(data: CreateUserData): Promise<UserEntity>
  async update(id: string, data: UpdateUserData): Promise<UserEntity>
  async delete(id: string): Promise<void>
}
```

#### 2. Service 层 (业务逻辑层)
- **位置**: `server/services/`
- **职责**: 实现业务逻辑，处理数据验证、权限检查、数据转换等
- **示例**: `UserService` 处理用户相关的业务逻辑

```typescript
// server/services/user.service.ts
export class UserService {
  async createUser(data: CreateUserData) {
    // 检查用户是否已存在
    // 加密密码
    // 创建用户
  }
  
  async updateUser(id: string, data: UpdateUserData) {
    // 验证用户存在
    // 处理密码加密
    // 更新用户
  }
}
```

#### 3. Controller 层 (路由层)
- **位置**: `server/controllers/`
- **职责**: 处理 HTTP 请求，调用 Service 层，返回响应
- **示例**: `UserController` 处理用户相关的 API 请求

```typescript
// server/controllers/user.controller.ts
export class UserController {
  constructor(ctx: Context) {
    const userRepository = new UserRepositoryImpl(ctx.db)
    this.userService = new UserService(userRepository)
  }
  
  async getUsers(input: FindUsersParams) {
    return await this.userService.getUsers(input)
  }
}
```

### 数据流向

```
tRPC Route → Controller → Service → Repository → Database
                ↓           ↓          ↓
             响应处理    业务逻辑    数据访问
```

## 通用 CRUD 组件

项目提供了通用的 CRUD 表格组件 (`CrudTable`)，支持：

- ✅ 搜索和过滤
- ✅ 分页
- ✅ 工具栏按钮
- ✅ 行操作 (编辑/删除/状态切换)
- ✅ 自定义操作按钮
- ✅ 加载状态
- ✅ 空状态提示

### 使用示例

```tsx
import { CrudTable, type CrudTableColumn } from "@/components/common/crud-table"

const columns: CrudTableColumn<User>[] = [
  {
    key: "name",
    header: "姓名",
    accessor: (user) => <span className="font-medium">{user.name}</span>,
  },
  {
    key: "email",
    header: "邮箱",
    accessor: (user) => user.email,
  },
]

<CrudTable
  data={users}
  columns={columns}
  onEdit={handleEdit}
  onDelete={handleDelete}
  filters={filters}
  onFiltersChange={setFilters}
  toolbarButtons={toolbarButtons}
  // ... 其他配置
/>
```

## 数据库脚本

- `pnpm db:generate` - 生成数据库迁移文件
- `pnpm db:migrate` - 运行数据库迁移
- `pnpm db:push` - 直接推送 schema 到数据库（开发环境）
- `pnpm db:studio` - 打开 Drizzle Studio 查看数据库

## 使用指南

### 使用 tRPC

在客户端组件中使用 tRPC：

```tsx
"use client";

import { trpc } from "@/lib/trpc/client";

export function MyComponent() {
  const { data, isLoading } = trpc.getCurrentUser.useQuery();

  if (isLoading) return <div>Loading...</div>;
  
  return <div>Hello, {data?.name}!</div>;
}
```

### 添加新的 API 端点

1. **创建 Repository** (`server/repositories/`)
```typescript
export interface MyRepository {
  findAll(): Promise<MyEntity[]>
}

export class MyRepositoryImpl implements MyRepository {
  constructor(private db: typeof db) {}
  
  async findAll(): Promise<MyEntity[]> {
    // 数据库操作
  }
}
```

2. **创建 Service** (`server/services/`)
```typescript
export class MyService {
  constructor(private myRepository: MyRepository) {}
  
  async getAllItems() {
    // 业务逻辑
    return await this.myRepository.findAll()
  }
}
```

3. **创建 Controller** (`server/controllers/`)
```typescript
export class MyController {
  private myService: MyService
  
  constructor(ctx: Context) {
    const repository = new MyRepositoryImpl(ctx.db)
    this.myService = new MyService(repository)
  }
  
  async getAllItems() {
    return await this.myService.getAllItems()
  }
}
```

4. **添加 tRPC 路由** (`server/trpc/routers/_app.ts`)
```typescript
getAllItems: protectedProcedure
  .query(async ({ ctx }) => {
    const controller = new MyController(ctx)
    return await controller.getAllItems()
  }),
```

### 使用 CRUD 组件

参考 `app/[locale]/dashboard/users/page.tsx` 的实现：

```tsx
<CrudTable
  data={data?.users}
  columns={columns}
  page={data?.page}
  totalPages={data?.totalPages}
  onPageChange={setPage}
  filters={filters}
  onFiltersChange={setFilters}
  onSearch={handleSearch}
  toolbarButtons={toolbarButtons}
  onEdit={handleEdit}
  onDelete={handleDelete}
  getRowId={(row) => row.id}
/>
```

## 认证流程

1. 用户访问 `/register` 注册新账户
2. 用户访问 `/login` 登录
3. 登录成功后自动跳转到 `/dashboard`
4. 未登录用户访问 `/dashboard` 会被重定向到 `/login`
5. 已登录用户访问 `/login` 或 `/register` 会被重定向到 `/dashboard`

## 开发

- 开发服务器: `pnpm dev`
- 构建: `pnpm build`
- 启动生产服务器: `pnpm start`
- 代码检查: `pnpm lint`

## 编码规范

### 文件命名
- 组件文件使用 PascalCase: `UserManagement.tsx`
- 工具文件使用 camelCase: `utils.ts`
- 类型文件使用 camelCase: `types.ts`

### 目录结构
- 组件按功能分类: `components/user/`, `components/common/`
- 服务器代码按层分类: `server/repositories/`, `server/services/`, `server/controllers/`

### 代码风格
- 使用 TypeScript 严格模式
- 优先使用函数式组件和 Hooks
- 使用 `"use client"` 标记客户端组件
- 使用 `useTranslations` 进行国际化

### 架构原则
- **单一职责**: 每个类/函数只做一件事
- **依赖注入**: Controller 依赖 Service，Service 依赖 Repository
- **接口隔离**: 使用接口定义契约
- **开闭原则**: 对扩展开放，对修改关闭

## 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 许可证

MIT License