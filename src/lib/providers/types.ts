// LLM provider abstraction - all calls happen directly from browser
export interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string | ContentPart[];
}

export type ContentPart =
  | { type: "text"; text: string }
  | { type: "image_url"; image_url: { url: string } };

export interface StreamChatOptions {
  apiKey: string;
  baseUrl?: string;
  model: string;
  messages: ChatMessage[];
  systemPrompt?: string;
  temperature?: number;
  topP?: number;
  maxTokens?: number;
  signal?: AbortSignal;
  onDelta: (text: string) => void;
}

export interface ProviderConfig {
  apiKey: string;
  baseUrl?: string;
  model: string;
}

export interface LLMProvider {
  id: string;
  name: string;
  description: string;
  defaultBaseUrl: string;
  baseUrlEditable: boolean;
  apiKeyLabel: string;
  apiKeyHint: string;
  apiKeyUrl?: string;
  defaultModels: string[];
  supportsImages: boolean;
  streamChat(opts: StreamChatOptions): Promise<void>;
  testConnection(cfg: ProviderConfig): Promise<{ ok: boolean; error?: string }>;
}
