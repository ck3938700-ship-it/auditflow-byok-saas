import { unauthorized } from "./http";

export type RequestContext = {
  tenantId: string;
  userId: string;
};

export function getRequestContext(request: Request): RequestContext | Response {
  const tenantId = request.headers.get("x-tenant-id");
  const userId = request.headers.get("x-user-id");

  if (!tenantId || !userId) {
    return unauthorized(
      "Send x-tenant-id and x-user-id headers until the auth provider is wired."
    );
  }

  return {
    tenantId,
    userId
  };
}

export function getUserId(request: Request): string | Response {
  const userId = request.headers.get("x-user-id");

  if (!userId) {
    return unauthorized("Send x-user-id header until the auth provider is wired.");
  }

  return userId;
}

export function isResponse(value: unknown): value is Response {
  return value instanceof Response;
}
