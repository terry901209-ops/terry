import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { chunkDocument, generateEmbeddings, estimateTokenCount } from "@/lib/rag/embeddings";
import { Database } from "@/types/database";

const supabase = createClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

// 获取文档列表
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const offset = (page - 1) * limit;

    let query = supabase
      .from("documents")
      .select("*", { count: "exact" })
      .order("created_at", { ascending: false })
      .range(offset, offset + limit - 1);

    if (category) {
      query = query.eq("category", category);
    }

    const { data: documents, count, error } = await query;

    if (error) {
      console.error("Fetch documents error:", error);
      return NextResponse.json(
        { error: "获取文档失败" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      documents,
      total: count,
      page,
      limit,
    });
  } catch (error) {
    console.error("Documents API error:", error);
    return NextResponse.json(
      { error: "服务出错" },
      { status: 500 }
    );
  }
}

// 创建新文档（含自动向量化）
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, content, description, category, tags, software_version, is_published } = body;

    if (!title || !content || !category) {
      return NextResponse.json(
        { error: "请提供标题、内容和分类" },
        { status: 400 }
      );
    }

    // 1. 创建文档
    const { data: document, error: docError } = await supabase
      .from("documents")
      .insert({
        title,
        content,
        description: description || null,
        category,
        tags: tags || [],
        software_version: software_version || null,
        is_published: is_published ?? true,
        content_type: "markdown",
      })
      .select()
      .single();

    if (docError) {
      console.error("Create document error:", docError);
      return NextResponse.json(
        { error: "创建文档失败" },
        { status: 500 }
      );
    }

    // 2. 分块文档内容
    const chunks = chunkDocument(content);

    // 3. 生成向量嵌入
    let embeddings: number[][] = [];
    try {
      embeddings = await generateEmbeddings(chunks);
    } catch (embError) {
      console.error("Embedding generation error:", embError);
      // 向量化失败不影响文档创建，后续可重试
    }

    // 4. 保存文档块和向量
    if (chunks.length > 0) {
      const chunkRecords = chunks.map((chunkContent, index) => ({
        document_id: document.id,
        chunk_index: index,
        content: chunkContent,
        embedding: embeddings[index] || null,
        token_count: estimateTokenCount(chunkContent),
        metadata: {
          title,
          category,
        },
      }));

      const { error: chunkError } = await supabase
        .from("document_chunks")
        .insert(chunkRecords);

      if (chunkError) {
        console.error("Create chunks error:", chunkError);
      }
    }

    return NextResponse.json({
      document,
      chunksCreated: chunks.length,
      vectorized: embeddings.length > 0,
    });
  } catch (error) {
    console.error("Create document error:", error);
    return NextResponse.json(
      { error: "创建文档服务出错" },
      { status: 500 }
    );
  }
}

// 更新文档
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, title, content, description, category, tags, software_version, is_published } = body;

    if (!id) {
      return NextResponse.json(
        { error: "请提供文档 ID" },
        { status: 400 }
      );
    }

    // 1. 更新文档
    const { data: document, error: docError } = await supabase
      .from("documents")
      .update({
        title,
        content,
        description,
        category,
        tags,
        software_version,
        is_published,
        updated_at: new Date().toISOString(),
      })
      .eq("id", id)
      .select()
      .single();

    if (docError) {
      console.error("Update document error:", docError);
      return NextResponse.json(
        { error: "更新文档失败" },
        { status: 500 }
      );
    }

    // 2. 如果内容改变，重新向量化
    if (content) {
      // 删除旧的文档块
      await supabase
        .from("document_chunks")
        .delete()
        .eq("document_id", id);

      // 重新分块和向量化
      const chunks = chunkDocument(content);
      let embeddings: number[][] = [];

      try {
        embeddings = await generateEmbeddings(chunks);
      } catch (embError) {
        console.error("Embedding generation error:", embError);
      }

      if (chunks.length > 0) {
        const chunkRecords = chunks.map((chunkContent, index) => ({
          document_id: id,
          chunk_index: index,
          content: chunkContent,
          embedding: embeddings[index] || null,
          token_count: estimateTokenCount(chunkContent),
          metadata: {
            title: title || document.title,
            category: category || document.category,
          },
        }));

        await supabase.from("document_chunks").insert(chunkRecords);
      }
    }

    return NextResponse.json({ document });
  } catch (error) {
    console.error("Update document error:", error);
    return NextResponse.json(
      { error: "更新文档服务出错" },
      { status: 500 }
    );
  }
}

// 删除文档
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "请提供文档 ID" },
        { status: 400 }
      );
    }

    // 删除文档块（级联删除会自动处理，但我们显式删除以确保）
    await supabase
      .from("document_chunks")
      .delete()
      .eq("document_id", id);

    // 删除文档
    const { error } = await supabase
      .from("documents")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("Delete document error:", error);
      return NextResponse.json(
        { error: "删除文档失败" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Delete document error:", error);
    return NextResponse.json(
      { error: "删除文档服务出错" },
      { status: 500 }
    );
  }
}
