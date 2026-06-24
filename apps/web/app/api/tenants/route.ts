import { createTenant, listTenantsForUser } from "@auditflow/db";
import { created, ok } from "@/lib/server/http";
import { toErrorResponse } from "@/lib/server/errors";
import { getUserId, isResponse } from "@/lib/server/request-context";
import { readSafeJson } from "@/lib/server/secret-guard";

export async function GET(request: Request) {
  const userId = getUserId(request);
  if (isResponse(userId)) return userId;

  try {
    const tenants = await listTenantsForUser(userId);
    return ok({ tenants });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const payload = await readSafeJson(request);
    const result = await createTenant({
      name: String(payload.name),
      slug: String(payload.slug),
      ownerEmail: String(payload.ownerEmail),
      ownerName: payload.ownerName ? String(payload.ownerName) : undefined
    });

    return created(result);
  } catch (error) {
    return toErrorResponse(error);
  }
}
