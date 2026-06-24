export type TextChunk = {
  chunkIndex: number;
  content: string;
  tokenCount: number;
};

export type ChunkOptions = {
  maxChars?: number;
  overlapChars?: number;
};

export function chunkText(text: string, options: ChunkOptions = {}): TextChunk[] {
  const maxChars = options.maxChars ?? 1400;
  const overlapChars = options.overlapChars ?? 160;
  const normalized = normalizeText(text);

  if (!normalized) {
    return [];
  }

  const chunks: TextChunk[] = [];
  let start = 0;

  while (start < normalized.length) {
    const end = findChunkEnd(normalized, start, maxChars);
    const content = normalized.slice(start, end).trim();

    if (content) {
      chunks.push({
        chunkIndex: chunks.length,
        content,
        tokenCount: estimateTokenCount(content)
      });
    }

    if (end >= normalized.length) {
      break;
    }

    start = Math.max(end - overlapChars, start + 1);
  }

  return chunks;
}

export function estimateTokenCount(text: string) {
  return Math.ceil(text.length / 4);
}

function normalizeText(text: string) {
  return text
    .replace(/\r\n/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function findChunkEnd(text: string, start: number, maxChars: number) {
  const hardEnd = Math.min(start + maxChars, text.length);
  const window = text.slice(start, hardEnd);
  const preferredBreaks = ["\n\n", "\n", "。", ".", "；", ";", "，", ","];

  for (const marker of preferredBreaks) {
    const index = window.lastIndexOf(marker);
    if (index > maxChars * 0.55) {
      return start + index + marker.length;
    }
  }

  return hardEnd;
}

