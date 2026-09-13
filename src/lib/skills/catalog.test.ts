import { describe, expect, it } from "vitest";
import { CATALOG, findEntry, iconFor, resolveSlug, searchCatalog, toCustomSlug } from "./catalog";

describe("searchCatalog", () => {
  it("略称で引いても本命が先頭に来る", () => {
    expect(searchCatalog("ts")[0].slug).toBe("typescript");
    expect(searchCatalog("k8s")[0].slug).toBe("kubernetes");
    expect(searchCatalog("rails")[0].slug).toBe("rubyonrails");
    expect(searchCatalog("gcp")[0].slug).toBe("googlecloud");
  });

  it("完全一致を前方一致より優先する", () => {
    // "go" は golang の別名。前方一致だけなら googlecloud なども混ざる。
    expect(searchCatalog("go")[0].slug).toBe("go");
  });

  it("大文字・記号・空白の揺れを吸収する", () => {
    expect(searchCatalog("Next.js")[0].slug).toBe("nextdotjs");
    expect(searchCatalog("NEXT JS")[0].slug).toBe("nextdotjs");
    expect(searchCatalog("spring boot")[0].slug).toBe("spring");
  });

  it("該当が無ければ空", () => {
    expect(searchCatalog("そんな技術はない")).toEqual([]);
  });

  it("空クエリはカタログの先頭を返す", () => {
    expect(searchCatalog("").length).toBeGreaterThan(0);
    expect(searchCatalog("  ", 3)).toHaveLength(3);
  });

  it("limit を超えない", () => {
    expect(searchCatalog("a", 5).length).toBeLessThanOrEqual(5);
  });
});

describe("resolveSlug", () => {
  it("GitHub の language 名をカタログの slug に寄せる", () => {
    expect(resolveSlug("TypeScript")).toBe("typescript");
    expect(resolveSlug("C++")).toBe("cplusplus");
    expect(resolveSlug("Shell")).toBeNull();
  });
});

describe("toCustomSlug", () => {
  it("空白をハイフンに寄せて小文字にする", () => {
    expect(toCustomSlug("  My In-House Framework ")).toBe("my-in-house-framework");
  });

  it("日本語もそのまま通す", () => {
    expect(toCustomSlug("社内フレームワーク")).toBe("社内フレームワーク");
  });
});

describe("CATALOG", () => {
  it("slug が重複していない", () => {
    const slugs = CATALOG.map((e) => e.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
  });

  it("表示名が空のエントリが無い", () => {
    expect(CATALOG.filter((e) => !e.label)).toEqual([]);
  });

  it("カタログの全エントリにロゴがある", () => {
    // ロゴが引けない slug は typo なので、ここで落として気付けるようにする。
    expect(CATALOG.filter((e) => !iconFor(e.slug)).map((e) => e.slug)).toEqual([]);
  });

  it("findEntry で slug から引ける", () => {
    expect(findEntry("vitest")?.category).toBe("tool");
    expect(findEntry("nope")).toBeUndefined();
  });
});
