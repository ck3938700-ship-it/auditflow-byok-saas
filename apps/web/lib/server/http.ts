import { toJsonSafe } from "./json";

export function ok<T>(data: T, init?: ResponseInit) {
  return Response.json(toJsonSafe(data), {
    status: 200,
    ...init
  });
}

export function created<T>(data: T) {
  return Response.json(toJsonSafe(data), {
    status: 201
  });
}

export function badRequest(message: string) {
  return Response.json(
    {
      error: "bad_request",
      message
    },
    {
      status: 400
    }
  );
}

export function unauthorized(message = "Authentication is required.") {
  return Response.json(
    {
      error: "unauthorized",
      message
    },
    {
      status: 401
    }
  );
}
