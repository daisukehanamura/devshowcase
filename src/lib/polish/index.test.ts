import { describe, expect, it } from "vitest";
import { polish } from "./index";
import { normalizeWidth, stripFillers, toPlainForm, normalizeBulletMarks } from "./rules";

describe("normalizeWidth", () => {
  it("全角英数字を半角にする", () => {
    expect(normalizeWidth("ＡＷＳでＥＣ２を１０台")).toBe("AWSでEC2を10台");
  });

  it("全角スペースと括弧を半角に寄せる", () => {
    expect(normalizeWidth("React　（v18）")).toBe("React (v18)");
  });
});

describe("toPlainForm", () => {
  it("文末の敬体を常体にする", () => {
    expect(toPlainForm("設計しました。")).toBe("設計した。");
    expect(toPlainForm("運用しております。")).toBe("運用している。");
  });

  it("文中の「です」は書き換えない", () => {
    expect(toPlainForm("これはですね難しい")).toBe("これはですね難しい");
  });

  it("行末でも適用される", () => {
    expect(toPlainForm("APIを実装しました")).toBe("APIを実装した");
  });

  it("長い語尾を優先して一度で置換する", () => {
    expect(toPlainForm("導入させていただきました。")).toBe("導入した。");
  });

  it("活用が必要な動詞も正しく常体にする", () => {
    expect(toPlainForm("ドキュメントを書きました。")).toBe("ドキュメントを書いた。");
    expect(toPlainForm("障害対応を行いました。")).toBe("障害対応を行った。");
    expect(toPlainForm("仕様が固まりませんでした。")).toBe("仕様が固まらなかった。");
    expect(toPlainForm("要件が読めません。")).toBe("要件が読めない。");
  });

  it("読点の前でも文末とみなす", () => {
    expect(toPlainForm("設計しました、そして実装した。")).toBe("設計した、そして実装した。");
  });
});

describe("stripFillers", () => {
  it("冗長表現を落とす", () => {
    expect(stripFillers("基本的にかなり難しい")).toBe("難しい");
  });
});

describe("normalizeBulletMarks", () => {
  it.each(["・項目", "- 項目", "* 項目", "1. 項目", "①項目", "  ● 項目"])(
    "%s から記号を外す",
    (line) => {
      expect(normalizeBulletMarks(line)).toBe("項目");
    },
  );
});

describe("polish", () => {
  it("空文字ならまず書き出すよう促す", () => {
    const result = polish("");
    expect(result.text).toBe("");
    expect(result.suggestions).toHaveLength(1);
  });

  it("箇条書きに整形して敬体を常体にする", () => {
    const result = polish("基本的にAPIの設計をしました。あとテストも書きました。");
    expect(result.text).toBe("- APIの設計をした\n- あとテストも書いた");
  });

  it("適用した処理を報告する", () => {
    const result = polish("ＡＰＩを設計しました。");
    expect(result.applied).toContain("全角の英数字・記号を半角に統一");
    expect(result.applied).toContain("敬体（ですます）を常体に統一");
  });

  it("重複した項目を落とす", () => {
    const result = polish("テストを書いた。テストを書いた。設計した。");
    expect(result.text.split("\n")).toHaveLength(2);
    expect(result.applied).toContain("重複した項目を削除");
  });

  it("prose 形式では箇条書きにしない", () => {
    const result = polish("設計しました。\n実装しました。", { format: "prose" });
    expect(result.text).toBe("設計した。実装した。");
    expect(result.text).not.toContain("- ");
  });

  it("オプションで整形を無効にできる", () => {
    const result = polish("基本的に設計しました。", {
      removeFillers: false,
      plainForm: false,
    });
    expect(result.text).toBe("- 基本的に設計しました");
  });

  it("数値が無ければ定量化を提案する", () => {
    const result = polish("パフォーマンスを改善した。");
    expect(result.suggestions.some((s) => s.includes("定量化"))).toBe(true);
  });

  it("数値があれば定量化の提案はしない", () => {
    const result = polish("レスポンスを800msから120msに短縮した。");
    expect(result.suggestions.some((s) => s.includes("定量化"))).toBe(false);
  });

  it("長すぎる行を指摘する", () => {
    const result = polish(`${"あ".repeat(120)}を3件改善した。`);
    expect(result.suggestions.some((s) => s.includes("80文字"))).toBe(true);
  });

  it("同じ入力なら常に同じ結果を返す", () => {
    const input = "ＡＰＩをかなり改善しました。テストも書きました。";
    expect(polish(input)).toEqual(polish(input));
  });
});
