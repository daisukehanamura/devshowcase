import { describe, expect, it } from "vitest";
import {
  experienceMonths,
  formatDuration,
  formatYearMonth,
  sortExperiences,
  sortSkills,
  totalCareerMonths,
} from "./career";
import type { Experience, Skill } from "./types";

const exp = (startedAt: string, endedAt: string | null, company = "c"): Experience => ({
  id: `${company}-${startedAt}`,
  company,
  role: "エンジニア",
  startedAt,
  endedAt,
  summary: "",
  highlights: [],
  stack: [],
});

const NOW = new Date("2026-09-13T00:00:00Z");

describe("experienceMonths", () => {
  it("終了月も在籍期間に数える", () => {
    expect(experienceMonths(exp("2020-01", "2020-12"), NOW)).toBe(12);
  });

  it("同じ月の入退社は1ヶ月", () => {
    expect(experienceMonths(exp("2020-04", "2020-04"), NOW)).toBe(1);
  });

  it("在籍中は現在月までを数える", () => {
    expect(experienceMonths(exp("2026-01", null), NOW)).toBe(9);
  });
});

describe("formatDuration", () => {
  it.each([
    [0, "0ヶ月"],
    [5, "5ヶ月"],
    [12, "1年"],
    [24, "2年"],
    [38, "3年2ヶ月"],
  ])("%i ヶ月 → %s", (months, expected) => {
    expect(formatDuration(months)).toBe(expected);
  });
});

describe("totalCareerMonths", () => {
  it("経歴が無ければ0", () => {
    expect(totalCareerMonths([], NOW)).toBe(0);
  });

  it("連続した経歴を合算する", () => {
    const months = totalCareerMonths([exp("2020-01", "2021-12", "a"), exp("2022-01", "2022-12", "b")], NOW);
    expect(months).toBe(36);
  });

  it("副業などで期間が重なっても二重に数えない", () => {
    const months = totalCareerMonths([exp("2020-01", "2021-12", "a"), exp("2021-01", "2021-06", "b")], NOW);
    expect(months).toBe(24);
  });

  it("空白期間は加算しない", () => {
    const months = totalCareerMonths([exp("2020-01", "2020-06", "a"), exp("2021-01", "2021-06", "b")], NOW);
    expect(months).toBe(12);
  });

  it("在籍中の経歴は現在月までを数える", () => {
    expect(totalCareerMonths([exp("2026-07", null)], NOW)).toBe(3);
  });
});

describe("sortExperiences", () => {
  it("在籍中を先頭に、あとは終了が新しい順", () => {
    const sorted = sortExperiences([
      exp("2018-01", "2019-12", "old"),
      exp("2024-01", null, "current"),
      exp("2020-01", "2023-12", "mid"),
    ]);
    expect(sorted.map((e) => e.company)).toEqual(["current", "mid", "old"]);
  });

  it("元の配列を破壊しない", () => {
    const input = [exp("2018-01", "2019-12", "a"), exp("2024-01", null, "b")];
    sortExperiences(input);
    expect(input.map((e) => e.company)).toEqual(["a", "b"]);
  });
});

describe("sortSkills", () => {
  const skill = (label: string, level: Skill["level"], years: number): Skill => ({
    slug: label.toLowerCase(),
    label,
    level,
    years,
  });

  it("熟練度 → 年数 → 名前の順に並ぶ", () => {
    const sorted = sortSkills([
      skill("Go", 4, 1),
      skill("TypeScript", 5, 3),
      skill("Rust", 4, 5),
      skill("Astro", 4, 1),
    ]);
    expect(sorted.map((s) => s.label)).toEqual(["TypeScript", "Rust", "Astro", "Go"]);
  });
});

describe("formatYearMonth", () => {
  it("ゼロ埋めを外して和文にする", () => {
    expect(formatYearMonth("2024-03")).toBe("2024年3月");
  });
});
