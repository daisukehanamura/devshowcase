import { ICONS, type IconData } from "./icons.generated";

export type SkillCategory =
  | "language"
  | "frontend"
  | "backend"
  | "data"
  | "infra"
  | "tool"
  | "ai";

export const CATEGORY_LABELS: Record<SkillCategory, string> = {
  language: "言語",
  frontend: "フロントエンド",
  backend: "バックエンド",
  data: "データ",
  infra: "インフラ",
  tool: "ツール",
  ai: "AI / 機械学習",
};

export type CatalogEntry = {
  slug: string;
  label: string;
  category: SkillCategory;
  /** 表記ゆれ・略称。検索のヒット率がそのまま入力の楽さになる。 */
  aliases: string[];
};

const entry = (
  slug: string,
  category: SkillCategory,
  aliases: string[] = [],
  label?: string,
): CatalogEntry => ({
  slug,
  label: label ?? ICONS[slug]?.title ?? slug,
  category,
  aliases,
});

export const CATALOG: CatalogEntry[] = [
  entry("typescript", "language", ["ts"]),
  entry("javascript", "language", ["js", "ecmascript"]),
  entry("python", "language", ["py"]),
  entry("go", "language", ["golang"]),
  entry("rust", "language", []),
  entry("ruby", "language", []),
  entry("php", "language", []),
  entry("swift", "language", []),
  entry("kotlin", "language", ["kt"]),
  entry("dart", "language", []),
  entry("elixir", "language", []),
  entry("scala", "language", []),
  entry("c", "language", []),
  entry("cplusplus", "language", ["c++", "cpp"], "C++"),
  entry("sharp", "language", ["c#", "csharp", "cs"], "C#"),
  entry("html5", "language", ["html"], "HTML"),
  entry("css", "language", ["css3"]),

  entry("react", "frontend", []),
  entry("nextdotjs", "frontend", ["next", "nextjs", "next.js"], "Next.js"),
  entry("vuedotjs", "frontend", ["vue", "vuejs"], "Vue.js"),
  entry("nuxt", "frontend", ["nuxtjs"]),
  entry("svelte", "frontend", ["sveltekit"]),
  entry("angular", "frontend", []),
  entry("astro", "frontend", []),
  entry("remix", "frontend", []),
  entry("solid", "frontend", ["solidjs"], "SolidJS"),
  entry("tailwindcss", "frontend", ["tailwind"], "Tailwind CSS"),
  entry("sass", "frontend", ["scss"]),
  entry("vite", "frontend", []),
  entry("webpack", "frontend", []),
  entry("storybook", "frontend", []),

  entry("nodedotjs", "backend", ["node", "nodejs"], "Node.js"),
  entry("deno", "backend", []),
  entry("bun", "backend", []),
  entry("express", "backend", ["expressjs"], "Express"),
  entry("nestjs", "backend", ["nest"], "NestJS"),
  entry("fastapi", "backend", []),
  entry("django", "backend", []),
  entry("flask", "backend", []),
  entry("rubyonrails", "backend", ["rails", "ror"], "Ruby on Rails"),
  entry("laravel", "backend", []),
  entry("spring", "backend", ["springboot", "spring boot"]),
  entry("dotnet", "backend", [".net", "aspnet"], ".NET"),
  entry("graphql", "backend", ["gql"]),
  entry("trpc", "backend", [], "tRPC"),

  entry("postgresql", "data", ["postgres", "psql", "pg"]),
  entry("mysql", "data", []),
  entry("sqlite", "data", []),
  entry("mongodb", "data", ["mongo"]),
  entry("redis", "data", []),
  entry("supabase", "data", []),
  entry("firebase", "data", ["firestore"]),
  entry("prisma", "data", []),
  entry("elasticsearch", "data", ["elastic", "opensearch"]),
  entry("apachekafka", "data", ["kafka"], "Kafka"),
  entry("snowflake", "data", []),
  entry("duckdb", "data", []),
  entry("rabbitmq", "data", ["rabbit"]),

  entry("googlecloud", "infra", ["gcp", "google cloud platform"], "Google Cloud"),
  entry("vercel", "infra", []),
  entry("netlify", "infra", []),
  entry("cloudflare", "infra", ["workers", "cf"]),
  entry("docker", "infra", []),
  entry("kubernetes", "infra", ["k8s"]),
  entry("terraform", "infra", ["iac"]),
  entry("githubactions", "infra", ["gha", "actions"], "GitHub Actions"),
  entry("nginx", "infra", []),
  entry("linux", "infra", ["ubuntu", "debian"]),
  entry("ansible", "infra", []),

  entry("git", "tool", []),
  entry("github", "tool", []),
  entry("gitlab", "tool", []),
  entry("figma", "tool", []),
  entry("jira", "tool", []),
  entry("notion", "tool", []),
  entry("sentry", "tool", []),
  entry("datadog", "tool", []),
  entry("grafana", "tool", []),
  entry("prometheus", "tool", []),
  entry("jest", "tool", []),
  entry("vitest", "tool", []),
  entry("cypress", "tool", []),
  entry("pytest", "tool", []),
  entry("testinglibrary", "tool", ["rtl", "testing library"], "Testing Library"),
  entry("jetbrains", "tool", ["intellij", "webstorm", "pycharm"]),
  entry("androidstudio", "tool", [], "Android Studio"),
  entry("stripe", "tool", []),

  entry("anthropic", "ai", ["claude"]),
  entry("googlegemini", "ai", ["gemini"], "Gemini"),
  entry("mistralai", "ai", ["mistral"], "Mistral AI"),
  entry("ollama", "ai", []),
  entry("huggingface", "ai", ["hf", "transformers"], "Hugging Face"),
  entry("langchain", "ai", []),
  entry("pytorch", "ai", ["torch"]),
  entry("tensorflow", "ai", ["tf"]),
  entry("jupyter", "ai", ["notebook"]),
  entry("pandas", "ai", []),
  entry("numpy", "ai", []),
  entry("scikitlearn", "ai", ["sklearn", "scikit"], "scikit-learn"),
  entry("keras", "ai", []),
];

