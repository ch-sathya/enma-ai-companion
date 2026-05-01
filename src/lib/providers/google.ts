import { LLMProvider, StreamChatOptions, ProviderConfig, ContentPart } from "./types";

const BASE = "https://generativelanguage.googleapis.com/v1beta";

function toGeminiParts(content: string | ContentPart[]): any[] {
  if (typeof content === "string") return [{ text: content }];
  return content.map((p) => {
    if (p.type === "text") return { text: p.text };
    const url = p.image_url.url;
    if (url.startsWith("data:")) {
      const [meta, data] = url.split(",");
      const mimeType = meta.match(/data:(.*?);base64/)?.[1] || "image/png";
      return { inlineData: { mimeType, data } };
    }
    return { fileData: { fileUri: url } };
  });
}

async function streamGoogle(opts: StreamChatOptions): Promise<void> {
  const baseUrl = opts.baseUrl || BASE;
  const url = `${baseUrl.replace(/\/$/, "")}/models/${opts.model}:streamGenerateContent?alt=sse&key=${encodeURIComponent(
    opts.apiKey
  )}`;

  const contents = opts.messages
    .filter((m) => m.role !== "system")
    .map((m) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: toGeminiParts(m.content),
    }));

  const body: any = {
    contents,
    generationConfig: {
      temperature: opts.temperature ?? 0.7,
      topP: opts.topP ?? 0.9,
      maxOutputTokens: opts.maxTokens ?? 2048,
    },
  };
  if (opts.systemPrompt) {
    body.systemInstruction = { parts: [{ text: opts.systemPrompt }] };
  }

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
    signal: opts.signal,
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "");
    throw new Error(`${response.status}: ${text || response.statusText}`);
  }
  if (!response.body) throw new Error("No response body");

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  while (true) {
    if (opts.signal?.aborted) {
      reader.cancel().catch(() => {});
      return;
    }
    const { done, value } = await reader.read();
    if (done) break;
    buf += decoder.decode(value, { stream: true });
    let nl: number;
    while ((nl = buf.indexOf("\n")) !== -1) {
      let line = buf.slice(0, nl);
      buf = buf.slice(nl + 1);
      if (line.endsWith("\r")) line = line.slice(0, -1);
      if (!line.startsWith("data: ")) continue;
      const jsonStr = line.slice(6).trim();
      if (!jsonStr || jsonStr === "[DONE]") continue;
      try {
        const parsed = JSON.parse(jsonStr);
        const parts = parsed.candidates?.[0]?.content?.parts;
        if (parts) {
          for (const p of parts) {
            if (p.text) opts.onDelta(p.text);
          }
        }
      } catch {
        buf = "data: " + jsonStr + "\n" + buf;
        break;
      }
    }
  }
}

export const googleProvider: LLMProvider = {
  id: "google",
  name: "Google Gemini",
  description: "Gemini 2.0 Flash, 1.5 Pro",
  defaultBaseUrl: BASE,
  baseUrlEditable: false,
  apiKeyLabel: "Google AI Studio API key",
  apiKeyHint: "Get a free key from AI Studio",
  apiKeyUrl: "https://aistudio.google.com/app/apikey",
  defaultModels: [
    "gemini-2.0-flash-exp",
    "gemini-1.5-flash",
    "gemini-1.5-flash-8b",
    "gemini-1.5-pro",
  ],
  supportsImages: true,
  streamChat: streamGoogle,
  async testConnection(cfg: ProviderConfig) {
    try {
      const res = await fetch(
        `${(cfg.baseUrl || BASE).replace(/\/$/, "")}/models?key=${encodeURIComponent(cfg.apiKey)}`
      );
      if (res.ok) return { ok: true };
      const text = await res.text().catch(() => "");
      return { ok: false, error: `${res.status}: ${text.slice(0, 120)}` };
    } catch (e: any) {
      return { ok: false, error: e?.message || "Network error" };
    }
  },
};
