import { prisma } from "./client";
import { appendAuditLog } from "./audit-log";
import type { TenantContext } from "./tenant";
import type { Citation } from "@auditflow/rag";

export type RetrievalMatch = Citation;

export async function searchDocumentChunks(
  context: TenantContext,
  input: {
    query: string;
    limit?: number;
  }
): Promise<RetrievalMatch[]> {
  const limit = input.limit ?? 5;

  const queryTerms = tokenizeQuery(input.query);
  const chunks = await prisma.documentChunk.findMany({
    where: {
      tenantId: context.tenantId,
      OR: queryTerms.length
        ? queryTerms.map((term) => ({
            content: {
              contains: term,
              mode: "insensitive" as const
            }
          }))
        : [
            {
              content: {
                contains: input.query,
                mode: "insensitive"
              }
            }
          ]
    },
    include: {
      document: true
    }
  });

  const matches = chunks
    .map((chunk) => ({
      documentId: chunk.documentId,
      documentTitle: chunk.document.title,
      chunkIndex: chunk.chunkIndex,
      citationText: chunk.content,
      score: scoreChunk(input.query, chunk.content)
    }))
    .sort((left, right) => right.score - left.score)
    .slice(0, limit);

  await appendAuditLog(context, {
    eventType: "RETRIEVAL_PERFORMED",
    payload: {
      query: input.query,
      matchCount: matches.length,
      matches: matches.map((match) => ({
        documentId: match.documentId,
        chunkIndex: match.chunkIndex,
        score: match.score
      }))
    }
  });

  return matches;
}

function tokenizeQuery(query: string) {
  return Array.from(
    new Set(
      query
        .toLowerCase()
        .split(/[\s,.;:!?，。；：！？、]+/)
        .map((term) => term.trim())
        .filter((term) => term.length >= 2)
    )
  ).slice(0, 8);
}

function scoreChunk(query: string, content: string) {
  const terms = tokenizeQuery(query);
  if (!terms.length) return 0.1;

  const normalized = content.toLowerCase();
  const hits = terms.filter((term) => normalized.includes(term)).length;
  return Number((hits / terms.length).toFixed(3));
}
