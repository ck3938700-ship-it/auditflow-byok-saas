import { getRequestContext, isResponse } from "@/lib/server/request-context";
import { ok } from "@/lib/server/http";

export async function GET(request: Request) {
  const context = getRequestContext(request);
  if (isResponse(context)) return context;

  return ok({
    userId: context.userId,
    tenantId: context.tenantId,
    note: "Phase 1 auth boundary. Replace header-based context with your auth provider."
  });
}