const BY_SLUG = new Map(CATALOG.map((e) => [e.slug, e]));

export const findEntry = (slug: string): CatalogEntry | undefined => BY_SLUG.get(slug);

export const iconFor = (slug: string): IconData | undefined => ICONS[slug];

const normalize = (s: string) => s.trim().toLowerCase().replace(/[\s._]/g, "");

/**
 * 検索。前方一致を完全一致の次に、部分一致をその次に置く。
 * 「ts」で TypeScript が一番上に来ないと棚卸しのテンポが死ぬので、そこを優先する。
 */
export const searchCatalog = (query: string, limit = 12): CatalogEntry[] => {
  const q = normalize(query);
  if (!q) return CATALOG.slice(0, limit);

  const scored: Array<{ entry: CatalogEntry; score: number }> = [];
  for (const e of CATALOG) {
    const haystacks = [e.label, e.slug, ...e.aliases].map(normalize);
    let best = Infinity;
    for (const h of haystacks) {
      if (h === q) best = Math.min(best, 0);
      else if (h.startsWith(q)) best = Math.min(best, 1);
      else if (h.includes(q)) best = Math.min(best, 2);
    }
    if (best < Infinity) scored.push({ entry: e, score: best });
  }

  return scored
    .sort((a, b) => a.score - b.score || a.entry.label.localeCompare(b.entry.label))
    .slice(0, limit)
    .map((s) => s.entry);
};

/** GitHub の language 名など、外から来た文字列をカタログの slug に寄せる。 */
export const resolveSlug = (name: string): string | null => {
  const n = normalize(name);
  for (const e of CATALOG) {
    if ([e.label, e.slug, ...e.aliases].map(normalize).includes(n)) return e.slug;
  }
  return null;
};
