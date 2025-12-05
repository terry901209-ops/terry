import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { generateEmbedding } from "@/lib/rag/embeddings";
import { Database } from "@/types/database";

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export interface SearchResult {
  chunk_id: string;
  document_id: string;
  document_title: string;
  content: string;
  similarity: number;
}

export async function POST(request: NextRequest) {
  try {
    const { query, limit = 5, threshold = 0.5 } = await request.json();

    if (!query || typeof query !== "string") {
      return NextResponse.json(
        { error: "请提供搜索查询" },
        { status: 400 }
      );
    }

    // 生成查询的向量嵌入
    const queryEmbedding = await generateEmbedding(query);

    // 使用 pgvector 进行相似度搜索
    const { data: chunks, error } = await supabase.rpc("match_documents", {
      query_embedding: queryEmbedding,
      match_threshold: threshold,
      match_count: limit,
    });

    if (error) {
      console.error("Vector search error:", error);
      return NextResponse.json(
        { error: "搜索失败" },
        { status: 500 }
      );
    }

    // 获取相关文档的标题
    const documentIds = [...new Set(chunks?.map((c: { document_id: string }) => c.document_id) || [])];

    const { data: documents } = await supabase
      .from("documents")
      .select("id, title")
      .in("id", documentIds);

    const documentTitleMap = new Map(
      documents?.map((d) => [d.id, d.title]) || []
    );

    // 格式化结果
    const results: SearchResult[] = (chunks || []).map((chunk: {
      id: string;
      document_id: string;
      content: string;
      similarity: number;
    }) => ({
      chunk_id: chunk.id,
      document_id: chunk.document_id,
      document_title: documentTitleMap.get(chunk.document_id) || "未知文档",
      content: chunk.content,
      similarity: chunk.similarity,
    }));

    return NextResponse.json({
      results,
      query,
    });
  } catch (error) {
    console.error("Search error:", error);
    return NextResponse.json(
      { error: "搜索服务出错" },
      { status: 500 }
    );
  }
}
