/** GitHub API のレスポンスのうち、この画面で使うところだけ。 */
export type GitHubApiRepo = {
  id: number;
  name: string;
  full_name: string;
  html_url: string;
  description: string | null;
  homepage: string | null;
  language: string | null;
  topics?: string[];
  stargazers_count: number;
  forks_count: number;
  fork: boolean;
  archived: boolean;
  pushed_at: string;
  created_at: string;
  owner: { login: string };
};

export type Repo = {
  id: number;
  name: string;
  fullName: string;
  owner: string;
  url: string;
  description: string;
  homepage: string | null;
  language: string | null;
  topics: string[];
  stars: number;
  forks: number;
  isFork: boolean;
  isArchived: boolean;
  pushedAt: string;
  /** ソート用の内部スコア。表示はしない。 */
  score: number;
};
