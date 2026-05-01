# Make Enma Fully Standalone & Multi-LLM

Transform Enma into an elegant, Claude-style chat app that runs **100% in the browser** with **no backend required**, while letting users plug in **any LLM provider** they choose (OpenAI, Anthropic, Google, Groq, OpenRouter, Ollama, custom endpoints).

## Goals

1. **Zero-backend by default** — install, open, use. No Supabase, no edge functions required.
2. **Bring-your-own LLM** — user pastes their own API key, picks any provider, app talks directly to it from the browser.
3. **Elegant UX** like Claude/ChatGPT — clean chat surface, smooth streaming, polished onboarding.
4. **Fully customizable** — provider, model, system prompt, temperature, theme, name.
5. **Privacy first** — keys + conversations stored locally in the browser only.

## What changes

### 1. New "Provider" system (replaces Lovable AI lock-in)

Create `src/lib/providers/` with a small adapter pattern:

```text
src/lib/providers/
  types.ts           // LLMProvider interface, Message type
  openai.ts          // OpenAI + any OpenAI-compatible (Groq, OpenRouter, Together, LM Studio, Ollama)
  anthropic.ts       // Claude (direct browser call w/ anthropic-dangerous-direct-browser-access)
  google.ts          // Gemini via generativelanguage.googleapis.com
  index.ts           // registry + factory
```

Each adapter exposes:
- `streamChat({ apiKey, baseUrl, model, messages, systemPrompt, temperature, topP, maxTokens, signal, onDelta })`
- `listModels?(apiKey, baseUrl)` — optional, for providers that expose `/models`

All calls happen **directly from the browser** (no edge function), using `fetch` with SSE parsing (reuse the existing line-by-line parser already in `useChat.ts`).

### 2. Settings: API Keys & Providers

New `src/components/ProviderSettings.tsx` opened from the gear icon:
- Provider dropdown: OpenAI, Anthropic, Google Gemini, Groq, OpenRouter, Ollama, Custom (OpenAI-compatible)
- API key input (password field, toggleable visibility)
- Optional Base URL (for Ollama / custom / proxies)
- Model picker (free-text + suggested list per provider; auto-fetch from `/models` when supported)
- "Test connection" button
- Per-provider keys persisted in `localStorage` under `enma_providers`
- Clear "Your key never leaves this device" copy

### 3. Rip out the cloud/demo split

The current dual-mode (cloud vs demo) adds complexity. Replace with one unified local mode:
- Delete: `useChatWrapper`, `useConversationsWrapper`, `useVoiceWrapper`, `useChat` (Supabase), `useConversations` (Supabase), `AppConfigProvider`, `ModeIndicator`, `useElevenLabsVoice`, `AuthModal`.
- Keep & promote: `useLocalChat`, `useLocalConversations`, `useVoice` (Web Speech API).
- Rewrite `useLocalChat` to call the selected provider adapter (real LLM) instead of `mockChat`. Keep `mockChat` only as fallback when **no key is configured** ("Demo" badge in input area).
- `Chat.tsx` simplified — no `user`, no auth modal, no mode indicator, no Supabase imports.

### 4. Onboarding flow (Claude-style)

First launch with no key configured:
- Landing/Chat shows a centered card: "Welcome to Enma — connect a model to begin"
- Buttons: "Use OpenAI", "Use Claude", "Use Gemini", "Try without a key (demo)"
- Selecting a provider opens the Provider Settings modal pre-filled
- Once a key is saved, normal chat UI takes over

### 5. Conversation features (already mostly there, polish them)

- Local conversations sidebar (already works via `useLocalConversations`)
- Rename / delete / pin conversations
- Export all data as JSON; import JSON (backup/restore)
- Clear-all-data button in settings

### 6. Customization

- Theme: keep monochrome glass, but add an accent picker (purple/gold/blue/green) writing to CSS vars in `index.css`
- Custom system prompt textarea per persona + a "Custom" persona slot users can edit
- Display name (already in `useUserPreferences`, move to localStorage)

### 7. Attachments

Drop Supabase Storage. For images: convert to base64 data URL in-browser and send as `image_url` content part (works with OpenAI, Anthropic, Gemini multimodal). Cap at ~4 MB with a friendly warning.

### 8. Voice

Keep `useVoice` (Web Speech API) only. Remove ElevenLabs path entirely.

### 9. Cleanup

- Remove Supabase client imports from app code (file `src/integrations/supabase/client.ts` stays — it's auto-generated — but nothing imports it).
- Remove `supabase/functions/chat` and `elevenlabs-scribe-token` references from frontend.
- Keep `supabase/config.toml` as-is (auto-managed).
- Update `README.md` with the new "no backend, BYO key" story.

## Technical details

**Provider adapter shape**

```text
interface LLMProvider {
  id: string;
  name: string;
  defaultBaseUrl: string;
  defaultModels: string[];
  supportsImages: boolean;
  streamChat(opts): Promise<void>;
  listModels?(opts): Promise<string[]>;
}
```

**Storage keys (all localStorage)**
- `enma_providers` → `{ activeProviderId, providers: { [id]: { apiKey, baseUrl, model } } }`
- `enma_conversations` → existing
- `enma_messages_<convId>` → existing
- `enma_preferences` → name, accent, voice settings
- `enma_chat_settings` → temperature, topP, maxTokens, personaId

**CORS notes**
- OpenAI, Anthropic (with `anthropic-dangerous-direct-browser-access: true` header), Google Gemini, Groq, OpenRouter, Ollama (localhost) all allow direct browser calls. Documented in the settings UI.

**Fallback / Demo**
- If no key for active provider → `mockChat` streams a friendly prompt explaining how to add a key, with a CTA button opening Provider Settings.

## Out of scope
- Server-side proxy (not needed; user keys stay in browser)
- Multi-user / sync across devices (intentionally local-only; export/import covers backup)
- Function/tool calling, RAG, agent loops

## Result

A self-contained, elegant chat client that:
- Runs offline-first from any static host (or Capacitor)
- Works with any modern LLM via the user's own key
- Has no Lovable Cloud / Supabase / ElevenLabs runtime dependency
- Keeps the existing premium monochrome glass aesthetic
