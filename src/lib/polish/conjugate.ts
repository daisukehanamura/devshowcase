/**
 * 敬体→常体で必要になる動詞の活用。
 * 「書きました」を素朴に「ました→た」で置換すると「書きた」になるので、音便をここで面倒を見る。
 *
 * 形態素解析は入れない。AI 整形が繋がればこの層は要らなくなるし、
 * 職務経歴書に出てくる語彙はサ変（〜する）に強く偏っていて、ルールで十分実用になるため。
 */

/** 連用形の末尾 → 過去形（音便）。「話し」のような し は「した」になるので変換不要。 */
const ONBIN_PAST: Record<string, string> = {
  き: "いた",
  ぎ: "いだ",
  ち: "った",
  り: "った",
  い: "った",
  に: "んだ",
  み: "んだ",
  び: "んだ",
};

/** 連用形の末尾（い段）→ 未然形（あ段）。否定形を作るのに使う。 */
const MIZEN: Record<string, string> = {
  き: "か",
  ぎ: "が",
  し: "さ",
  ち: "た",
  に: "な",
  び: "ば",
  み: "ま",
  り: "ら",
  い: "わ",
};

/** 連用形の末尾（い段）→ 終止形（う段）。 */
const SHUUSHI: Record<string, string> = {
  き: "く",
  ぎ: "ぐ",
  し: "す",
  ち: "つ",
  に: "ぬ",
  び: "ぶ",
  み: "む",
  り: "る",
  い: "う",
};

/**
 * 五段と紛らわしい一段動詞の語幹。
 * 「起きました」は五段扱いだと「起いた」になってしまうので、明示的に逃がす。
 * （え段で終わる語幹（食べ・決め・入れ…）は ONBIN_PAST に載っていないので自動的に一段扱いになる）
 */
const ICHIDAN_STEMS = [
  "起き", "生き", "飽き", "尽き", "過ぎ", "借り", "足り", "降り", "落ち", "満ち",
  "用い", "老い", "報い",
];

/** 音便が不規則なもの。 */
const IRREGULAR_PAST: Record<string, string> = {
  行き: "行った",
  いき: "いった",
};

const isIchidan = (stem: string) => ICHIDAN_STEMS.some((s) => stem.endsWith(s));

/** 一段と五段で付く語尾が変わる（終止形だけ）ので、両方受け取る。 */
const convert = (
  stem: string,
  table: Record<string, string>,
  godanSuffix: string,
  ichidanSuffix: string = godanSuffix,
): string => {
  if (isIchidan(stem)) return stem + ichidanSuffix;
  const last = stem.at(-1);
  const replacement = last ? table[last] : undefined;
  // 活用表に無い＝一段動詞の語幹（え段など）とみなして、そのまま語尾を付ける。
  return replacement ? stem.slice(0, -1) + replacement + godanSuffix : stem + ichidanSuffix;
};

/** 「書き」→「書いた」、「食べ」→「食べた」、「行き」→「行った」。 */
export const toPast = (stem: string): string => {
  for (const [from, to] of Object.entries(IRREGULAR_PAST)) {
    if (stem.endsWith(from)) return stem.slice(0, -from.length) + to;
  }
  if (isIchidan(stem)) return `${stem}た`;

  const last = stem.at(-1);
  const onbin = last ? ONBIN_PAST[last] : undefined;
  return onbin ? stem.slice(0, -1) + onbin : `${stem}た`;
};

/** 「書き」→「書かない」、「食べ」→「食べない」。 */
export const toNegative = (stem: string): string => convert(stem, MIZEN, "ない");

/** 「書き」→「書かなかった」。 */
export const toPastNegative = (stem: string): string => convert(stem, MIZEN, "なかった");

/** 「書き」→「書く」、「食べ」→「食べる」。 */
export const toDictionary = (stem: string): string => convert(stem, SHUUSHI, "", "る");
