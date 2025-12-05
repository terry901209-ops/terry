import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import OpenAI from "openai";
import { generateEmbedding } from "@/lib/rag/embeddings";
import { Database } from "@/types/database";

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export interface ChatSource {
  document_id: string;
  document_title: string;
  chunk_id: string;
  relevance_score: number;
  excerpt: string;
}

export async function POST(request: NextRequest) {
  try {
    const { message, session_id } = await request.json();

    if (!message || typeof message !== "string") {
      return NextResponse.json(
        { error: "请提供消息内容" },
        { status: 400 }
      );
    }

    // 1. 生成查询向量并搜索相关内容
    let relevantContext = "";
    let sources: ChatSource[] = [];

    try {
      const queryEmbedding = await generateEmbedding(message);

      // 使用 pgvector 进行相似度搜索
      const { data: chunks, error: searchError } = await supabase.rpc(
        "match_documents",
        {
          query_embedding: queryEmbedding,
          match_threshold: 0.5,
          match_count: 5,
        }
      );

      if (!searchError && chunks && chunks.length > 0) {
        // 获取文档标题
        const documentIds = [...new Set(chunks.map((c: { document_id: string }) => c.document_id))];
        const { data: documents } = await supabase
          .from("documents")
          .select("id, title")
          .in("id", documentIds);

        const documentTitleMap = new Map(
          documents?.map((d) => [d.id, d.title]) || []
        );

        // 构建上下文和来源
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

        relevantContext = chunks
          .map((chunk: { content: string }, index: number) => `[文档 ${index + 1}]: ${chunk.content}`)
          .join("\n\n");
      }
    } catch (searchError) {
      console.error("Search error:", searchError);
      // 搜索失败不阻止对话，继续使用基础模型
    }

    // 2. 构建系统提示
    const systemPrompt = `你是像素蛋糕产品知识库的智能助手。像素蛋糕是一款面向商业摄影行业的 AI 图像编辑软件，主要功能包括智能抠图、背景替换、批量处理等。

你的职责是帮助用户解答关于像素蛋糕产品的问题，包括功能介绍、使用教程、常见问题等。

${relevantContext ? `以下是与用户问题相关的知识库内容，请基于这些内容回答问题：

${relevantContext}

请注意：
1. 优先使用上述知识库内容回答问题
2. 如果知识库内容不足以完整回答问题，可以结合你的理解补充
3. 如果问题完全超出知识库范围，请诚实告知用户
4. 回答时保持专业、友好的态度` : `当前知识库中没有找到与问题直接相关的内容。请根据你对像素蛋糕产品的理解尽可能回答，如果不确定请告知用户可以联系客服获取更详细的信息。`}`;

    // 3. 调用 OpenAI API
    const completion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: message },
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    const assistantMessage = completion.choices[0]?.message?.content || "抱歉，我无法生成回复。";

    // 4. 保存对话记录（如果有 session_id）
    if (session_id) {
      await supabase.from("chat_messages").insert([
        {
          session_id,
          role: "user",
          content: message,
        },
        {
          session_id,
          role: "assistant",
          content: assistantMessage,
          sources: sources,
          confidence_score: sources.length > 0 ? sources[0].relevance_score : null,
          prompt_tokens: completion.usage?.prompt_tokens,
          completion_tokens: completion.usage?.completion_tokens,
        },
      ]);
    }

    return NextResponse.json({
      message: assistantMessage,
      sources,
      usage: {
        prompt_tokens: completion.usage?.prompt_tokens,
        completion_tokens: completion.usage?.completion_tokens,
      },
    });
  } catch (error) {
    console.error("Chat API error:", error);
    return NextResponse.json(
      { error: "对话服务出错，请稍后重试" },
      { status: 500 }
    );
  }
}
