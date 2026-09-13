import { toRepo } from "./rank";
import type { GitHubApiRepo, Repo } from "./types";

export class GitHubError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "GitHubError";
  }
}

const API = "https://api.github.com";

const headers = (): HeadersInit => {
  const h: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
  };
  // 未認証だと 60req/h ですぐ枯れるので、置いてあれば使う。
  if (process.env.GITHUB_TOKEN) h.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  return h;
};

export type GitHubUser = {
  login: string;
  name: string | null;
  avatarUrl: string;
  bio: string | null;
  company: string | null;
  location: string | null;
  blog: string | null;
  publicRepos: number;
  followers: number;
};

const request = async <T>(path: string, revalidate: number): Promise<T> => {
  const res = await fetch(`${API}${path}`, {
    headers: headers(),
    next: { revalidate },
  });

  if (res.status === 404) throw new GitHubError("GitHub 上にそのユーザーが見つかりませんでした", 404);
  if (res.status === 403 || res.status === 429) {
    throw new GitHubError("GitHub API のレート制限に達しました。しばらく待ってから再試行してください", 429);
  }
  if (!res.ok) throw new GitHubError(`GitHub API がエラーを返しました (${res.status})`, res.status);

  return (await res.json()) as T;
};

export const fetchUser = async (username: string): Promise<GitHubUser> => {
  const u = await request<{
    login: string;
    name: string | null;
    avatar_url: string;
    bio: string | null;
    company: string | null;
    location: string | null;
    blog: string | null;
    public_repos: number;
    followers: number;
  }>(`/users/${encodeURIComponent(username)}`, 60 * 60);

  return {
    login: u.login,
    name: u.name,
    avatarUrl: u.avatar_url,
    bio: u.bio,
    company: u.company,
    location: u.location,
    blog: u.blog || null,
    publicRepos: u.public_repos,
    followers: u.followers,
  };
};

/** 公開リポジトリを最大 200 件まで。これを超える人は手で pin してもらう想定。 */
export const fetchRepos = async (username: string): Promise<Repo[]> => {
  const pages = await Promise.all(
    [1, 2].map((page) =>
      request<GitHubApiRepo[]>(
        `/users/${encodeURIComponent(username)}/repos?per_page=100&sort=pushed&page=${page}`,
        60 * 30,
      ),
    ),
  );

  const now = new Date();
  return pages.flat().map((r) => toRepo(r, now));
};
