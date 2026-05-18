import { useCallback, useEffect, useState } from "react";
import { DEFAULT_THEME, THEMES, ThemeId } from "@/lib/theme/themes";

const LS_THEME = "enma_theme";
const LS_GLOW = "enma_theme_glow";
const LS_BLUR = "enma_theme_blur";
const EVT = "enma:theme-change";

interface ThemeState {
  theme: ThemeId;
  glow: number; // 0..1
  blur: number; // px
}

const read = (): ThemeState => {
  try {
    return {
      theme: (localStorage.getItem(LS_THEME) as ThemeId) || DEFAULT_THEME,
      glow: Number(localStorage.getItem(LS_GLOW) ?? "0.15"),
      blur: Number(localStorage.getItem(LS_BLUR) ?? "20"),
    };
  } catch {
    return { theme: DEFAULT_THEME, glow: 0.15, blur: 20 };
  }
};

export const applyTheme = ({ theme, glow, blur }: ThemeState) => {
  const def = THEMES[theme] ?? THEMES[DEFAULT_THEME];
  const root = document.documentElement;
  const v = def.vars;

  root.style.setProperty("--background", v.background);
  root.style.setProperty("--foreground", v.foreground);
  root.style.setProperty("--card", v.card);
  root.style.setProperty("--popover", v.card);
  root.style.setProperty("--primary", v.primary);
  root.style.setProperty("--primary-foreground", v.primaryForeground);
  root.style.setProperty("--ring", v.ring);
  root.style.setProperty("--enma-purple", v.accent1);
  root.style.setProperty("--enma-purple-glow", v.accent1Glow);
  root.style.setProperty("--enma-gold", v.accent2);
  root.style.setProperty("--enma-gold-glow", v.accent2Glow);

  root.style.setProperty("--glow-opacity", String(glow));
  root.style.setProperty("--glass-blur", `${blur}px`);
  root.dataset.theme = theme;
};

export const useTheme = () => {
  const [state, setState] = useState<ThemeState>(read);

  useEffect(() => {
    applyTheme(state);
    try {
      localStorage.setItem(LS_THEME, state.theme);
      localStorage.setItem(LS_GLOW, String(state.glow));
      localStorage.setItem(LS_BLUR, String(state.blur));
    } catch {}
    window.dispatchEvent(new CustomEvent(EVT));
  }, [state]);

  useEffect(() => {
    const sync = () => setState(read());
    window.addEventListener(EVT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const setTheme = useCallback((theme: ThemeId) => setState((s) => ({ ...s, theme })), []);
  const setGlow = useCallback((glow: number) => setState((s) => ({ ...s, glow })), []);
  const setBlur = useCallback((blur: number) => setState((s) => ({ ...s, blur })), []);

  return { ...state, setTheme, setGlow, setBlur };
};

// Apply persisted theme as early as possible to avoid flash
export const bootTheme = () => applyTheme(read());
