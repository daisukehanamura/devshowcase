import { currentYearMonth } from "./career";
import type { ProfileInput } from "./schema";
import type { Profile } from "./types";

/**
 * 編集画面が持つ下書きを作る・変換する道具。
 * 空欄は null ではなく "" で持つ（input の value に null を渡せないので）。
 * "" → null への変換は保存時に zod スキーマがやる。
 */

export type ExperienceDraft = ProfileInput["experiences"][number];
export type ProjectDraft = ProfileInput["projects"][number];

/** 配列要素の React key と、経歴の並び替えに使う識別子。 */
export const newId = (): string =>
  globalThis.crypto?.randomUUID?.() ?? `id-${Math.random().toString(36).slice(2, 10)}`;

export const emptyProfileInput = (): ProfileInput => ({
  slug: "",
  displayName: "",
  headline: "",
  bio: "",
  location: "",
  links: { github: "", x: "", website: "", email: "" },
  skills: [],
  experiences: [],
  projects: [],
  published: false,
});

/** 開始年月は今月を既定にする。空だと必ずエラーになるので、直すほうが速い。 */
export const newExperience = (now: Date = new Date()): ExperienceDraft => ({
  id: newId(),
  company: "",
  role: "",
  startedAt: currentYearMonth(now),
  endedAt: null,
  summary: "",
  highlights: [],
  stack: [],
});

export const newProject = (): ProjectDraft => ({
  id: newId(),
  name: "",
  description: "",
  url: "",
  repo: "",
  imageUrl: "",
  videoUrl: "",
  tags: [],
  featured: false,
});

/** 保存済みのプロフィールを編集画面に戻す。updatedAt はサーバが決めるので落とす。 */
export const toProfileInput = (profile: Profile): ProfileInput => ({
  slug: profile.slug,
  displayName: profile.displayName,
  headline: profile.headline,
  bio: profile.bio,
  location: profile.location ?? "",
  links: {
    github: profile.links.github ?? "",
    x: profile.links.x ?? "",
    website: profile.links.website ?? "",
    email: profile.links.email ?? "",
  },
  skills: profile.skills,
  experiences: profile.experiences,
  projects: profile.projects,
  published: profile.published,
});

/** 複数行のテキスト欄 ↔ 文字列配列。空行は落とす。 */
export const linesToArray = (text: string): string[] =>
  text
    .split("\n")
    .map((line) => line.replace(/^\s*[-*・]\s*/, "").trim())
    .filter(Boolean);

export const arrayToLines = (items: string[]): string => items.join("\n");

/** タグ欄。読点・カンマ・空白のどれで区切っても通す。 */
export const parseTags = (text: string): string[] => {
  const seen = new Set<string>();
  return text
    .split(/[,、\s]+/)
    .map((t) => t.trim())
    .filter((t) => t && !seen.has(t) && (seen.add(t), true));
};

export const formatTags = (tags: string[]): string => tags.join(", ");
