import { replaceDocumentChunks } from "@auditflow/db";
import { created } from "@/lib/server/http";
import { toErrorResponse } from "@/lib/server/errors";
import { getRequestContext, isResponse } from "@/lib/server/request-context";
import { readSafeJson } from "@/lib/server/secret-guard";

type RouteContext = {
  params: Promise<{
    documentId: string;
  }>;
};

export async function POST(request: Request, context: RouteContext) {
  const requestContext = getRequestContext(request);
  if (isResponse(requestContext)) return requestContext;

  try {
    const { documentId } = await context.params;
    const payload = await readSafeJson(request);
    const result = await replaceDocumentChunks(requestContext, {
      documentId,
      text: String(payload.text ?? ""),
      options: {
        maxChars: payload.maxChars ? Number(payload.maxChars) : undefined,
        overlapChars: payload.overlapChars ? Number(payload.overlapChars) : undefined
      }
    });

    return created(result);
  } catch (error) {
    return toErrorResponse(error);
  }
}

