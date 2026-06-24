import { appendAuditLog, listAuditLogs } from "@auditflow/db";
import { created, ok } from "@/lib/server/http";
import { toErrorResponse } from "@/lib/server/errors";
import { getRequestContext, isResponse } from "@/lib/server/request-context";
import { readSafeJson } from "@/lib/server/secret-guard";

export async function GET(request: Request) {
  const context = getRequestContext(request);
  if (isResponse(context)) return context;

  try {
    const auditLogs = await listAuditLogs(context);
    return ok({
      tenantId: context.tenantId,
      auditLogs,
      integrity: {
        mode: "append-only hash chain"
      }
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
    const auditLog = await appendAuditLog(context, {
      eventType: String(payload.eventType ?? "AI_OUTPUT_RECORDED") as "AI_OUTPUT_RECORDED",
      workflowId: payload.workflowId ? String(payload.workflowId) : undefined,
      payload: (payload.payload ?? {}) as never
    });

    return created({
      tenantId: context.tenantId,
      auditLog
    });
  } catch (error) {
    return toErrorResponse(error);
  }
}
