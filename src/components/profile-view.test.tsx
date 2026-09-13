import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { emptyProfile, type Profile } from "@/lib/profile/types";
import { ProfileView } from "./profile-view";

const profile = (over: Partial<Profile> = {}): Profile => ({
  ...emptyProfile("hanamaru"),
  displayName: "はなまる",
  headline: "バックエンドエンジニア",
  ...over,
});

describe("ProfileView", () => {
  it("名前と肩書きを見出しに出す", () => {
    render(<ProfileView profile={profile()} />);
    expect(screen.getByRole("heading", { level: 1, name: "はなまる" })).toBeInTheDocument();
    expect(screen.getByText("バックエンドエンジニア")).toBeInTheDocument();
  });

  it("中身が無いセクションは出さない", () => {
    render(<ProfileView profile={profile()} />);
    expect(screen.queryByRole("heading", { name: "スキル" })).toBeNull();
    expect(screen.queryByRole("heading", { name: "経歴" })).toBeNull();
    expect(screen.queryByRole("heading", { name: "プロジェクト" })).toBeNull();
  });

  it("スキルを分類ごとにまとめ、熟練度と年数を出す", () => {
    render(
      <ProfileView
        profile={profile({
          skills: [
            { slug: "docker", label: "Docker", level: 3, years: 2 },
            { slug: "typescript", label: "TypeScript", level: 5, years: 6 },
            { slug: "社内基盤", label: "社内基盤", level: 4, years: 1 },
          ],
        })}
      />,
    );

    expect(screen.getByRole("heading", { name: "言語" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "インフラ" })).toBeInTheDocument();
    // カタログに無い技術も落とさず「その他」に入れる。
    expect(screen.getByRole("heading", { name: "その他" })).toBeInTheDocument();

    expect(screen.getByLabelText("熟練度 5（チームを牽引できる）")).toBeInTheDocument();
    expect(screen.getByText("6年")).toBeInTheDocument();
  });

  it("経歴は在籍中を先頭に、期間の長さを添えて出す", () => {
    render(
      <ProfileView
        profile={profile({
          experiences: [
            {
              id: "old",
              company: "前職",
              role: "エンジニア",
              startedAt: "2018-04",
              endedAt: "2021-03",
              summary: "受託開発をしていた。",
              highlights: ["管理画面を作った"],
              stack: [],
            },
            {
              id: "now",
              company: "現職",
              role: "テックリード",
              startedAt: "2021-04",
              endedAt: null,
              summary: "",
              highlights: [],
              stack: ["go"],
            },
          ],
        })}
      />,
    );

    const headings = screen.getAllByRole("heading", { level: 3 });
    expect(headings[0]).toHaveTextContent("現職");
    expect(headings[1]).toHaveTextContent("前職");

    expect(screen.getByText(/2018年4月 〜 2021年3月/)).toBeInTheDocument();
    expect(screen.getByText(/3年/)).toBeInTheDocument();
    expect(screen.getByText("管理画面を作った")).toBeInTheDocument();
    // 在籍中は終了年月の代わりに「現在」。
    expect(screen.getByText(/2021年4月 〜 現在/)).toBeInTheDocument();
  });

  it("重なった在籍期間は合算せずマージして実務経験を出す", () => {
    render(
      <ProfileView
        profile={profile({
          experiences: [
            { id: "a", company: "A社", role: "", startedAt: "2020-01", endedAt: "2021-12", summary: "", highlights: [], stack: [] },
            { id: "b", company: "B社（副業）", role: "", startedAt: "2021-01", endedAt: "2022-12", summary: "", highlights: [], stack: [] },
          ],
        })}
      />,
    );

    // 単純合計は 24+24=48ヶ月だが、重なりを除くと 2020-01〜2022-12 の 36ヶ月。
    expect(screen.getByText("3年")).toBeInTheDocument();
  });

  it("一番上に出すプロジェクトを先頭に並べる", () => {
    render(
      <ProfileView
        profile={profile({
          projects: [
            { id: "p1", name: "ふつう", description: "", url: null, repo: null, imageUrl: null, videoUrl: null, tags: [], featured: false },
            { id: "p2", name: "推し", description: "", url: null, repo: null, imageUrl: null, videoUrl: null, tags: ["個人開発"], featured: true },
          ],
        })}
      />,
    );

    const items = within(screen.getByRole("heading", { name: "プロジェクト" }).parentElement!).getAllByRole("listitem");
    expect(items[0]).toHaveTextContent("推し");
    expect(screen.getByText("個人開発")).toBeInTheDocument();
  });

  it("YouTube の URL は埋め込みにする", () => {
    render(
      <ProfileView
        profile={profile({
          projects: [
            { id: "p1", name: "デモ", description: "", url: null, repo: null, imageUrl: null, videoUrl: "https://youtu.be/abc123", tags: [], featured: false },
          ],
        })}
      />,
    );

    const frame = screen.getByTitle("デモ のデモ動画（YouTube）");
    expect(frame).toHaveAttribute("src", "https://www.youtube.com/embed/abc123");
  });

  it("スクリーンショットがあれば画像で出す", () => {
    render(
      <ProfileView
        profile={profile({
          projects: [
            { id: "p1", name: "アプリ", description: "", url: null, repo: null, imageUrl: "https://example.com/s.png", videoUrl: null, tags: [], featured: false },
          ],
        })}
      />,
    );

    expect(screen.getByAltText("アプリ のスクリーンショット")).toHaveAttribute(
      "src",
      "https://example.com/s.png",
    );
  });

  it("リンクは入っているものだけ出す", () => {
    render(
      <ProfileView
        profile={profile({
          links: { github: "dellgreen", x: null, website: null, email: "me@example.com" },
        })}
      />,
    );

    expect(screen.getByRole("link", { name: /GitHub/ })).toHaveAttribute(
      "href",
      "https://github.com/dellgreen",
    );
    expect(screen.getByRole("link", { name: "メール" })).toHaveAttribute(
      "href",
      "mailto:me@example.com",
    );
    expect(screen.queryByRole("link", { name: "X" })).toBeNull();
  });

  it("リポジトリは GitHub の URL に組み立てる", () => {
    render(
      <ProfileView
        profile={profile({
          projects: [
            { id: "p1", name: "アプリ", description: "", url: null, repo: "dellgreen/devshowcase", imageUrl: null, videoUrl: null, tags: [], featured: false },
          ],
        })}
      />,
    );

    expect(screen.getByRole("link", { name: "dellgreen/devshowcase" })).toHaveAttribute(
      "href",
      "https://github.com/dellgreen/devshowcase",
    );
  });
});
