import { motion } from "framer-motion";
import { Check, Palette, Sparkles, Layers } from "lucide-react";
import { THEME_LIST } from "@/lib/theme/themes";
import { useTheme } from "@/hooks/useTheme";

export const ThemePanel = () => {
  const { theme, glow, blur, setTheme, setGlow, setBlur } = useTheme();

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Palette size={14} />
        <span>Appearance</span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {THEME_LIST.map((t) => {
          const active = theme === t.id;
          return (
            <motion.button
              key={t.id}
              onClick={() => setTheme(t.id)}
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.98 }}
              className={`relative text-left p-3 rounded-xl border transition-all ${
                active
                  ? "bg-white/10 border-white/25 shadow-lg"
                  : "bg-white/[0.03] border-white/5 hover:border-white/15"
              }`}
            >
              <div className="flex items-center gap-1.5 mb-2">
                {t.swatch.map((c, i) => (
                  <span
                    key={i}
                    className="w-4 h-4 rounded-full border border-white/10"
                    style={{ background: c }}
                  />
                ))}
                {active && (
                  <Check size={12} className="ml-auto text-foreground" />
                )}
              </div>
              <p className="text-xs font-medium text-foreground truncate">{t.name}</p>
              <p className="text-[10px] text-muted-foreground/70 mt-0.5 line-clamp-2">
                {t.description}
              </p>
            </motion.button>
          );
        })}
      </div>

      <div className="space-y-3 pt-1">
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Sparkles size={12} /> Glow intensity
            </label>
            <span className="text-[10px] tabular-nums text-muted-foreground/70">
              {Math.round(glow * 100)}%
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={0.6}
            step={0.01}
            value={glow}
            onChange={(e) => setGlow(Number(e.target.value))}
            className="w-full accent-foreground"
          />
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Layers size={12} /> Glass blur
            </label>
            <span className="text-[10px] tabular-nums text-muted-foreground/70">
              {blur}px
            </span>
          </div>
          <input
            type="range"
            min={0}
            max={40}
            step={1}
            value={blur}
            onChange={(e) => setBlur(Number(e.target.value))}
            className="w-full accent-foreground"
          />
        </div>
      </div>
    </div>
  );
};
