# 像素蛋糕产品知识库 - 数据库设计

## 数据库架构概览

```
┌─────────────────────────────────────────────────────────────────────────┐
│                           Supabase PostgreSQL                            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────────────────┐      │
│  │   users     │    │  documents  │    │   document_chunks       │      │
│  │  (profiles) │    │             │────│   (向量存储)             │      │
│  └─────────────┘    └─────────────┘    └─────────────────────────┘      │
│         │                  │                                             │
│         │                  │                                             │
│         ▼                  ▼                                             │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────────────────┐      │
│  │  chat_      │    │  prompt_    │    │   template_form_        │      │
│  │  sessions   │    │  templates  │────│   fields                │      │
│  └─────────────┘    └─────────────┘    └─────────────────────────┘      │
│         │                                                                │
│         ▼                                                                │
│  ┌─────────────┐    ┌─────────────┐                                     │
│  │  chat_      │    │  generation_│                                     │
│  │  messages   │    │  history    │                                     │
│  └─────────────┘    └─────────────┘                                     │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

## 详细表结构

### 1. 用户相关表

#### `profiles` - 用户档案表
> 扩展 Supabase Auth 的用户信息

```sql
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('user', 'admin')),
  department TEXT CHECK (department IN ('customer_service', 'sales', 'marketing', 'operations', 'other')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_department ON profiles(department);

-- RLS 策略
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "用户可查看所有档案" ON profiles
  FOR SELECT USING (true);

CREATE POLICY "用户只能更新自己的档案" ON profiles
  FOR UPDATE USING (auth.uid() = id);
```

---

### 2. 知识库文档表

#### `documents` - 文档主表

```sql
CREATE TABLE documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  content TEXT NOT NULL,                    -- 原始文档内容（Markdown）
  content_type TEXT NOT NULL DEFAULT 'markdown'
    CHECK (content_type IN ('markdown', 'pdf', 'word')),

  -- 版本与分类
  software_version TEXT,                    -- 软件版本号，如 'v5.0', 'v5.1'
  category TEXT NOT NULL CHECK (category IN (
    'feature',           -- 功能说明
    'tutorial',          -- 使用教程
    'faq',               -- 常见问题
    'release_note',      -- 版本更新
    'case_study',        -- 成功案例
    'sales_material',    -- 销售资料
    'marketing_material' -- 营销素材
  )),
  tags TEXT[] DEFAULT '{}',                 -- 标签数组，如 ['调色', '婚纱摄影']

  -- 关联媒体资源
  cover_image_url TEXT,                     -- 封面图

  -- 元信息
  is_published BOOLEAN NOT NULL DEFAULT false,
  view_count INTEGER NOT NULL DEFAULT 0,
  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_documents_category ON documents(category);
CREATE INDEX idx_documents_software_version ON documents(software_version);
CREATE INDEX idx_documents_tags ON documents USING GIN(tags);
CREATE INDEX idx_documents_is_published ON documents(is_published);
CREATE INDEX idx_documents_created_at ON documents(created_at DESC);

-- 全文搜索索引
CREATE INDEX idx_documents_fts ON documents
  USING GIN(to_tsvector('chinese', title || ' ' || COALESCE(description, '') || ' ' || content));

-- RLS 策略
ALTER TABLE documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "已发布文档所有人可见" ON documents
  FOR SELECT USING (is_published = true OR auth.uid() IN (
    SELECT id FROM profiles WHERE role = 'admin'
  ));

CREATE POLICY "管理员可管理文档" ON documents
  FOR ALL USING (auth.uid() IN (
    SELECT id FROM profiles WHERE role = 'admin'
  ));
```

#### `document_chunks` - 文档分块向量表
> 用于 RAG 检索，存储文档的分块内容和向量嵌入

```sql
-- 启用 pgvector 扩展
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE document_chunks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,

  chunk_index INTEGER NOT NULL,             -- 分块序号
  content TEXT NOT NULL,                    -- 分块文本内容

  -- 向量嵌入 (OpenAI text-embedding-3-small 输出 1536 维)
  embedding vector(1536),

  -- 分块元信息
  metadata JSONB DEFAULT '{}',              -- 存储额外信息如标题层级、图片URL等
  token_count INTEGER,                      -- Token 数量

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_chunks_document_id ON document_chunks(document_id);
CREATE INDEX idx_chunks_embedding ON document_chunks
  USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);

