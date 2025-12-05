import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * 将文档内容分割成小块
 * @param content 文档内容
 * @param chunkSize 每块的最大字符数
 * @param overlap 块之间的重叠字符数
 * @returns 分割后的内容块数组
 */
export function chunkDocument(
  content: string,
  chunkSize: number = 500,
  overlap: number = 100
): string[] {
  const chunks: string[] = [];

  // 按段落分割
  const paragraphs = content.split(/\n\n+/);
  let currentChunk = "";

  for (const paragraph of paragraphs) {
    const trimmedParagraph = paragraph.trim();
    if (!trimmedParagraph) continue;

    // 如果当前块加上新段落超过限制，保存当前块并开始新块
    if (currentChunk.length + trimmedParagraph.length > chunkSize && currentChunk.length > 0) {
      chunks.push(currentChunk.trim());
      // 保留部分重叠内容
      const words = currentChunk.split(/\s+/);
      const overlapWords = words.slice(-Math.ceil(overlap / 5));
      currentChunk = overlapWords.join(" ") + "\n\n" + trimmedParagraph;
    } else {
      currentChunk += (currentChunk ? "\n\n" : "") + trimmedParagraph;
    }
  }

  // 保存最后一块
  if (currentChunk.trim()) {
    chunks.push(currentChunk.trim());
  }

  // 如果没有分块，返回整个内容
  if (chunks.length === 0 && content.trim()) {
    chunks.push(content.trim());
  }

  return chunks;
}

/**
 * 使用 OpenAI 生成文本的向量嵌入
 * @param text 要嵌入的文本
 * @returns 向量数组
 */
export async function generateEmbedding(text: string): Promise<number[]> {
  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: text,
  });

  return response.data[0].embedding;
}

/**
 * 批量生成向量嵌入
 * @param texts 文本数组
 * @returns 向量数组的数组
 */
export async function generateEmbeddings(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];

  const response = await openai.embeddings.create({
    model: "text-embedding-3-small",
    input: texts,
  });

  return response.data.map((item) => item.embedding);
}

/**
 * 计算文本的 token 数量（近似值）
 * @param text 文本内容
 * @returns token 数量
 */
export function estimateTokenCount(text: string): number {
  // 简单估算：中文约 1 字符 = 1-2 token，英文约 4 字符 = 1 token
  const chineseCount = (text.match(/[\u4e00-\u9fa5]/g) || []).length;
  const otherCount = text.length - chineseCount;
  return Math.ceil(chineseCount * 1.5 + otherCount / 4);
}
