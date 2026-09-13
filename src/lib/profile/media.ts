/**
 * ユーザーが貼った URL をどう見せるか決める。
 * 埋め込みは YouTube / Vimeo / 直リンクの mp4 だけ扱い、
 * それ以外は判断せずリンクとして出す（知らない host を iframe に入れたくない）。
 */

export type Video =
  | { kind: "file"; src: string }
  | { kind: "embed"; src: string; title: string }
  | { kind: "link"; src: string };

const YOUTUBE_HOSTS = ["youtube.com", "www.youtube.com", "m.youtube.com", "youtu.be"];
const VIMEO_HOSTS = ["vimeo.com", "www.vimeo.com", "player.vimeo.com"];

const idFromYouTube = (url: URL): string | null => {
  if (url.hostname === "youtu.be") return url.pathname.slice(1) || null;
  if (url.pathname.startsWith("/embed/")) return url.pathname.slice("/embed/".length) || null;
  if (url.pathname.startsWith("/shorts/")) return url.pathname.slice("/shorts/".length) || null;
  return url.searchParams.get("v");
};

const idFromVimeo = (url: URL): string | null => {
  const last = url.pathname.split("/").filter(Boolean).at(-1);
  return last && /^\d+$/.test(last) ? last : null;
};

export const parseVideo = (raw: string | null): Video | null => {
  if (!raw) return null;

  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }
  // http(s) 以外（javascript: など）は受け付けない。
  if (url.protocol !== "https:" && url.protocol !== "http:") return null;

  if (/\.(mp4|webm|mov)$/i.test(url.pathname)) return { kind: "file", src: url.toString() };

  if (YOUTUBE_HOSTS.includes(url.hostname)) {
    const id = idFromYouTube(url);
    if (id) return { kind: "embed", src: `https://www.youtube.com/embed/${id}`, title: "YouTube" };
  }

  if (VIMEO_HOSTS.includes(url.hostname)) {
    const id = idFromVimeo(url);
    if (id) return { kind: "embed", src: `https://player.vimeo.com/video/${id}`, title: "Vimeo" };
  }

  return { kind: "link", src: url.toString() };
};

/** 画像として出して良い URL か。相対パスや javascript: を弾く。 */
export const safeImageUrl = (raw: string | null): string | null => {
  if (!raw) return null;
  try {
    const url = new URL(raw);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : null;
  } catch {
    return null;
  }
};
