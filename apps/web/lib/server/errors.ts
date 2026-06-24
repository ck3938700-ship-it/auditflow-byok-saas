export function toErrorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : "Unexpected server error.";
  const isBadRequest =
    message.includes("Provider secrets") ||
    message.includes("required") ||
    message.includes("not found");

  return Response.json(
    {
      error: isBadRequest ? "bad_request" : "server_error",
      message
    },
    {
      status: isBadRequest ? 400 : 500
    }
  );
}

