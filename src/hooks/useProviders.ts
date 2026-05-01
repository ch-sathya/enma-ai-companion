import { useState, useEffect, useCallback } from "react";
import { PROVIDERS, getProvider } from "@/lib/providers";

export interface ProviderSettings {
  apiKey: string;
  baseUrl?: string;
  model: string;
}

export interface ProvidersState {
  activeProviderId: string;
  providers: Record<string, ProviderSettings>;
}

const STORAGE_KEY = "enma_providers";

const DEFAULT_STATE: ProvidersState = {
  activeProviderId: "openai",
  providers: {},
};

const load = (): ProvidersState => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return DEFAULT_STATE;
    const parsed = JSON.parse(raw);
    return { ...DEFAULT_STATE, ...parsed };
  } catch {
    return DEFAULT_STATE;
  }
};

const save = (state: ProvidersState) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
};

// Module-level subscribers so all hook instances stay in sync
const listeners = new Set<() => void>();
let cached: ProvidersState | null = null;
const getState = (): ProvidersState => {
  if (!cached) cached = load();
  return cached;
};
const setState = (next: ProvidersState) => {
  cached = next;
  save(next);
  listeners.forEach((l) => l());
};

export const useProviders = () => {
  const [state, setLocal] = useState<ProvidersState>(getState);

  useEffect(() => {
    const l = () => setLocal(getState());
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  }, []);

  const updateProvider = useCallback(
    (providerId: string, updates: Partial<ProviderSettings>) => {
      const current = getState();
      const existing = current.providers[providerId] || {
        apiKey: "",
        model: getProvider(providerId)?.defaultModels[0] || "",
      };
      setState({
        ...current,
        providers: {
          ...current.providers,
          [providerId]: { ...existing, ...updates },
        },
      });
    },
    []
  );

  const setActiveProvider = useCallback((providerId: string) => {
    setState({ ...getState(), activeProviderId: providerId });
  }, []);

  const removeProvider = useCallback((providerId: string) => {
    const current = getState();
    const next = { ...current.providers };
    delete next[providerId];
    setState({ ...current, providers: next });
  }, []);

  const activeProvider = getProvider(state.activeProviderId);
  const activeSettings = state.providers[state.activeProviderId];
  const isConfigured = !!(
    activeProvider &&
    activeSettings?.apiKey &&
    activeSettings?.model
  );
  // Ollama allows empty apiKey
  const isReady = !!(
    activeProvider &&
    activeSettings?.model &&
    (activeSettings.apiKey || activeProvider.id === "ollama")
  );

  return {
    state,
    activeProviderId: state.activeProviderId,
    activeProvider,
    activeSettings,
    isConfigured,
    isReady,
    updateProvider,
    setActiveProvider,
    removeProvider,
    allProviders: PROVIDERS,
  };
};
