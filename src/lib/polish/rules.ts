import { toDictionary, toNegative, toPast, toPastNegative } from "./conjugate";

/**
 * 文章整形のルール定義。
 * AI にやらせる前段として、機械的に直せるところはここで直しきる。
 * （AI 接続はまだモック。ルールの適用結果が「整形後」として返る）
 */

/** 全角英数字・全角スペースを半角に寄せる。日本語の履歴書でいちばん多い表記ゆれ。 */
export const normalizeWidth = (text: string): string =>
  text
    .replace(/[Ａ-Ｚａ-ｚ０-９]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0))
    .replace(/　/g, " ")
    .replace(/[（）]/g, (c) => (c === "（" ? "(" : ")"))
    .replace(/：/g, ": ")
    .replace(/，/g, "、");

/** 消しても意味が変わらない言葉。冗長さの正体はだいたいこれ。 */
export const FILLERS = [
  "基本的には",
  "基本的に",
  "というような形で",
  "といった形で",
  "という形で",
  "ような感じで",
  "という感じで",
  "個人的には",
  "しっかりと",
  "きちんと",
  "いろいろと",
  "色々と",
  "ある程度",
  "かなり",
  "非常に",
  "とても",
  "少し",
  "基本",
] as const;

/**
 * 敬体 → 常体の固定語尾。動詞の活用を伴わないものだけをここに置く。
 * 長い語尾から先に当てないと途中で食われるので、適用時に降順へ並べ替える。
 */
const POLITE_TO_PLAIN: Array<[string, string]> = [
  ["させていただきました", "した"],
  ["させていただきます", "する"],
  ["しておりませんでした", "していなかった"],
  ["しておりました", "していた"],
  ["しております", "している"],
  ["いたしませんでした", "しなかった"],
  ["いたしました", "した"],
  ["いたします", "する"],
  ["ていませんでした", "ていなかった"],
  ["ておりました", "ていた"],
  ["ております", "ている"],
  ["ていました", "ていた"],
  ["ています", "ている"],
  ["ございません", "ない"],
  ["ございます", "ある"],
  ["ありませんでした", "なかった"],
  ["ありません", "ない"],
  ["できませんでした", "できなかった"],
  ["できました", "できた"],
  ["できません", "できない"],
  ["できます", "できる"],
  ["しませんでした", "しなかった"],
  ["しました", "した"],
  ["しません", "しない"],
  ["します", "する"],
  ["でしょう", "だろう"],
  ["でした", "だった"],
  ["ですが", "だが"],
  ["です", "だ"],
];

/** 語尾が文の切れ目にあるときだけ置換したい。文中の「です」は触らない。 */
const SENTENCE_END = "(?=[。、）)\\s]|$)";

/** 連用形＋敬体語尾。語幹を捕まえて活用させる。 */
const CONJUGATED: Array<[RegExp, (stem: string) => string]> = [
  [new RegExp(`([\\p{Script=Han}ぁ-んァ-ヶー]+?)ませんでした${SENTENCE_END}`, "gu"), toPastNegative],
  [new RegExp(`([\\p{Script=Han}ぁ-んァ-ヶー]+?)ました${SENTENCE_END}`, "gu"), toPast],
  [new RegExp(`([\\p{Script=Han}ぁ-んァ-ヶー]+?)ません${SENTENCE_END}`, "gu"), toNegative],
  [new RegExp(`([\\p{Script=Han}ぁ-んァ-ヶー]+?)ます${SENTENCE_END}`, "gu"), toDictionary],
];

const byLengthDesc = (rules: Array<[string, string]>) =>
  [...rules].sort((a, b) => b[0].length - a[0].length);

/**
 * 固定語尾が、活用ルール側が担当する長い語尾の末尾だけを先に食うのを防ぐ。
 * 「固まりませんでした」は固定表に無いので、「でした」→「だった」が先に当たると
 * 「固まりませんだった」になり、活用ルールの「〜ませんでした」が拾えなくなる。
 */
const NOT_CONJUGATED_TAIL = "(?<!ません)";

/**
 * 文末（句点・読点・改行・行末）にある敬体を常体に直す。
 * 固定語尾を先に潰してから、残った「〜ました」類を活用ルールで処理する。
 */
export const toPlainForm = (text: string): string => {
  let out = text;
  for (const [from, to] of byLengthDesc(POLITE_TO_PLAIN)) {
    out = out.replace(new RegExp(`${NOT_CONJUGATED_TAIL}${from}${SENTENCE_END}`, "g"), to);
  }
  for (const [pattern, conjugate] of CONJUGATED) {
    out = out.replace(pattern, (_match, stem: string) => conjugate(stem));
  }
  return out;
};

export const stripFillers = (text: string): string => {
  let out = text;
  for (const filler of FILLERS) {
    out = out.replace(new RegExp(filler, "g"), "");
  }
  return out;
};

/** 行頭の箇条書き記号を「- 」に統一する。丸数字や全角中黒もここで吸収。 */
export const normalizeBulletMarks = (line: string): string =>
  line.replace(/^\s*(?:[-*・･●○◆■▪]|[0-9]+[.)、]|[①-⑳])\s*/u, "");

export const collapseSpaces = (text: string): string =>
  text.replace(/[ \t]+/g, " ").replace(/ +([。、)])/g, "$1").replace(/([(]) +/g, "$1");