-- RLS 策略
ALTER TABLE document_chunks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "分块跟随文档权限" ON document_chunks
  FOR SELECT USING (
    document_id IN (SELECT id FROM documents WHERE is_published = true)
    OR auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
  );
```

#### `document_media` - 文档媒体资源表
> 存储文档关联的图片、GIF、视频等

```sql
CREATE TABLE document_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,

  media_type TEXT NOT NULL CHECK (media_type IN ('image', 'gif', 'video')),
  url TEXT NOT NULL,                        -- 存储路径（Supabase Storage）
  alt_text TEXT,                            -- 图片描述

  -- 效果对比图特有字段
  is_comparison BOOLEAN DEFAULT false,      -- 是否为对比图
  before_url TEXT,                          -- Before 图片URL
  after_url TEXT,                           -- After 图片URL

  display_order INTEGER DEFAULT 0,          -- 显示顺序
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_media_document_id ON document_media(document_id);
CREATE INDEX idx_media_is_comparison ON document_media(is_comparison);

-- RLS
ALTER TABLE document_media ENABLE ROW LEVEL SECURITY;

CREATE POLICY "媒体跟随文档权限" ON document_media
  FOR SELECT USING (
    document_id IN (SELECT id FROM documents WHERE is_published = true)
    OR auth.uid() IN (SELECT id FROM profiles WHERE role = 'admin')
  );
```

---

### 3. 提示词模板表（核心：支持动态表单）

#### `prompt_templates` - 提示词模板主表

```sql
CREATE TABLE prompt_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- 基础信息
  name TEXT NOT NULL,                       -- 模板名称，如 "客服快速响应"
  slug TEXT NOT NULL UNIQUE,                -- URL友好标识，如 "customer-service"
  description TEXT,                         -- 模板描述
  icon TEXT,                                -- 图标名称（用于前端展示）

  -- 模板类型与分类
  template_type TEXT NOT NULL CHECK (template_type IN (
    'customer_service',  -- 客服快速响应
    'marketing',         -- 运营推广策划
    'sales',             -- 销售策略定制
    'custom'             -- 自定义模板
  )),

  -- 核心提示词配置
  system_prompt TEXT NOT NULL,              -- 系统提示词
  user_prompt_template TEXT NOT NULL,       -- 用户提示词模板，使用 {{field_name}} 占位符

  -- 输出配置
  output_format JSONB DEFAULT '{}',         -- 输出格式配置
  /*
    示例:
    {
      "sections": [
        {"key": "summary", "title": "功能详解", "type": "markdown"},
        {"key": "script", "title": "标准回复话术", "type": "copyable"},
        {"key": "tips", "title": "注意事项", "type": "list"}
      ]
    }
  */

  -- RAG 检索配置
  retrieval_config JSONB DEFAULT '{
    "top_k": 5,
    "similarity_threshold": 0.7,
    "filter_categories": [],
    "boost_recent_versions": true
  }',

  -- 状态
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER DEFAULT 0,          -- 显示顺序

  created_by UUID REFERENCES profiles(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_templates_slug ON prompt_templates(slug);
CREATE INDEX idx_templates_type ON prompt_templates(template_type);
CREATE INDEX idx_templates_is_active ON prompt_templates(is_active);

-- RLS
ALTER TABLE prompt_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "激活的模板所有登录用户可见" ON prompt_templates
  FOR SELECT USING (is_active = true AND auth.uid() IS NOT NULL);

CREATE POLICY "管理员可管理模板" ON prompt_templates
  FOR ALL USING (auth.uid() IN (
    SELECT id FROM profiles WHERE role = 'admin'
  ));
```

#### `template_form_fields` - 模板表单字段配置表
> **核心设计：支持动态表单配置**

```sql
CREATE TABLE template_form_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES prompt_templates(id) ON DELETE CASCADE,

  -- 字段基础配置
  field_name TEXT NOT NULL,                 -- 字段标识符，用于模板占位符 {{field_name}}
  field_label TEXT NOT NULL,                -- 字段显示标签
  field_type TEXT NOT NULL CHECK (field_type IN (
    'text',              -- 单行文本
    'textarea',          -- 多行文本
    'select',            -- 下拉选择
    'multi_select',      -- 多选
    'radio',             -- 单选按钮
    'checkbox',          -- 复选框
    'number',            -- 数字
    'date'               -- 日期
  )),

  -- 字段验证
  is_required BOOLEAN NOT NULL DEFAULT false,
  placeholder TEXT,                         -- 占位提示文本
  help_text TEXT,                           -- 帮助说明文本
  default_value TEXT,                       -- 默认值

  -- 选项配置（用于 select/multi_select/radio 类型）
  options JSONB,
  /*
    示例:
    [
      {"value": "wedding", "label": "婚纱摄影"},
      {"value": "children", "label": "儿童摄影"},
      {"value": "family", "label": "全家福"},
      {"value": "portrait", "label": "个人写真"},
      {"value": "independent", "label": "独立摄影师"}
    ]
  */

  -- 高级验证规则
  validation_rules JSONB DEFAULT '{}',
  /*
    示例:
    {
      "min_length": 2,
      "max_length": 500,
      "pattern": "^[a-zA-Z0-9]+$",
      "custom_error": "请输入有效的功能名称"
    }
  */

  -- 条件显示（高级功能）
  show_condition JSONB,
  /*
    示例: 当另一个字段为特定值时才显示
    {
      "field": "customer_type",
      "operator": "equals",
      "value": "wedding"
    }
  */

  -- 显示顺序
  display_order INTEGER NOT NULL DEFAULT 0,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE(template_id, field_name)
);

