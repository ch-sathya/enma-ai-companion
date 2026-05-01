import { LLMProvider } from "./types";
import {
  openaiProvider,
  groqProvider,
  openrouterProvider,
  ollamaProvider,
  customProvider,
} from "./openai";
import { anthropicProvider } from "./anthropic";
import { googleProvider } from "./google";

export const PROVIDERS: LLMProvider[] = [
  openaiProvider,
  anthropicProvider,
  googleProvider,
  groqProvider,
  openrouterProvider,
  ollamaProvider,
  customProvider,
];

export const PROVIDER_MAP: Record<string, LLMProvider> = Object.fromEntries(
  PROVIDERS.map((p) => [p.id, p])
);

export const getProvider = (id: string): LLMProvider | undefined => PROVIDER_MAP[id];

export * from "./types";
