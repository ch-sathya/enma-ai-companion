// Each theme overrides a tight set of HSL CSS variables. Values are HSL triplets
// (matching the `hsl(var(--token))` pattern already in index.css). Accent-1/2
// drive the existing --enma-purple/--enma-gold rim and glow hooks.

export type ThemeId =
  | "monochrome"
  | "aurora"
  | "emerald-gold"
  | "inferno"
  | "quantum"
  | "blue-morphosis";

export interface ThemeDef {
  id: ThemeId;
  name: string;
  description: string;
  swatch: string[]; // hex previews
  vars: {
    background: string;
    foreground: string;
    card: string;
    primary: string;
    primaryForeground: string;
    accent1: string; // maps to --enma-purple
    accent1Glow: string;
    accent2: string; // maps to --enma-gold
    accent2Glow: string;
    ring: string;
  };
}

export const THEMES: Record<ThemeId, ThemeDef> = {
  monochrome: {
    id: "monochrome",
    name: "Monochrome",
    description: "Original Enma — pure black & white with katana accents",
    swatch: ["#000000", "#0a0a0a", "#9b72cf", "#d4af37"],
    vars: {
      background: "0 0% 0%",
      foreground: "0 0% 95%",
      card: "0 0% 6%",
      primary: "0 0% 100%",
      primaryForeground: "0 0% 0%",
      accent1: "270 45% 55%",
      accent1Glow: "270 50% 60%",
      accent2: "43 74% 49%",
      accent2Glow: "43 80% 55%",
      ring: "0 0% 100%",
    },
  },
  aurora: {
    id: "aurora",
    name: "Enma Aurora",
    description: "Black, pale green & gold over deep blue glass",
    swatch: ["#04060b", "#9beaa9", "#3b82f6", "#d4af37"],
    vars: {
      background: "222 47% 3%",
      foreground: "140 30% 92%",
      card: "222 40% 7%",
      primary: "138 55% 78%",        // pale green
      primaryForeground: "222 47% 4%",
      accent1: "215 90% 60%",        // bluemorphosis
      accent1Glow: "200 95% 65%",
      accent2: "43 80% 58%",         // gold
      accent2Glow: "43 90% 65%",
      ring: "138 55% 78%",
    },
  },
  "emerald-gold": {
    id: "emerald-gold",
    name: "Emerald Gold",
    description: "Matte black, neon green & soft gold — executive AI OS",
    swatch: ["#000000", "#34d399", "#d4af37", "#0a0a0a"],
    vars: {
      background: "0 0% 2%",
      foreground: "150 30% 92%",
      card: "150 20% 6%",
      primary: "152 76% 55%",
      primaryForeground: "0 0% 4%",
      accent1: "152 76% 50%",
      accent1Glow: "152 90% 60%",
      accent2: "45 80% 55%",
      accent2Glow: "45 90% 62%",
      ring: "152 76% 55%",
    },
  },
  inferno: {
    id: "inferno",
    name: "Inferno Tech",
    description: "Tactical HUD — black, neon green & deep red",
    swatch: ["#000000", "#22c55e", "#dc2626", "#0d0d0d"],
    vars: {
      background: "0 0% 2%",
      foreground: "0 0% 95%",
      card: "0 0% 7%",
      primary: "0 75% 55%",
      primaryForeground: "0 0% 98%",
      accent1: "142 70% 48%",
      accent1Glow: "142 85% 55%",
      accent2: "0 78% 52%",
      accent2Glow: "0 90% 60%",
      ring: "0 75% 55%",
    },
  },
  quantum: {
    id: "quantum",
    name: "Quantum Purple",
    description: "Neural sci-fi — emerald over deep purple gradients",
    swatch: ["#000000", "#7c3aed", "#10b981", "#1a0b2e"],
    vars: {
      background: "265 40% 4%",
      foreground: "270 30% 95%",
      card: "265 35% 9%",
      primary: "265 80% 65%",
      primaryForeground: "0 0% 100%",
      accent1: "265 80% 60%",
      accent1Glow: "275 90% 68%",
      accent2: "160 75% 50%",
      accent2Glow: "160 85% 58%",
      ring: "265 80% 65%",
    },
  },
  "blue-morphosis": {
    id: "blue-morphosis",
    name: "Blue Morphosis",
    description: "Space black with electric blue & cyan glass",
    swatch: ["#020617", "#3b82f6", "#22d3ee", "#0b1228"],
    vars: {
      background: "222 60% 4%",
      foreground: "210 40% 96%",
      card: "222 50% 9%",
      primary: "210 95% 62%",
      primaryForeground: "222 60% 5%",
      accent1: "215 90% 60%",
      accent1Glow: "200 95% 65%",
      accent2: "185 90% 55%",
      accent2Glow: "180 95% 62%",
      ring: "210 95% 62%",
    },
  },
};

export const THEME_LIST = Object.values(THEMES);

export const DEFAULT_THEME: ThemeId = "monochrome";
