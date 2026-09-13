import { describe, expect, it } from "vitest";
import { isBrandColorUsable, parseHex, relativeLuminance } from "./color";
import { ICONS } from "./icons.generated";

describe("parseHex", () => {
  it("6桁の16進数を RGB にする", () => {
    expect(parseHex("3178C6")).toEqual([49, 120, 198]);
    expect(parseHex("#000000")).toEqual([0, 0, 0]);
    expect(parseHex("ffffff")).toEqual([255, 255, 255]);
  });

  it("形式が違えば null", () => {
    expect(parseHex("fff")).toBeNull();
    expect(parseHex("zzzzzz")).toBeNull();
    expect(parseHex("")).toBeNull();
  });
});

describe("relativeLuminance", () => {
  it("黒は0、白は1", () => {
    expect(relativeLuminance("000000")).toBe(0);
    expect(relativeLuminance("FFFFFF")).toBeCloseTo(1, 5);
  });

  it("解釈できない値は中間値に逃がす", () => {
    expect(relativeLuminance("nope")).toBe(0.5);
  });
});

describe("isBrandColorUsable", () => {
  it("黒に近いロゴはブランド色を使わない", () => {
    expect(isBrandColorUsable("000000")).toBe(false);
    // Rust と Express はどちらも純黒指定で、ダークテーマだと沈む。
    expect(isBrandColorUsable(ICONS["rust"].hex)).toBe(false);
  });

  it("白に近いロゴもブランド色を使わない", () => {
    expect(isBrandColorUsable("FFFFFF")).toBe(false);
  });

  it("色が付いているロゴはブランド色のまま出す", () => {
    expect(isBrandColorUsable(ICONS["typescript"].hex)).toBe(true);
    expect(isBrandColorUsable(ICONS["python"].hex)).toBe(true);
    expect(isBrandColorUsable(ICONS["postgresql"].hex)).toBe(true);
  });
});
