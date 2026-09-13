import { iconFor } from "@/lib/skills/catalog";
import { isBrandColorUsable } from "@/lib/skills/color";

type Props = {
  slug: string;
  /** 表示名。カタログに無い技術のフォールバックにも使う。 */
  label?: string;
  size?: number;
  className?: string;
  /**
   * すぐ隣に同じ名前の文字が出ているとき用。
   * 読み上げると「Go Go」のように二重になるので、その場合は装飾として扱う。
   */
  decorative?: boolean;
};

/**
 * 技術ロゴ。simple-icons のパスを inline SVG で出す。
 * 画像リクエストを増やさずに済むし、色をテーマに合わせて差し替えられる。
 */
export const TechIcon = ({ slug, label, size = 20, className, decorative = false }: Props) => {
  const icon = iconFor(slug);
  const name = label ?? icon?.title ?? slug;

  // カタログ外の技術は頭文字で代替する。登録を止めないことのほうが大事。
  if (!icon) {
    return (
      <span
        aria-hidden="true"
        className={`inline-flex shrink-0 items-center justify-center rounded-[4px] bg-surface-strong font-semibold text-muted ${className ?? ""}`}
        style={{ width: size, height: size, fontSize: size * 0.55 }}
      >
        {name.slice(0, 1).toUpperCase()}
      </span>
    );
  }

  const brandable = isBrandColorUsable(icon.hex);

  return (
    <svg
      role={decorative ? undefined : "img"}
      aria-hidden={decorative || undefined}
      aria-label={decorative ? undefined : name}
      viewBox="0 0 24 24"
      width={size}
      height={size}
      className={`shrink-0 ${brandable ? "" : "text-foreground"} ${className ?? ""}`}
      // ブランド色が使えるものは currentColor 経由で色を渡す。
      // 使えない（黒/白に寄っている）ものは text-foreground に任せて、テーマ側で反転させる。
      style={brandable ? { color: `#${icon.hex}` } : undefined}
      fill="currentColor"
    >
      <path d={icon.path} />
    </svg>
  );
};
