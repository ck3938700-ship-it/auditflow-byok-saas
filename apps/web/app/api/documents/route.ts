import { createDocumentMetadata, listDocuments } from "@auditflow/db";
import { created, ok } from "@/lib/server/http";
import { toErrorResponse } from "@/lib/server/errors";
import { getRequestContext, isResponse } from "@/lib/server/request-context";
import { readSafeJson } from "@/lib/server/secret-guard";

export async function GET(request: Request) {
  const context = getRequestContext(request);
  if (isResponse(context)) return context;

  try {
    const documents = await listDocuments(context);
    return ok({
      tenantId: context.tenantId,
      documents,
      storage: "R2/S3 metadata only in DB; file bytes live in object storage."
    });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function POST(request: Request) {
  const context = getRequestContext(request);
  if (isResponse(context)) return context;

  try {
    const payload = await readSafeJson(request);
    const document = await createDocumentMetadata(context, {
      title: String(payload.title),
      sourceType: String(payload.sourceType ?? "upload"),
      storageKey: String(payload.storageKey),
      mimeType: String(payload.mimeType),
      sizeBytes: BigInt(String(payload.sizeBytes ?? 0)),
      checksumSha256: String(payload.checksumSha256),
      metadata: typeof payload.metadata === "object" ? payload.metadata : undefined
    });

    return created({
      tenantId: context.tenantId,
      document
    });
  } catch (error) {
    return toErrorResponse(error);
  }
}
