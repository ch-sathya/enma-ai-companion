// Centralized configuration for demo/cloud mode detection
import { createContext, useContext } from "react";

export type AppMode = "cloud" | "demo";

export interface AppConfig {
  mode: AppMode;
  isDemo: boolean;
  isCloud: boolean;
  features: {
    database: boolean;
    auth: boolean;
    storage: boolean;
    ai: boolean;
    elevenLabs: boolean;
  };
}

const DEMO_MODE_KEY = "enma_demo_mode";
const BACKEND_CHECK_TIMEOUT = 3000;

// Check if demo mode is forced via localStorage
export const isDemoModeForced = (): boolean => {
  try {
    return localStorage.getItem(DEMO_MODE_KEY) === "true";
  } catch {
    return false;
  }
};

// Force demo mode on/off
export const setDemoModeForced = (force: boolean): void => {
  try {
    if (force) {
      localStorage.setItem(DEMO_MODE_KEY, "true");
    } else {
      localStorage.removeItem(DEMO_MODE_KEY);
    }
  } catch {
    // Ignore storage errors
  }
};

// Check if Supabase is configured
export const isSupabaseConfigured = (): boolean => {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
  
  return !!(
    url && 
    key && 
    url !== "" && 
    !url.includes("localhost") &&
    url.startsWith("https://")
  );
};

// Lightweight health check for backend availability
export const checkBackendAvailable = async (): Promise<boolean> => {
  if (!isSupabaseConfigured()) {
    return false;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), BACKEND_CHECK_TIMEOUT);
    
    const response = await fetch(
      `${import.meta.env.VITE_SUPABASE_URL}/rest/v1/`,
      {
        method: "HEAD",
        headers: {
          "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        signal: controller.signal,
      }
    );
    
    clearTimeout(timeoutId);
    return response.ok || response.status === 400; // 400 is OK - means API is responding
  } catch {
    return false;
  }
};

// Determine app mode based on configuration and availability
export const detectAppMode = async (): Promise<AppMode> => {
  // Check if demo mode is forced
  if (isDemoModeForced()) {
    return "demo";
  }

  // Check if backend is configured and available
  const backendAvailable = await checkBackendAvailable();
  
  return backendAvailable ? "cloud" : "demo";
};

// Get config for current mode
export const getAppConfig = (mode: AppMode): AppConfig => {
  const isDemo = mode === "demo";
  
  return {
    mode,
    isDemo,
    isCloud: !isDemo,
    features: {
      database: !isDemo,
      auth: !isDemo,
      storage: !isDemo,
      ai: !isDemo,
      elevenLabs: !isDemo,
    },
  };
};

// React context for app config
export const AppConfigContext = createContext<AppConfig>({
  mode: "demo",
  isDemo: true,
  isCloud: false,
  features: {
    database: false,
    auth: false,
    storage: false,
    ai: false,
    elevenLabs: false,
  },
});

export const useAppConfig = () => useContext(AppConfigContext);