-- 索引
CREATE INDEX idx_form_fields_template_id ON template_form_fields(template_id);
CREATE INDEX idx_form_fields_order ON template_form_fields(template_id, display_order);

-- RLS
ALTER TABLE template_form_fields ENABLE ROW LEVEL SECURITY;

CREATE POLICY "字段跟随模板权限" ON template_form_fields
  FOR SELECT USING (
    template_id IN (SELECT id FROM prompt_templates WHERE is_active = true)
    AND auth.uid() IS NOT NULL
  );

CREATE POLICY "管理员可管理字段" ON template_form_fields
  FOR ALL USING (auth.uid() IN (
    SELECT id FROM profiles WHERE role = 'admin'
  ));
```

---

### 4. 对话与历史记录表

#### `chat_sessions` - 对话会话表

```sql
CREATE TABLE chat_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  title TEXT,                               -- 会话标题（可由AI生成）
  session_type TEXT NOT NULL DEFAULT 'chat' CHECK (session_type IN (
    'chat',              -- 自由问答
    'template'           -- 模板生成
  )),
  template_id UUID REFERENCES prompt_templates(id), -- 如果是模板会话

  -- 会话配置
  context_window JSONB DEFAULT '[]',        -- 上下文窗口中的消息ID

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_sessions_user_id ON chat_sessions(user_id);
CREATE INDEX idx_sessions_created_at ON chat_sessions(created_at DESC);

-- RLS
ALTER TABLE chat_sessions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "用户只能访问自己的会话" ON chat_sessions
  FOR ALL USING (auth.uid() = user_id);
```

#### `chat_messages` - 对话消息表

```sql
CREATE TABLE chat_messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id UUID NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,

  role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content TEXT NOT NULL,                    -- 消息内容（支持Markdown）

  -- AI 响应元信息
  sources JSONB DEFAULT '[]',               -- 引用来源
  /*
    示例:
    [
      {
        "document_id": "uuid",
        "document_title": "V5.2版本功能说明书",
        "chunk_id": "uuid",
        "relevance_score": 0.89,
        "excerpt": "磨皮功能采用AI智能识别..."
      }
    ]
  */

  confidence_score FLOAT,                   -- 置信度分数
  is_fallback BOOLEAN DEFAULT false,        -- 是否为兜底回复（知识库未收录）

  -- Token 统计
  prompt_tokens INTEGER,
  completion_tokens INTEGER,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_messages_session_id ON chat_messages(session_id);
CREATE INDEX idx_messages_created_at ON chat_messages(created_at);

