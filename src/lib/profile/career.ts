import type { Experience, Skill } from "./types";

/** "YYYY-MM" を月数（西暦0年1月からの通し）に直す。差分を取るためだけの内部表現。 */
const toMonths = (ym: string): number => {
  const [y, m] = ym.split("-").map(Number);
  return y * 12 + (m - 1);
};

/** 今日の "YYYY-MM"。在籍中の経歴を「今日まで」として数えるのに使う。 */
export const currentYearMonth = (now: Date = new Date()): string =>
  `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;

export const formatYearMonth = (ym: string): string => {
  const [y, m] = ym.split("-");
  return `${y}年${Number(m)}月`;
};

/** 在籍期間を月数で返す。終了月も在籍していた扱いなので +1 する。 */
export const experienceMonths = (exp: Experience, now: Date = new Date()): number => {
  const end = exp.endedAt ?? currentYearMonth(now);
  return Math.max(0, toMonths(end) - toMonths(exp.startedAt) + 1);
};

/** 「3年2ヶ月」のような表示に。1年未満なら月だけ、ちょうどなら年だけ。 */
export const formatDuration = (months: number): string => {
  const y = Math.floor(months / 12);
  const m = months % 12;
  if (y === 0) return `${m}ヶ月`;
  if (m === 0) return `${y}年`;
  return `${y}年${m}ヶ月`;
};

/**
 * 全経験の合計期間。転職や副業で期間が重なることがあるので、
 * 単純な足し算ではなく区間をマージして「実働年数」を出す。
 */
export const totalCareerMonths = (experiences: Experience[], now: Date = new Date()): number => {
  if (experiences.length === 0) return 0;
  const nowYm = currentYearMonth(now);

  const ranges = experiences
    .map((e) => [toMonths(e.startedAt), toMonths(e.endedAt ?? nowYm) + 1] as const)
    .filter(([s, e]) => e > s)
    .sort((a, b) => a[0] - b[0]);

  let total = 0;
  let [curStart, curEnd] = ranges[0] ?? [0, 0];
  for (const [s, e] of ranges.slice(1)) {
    if (s <= curEnd) {
      curEnd = Math.max(curEnd, e);
    } else {
      total += curEnd - curStart;
      [curStart, curEnd] = [s, e];
    }
  }
  return total + (curEnd - curStart);
};

/** 新しい経歴が上に来るように。在籍中は常に最上段。 */
export const sortExperiences = (experiences: Experience[]): Experience[] =>
  [...experiences].sort((a, b) => {
    if ((a.endedAt === null) !== (b.endedAt === null)) return a.endedAt === null ? -1 : 1;
    const byEnd = (b.endedAt ?? "9999-12").localeCompare(a.endedAt ?? "9999-12");
    return byEnd !== 0 ? byEnd : b.startedAt.localeCompare(a.startedAt);
  });

/** スキルの並び: 熟練度 → 年数 → 名前。同率でも順序がぶれないようにする。 */
export const sortSkills = (skills: Skill[]): Skill[] =>
  [...skills].sort(
    (a, b) => b.level - a.level || b.years - a.years || a.label.localeCompare(b.label),
  );

export const SKILL_LEVEL_LABELS: Record<number, string> = {
  1: "触ったことがある",
  2: "サポートがあれば書ける",
  3: "実務で普通に使える",
  4: "設計から任せられる",
  5: "チームを牽引できる",
};
