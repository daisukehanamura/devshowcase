import { describe, expect, it } from "vitest";
import { toDictionary, toNegative, toPast, toPastNegative } from "./conjugate";

describe("toPast", () => {
  it.each([
    ["書き", "書いた"],
    ["泳ぎ", "泳いだ"],
    ["作り", "作った"],
    ["使い", "使った"],
    ["待ち", "待った"],
    ["読み", "読んだ"],
    ["遊び", "遊んだ"],
    ["死に", "死んだ"],
    ["話し", "話した"],
  ])("五段: %s → %s", (stem, expected) => {
    expect(toPast(stem)).toBe(expected);
  });

  it.each([
    ["食べ", "食べた"],
    ["決め", "決めた"],
    ["入れ", "入れた"],
    ["見", "見た"],
    ["起き", "起きた"],
    ["借り", "借りた"],
    ["落ち", "落ちた"],
  ])("一段: %s → %s", (stem, expected) => {
    expect(toPast(stem)).toBe(expected);
  });

  it("「行き」は促音便の例外", () => {
    expect(toPast("行き")).toBe("行った");
    expect(toPast("持って行き")).toBe("持って行った");
  });

  it("サ変や漢語の語幹はそのまま「た」を付ける", () => {
    expect(toPast("設計し")).toBe("設計した");
  });
});

describe("toNegative", () => {
  it.each([
    ["書き", "書かない"],
    ["作り", "作らない"],
    ["使い", "使わない"],
    ["読み", "読まない"],
    ["食べ", "食べない"],
    ["起き", "起きない"],
  ])("%s → %s", (stem, expected) => {
    expect(toNegative(stem)).toBe(expected);
  });
});

describe("toPastNegative", () => {
  it.each([
    ["書き", "書かなかった"],
    ["食べ", "食べなかった"],
  ])("%s → %s", (stem, expected) => {
    expect(toPastNegative(stem)).toBe(expected);
  });
});

describe("toDictionary", () => {
  it.each([
    ["書き", "書く"],
    ["泳ぎ", "泳ぐ"],
    ["作り", "作る"],
    ["使い", "使う"],
    ["待ち", "待つ"],
    ["読み", "読む"],
    ["話し", "話す"],
  ])("五段: %s → %s", (stem, expected) => {
    expect(toDictionary(stem)).toBe(expected);
  });

  it.each([
    ["食べ", "食べる"],
    ["決め", "決める"],
    ["起き", "起きる"],
    ["借り", "借りる"],
  ])("一段: %s → %s", (stem, expected) => {
    expect(toDictionary(stem)).toBe(expected);
  });
});