-- RLS
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "消息跟随会话权限" ON chat_messages
  FOR ALL USING (
    session_id IN (SELECT id FROM chat_sessions WHERE user_id = auth.uid())
  );
```

#### `generation_history` - 模板生成历史表

```sql
CREATE TABLE generation_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES prompt_templates(id),

  -- 输入与输出
  input_data JSONB NOT NULL,                -- 用户填写的表单数据
  output_content JSONB NOT NULL,            -- AI 生成的结构化输出
  /*
    示例:
    {
      "sections": {
        "summary": "## 功能详解\n调色功能支持...",
        "script": "尊敬的客户，您好...",
        "tips": ["注意事项1", "注意事项2"]
      }
    }
  */

  -- 引用来源
  sources JSONB DEFAULT '[]',

  -- 用户反馈
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  feedback TEXT,
  is_bookmarked BOOLEAN DEFAULT false,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 索引
CREATE INDEX idx_history_user_id ON generation_history(user_id);
CREATE INDEX idx_history_template_id ON generation_history(template_id);
CREATE INDEX idx_history_is_bookmarked ON generation_history(is_bookmarked);
CREATE INDEX idx_history_created_at ON generation_history(created_at DESC);

-- RLS
ALTER TABLE generation_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "用户只能访问自己的历史" ON generation_history
  FOR ALL USING (auth.uid() = user_id);
```

---

### 5. 辅助函数

#### 向量相似度搜索函数

```sql
-- 创建向量搜索函数
CREATE OR REPLACE FUNCTION search_documents(
  query_embedding vector(1536),
  match_threshold FLOAT DEFAULT 0.7,
  match_count INT DEFAULT 5,
  filter_categories TEXT[] DEFAULT NULL,
  filter_version TEXT DEFAULT NULL
)
RETURNS TABLE (
  chunk_id UUID,
  document_id UUID,
  document_title TEXT,
  chunk_content TEXT,
  chunk_metadata JSONB,
  similarity FLOAT
)
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN QUERY
  SELECT
    dc.id AS chunk_id,
    d.id AS document_id,
    d.title AS document_title,
    dc.content AS chunk_content,
    dc.metadata AS chunk_metadata,
    1 - (dc.embedding <=> query_embedding) AS similarity
  FROM document_chunks dc
  JOIN documents d ON dc.document_id = d.id
  WHERE
    d.is_published = true
    AND 1 - (dc.embedding <=> query_embedding) > match_threshold
    AND (filter_categories IS NULL OR d.category = ANY(filter_categories))
    AND (filter_version IS NULL OR d.software_version = filter_version)
  ORDER BY dc.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;
```

#### 自动更新 updated_at 触发器

```sql
-- 创建更新时间触发器函数
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 为需要的表添加触发器
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_documents_updated_at
  BEFORE UPDATE ON documents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_templates_updated_at
  BEFORE UPDATE ON prompt_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_form_fields_updated_at
  BEFORE UPDATE ON template_form_fields
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_sessions_updated_at
  BEFORE UPDATE ON chat_sessions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

#### 新用户注册时自动创建 Profile

```sql
-- 创建处理新用户的函数
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 在 auth.users 上创建触发器
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();
```

---

## 预置数据示例

### 初始化三个核心模板

