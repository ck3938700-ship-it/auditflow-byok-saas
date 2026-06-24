import { searchDocumentChunks } from "@auditflow/db";
import { ok } from "@/lib/server/http";
import { toErrorResponse } from "@/lib/server/errors";
import { getRequestContext, isResponse } from "@/lib/server/request-context";
import { readSafeJson } from "@/lib/server/secret-guard";

export async function POST(request: Request) {
  const context = getRequestContext(request);
  if (isResponse(context)) return context;

  try {
    const payload = await readSafeJson(request);
    const matches = await searchDocumentChunks(context, {
      query: String(payload.query),
      limit: payload.limit ? Number(payload.limit) : undefined
    });

    return ok({
      tenantId: context.tenantId,
      query: payload.query,
      citations: matches,
      note: "Retrieval is backend-owned; LLM prompt construction remains client-owned."
    });
  } catch (error) {
    return toErrorResponse(error);
  }
}
