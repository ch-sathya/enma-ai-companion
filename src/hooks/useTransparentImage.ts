import { useEffect, useMemo, useState } from "react";

type RGB = [number, number, number];

export type TransparentImageOptions = {
  /** Background colors to key out (remove). Defaults to common checkerboard whites. */
  keyColors?: RGB[];
  /** Distance threshold (0-441). Higher removes more. */
  threshold?: number;
  /** Extra range to feather edges for smoother cutouts. */
  feather?: number;
};

const DEFAULT_KEY_COLORS: RGB[] = [
  [245, 245, 245],
  [229, 229, 229],
];

const dist = (r: number, g: number, b: number, c: RGB) => {
  const dr = r - c[0];
  const dg = g - c[1];
  const db = b - c[2];
  return Math.sqrt(dr * dr + dg * dg + db * db);
};

/**
 * Some “background removed” PNGs still have a baked-in checkerboard/white matte.
 * This hook keys those pixels out and returns a data URL with real alpha.
 */
export function useTransparentImage(src: string, options?: TransparentImageOptions) {
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  const opts = useMemo(
    () => ({
      keyColors: options?.keyColors ?? DEFAULT_KEY_COLORS,
      threshold: options?.threshold ?? 28,
      feather: options?.feather ?? 18,
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [JSON.stringify(options)]
  );

  useEffect(() => {
    let cancelled = false;

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.decoding = "async";
    img.src = src;

    img.onload = () => {
      try {
        const canvas = document.createElement("canvas");
        canvas.width = img.naturalWidth || img.width;
        canvas.height = img.naturalHeight || img.height;

        const ctx = canvas.getContext("2d");
        if (!ctx) return;

        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const d = imageData.data;

        const { keyColors, threshold, feather } = opts;
        const soft = Math.max(0, feather);

        for (let i = 0; i < d.length; i += 4) {
          const r = d[i];
          const g = d[i + 1];
          const b = d[i + 2];

          let min = Infinity;
          for (const c of keyColors) min = Math.min(min, dist(r, g, b, c));

          if (min <= threshold) {
            d[i + 3] = 0;
          } else if (soft > 0 && min < threshold + soft) {
            const t = (min - threshold) / soft; // 0..1
            d[i + 3] = Math.round(d[i + 3] * t);
          }
        }

        ctx.putImageData(imageData, 0, 0);
        const url = canvas.toDataURL("image/png");
        if (!cancelled) setDataUrl(url);
      } catch {
        if (!cancelled) setDataUrl(null);
      }
    };

    img.onerror = () => {
      if (!cancelled) setDataUrl(null);
    };

    return () => {
      cancelled = true;
    };
  }, [src, opts]);

  return dataUrl ?? src;
}