```sql
-- 1. 客服快速响应模板
INSERT INTO prompt_templates (name, slug, description, icon, template_type, system_prompt, user_prompt_template, output_format) VALUES (
  '客服快速响应',
  'customer-service',
  '帮助客服快速了解功能详情，并生成标准回复话术',
  'headset',
  'customer_service',
  '你是像素蛋糕产品的专业客服助手。你的任务是：
1. 根据知识库中的信息，准确解答关于产品功能的问题
2. 生成专业、友好的客服回复话术
3. 如果知识库中没有相关信息，明确告知"知识库暂未收录该信息"
4. 所有回答必须基于提供的参考资料，不得编造功能

回答格式要求：
- 功能详解：给客服看的详细说明，帮助理解功能
- 标准回复：可直接发送给用户的专业话术',
  '用户想了解以下功能：{{feature_name}}

用户的具体问题：{{user_question}}

请基于知识库内容，提供：
1. 功能详解（供客服理解）
2. 标准回复话术（可直接发送给用户）',
  '{"sections": [{"key": "detail", "title": "功能详解", "type": "markdown"}, {"key": "reply", "title": "标准回复话术", "type": "copyable"}]}'
);

-- 客服模板的表单字段
INSERT INTO template_form_fields (template_id, field_name, field_label, field_type, is_required, placeholder, display_order) VALUES
((SELECT id FROM prompt_templates WHERE slug = 'customer-service'), 'feature_name', '功能名称/关键词', 'text', true, '如：联机拍摄功能、磨皮、换天空', 1),
((SELECT id FROM prompt_templates WHERE slug = 'customer-service'), 'user_question', '用户具体问题', 'textarea', false, '如：像素蛋糕的联机拍摄是否支持索尼A7M4？', 2);

-- 2. 运营推广策划模板
INSERT INTO prompt_templates (name, slug, description, icon, template_type, system_prompt, user_prompt_template, output_format) VALUES (
  '运营推广策划',
  'marketing',
  '针对特定功能或活动，产出卖点总结与营销文案',
  'megaphone',
  'marketing',
  '你是像素蛋糕产品的资深营销策划专家。你的任务是：
1. 深入分析产品功能的核心卖点和技术优势
2. 结合推广目标，产出有吸引力的营销方案
3. 所有内容必须基于真实的产品功能，不得夸大或编造

输出要求：
- 卖点总结要同时包含功能性卖点和情感化卖点
- 推广场景要具体可执行
- 宣传语要朗朗上口，易于传播',
  '推广功能/核心卖点：{{feature}}
推广活动/背景：{{campaign}}
营销推广目标：{{goal}}

请基于知识库中关于该功能的信息，产出：
1. 全方位卖点总结（功能性卖点+情感化卖点）
2. 适用推广场景
3. 营销宣传语（短句Slogan和长篇种草文案）',
  '{"sections": [{"key": "selling_points", "title": "全方位卖点总结", "type": "markdown"}, {"key": "scenarios", "title": "适用推广场景", "type": "list"}, {"key": "slogans", "title": "营销宣传语", "type": "markdown"}]}'
);

-- 运营模板的表单字段
INSERT INTO template_form_fields (template_id, field_name, field_label, field_type, is_required, placeholder, display_order) VALUES
((SELECT id FROM prompt_templates WHERE slug = 'marketing'), 'feature', '推广功能/核心卖点', 'text', true, '如：调色功能、AI祛路人', 1),
((SELECT id FROM prompt_templates WHERE slug = 'marketing'), 'campaign', '推广活动/背景', 'text', false, '如：双11大促、新品发布', 2),
((SELECT id FROM prompt_templates WHERE slug = 'marketing'), 'goal', '营销推广目标', 'textarea', true, '如：提升用户活跃度、吸引婚纱客户', 3);

-- 3. 销售策略定制模板
INSERT INTO prompt_templates (name, slug, description, icon, template_type, system_prompt, user_prompt_template, output_format) VALUES (
  '销售策略定制',
  'sales',
  '针对不同类型的摄影客户，提供定制化的攻单策略',
  'target',
  'sales',
  '你是像素蛋糕产品的资深销售顾问。你的任务是：
1. 根据客户类型和痛点，推荐最适合的功能组合
2. 提供有针对性的销售话术和攻单策略
3. 所有推荐必须基于真实的产品功能和成功案例

注意事项：
- 话术要直击客户痛点
- 推荐功能要与客户类型高度匹配
- 如有相关成功案例，请引用说明',
  '客户类型：{{customer_type}}
客户关键信息/痛点：{{pain_points}}

请基于知识库内容，提供：
1. 推荐功能组合（针对该客户类型最适合的功能）
2. 核心话术策略（如何直击痛点、打动客户）',
  '{"sections": [{"key": "features", "title": "推荐功能组合", "type": "markdown"}, {"key": "strategy", "title": "核心话术策略", "type": "markdown"}]}'
);

-- 销售模板的表单字段
INSERT INTO template_form_fields (template_id, field_name, field_label, field_type, is_required, placeholder, help_text, options, display_order) VALUES
((SELECT id FROM prompt_templates WHERE slug = 'sales'), 'customer_type', '客户类型', 'select', true, NULL, '选择目标客户的业务类型',
 '[{"value": "wedding", "label": "婚纱影楼"}, {"value": "children", "label": "儿童摄影"}, {"value": "family", "label": "全家福"}, {"value": "portrait", "label": "个人写真"}, {"value": "independent", "label": "独立摄影师"}, {"value": "commercial", "label": "商业摄影"}, {"value": "other", "label": "其他"}]', 1),
((SELECT id FROM prompt_templates WHERE slug = 'sales'), 'pain_points', '客户关键信息/痛点', 'textarea', false, '如：在乎修图效率、对肤色要求高、目前使用竞品A', '描述客户的核心关注点或当前面临的问题', NULL, 2);
```

