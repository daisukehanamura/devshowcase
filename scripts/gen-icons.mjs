// 技術ロゴのパスデータを simple-icons から生成する。
// バンドルに 3000 個の SVG を載せたくないので、使うものだけを抜き出して .ts に焼き込む。
// 追加したいときは SLUGS に simple-icons の slug を足して `npm run gen:icons`。
import { writeFileSync } from "node:fs";
import * as si from "simple-icons";

const SLUGS = [
  // languages
  "typescript", "javascript", "python", "go", "rust", "ruby", "php", "swift",
  "kotlin", "dart", "elixir", "scala", "c", "cplusplus", "sharp", "html5", "css",
  // frontend
  "react", "nextdotjs", "vuedotjs", "nuxt", "svelte", "angular", "astro",
  "tailwindcss", "sass", "vite", "webpack", "storybook", "remix", "solid",
  // backend / runtime
  "nodedotjs", "deno", "bun", "express", "nestjs", "fastapi", "django", "flask",
  "rubyonrails", "laravel", "spring", "dotnet", "graphql", "trpc",
  // data
  "postgresql", "mysql", "sqlite", "mongodb", "redis", "supabase", "firebase",
  "prisma", "elasticsearch", "apachekafka", "snowflake", "duckdb",
  // infra / cloud
  "googlecloud", "vercel", "netlify", "cloudflare", "docker", "kubernetes",
  "terraform", "githubactions", "nginx", "linux", "ansible", "rabbitmq",
  // tools
  "git", "github", "gitlab", "figma", "jira", "notion", "sentry", "datadog",
  "grafana", "prometheus", "jest", "vitest", "cypress", "pytest",
  "testinglibrary", "jetbrains", "androidstudio", "stripe",
  // ai / data science
  "anthropic", "googlegemini", "mistralai", "ollama", "huggingface",
  "langchain", "pytorch", "tensorflow", "jupyter", "pandas", "numpy",
  "scikitlearn", "keras",
];

const toKey = (slug) =>
  "si" + slug.replace(/(^|[^a-z0-9])([a-z0-9])/g, (_, __, c) => c.toUpperCase());

const missing = [];
const icons = [];

for (const slug of SLUGS) {
  const icon = si[toKey(slug)];
  if (!icon) {
    missing.push(slug);
    continue;
  }
  const path = icon.svg.match(/ d="([^"]+)"/)?.[1];
  if (!path) {
    missing.push(slug);
    continue;
  }
  icons.push({ slug: icon.slug, title: icon.title, hex: icon.hex, path });
}

if (missing.length) {
  console.warn(`[gen-icons] 見つからなかった slug: ${missing.join(", ")}`);
}

const body = icons
  .map(
    (i) =>
      `  ${JSON.stringify(i.slug)}: { title: ${JSON.stringify(i.title)}, hex: ${JSON.stringify(i.hex)}, path: ${JSON.stringify(i.path)} },`,
  )
  .join("\n");

writeFileSync(
  new URL("../src/lib/skills/icons.generated.ts", import.meta.url),
  `// このファイルは scripts/gen-icons.mjs が生成する。手で編集しない。
export type IconData = { title: string; hex: string; path: string };

export const ICONS: Record<string, IconData> = {
${body}
};
`,
);

console.log(`[gen-icons] ${icons.length} 件のアイコンを書き出した`);
