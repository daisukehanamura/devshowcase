import type { ZodError } from "zod";

/**
 * 入力エラーを「フィールドのパス → メッセージ」に畳む。
 * 画面側は `errors["experiences.0.company"]` で引けるので、
 * ネストした配列でも入力欄の隣に出せる。
 */
export type FieldErrors = Record<string, string>;

/**
 * zod の issue パスを画面が引けるキーにする。`["links","github"]` → `"links.github"`
 * zod のパス要素は PropertyKey なので、symbol が来ても落ちないよう String を通す。
 */
export const errorKey = (path: ReadonlyArray<PropertyKey>): string => path.map(String).join(".");

/**
 * 同じフィールドに複数出たときは最初のものだけ残す。
 * 一度に全部見せても直せないので、1フィールド1メッセージに絞る。
 */
export const fieldErrors = (error: ZodError): FieldErrors => {
  const out: FieldErrors = {};
  for (const issue of error.issues) {
    const key = errorKey(issue.path);
    if (!(key in out)) out[key] = issue.message;
  }
  return out;
};

/** フィールドに紐づかない（オブジェクト全体に対する）エラー。 */
export const formErrors = (error: ZodError): string[] =>
  error.issues.filter((i) => i.path.length === 0).map((i) => i.message);

/**
 * 「この見出しの中にエラーがあるか」を見る。
 * 折りたたまれたセクションに赤いバッジを出すのに使う。
 */
export const hasErrorIn = (errors: FieldErrors, prefix: string): boolean =>
  Object.keys(errors).some((k) => k === prefix || k.startsWith(`${prefix}.`));

/** 何件のエラーが残っているか。保存ボタンの脇に出す。 */
export const errorCount = (errors: FieldErrors): number => Object.keys(errors).length;
