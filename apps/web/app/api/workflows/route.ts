import { createWorkflow, listWorkflows } from "@auditflow/db";
import { created, ok } from "@/lib/server/http";
import { toErrorResponse } from "@/lib/server/errors";
import { getRequestContext, isResponse } from "@/lib/server/request-context";
import { readSafeJson } from "@/lib/server/secret-guard";
import { parseWorkflowType } from "@/lib/server/workflow-types";

export async function GET(request: Request) {
  const context = getRequestContext(request);
  if (isResponse(context)) return context;

  try {
    const workflows = await listWorkflows(context);
    return ok({ tenantId: context.tenantId, workflows });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function POST(request: Request) {
  const context = getRequestContext(request);
  if (isResponse(context)) return context;

  try {
    const payload = await readSafeJson(request);
    const workflow = await createWorkflow(context, {
      title: String(payload.title ?? "Untitled workflow"),
      type: parseWorkflowType(payload.type),
      input: {
        prompt: String(payload.prompt ?? payload.input ?? ""),
        question: payload.question ? String(payload.question) : undefined
      }
    });

    return created({
      tenantId: context.tenantId,
      workflow
    });
  } catch (error) {
    return toErrorResponse(error);
  }
}
