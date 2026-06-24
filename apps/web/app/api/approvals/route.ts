import { decideApproval, listApprovals } from "@auditflow/db";
import { created, ok } from "@/lib/server/http";
import { toErrorResponse } from "@/lib/server/errors";
import { getRequestContext, isResponse } from "@/lib/server/request-context";
import { readSafeJson } from "@/lib/server/secret-guard";

export async function GET(request: Request) {
  const context = getRequestContext(request);
  if (isResponse(context)) return context;

  try {
    const approvals = await listApprovals(context);
    return ok({
      tenantId: context.tenantId,
      approvals
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
    const approval = await decideApproval(context, {
      approvalId: String(payload.approvalId),
      decision: String(payload.decision ?? "APPROVED") as "APPROVED" | "REJECTED",
      decisionNote: payload.decisionNote ? String(payload.decisionNote) : undefined
    });

    return created({
      tenantId: context.tenantId,
      approval
    });
  } catch (error) {
    return toErrorResponse(error);
  }
}
