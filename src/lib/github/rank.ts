import type { GitHubApiRepo, Repo } from "./types";

const DAY = 1000 * 60 * 60 * 24;

/**
 * 「見せたい順」を作る。スター数だけで並べると昔の一発屋が上に来てしまうので、
 * スターと直近の活動を混ぜる。fork とアーカイブは沈める。
 */
export const scoreRepo = (repo: GitHubApiRepo, now: Date = new Date()): number => {
  const pushedAt = new Date(repo.pushed_at).getTime();
  // pushed_at が壊れている（古い fork など）ときは新しさの加点を捨てる。
  const daysSincePush = Number.isNaN(pushedAt) ? Infinity : Math.max(0, (now.getTime() - pushedAt) / DAY);

  // スターは効き方が対数的。100 と 120 の差より 0 と 20 の差のほうが大きい。
  const starScore = Math.log10(repo.stargazers_count + 1) * 40;
  // 直近1年を満点に、そこから緩やかに減衰させる。
  const freshness = Math.max(0, 30 - daysSincePush / 24);
  const described = repo.description ? 10 : 0;
  const topicBonus = Math.min((repo.topics?.length ?? 0) * 2, 10);
  const homepageBonus = repo.homepage ? 8 : 0;

  let score = starScore + freshness + described + topicBonus + homepageBonus;
  if (repo.fork) score *= 0.3;
  if (repo.archived) score *= 0.6;

  return Math.round(score * 100) / 100;
};

export const toRepo = (api: GitHubApiRepo, now: Date = new Date()): Repo => ({
  id: api.id,
  name: api.name,
  fullName: api.full_name,
  owner: api.owner?.login ?? api.full_name.split("/")[0],
  url: api.html_url,
  description: api.description ?? "",
  homepage: api.homepage || null,
  language: api.language,
  topics: api.topics ?? [],
  stars: api.stargazers_count,
  forks: api.forks_count,
  isFork: api.fork,
  isArchived: api.archived,
  pushedAt: api.pushed_at,
  score: scoreRepo(api, now),
});

export type RepoFilter = {
  includeForks?: boolean;
  includeArchived?: boolean;
  language?: string | null;
  query?: string;
};

export const filterAndRank = (
  repos: Repo[],
  { includeForks = false, includeArchived = false, language = null, query = "" }: RepoFilter = {},
): Repo[] => {
  const q = query.trim().toLowerCase();
  return repos
    .filter((r) => includeForks || !r.isFork)
    .filter((r) => includeArchived || !r.isArchived)
    .filter((r) => !language || r.language === language)
    .filter(
      (r) =>
        !q ||
        r.name.toLowerCase().includes(q) ||
        r.description.toLowerCase().includes(q) ||
        r.topics.some((t) => t.toLowerCase().includes(q)),
    )
    .sort((a, b) => b.score - a.score || a.name.localeCompare(b.name));
};

/** 言語ごとの件数。フィルタ UI のチップに出す。 */
export const languageBreakdown = (repos: Repo[]): Array<{ language: string; count: number }> => {
  const counts = new Map<string, number>();
  for (const r of repos) {
    if (!r.language) continue;
    counts.set(r.language, (counts.get(r.language) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([language, count]) => ({ language, count }))
    .sort((a, b) => b.count - a.count || a.language.localeCompare(b.language));
};
