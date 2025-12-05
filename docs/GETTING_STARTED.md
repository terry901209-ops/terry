# 像素蛋糕产品知识库 - 快速开始指南

## 环境要求

在开始之前，请确保你的电脑已安装：

- **Node.js** 18.17 或更高版本（推荐使用 LTS 版本）
- **npm** 或 **pnpm**（推荐使用 pnpm，速度更快）
- **Git**

### 检查环境

```bash
# 检查 Node.js 版本
node -v
# 应该显示 v18.17.0 或更高

# 检查 npm 版本
npm -v

# 检查 Git 版本
git -v
```

---

## 第一步：初始化 Next.js 项目

在终端中运行以下命令：

```bash
# 使用 create-next-app 创建项目
npx create-next-app@latest pixel-cake-kb --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
```

命令参数说明：
- `pixel-cake-kb` - 项目名称
- `--typescript` - 使用 TypeScript
- `--tailwind` - 集成 Tailwind CSS
- `--eslint` - 集成 ESLint
- `--app` - 使用 App Router（新版路由）
- `--src-dir` - 使用 src 目录结构
- `--import-alias "@/*"` - 设置导入别名

创建完成后：

```bash
# 进入项目目录
cd pixel-cake-kb

# 启动开发服务器（验证项目创建成功）
npm run dev
```

浏览器访问 http://localhost:3000 查看是否正常运行。

---

## 第二步：安装核心依赖

```bash
# 安装 Supabase 相关
npm install @supabase/supabase-js @supabase/ssr

# 安装 OpenAI SDK
npm install openai

# 安装 AI SDK (Vercel AI SDK - 推荐用于流式响应)
npm install ai

# 安装表单处理
npm install react-hook-form @hookform/resolvers zod

# 安装图标库
npm install lucide-react

# 安装 Markdown 渲染
npm install react-markdown remark-gfm

# 安装日期处理
npm install date-fns

# 安装类名工具
npm install clsx tailwind-merge
```

---

## 第三步：安装 shadcn/ui

```bash
# 初始化 shadcn/ui
npx shadcn@latest init
```

初始化时的推荐选项：
- Style: **Default**
- Base color: **Slate**（或你喜欢的颜色）
- CSS variables: **Yes**

安装常用组件：

```bash
# 安装常用的 UI 组件
npx shadcn@latest add button input textarea label card dialog form select tabs avatar dropdown-menu sheet toast skeleton badge separator scroll-area
```

---

## 第四步：设置 Supabase

### 4.1 创建 Supabase 项目

1. 访问 [Supabase](https://supabase.com/) 并注册/登录
2. 点击 "New Project" 创建新项目
3. 设置项目名称、数据库密码、选择区域（推荐选择亚洲区域）
4. 等待项目创建完成（约2分钟）

### 4.2 获取 API 密钥

在 Supabase 项目面板中：
1. 点击左侧 "Project Settings"（齿轮图标）
2. 点击 "API"
3. 复制以下信息：
   - **Project URL** (`NEXT_PUBLIC_SUPABASE_URL`)
   - **anon public** key (`NEXT_PUBLIC_SUPABASE_ANON_KEY`)
   - **service_role** key (`SUPABASE_SERVICE_ROLE_KEY`) - 仅用于服务端

### 4.3 启用 pgvector 扩展

在 Supabase SQL 编辑器中运行：

```sql
-- 启用向量扩展（用于 RAG 检索）
CREATE EXTENSION IF NOT EXISTS vector;
```

### 4.4 创建数据库表

将 `docs/DATABASE_SCHEMA.md` 中的 SQL 语句复制到 Supabase SQL 编辑器中执行。

---

## 第五步：设置环境变量

在项目根目录创建 `.env.local` 文件：

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=你的_Supabase_项目_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=你的_anon_key
SUPABASE_SERVICE_ROLE_KEY=你的_service_role_key

# OpenAI
OPENAI_API_KEY=你的_OpenAI_API_密钥

# 可选：如果使用国内代理
# OPENAI_BASE_URL=https://api.openai-proxy.com/v1
```

同时创建 `.env.example` 作为模板（不含敏感信息）：

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# OpenAI
OPENAI_API_KEY=
```

---

## 第六步：获取 OpenAI API Key

1. 访问 [OpenAI Platform](https://platform.openai.com/)
2. 注册/登录账号
3. 点击右上角头像 → "API Keys"
4. 点击 "Create new secret key"
5. 复制密钥并保存到 `.env.local`

> ⚠️ 注意：OpenAI API 是付费的，请确保账户有余额

---

## 项目结构初始化完成后

确认目录结构如下：

```
pixel-cake-kb/
├── .env.local              ✅ 已创建
├── .env.example            ✅ 已创建
├── src/
│   ├── app/
│   │   ├── layout.tsx
│   │   ├── page.tsx
│   │   └── globals.css
│   ├── components/
│   │   └── ui/             ✅ shadcn 组件
│   └── lib/
│       └── utils.ts        ✅ cn() 函数
├── package.json
├── tailwind.config.ts
└── next.config.js
```

---

## 一键初始化脚本（可选）

如果你想一次性执行所有初始化命令，可以使用以下脚本：

```bash
#!/bin/bash

# 创建 Next.js 项目
npx create-next-app@latest pixel-cake-kb --typescript --tailwind --eslint --app --src-dir --import-alias "@/*" --yes

cd pixel-cake-kb

# 安装所有依赖
npm install @supabase/supabase-js @supabase/ssr openai ai react-hook-form @hookform/resolvers zod lucide-react react-markdown remark-gfm date-fns clsx tailwind-merge

# 初始化 shadcn/ui (需要交互式选择)
npx shadcn@latest init

# 安装 shadcn 组件
npx shadcn@latest add button input textarea label card dialog form select tabs avatar dropdown-menu sheet toast skeleton badge separator scroll-area

echo "✅ 项目初始化完成！"
echo "📝 请记得："
echo "   1. 创建 .env.local 文件并填写环境变量"
echo "   2. 在 Supabase 中创建数据库表"
echo "   3. 运行 npm run dev 启动开发服务器"
```

---

## 下一步

初始化完成后，你可以开始：

1. **配置 Supabase 客户端** - 创建 `src/lib/supabase/client.ts`
2. **实现认证功能** - 登录/注册页面
3. **搭建基础布局** - 侧边栏、顶部导航
4. **实现文档上传功能** - 管理后台
5. **实现 RAG 问答** - 智能对话

如需帮助，请随时询问！
