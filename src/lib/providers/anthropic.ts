import { LLMProvider, StreamChatOptions, ProviderConfig, ContentPart } from "./types";
import { parseSSEStream } from "./sse";

const BASE = "https://api.anthropic.com/v1";

function toAnthropicContent(content: string | ContentPart[]): any {
  if (typeof content === "string") return content;
  return content.map((p) => {
    if (p.type === "text") return { type: "text", text: p.text };
    // image_url -> Anthropic image format (base64 data URL or URL)
    const url = p.image_url.url;
    if (url.startsWith("data:")) {
      const [meta, data] = url.split(",");
      const mediaType = meta.match(/data:(.*?);base64/)?.[1] || "image/png";
      return {
        type: "image",
        source: { type: "base64", media_type: mediaType, data },
      };
    }
    return { type: "image", source: { type: "url", url } };
  });
}

async function streamAnthropic(opts: StreamChatOptions): Promise<void> {
  const baseUrl = opts.baseUrl || BASE;
  const messages = opts.messages
    .filter((m) => m.role !== "system")
    .map((m) => ({ role: m.role, content: toAnthropicContent(m.content) }));

  const response = await fetch(`${baseUrl.replace(/\/$/, "")}/messages`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": opts.apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: opts.model,
      max_tokens: opts.maxTokens ?? 2048,
      temperature: opts.temperature ?? 0.7,
      top_p: opts.topP ?? 0.9,
      system: opts.systemPrompt,
      messages,
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
      if (parsed.type === "content_block_delta" && parsed.delta?.text) {
        opts.onDelta(parsed.delta.text);
      }
    },
    opts.signal
  );
}

export const anthropicProvider: LLMProvider = {
  id: "anthropic",
  name: "Anthropic Claude",
  description: "Claude 3.5 Sonnet, Haiku, Opus",
  defaultBaseUrl: BASE,
  baseUrlEditable: false,
  apiKeyLabel: "Anthropic API key",
  apiKeyHint: "Starts with sk-ant-…",
  apiKeyUrl: "https://console.anthropic.com/settings/keys",
  defaultModels: [
    "claude-3-5-sonnet-latest",
    "claude-3-5-haiku-latest",
    "claude-3-opus-latest",
  ],
  supportsImages: true,
  streamChat: streamAnthropic,
  async testConnection(cfg: ProviderConfig) {
    try {
      // Anthropic has no public /models; do a tiny ping with messages
      const res = await fetch(`${(cfg.baseUrl || BASE).replace(/\/$/, "")}/messages`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": cfg.apiKey,
          "anthropic-version": "2023-06-01",
          "anthropic-dangerous-direct-browser-access": "true",
        },
        body: JSON.stringify({
          model: cfg.model || "claude-3-5-haiku-latest",
          max_tokens: 1,
          messages: [{ role: "user", content: "hi" }],
        }),
      });
      if (res.ok) return { ok: true };
      const text = await res.text().catch(() => "");
      return { ok: false, error: `${res.status}: ${text.slice(0, 120)}` };
    } catch (e: any) {
      return { ok: false, error: e?.message || "Network error" };
    }
  },
};
