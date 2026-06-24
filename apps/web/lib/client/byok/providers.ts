import type { ByokConfig, ChatMessage, LlmCallInput, LlmCallResult } from "./types";

export async function callLlm(
  config: ByokConfig,
  input: LlmCallInput
): Promise<LlmCallResult> {
  if (config.provider === "claude") {
    return callClaude(config, input);
  }

  return callOpenAiCompatible(config, input);
}

export async function testLlmConnection(config: ByokConfig) {
  return callLlm(config, {
    messages: [
      {
        role: "user",
        content: "Return exactly: OK"
      }
    ],
    temperature: 0,
    maxTokens: 16
  });
}

async function callOpenAiCompatible(
  config: ByokConfig,
  input: LlmCallInput
): Promise<LlmCallResult> {
  const baseUrl =
    config.baseUrl ??
    (config.provider === "deepseek"
      ? "https://api.deepseek.com"
      : "https://api.openai.com/v1");

  const endpoint = config.provider === "deepseek" ? `${baseUrl}/chat/completions` : `${baseUrl}/chat/completions`;
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${config.apiKey}`
    },
    body: JSON.stringify({
      model: config.model,
      messages: input.messages,
      temperature: input.temperature ?? 0.2,
      max_tokens: input.maxTokens ?? 1200
    })
  });

  const raw = await response.json();

  if (!response.ok) {
    throw new Error(readProviderError(raw, response.status));
  }

  return {
    provider: config.provider,
    model: config.model,
    output: raw.choices?.[0]?.message?.content ?? "",
    raw
  };
}

async function callClaude(
  config: ByokConfig,
  input: LlmCallInput
): Promise<LlmCallResult> {
  const system = input.messages.find((message) => message.role === "system")?.content;
  const messages = input.messages
    .filter((message) => message.role !== "system")
    .map((message) => ({
      role: message.role === "assistant" ? "assistant" : "user",
      content: message.content
    }));

  const response = await fetch(config.baseUrl ?? "https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": config.apiKey,
      "anthropic-version": "2023-06-01"
    },
    body: JSON.stringify({
      model: config.model,
      system,
      messages,
      temperature: input.temperature ?? 0.2,
      max_tokens: input.maxTokens ?? 1200
    })
  });

  const raw = await response.json();

  if (!response.ok) {
    throw new Error(readProviderError(raw, response.status));
  }

  return {
    provider: config.provider,
    model: config.model,
    output: raw.content?.map((part: { text?: string }) => part.text ?? "").join("") ?? "",
    raw
  };
}

function readProviderError(raw: unknown, status: number) {
  if (raw && typeof raw === "object" && "error" in raw) {
    const error = raw.error as { message?: string };
    return error.message ?? `Provider request failed with status ${status}.`;
  }

  return `Provider request failed with status ${status}.`;
}

