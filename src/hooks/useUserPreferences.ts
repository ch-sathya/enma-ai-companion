import { useState, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";

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
  preferred_voice: "EXAVITQu4vr4xnSDxMaL",
};

// Local storage key for guests
const GUEST_PREFERENCES_KEY = "enma_guest_preferences";

export const useUserPreferences = (user: User | null) => {
  const [preferences, setPreferences] = useState<UserPreferences>(DEFAULT_PREFERENCES);
  const [isLoading, setIsLoading] = useState(true);

  // Load preferences
  const loadPreferences = useCallback(async () => {
    setIsLoading(true);

    if (user) {
      // Load from database for authenticated users
      const { data, error } = await supabase
        .from("profiles")
        .select("display_name, voice_enabled, wake_word_enabled, preferred_voice")
        .eq("user_id", user.id)
        .maybeSingle();

      if (!error && data) {
        setPreferences({
          display_name: data.display_name,
          voice_enabled: data.voice_enabled ?? false,
          wake_word_enabled: data.wake_word_enabled ?? false,
          preferred_voice: data.preferred_voice ?? "EXAVITQu4vr4xnSDxMaL",
        });
      }
    } else {
      // Load from localStorage for guests
      const stored = localStorage.getItem(GUEST_PREFERENCES_KEY);
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setPreferences({ ...DEFAULT_PREFERENCES, ...parsed });
        } catch {
          setPreferences(DEFAULT_PREFERENCES);
        }
      }
    }

    setIsLoading(false);
  }, [user]);

  // Save preferences
  const savePreferences = useCallback(
    async (updates: Partial<UserPreferences>) => {
      const newPreferences = { ...preferences, ...updates };
      setPreferences(newPreferences);

      if (user) {
        // Save to database for authenticated users
        await supabase
          .from("profiles")
          .update({
            display_name: newPreferences.display_name,
            voice_enabled: newPreferences.voice_enabled,
            wake_word_enabled: newPreferences.wake_word_enabled,
            preferred_voice: newPreferences.preferred_voice,
          })
          .eq("user_id", user.id);
      } else {
        // Save to localStorage for guests
        localStorage.setItem(GUEST_PREFERENCES_KEY, JSON.stringify(newPreferences));
      }
    },
    [user, preferences]
  );

  // Update single preference
  const updatePreference = useCallback(
    async <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => {
      await savePreferences({ [key]: value });
    },
    [savePreferences]
  );

  // Load on mount and user change
  useEffect(() => {
    loadPreferences();
  }, [loadPreferences]);

  return {
    preferences,
    isLoading,
    savePreferences,
    updatePreference,
    reloadPreferences: loadPreferences,
  };
};
