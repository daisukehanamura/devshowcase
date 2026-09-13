import { describe, expect, it } from "vitest";
import {
  arrayToLines,
  emptyProfileInput,
  formatTags,
  linesToArray,
  newExperience,
  newId,
  newProject,
  parseTags,
  toProfileInput,
} from "./draft";
import { profileInputSchema } from "./schema";
import { emptyProfile, type Profile } from "./types";

describe("emptyProfileInput", () => {
  it("空欄は null ではなく空文字で持つ", () => {
    const draft = emptyProfileInput();
    expect(draft.location).toBe("");
    expect(draft.links).toEqual({ github: "", x: "", website: "", email: "" });
  });

  it("表示名と slug を埋めれば保存できる", () => {
    const result = profileInputSchema.safeParse({
      ...emptyProfileInput(),
      slug: "hanamaru",
      displayName: "はなまる",
    });

    expect(result.success).toBe(true);
    // 空文字は保存時に null へ寄せる。
    expect(result.success && result.data.location).toBeNull();
    expect(result.success && result.data.links.github).toBeNull();
  });
});

describe("newId", () => {
  it("毎回違う値を返す", () => {
    const ids = new Set(Array.from({ length: 50 }, newId));
    expect(ids.size).toBe(50);
  });
});

describe("newExperience", () => {
  it("開始年月は今月を既定にする", () => {
    expect(newExperience(new Date("2026-09-13T00:00:00Z")).startedAt).toBe("2026-09");
    expect(newExperience(new Date("2026-01-05T00:00:00Z")).startedAt).toBe("2026-01");
  });

  it("追加した直後でもスキーマを通る", () => {
    const draft = { ...emptyProfileInput(), slug: "hanamaru", displayName: "はなまる" };
    const result = profileInputSchema.safeParse({
      ...draft,
      experiences: [{ ...newExperience(), company: "株式会社テスト" }],
      projects: [{ ...newProject(), name: "devshowcase" }],
    });

    expect(result.success).toBe(true);
  });

  it("在籍中（終了年月なし）で始まる", () => {
    expect(newExperience().endedAt).toBeNull();
  });
});

describe("toProfileInput", () => {
  it("null を空文字に開いて編集画面に戻す", () => {
    const profile: Profile = {
      ...emptyProfile("hanamaru"),
      displayName: "はなまる",
      location: null,
      links: { github: "dellgreen", x: null, website: null, email: null },
    };

    const draft = toProfileInput(profile);
    expect(draft.location).toBe("");
    expect(draft.links).toEqual({ github: "dellgreen", x: "", website: "", email: "" });
    expect(draft).not.toHaveProperty("updatedAt");
  });

  it("往復させても中身が変わらない", () => {
    const profile: Profile = {
      ...emptyProfile("hanamaru"),
      displayName: "はなまる",
      headline: "バックエンドエンジニア",
      skills: [{ slug: "go", label: "Go", level: 4, years: 3 }],
    };

    const result = profileInputSchema.safeParse(toProfileInput(profile));
    expect(result.success && result.data.skills).toEqual(profile.skills);
    expect(result.success && result.data.headline).toBe("バックエンドエンジニア");
  });
});

describe("linesToArray", () => {
  it("行に割って空行を落とす", () => {
    expect(linesToArray("設計した\n\n実装した\n")).toEqual(["設計した", "実装した"]);
  });

  it("行頭の箇条書き記号を外す", () => {
    expect(linesToArray("- 設計した\n* 実装した\n・運用した")).toEqual([
      "設計した",
      "実装した",
      "運用した",
    ]);
  });

  it("空文字は空配列", () => {
    expect(linesToArray("")).toEqual([]);
    expect(linesToArray("  \n  ")).toEqual([]);
  });

  it("arrayToLines で戻せる", () => {
    const items = ["設計した", "実装した"];
    expect(linesToArray(arrayToLines(items))).toEqual(items);
  });
});

describe("parseTags", () => {
  it("カンマ・読点・空白のどれでも区切る", () => {
    expect(parseTags("Next.js, TypeScript、Supabase Vercel")).toEqual([
      "Next.js",
      "TypeScript",
      "Supabase",
      "Vercel",
    ]);
  });

  it("重複と空要素を落とす", () => {
    expect(parseTags("go,,go, rust,")).toEqual(["go", "rust"]);
  });

  it("formatTags で戻せる", () => {
    const tags = ["Next.js", "TypeScript"];
    expect(parseTags(formatTags(tags))).toEqual(tags);
  });
});
