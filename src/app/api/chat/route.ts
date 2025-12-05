import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { Database } from "@/types/database";

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// 检查是否为演示模式
const isDemoMode = !process.env.OPENAI_API_KEY ||
  process.env.OPENAI_API_KEY === "your-openai-api-key-here" ||
  process.env.DEMO_MODE === "true";

export interface ChatSource {
  document_id: string;
  document_title: string;
  chunk_id: string;
  relevance_score: number;
  excerpt: string;
}

// 演示模式：基于关键词搜索文档
async function searchByKeyword(query: string): Promise<{
  chunks: Array<{
    id: string;
    document_id: string;
    content: string;
  }>;
  documents: Array<{
    id: string;
    title: string;
  }>;
}> {
  // 提取关键词（简单分词）
  const keywords = query
    .replace(/[？?！!，,。.]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 1);

  // 搜索包含关键词的文档块
  let chunks: Array<{ id: string; document_id: string; content: string }> = [];

  for (const keyword of keywords) {
    const { data } = await supabase
      .from("document_chunks")
      .select("id, document_id, content")
      .ilike("content", `%${keyword}%`)
      .limit(5);

    if (data) {
      chunks = [...chunks, ...data];
    }
  }

  // 去重
  const uniqueChunks = Array.from(
    new Map(chunks.map((c) => [c.id, c])).values()
  ).slice(0, 5);

  // 获取文档标题
  const documentIds = [...new Set(uniqueChunks.map((c) => c.document_id))];
  const { data: documents } = await supabase
    .from("documents")
    .select("id, title")
    .in("id", documentIds);

  return {
    chunks: uniqueChunks,
    documents: documents || [],
  };
}

// 演示模式：生成模拟回复
function generateDemoResponse(
  query: string,
  chunks: Array<{ content: string }>,
  documentTitles: string[]
): string {
  if (chunks.length === 0) {
    return `您好！您询问的是关于"${query}"的问题。

目前知识库中暂时没有找到直接相关的内容。

**温馨提示：**
- 这是演示模式，AI 回复功能需要配置 OpenAI API Key
- 您可以先在「管理后台 → 文档管理」中添加相关文档
- 添加文档后，系统会基于知识库内容为您提供更精准的回答

如需了解更多，请联系客服获取帮助。`;
  }

  // 基于找到的内容生成回复
  const contentSummary = chunks
    .slice(0, 3)
    .map((c, i) => `${i + 1}. ${c.content.substring(0, 150)}...`)
    .join("\n\n");

  return `您好！根据知识库中的相关内容，为您找到以下信息：

**相关文档：** ${documentTitles.join("、")}

**内容摘要：**
${contentSummary}

---
*💡 提示：这是演示模式的模拟回复。配置有效的 OpenAI API Key 后，AI 将基于知识库内容生成更智能、更精准的回答。*`;
}

export async function POST(request: NextRequest) {
  try {
    const { message } = await request.json();

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "请提供消息内容" },
        { status: 400 }
      );
    }

    let sources: ChatSource[] = [];
    let assistantMessage = "";

    if (isDemoMode) {
      // 演示模式：使用关键词搜索
      const { chunks, documents } = await searchByKeyword(message);

      const documentTitleMap = new Map(
        documents.map((d) => [d.id, d.title])
      );

      // 构建来源
      sources = chunks.map((chunk, index) => ({
        document_id: chunk.document_id,
        document_title: documentTitleMap.get(chunk.document_id) || "未知文档",
        chunk_id: chunk.id,
        relevance_score: 0.9 - index * 0.1, // 模拟相关度分数
        excerpt: chunk.content.substring(0, 200) + (chunk.content.length > 200 ? "..." : ""),
      }));

      // 生成演示回复
      const documentTitles = [...new Set(sources.map((s) => s.document_title))];
      assistantMessage = generateDemoResponse(message, chunks, documentTitles);
    } else {
      // 正式模式：使用 OpenAI
      const OpenAI = (await import("openai")).default;
      const { generateEmbedding } = await import("@/lib/rag/embeddings");

      const openai = new OpenAI({
        apiKey: process.env.OPENAI_API_KEY,
      });

      // 向量搜索
      try {
        const queryEmbedding = await generateEmbedding(message);

        const { data: chunks, error: searchError } = await supabase.rpc(
          "match_documents",
          {
            query_embedding: queryEmbedding,
            match_threshold: 0.5,
            match_count: 5,
          }
        );

        if (!searchError && chunks && chunks.length > 0) {
          const documentIds = [...new Set(chunks.map((c: { document_id: string }) => c.document_id))];
          const { data: documents } = await supabase
            .from("documents")
            .select("id, title")
            .in("id", documentIds);

          const documentTitleMap = new Map(
            documents?.map((d) => [d.id, d.title]) || []
          );

          sources = chunks.map((chunk: {
            id: string;
            document_id: string;
            content: string;
            similarity: number;
          }) => ({
            document_id: chunk.document_id,
            document_title: documentTitleMap.get(chunk.document_id) || "未知文档",
            chunk_id: chunk.id,
            relevance_score: chunk.similarity,
            excerpt: chunk.content.substring(0, 200) + (chunk.content.length > 200 ? "..." : ""),
          }));
        }
      } catch (searchError) {
        console.error("Search error:", searchError);
      }

      // 构建系统提示
      const relevantContext = sources
        .map((s, i) => `[文档 ${i + 1}]: ${s.excerpt}`)
        .join("\n\n");

      const systemPrompt = `你是像素蛋糕产品知识库的智能助手。像素蛋糕是一款面向商业摄影行业的 AI 图像编辑软件，主要功能包括智能抠图、背景替换、批量处理等。

${relevantContext ? `以下是与用户问题相关的知识库内容：

${relevantContext}

请基于这些内容回答问题。` : "当前知识库中没有找到直接相关的内容，请根据你的理解回答。"}`;

      // 调用 OpenAI
      const completion = await openai.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: message },
        ],
        temperature: 0.7,
        max_tokens: 1000,
      });

      assistantMessage = completion.choices[0]?.message?.content || "抱歉，我无法生成回复。";
    }

    return NextResponse.json({
      message: assistantMessage,
      sources,
      demoMode: isDemoMode,
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "对话服务出错，请稍后重试" },
      { status: 500 }
    );
  }
}
