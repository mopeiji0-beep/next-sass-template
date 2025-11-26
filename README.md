# Next.js Full Stack Template

这是一个基于 Next.js 16 的全栈项目模板，集成了以下技术栈：

## 技术栈

- **前端框架**: Next.js 16 (App Router)
- **样式**: Tailwind CSS
- **国际化**: next-intl (支持英文和中文)
- **数据库**: PostgreSQL + Drizzle ORM
- **身份验证**: NextAuth.js v5 (Auth.js)
- **API**: tRPC (类型安全的 API)
- **UI 组件**: Radix UI + shadcn/ui

## 功能特性

1. ✅ 多语言支持 (英文/中文)
2. ✅ 用户认证系统 (注册/登录)
3. ✅ 类型安全的 API (tRPC)
4. ✅ 数据库管理 (Drizzle ORM + PostgreSQL)
5. ✅ 路由保护 (未登录用户重定向到首页)

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
├── app/                    # Next.js App Router
│   ├── [locale]/          # 国际化路由
│   │   ├── dashboard/      # Dashboard 页面
│   │   ├── login/          # 登录页面
│   │   └── register/       # 注册页面
│   └── api/                # API 路由
│       ├── auth/           # NextAuth.js 路由
│       └── trpc/           # tRPC 路由
├── components/             # React 组件
├── lib/                   # 工具库
│   ├── auth/              # Auth.js 配置
│   ├── db/                # 数据库配置和 schema
│   └── trpc/              # tRPC 客户端配置
├── server/                # 服务器端代码
│   └── trpc/              # tRPC 服务器配置和路由
└── i18n/                  # 国际化配置
    └── locales/           # 翻译文件
```

## 数据库脚本

- `pnpm db:generate` - 生成数据库迁移文件
- `pnpm db:migrate` - 运行数据库迁移
- `pnpm db:push` - 直接推送 schema 到数据库（开发环境）
- `pnpm db:studio` - 打开 Drizzle Studio 查看数据库

## 使用 tRPC

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