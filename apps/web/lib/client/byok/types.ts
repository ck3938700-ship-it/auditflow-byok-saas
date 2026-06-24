export type LlmProvider = "openai" | "deepseek" | "claude";

export type ByokConfig = {
  provider: LlmProvider;
  model: string;
  apiKey: string;
  baseUrl?: string;
};

export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

export type LlmCallInput = {
  messages: ChatMessage[];
  temperature?: number;
  maxTokens?: number;
};

export type LlmCallResult = {
  provider: LlmProvider;
  model: string;
  output: string;
  raw: unknown;
};

export const defaultModels: Record<LlmProvider, string> = {
  openai: "gpt-4o-mini",
  deepseek: "deepseek-chat",
  claude: "claude-3-5-sonnet-latest"
};

