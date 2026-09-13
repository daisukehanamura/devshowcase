export type SkillLevel = 1 | 2 | 3 | 4 | 5;

/** 技術スタック1件。slug は simple-icons の slug に揃えてロゴを引く。 */
export type Skill = {
  slug: string;
  /** カタログに無い技術も登録できるので、表示名は自前で持つ。 */
  label: string;
  level: SkillLevel;
  /** 経験年数。0.5 刻みくらいの想定。 */
  years: number;
};

export type Experience = {
  id: string;
  company: string;
  role: string;
  /** YYYY-MM */
  startedAt: string;
  /** YYYY-MM。在籍中なら null。 */
  endedAt: string | null;
  summary: string;
  highlights: string[];
  /** この経験で使った技術の slug。 */
  stack: string[];
};

export type Project = {
  id: string;
  name: string;
  description: string;
  /** デモやサービスの URL。 */
  url: string | null;
  /** owner/repo 形式。GitHub から引っ張ってきたものはここが埋まる。 */
  repo: string | null;
  /** OGP 用のスクショなど。 */
  imageUrl: string | null;
  /** デモ動画。mp4 か YouTube/Vimeo の URL。 */
  videoUrl: string | null;
  tags: string[];
  featured: boolean;
};

export type Links = {
  github: string | null;
  x: string | null;
  website: string | null;
  email: string | null;
};

export type Profile = {
  slug: string;
  displayName: string;
  headline: string;
  bio: string;
  location: string | null;
  links: Links;
  skills: Skill[];
  experiences: Experience[];
  projects: Project[];
  published: boolean;
  updatedAt: string;
};

export const emptyProfile = (slug = ""): Profile => ({
  slug,
  displayName: "",
  headline: "",
  bio: "",
  location: null,
  links: { github: null, x: null, website: null, email: null },
  skills: [],
  experiences: [],
  projects: [],
  published: false,
  updatedAt: new Date(0).toISOString(),
});
