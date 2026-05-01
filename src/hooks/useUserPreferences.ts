import { useState, useCallback, useEffect } from "react";

export interface UserPreferences {
  display_name: string | null;
  voice_enabled: boolean;
  wake_word_enabled: boolean;
  preferred_voice: string;
}

const DEFAULT_PREFERENCES: UserPreferences = {
  display_name: null,
  voice_enabled: false,
  wake_word_enabled: false,
  preferred_voice: "",
};

const STORAGE_KEY = "enma_preferences";

export const useUserPreferences = (_user?: unknown) => {
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setPreferences({ ...DEFAULT_PREFERENCES, ...JSON.parse(stored) });
      }
    } catch {
      // ignore
    }
    setIsLoading(false);
  }, []);

  const savePreferences = useCallback(
    async (updates: Partial<UserPreferences>) => {
      setPreferences((prev) => {
        const next = { ...prev, ...updates };
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        } catch {
          // ignore
        }
        return next;
      });
    },
    []
  );

  const updatePreference = useCallback(
    async <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => {
      await savePreferences({ [key]: value });
    },
    [savePreferences]
  );

  return {
    preferences,
    isLoading,
    savePreferences,
    updatePreference,
    reloadPreferences: () => {},
  };
};
