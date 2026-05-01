// OpenAI + OpenAI-compatible providers (Groq, OpenRouter, Together, LM Studio, Ollama, custom)
import { LLMProvider, StreamChatOptions, ProviderConfig } from "./types";
import { parseSSEStream } from "./sse";

async function streamOpenAICompat(
  baseUrl: string,
  opts: StreamChatOptions,
  extraHeaders: Record<string, string> = {}
): Promise<void> {
  const url = `${baseUrl.replace(/\/$/, "")}/chat/completions`;
  const messages = opts.systemPrompt
    ? [{ role: "system" as const, content: opts.systemPrompt }, ...opts.messages]
    : opts.messages;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${opts.apiKey}`,
      ...extraHeaders,
    },
    body: JSON.stringify({
      model: opts.model,
      messages,
      temperature: opts.temperature ?? 0.7,
      top_p: opts.topP ?? 0.9,
      max_tokens: opts.maxTokens ?? 2048,
      stream: true,
    }),
    signal: opts.signal,
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`${response.status}: ${text || response.statusText}`);
  }

  await parseSSEStream(
    response,
    (jsonStr) => {
      const parsed = JSON.parse(jsonStr);
      const delta = parsed.choices?.[0]?.delta?.content;
      if (delta) opts.onDelta(delta);
    },
    opts.signal
  );
}

async function testOpenAICompat(
  baseUrl: string,
  cfg: ProviderConfig,
  extraHeaders: Record<string, string> = {}
): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await fetch(`${baseUrl.replace(/\/$/, "")}/models`, {
      headers: { Authorization: `Bearer ${cfg.apiKey}`, ...extraHeaders },
    });
    if (res.ok) return { ok: true };
    return { ok: false, error: `${res.status} ${res.statusText}` };
  } catch (e: any) {
    return { ok: false, error: e?.message || "Network error" };
  }
}

export const openaiProvider: LLMProvider = {
  id: "openai",
  name: "OpenAI",
  description: "GPT-4o, GPT-4, GPT-3.5",
  defaultBaseUrl: "https://api.openai.com/v1",
  baseUrlEditable: false,
  apiKeyLabel: "OpenAI API key",
  apiKeyHint: "Starts with sk-…",
  apiKeyUrl: "https://platform.openai.com/api-keys",
  defaultModels: ["gpt-4o-mini", "gpt-4o", "gpt-4-turbo", "gpt-3.5-turbo"],
  supportsImages: true,
  streamChat: (opts) => streamOpenAICompat(opts.baseUrl || "https://api.openai.com/v1", opts),
  testConnection: (cfg) => testOpenAICompat(cfg.baseUrl || "https://api.openai.com/v1", cfg),
};

export const groqProvider: LLMProvider = {
  id: "groq",
  name: "Groq",
  description: "Ultra-fast Llama, Mixtral, Gemma",
  defaultBaseUrl: "https://api.groq.com/openai/v1",
  baseUrlEditable: false,
  apiKeyLabel: "Groq API key",
  apiKeyHint: "Starts with gsk_…",
  apiKeyUrl: "https://console.groq.com/keys",
  defaultModels: [
    "llama-3.3-70b-versatile",
    "llama-3.1-8b-instant",
    "mixtral-8x7b-32768",
    "gemma2-9b-it",
  ],
  supportsImages: false,
  streamChat: (opts) => streamOpenAICompat(opts.baseUrl || "https://api.groq.com/openai/v1", opts),
  testConnection: (cfg) => testOpenAICompat(cfg.baseUrl || "https://api.groq.com/openai/v1", cfg),
};

export const openrouterProvider: LLMProvider = {
  id: "openrouter",
  name: "OpenRouter",
  description: "Access 200+ models with one key",
  defaultBaseUrl: "https://openrouter.ai/api/v1",
  baseUrlEditable: false,
  apiKeyLabel: "OpenRouter API key",
  apiKeyHint: "Starts with sk-or-…",
  apiKeyUrl: "https://openrouter.ai/keys",
  defaultModels: [
    "anthropic/claude-3.5-sonnet",
    "openai/gpt-4o-mini",
    "google/gemini-2.0-flash-exp:free",
    "meta-llama/llama-3.3-70b-instruct",
    "mistralai/mistral-nemo:free",
  ],
  supportsImages: true,
  streamChat: (opts) =>
    streamOpenAICompat(opts.baseUrl || "https://openrouter.ai/api/v1", opts, {
      "HTTP-Referer": typeof window !== "undefined" ? window.location.origin : "",
      "X-Title": "Enma",
    }),
  testConnection: (cfg) =>
    testOpenAICompat(cfg.baseUrl || "https://openrouter.ai/api/v1", cfg),
};

export const ollamaProvider: LLMProvider = {
  id: "ollama",
  name: "Ollama (local)",
  description: "Run models locally on your machine",
  defaultBaseUrl: "http://localhost:11434/v1",
  baseUrlEditable: true,
  apiKeyLabel: "API key (optional)",
  apiKeyHint: "Leave 'ollama' if unset",
  apiKeyUrl: "https://ollama.com/download",
  defaultModels: ["llama3.2", "llama3.1", "qwen2.5", "mistral", "phi3"],
  supportsImages: false,
  streamChat: (opts) =>
    streamOpenAICompat(opts.baseUrl || "http://localhost:11434/v1", {
      ...opts,
      apiKey: opts.apiKey || "ollama",
    }),
  testConnection: (cfg) =>
    testOpenAICompat(cfg.baseUrl || "http://localhost:11434/v1", {
      ...cfg,
      apiKey: cfg.apiKey || "ollama",
    }),
};

export const customProvider: LLMProvider = {
  id: "custom",
  name: "Custom (OpenAI-compatible)",
  description: "Any OpenAI-compatible endpoint",
  defaultBaseUrl: "https://api.example.com/v1",
  baseUrlEditable: true,
  apiKeyLabel: "API key",
  apiKeyHint: "Your provider's key",
  defaultModels: [],
  supportsImages: true,
  streamChat: (opts) => streamOpenAICompat(opts.baseUrl || "", opts),
  testConnection: (cfg) => testOpenAICompat(cfg.baseUrl || "", cfg),
};
