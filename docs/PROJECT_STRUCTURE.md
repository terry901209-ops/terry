# 像素蛋糕产品知识库 - 项目结构

## 目录结构

```
pixel-cake-kb/
├── .env.local                    # 环境变量（Supabase、OpenAI密钥等）
├── .env.example                  # 环境变量示例
├── next.config.js                # Next.js 配置
├── tailwind.config.ts            # Tailwind CSS 配置
├── tsconfig.json                 # TypeScript 配置
├── package.json
│
├── public/                       # 静态资源
│   ├── images/
│   └── icons/
│
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── layout.tsx            # 根布局
│   │   ├── page.tsx              # 首页
│   │   ├── globals.css           # 全局样式
│   │   │
│   │   ├── (auth)/               # 认证相关页面组
│   │   │   ├── login/
│   │   │   │   └── page.tsx      # 登录页
│   │   │   ├── register/
│   │   │   │   └── page.tsx      # 注册页
│   │   │   └── layout.tsx        # 认证页面布局
│   │   │
│   │   ├── (main)/               # 主应用页面组（需要登录）
│   │   │   ├── layout.tsx        # 主应用布局（含侧边栏）
│   │   │   ├── dashboard/
│   │   │   │   └── page.tsx      # 仪表盘/首页
│   │   │   │
│   │   │   ├── chat/             # 智能问答
│   │   │   │   └── page.tsx      # AI对话页面
│   │   │   │
│   │   │   ├── templates/        # 场景化模板（工具箱）
│   │   │   │   ├── page.tsx      # 模板列表页
│   │   │   │   ├── customer-service/
│   │   │   │   │   └── page.tsx  # 客服快速响应
│   │   │   │   ├── marketing/
│   │   │   │   │   └── page.tsx  # 运营推广策划
│   │   │   │   └── sales/
│   │   │   │       └── page.tsx  # 销售策略定制
│   │   │   │
│   │   │   ├── knowledge/        # 知识库浏览
│   │   │   │   ├── page.tsx      # 知识库列表
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx  # 文档详情页
│   │   │   │
│   │   │   └── history/          # 历史记录
│   │   │       └── page.tsx      # 对话/生成历史
│   │   │
│   │   ├── admin/                # 管理员后台
│   │   │   ├── layout.tsx        # 管理后台布局
│   │   │   ├── page.tsx          # 管理后台首页
│   │   │   │
│   │   │   ├── documents/        # 文档管理
│   │   │   │   ├── page.tsx      # 文档列表
│   │   │   │   ├── new/
│   │   │   │   │   └── page.tsx  # 新建文档
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx  # 编辑文档
│   │   │   │
│   │   │   ├── templates/        # 提示词模板管理
│   │   │   │   ├── page.tsx      # 模板列表
│   │   │   │   └── [id]/
│   │   │   │       └── page.tsx  # 编辑模板
│   │   │   │
│   │   │   └── users/            # 用户管理
│   │   │       └── page.tsx
│   │   │
│   │   └── api/                  # API 路由
│   │       ├── chat/
│   │       │   └── route.ts      # AI 对话接口
│   │       ├── generate/
│   │       │   └── route.ts      # 模板生成接口
│   │       ├── documents/
│   │       │   ├── route.ts      # 文档 CRUD
│   │       │   ├── [id]/
│   │       │   │   └── route.ts
│   │       │   └── upload/
│   │       │       └── route.ts  # 文档上传与向量化
│   │       ├── templates/
│   │       │   └── route.ts      # 模板 CRUD
│   │       └── search/
│   │           └── route.ts      # 向量搜索接口
│   │
│   ├── components/               # React 组件
│   │   ├── ui/                   # shadcn/ui 基础组件
│   │   │   ├── button.tsx
│   │   │   ├── input.tsx
│   │   │   ├── dialog.tsx
│   │   │   ├── card.tsx
│   │   │   ├── form.tsx
│   │   │   └── ...
│   │   │
│   │   ├── layout/               # 布局组件
│   │   │   ├── Sidebar.tsx       # 侧边栏导航
│   │   │   ├── Header.tsx        # 顶部导航栏
│   │   │   └── Footer.tsx
│   │   │
│   │   ├── chat/                 # 聊天相关组件
│   │   │   ├── ChatContainer.tsx # 聊天容器
│   │   │   ├── ChatMessage.tsx   # 消息气泡
│   │   │   ├── ChatInput.tsx     # 输入框
│   │   │   └── SourceReference.tsx # 引用来源展示
│   │   │
│   │   ├── templates/            # 模板相关组件
│   │   │   ├── TemplateCard.tsx  # 模板卡片
│   │   │   ├── DynamicForm.tsx   # 动态表单生成器
│   │   │   └── ResultDisplay.tsx # 结果展示
│   │   │
│   │   ├── knowledge/            # 知识展示组件
│   │   │   ├── DocumentCard.tsx  # 文档卡片
│   │   │   ├── ImageCompare.tsx  # Before/After 对比组件
│   │   │   └── MarkdownRenderer.tsx # Markdown渲染器
│   │   │
│   │   └── admin/                # 管理后台组件
│   │       ├── DocumentEditor.tsx    # 文档编辑器
│   │       ├── TemplateEditor.tsx    # 模板编辑器
│   │       └── FormFieldBuilder.tsx  # 表单字段配置器
│   │
│   ├── lib/                      # 工具库
│   │   ├── supabase/
│   │   │   ├── client.ts         # 客户端 Supabase 实例
│   │   │   ├── server.ts         # 服务端 Supabase 实例
│   │   │   └── middleware.ts     # Auth 中间件
│   │   │
│   │   ├── openai/
│   │   │   ├── client.ts         # OpenAI 客户端
│   │   │   ├── embeddings.ts     # 文本向量化
│   │   │   └── chat.ts           # 聊天完成
│   │   │
│   │   ├── rag/
│   │   │   ├── retriever.ts      # 向量检索
│   │   │   ├── chunker.ts        # 文档分块
│   │   │   └── prompts.ts        # 系统提示词
│   │   │
│   │   └── utils/
│   │       ├── cn.ts             # className 合并工具
│   │       ├── format.ts         # 格式化工具
│   │       └── validators.ts     # 验证工具
│   │
│   ├── hooks/                    # 自定义 Hooks
│   │   ├── useAuth.ts            # 认证 Hook
│   │   ├── useChat.ts            # 聊天 Hook
│   │   └── useDocuments.ts       # 文档操作 Hook
│   │
│   ├── types/                    # TypeScript 类型定义
│   │   ├── database.ts           # 数据库类型（Supabase生成）
│   │   ├── api.ts                # API 请求/响应类型
│   │   └── index.ts
│   │
│   └── middleware.ts             # Next.js 中间件（路由保护）
│
├── supabase/                     # Supabase 本地开发配置
│   ├── config.toml
│   ├── migrations/               # 数据库迁移文件
│   │   └── 20241205_init.sql     # 初始化表结构
│   └── seed.sql                  # 种子数据
│
└── docs/                         # 项目文档
    ├── PROJECT_STRUCTURE.md      # 本文档
    ├── DATABASE_SCHEMA.md        # 数据库设计文档
    └── API.md                    # API 文档
```

## 核心模块说明

### 1. 认证模块 `(auth)`
- 使用 Supabase Auth 实现登录/注册
- 支持邮箱密码登录
- 中间件保护需要登录的路由

### 2. 智能问答 `chat`
- 基于 RAG（检索增强生成）的问答系统
- 支持图文混排展示
- 显示引用来源，支持点击跳转

### 3. 场景化模板 `templates`
- 动态表单生成器
- 三个预置模板：客服、运营、销售
- 管理员可配置表单字段

### 4. 知识库管理 `admin`
- 文档上传与管理
- 提示词模板配置
- 表单字段动态配置

### 5. RAG 核心 `lib/rag`
- 文档分块与向量化
- 相似度检索
- 上下文注入与回答生成
