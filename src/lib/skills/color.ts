/**
 * ブランドカラーをそのまま使うと、黒に近いロゴ（Rust, Express, Flask など）が
 * ダークテーマで消える。ロゴを「ブランド色で出すか、地の色に任せるか」をここで決める。
 */

/** "3178C6" → [49, 120, 198] */
export const parseHex = (hex: string): [number, number, number] | null => {
  const h = hex.replace(/^#/, "");
  if (!/^[0-9a-fA-F]{6}$/.test(h)) return null;
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16)) as [number, number, number];
};

/** WCAG の相対輝度。0（黒）〜1（白）。 */
export const relativeLuminance = (hex: string): number => {
  const rgb = parseHex(hex);
  if (!rgb) return 0.5;

  const [r, g, b] = rgb.map((v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};

/** 明るすぎ・暗すぎるロゴはテーマ側の文字色に任せる境界。 */
const TOO_DARK = 0.06;
const TOO_LIGHT = 0.85;

/**
 * ブランド色で塗って良いか。
 * 偽なら currentColor に寄せて、テーマに応じた色で出す。
 */
export const isBrandColorUsable = (hex: string): boolean => {
  const l = relativeLuminance(hex);
  return l > TOO_DARK && l < TOO_LIGHT;
};
