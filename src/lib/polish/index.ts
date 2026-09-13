import {
  collapseSpaces,
  normalizeBulletMarks,
  normalizeWidth,
  stripFillers,
  toPlainForm,
} from "./rules";

export type PolishFormat = "bullets" | "prose";

export type PolishOptions = {
  /** 箇条書きに割るか、地の文のまま整えるか。 */
  format: PolishFormat;
  /** 敬体を常体に寄せるか。職務経歴書は常体が読みやすいので既定で true。 */
  plainForm: boolean;
  /** 冗長表現を落とすか。 */
  removeFillers: boolean;
};

export type PolishResult = {
  text: string;
  /** 実際に適用した処理。何が変わったか分からないと怖くて使えないので返す。 */
  applied: string[];
  /** 人間が判断するしかない改善点。 */
  suggestions: string[];
};

export const defaultPolishOptions: PolishOptions = {
  format: "bullets",
  plainForm: true,
  removeFillers: true,
};

const splitSentences = (text: string): string[] =>
  text
    .split(/(?<=。)|\n/)
    .map((s) => s.trim())
    .filter(Boolean);

const hasNumber = (text: string) => /[0-9]/.test(text);

const VAGUE_WORDS = ["担当", "対応", "従事", "携わ", "など"];

const buildSuggestions = (original: string, result: string): string[] => {
  const suggestions: string[] = [];

  if (!hasNumber(original)) {
    suggestions.push(
      "数値が入っていません。「レスポンスを800ms→120msに短縮」のように定量化すると説得力が上がります。",
    );
  }
  if (VAGUE_WORDS.some((w) => original.includes(w)) && !hasNumber(original)) {
    suggestions.push(
      "「担当した」「対応した」で止まっています。何を判断し、何が変わったかまで書くと強くなります。",
    );
  }

  const longLines = result.split("\n").filter((l) => l.replace(/^- /, "").length > 80);
  if (longLines.length > 0) {
    suggestions.push(`80文字を超える行が${longLines.length}行あります。1行1トピックに割ると読みやすくなります。`);
  }

  if (!/(設計|実装|改善|構築|移行|削減|立ち上げ|リード|推進)/.test(original)) {
    suggestions.push("動詞が弱いかもしれません。「設計」「移行」「削減」など、動きが見える語を使うと伝わります。");
  }

  return suggestions;
};

/**
 * 経歴・実績の文章を整える。
 * いまは純粋なルールベース（AI 未接続）。副作用が無いので入力が同じなら必ず同じ結果になる。
 */
export const polish = (input: string, options: Partial<PolishOptions> = {}): PolishResult => {
  const opts = { ...defaultPolishOptions, ...options };
  const applied: string[] = [];

  const original = input;
  let text = input.replace(/\r\n?/g, "\n").trim();

  if (!text) {
    return { text: "", applied: [], suggestions: ["まず思いついた順に書き出してください。整形はこちらでやります。"] };
  }

  const widthNormalized = normalizeWidth(text);
  if (widthNormalized !== text) applied.push("全角の英数字・記号を半角に統一");
  text = widthNormalized;

  if (opts.removeFillers) {
    const stripped = stripFillers(text);
    if (stripped !== text) applied.push("冗長な表現を削除");
    text = stripped;
  }

  if (opts.plainForm) {
    const plain = toPlainForm(text);
    if (plain !== text) applied.push("敬体（ですます）を常体に統一");
    text = plain;
  }

  if (opts.format === "bullets") {
    const items = splitSentences(text)
      .map((line) => collapseSpaces(normalizeBulletMarks(line)).trim())
      .map((line) => line.replace(/。$/, ""))
      .filter(Boolean);

    // 同じ内容が並ぶと読み手の信頼を削るので、重複はここで落とす。
    const seen = new Set<string>();
    const unique = items.filter((i) => (seen.has(i) ? false : (seen.add(i), true)));
    if (unique.length < items.length) applied.push("重複した項目を削除");

    applied.push(`${unique.length}件の箇条書きに整形`);
    text = unique.map((i) => `- ${i}`).join("\n");
  } else {
    text = text
      .split("\n")
      .map((line) => collapseSpaces(normalizeBulletMarks(line)).trim())
      .filter(Boolean)
      .join("");
    applied.push("地の文として連結");
  }

  return { text, applied, suggestions: buildSuggestions(original, text) };
};