---

## ER 图

```
┌──────────────┐       ┌──────────────────┐       ┌─────────────────────┐
│   profiles   │       │    documents     │       │  document_chunks    │
├──────────────┤       ├──────────────────┤       ├─────────────────────┤
│ id (PK)      │       │ id (PK)          │       │ id (PK)             │
│ email        │       │ title            │──────▶│ document_id (FK)    │
│ full_name    │       │ content          │       │ chunk_index         │
│ role         │◀──────│ created_by (FK)  │       │ content             │
│ department   │       │ category         │       │ embedding           │
└──────────────┘       │ software_version │       │ metadata            │
       │               │ tags[]           │       └─────────────────────┘
       │               │ is_published     │
       │               └──────────────────┘
       │                        │
       │               ┌────────┴────────┐
       │               ▼                 │
       │       ┌──────────────────┐      │
       │       │  document_media  │      │
       │       ├──────────────────┤      │
       │       │ id (PK)          │      │
       │       │ document_id (FK) │      │
       │       │ media_type       │      │
       │       │ url              │      │
       │       │ is_comparison    │      │
       │       │ before_url       │      │
       │       │ after_url        │      │
       │       └──────────────────┘      │
       │                                 │
       ▼                                 │
┌──────────────┐    ┌──────────────────┐ │   ┌─────────────────────────┐
│chat_sessions │    │ prompt_templates │ │   │ template_form_fields    │
├──────────────┤    ├──────────────────┤ │   ├─────────────────────────┤
│ id (PK)      │    │ id (PK)          │─┼──▶│ id (PK)                 │
│ user_id (FK) │    │ name             │ │   │ template_id (FK)        │
│ title        │    │ slug             │ │   │ field_name              │
│ template_id  │───▶│ system_prompt    │ │   │ field_label             │
│ session_type │    │ user_prompt_tpl  │ │   │ field_type              │
└──────────────┘    │ output_format    │ │   │ is_required             │
       │            │ retrieval_config │ │   │ options                 │
       ▼            └──────────────────┘ │   │ validation_rules        │
┌──────────────┐            │            │   │ show_condition          │
│chat_messages │            │            │   └─────────────────────────┘
├──────────────┤            │            │
│ id (PK)      │            ▼            │
│ session_id   │    ┌──────────────────┐ │
│ role         │    │generation_history│ │
│ content      │    ├──────────────────┤ │
│ sources      │    │ id (PK)          │ │
│ confidence   │    │ user_id (FK)     │◀┘
│ is_fallback  │    │ template_id (FK) │
└──────────────┘    │ input_data       │
                    │ output_content   │
                    │ sources          │
                    │ rating           │
                    │ is_bookmarked    │
                    └──────────────────┘
```

---

## 设计说明

### 1. 动态表单设计亮点

`template_form_fields` 表支持：
- **多种字段类型**：文本、多行文本、下拉选择、多选、单选等
- **灵活的选项配置**：通过 JSONB 存储选项，支持动态增减
- **验证规则**：支持长度限制、正则表达式等验证
- **条件显示**：支持字段间的联动显示逻辑

### 2. 向量搜索优化

- 使用 `pgvector` 扩展存储向量
- 创建 IVFFlat 索引加速相似度搜索
- 提供带过滤条件的搜索函数

### 3. 安全性

- 所有表都启用了 RLS（行级安全）
- 用户只能访问自己的数据
- 管理员有完整的管理权限
