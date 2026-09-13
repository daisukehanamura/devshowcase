import type { ZodError } from "zod";
import {
  InvalidTokenError,
  ProfileNotFoundError,
  SlugTakenError,
} from "@/lib/repo/types";
import { fieldErrors, type FieldErrors } from "./errors";

/**
 * 保存の結果。Server Action と編集画面の間でやり取りする。
 * 値も型もここに置く（"use server" のファイルは関数以外を export できない）。
 */
export type SaveState =
  | { status: "idle" }
  | { status: "ok"; slug: string; created: boolean; message: string }
  | { status: "error"; message: string; errors: FieldErrors };

export type SavePayload = {
  /** 新規なら null。既存の編集なら「変更前の」slug。slug 自体を変えられるので必要。 */
  originalSlug: string | null;
  profile: unknown;
};

/** 呼び出し側で毎回 status を絞らせないよう、成功/失敗を型で分けて返す。 */
export type SaveOk = Extract<SaveState, { status: "ok" }>;
export type SaveError = Extract<SaveState, { status: "error" }>;

export const initialSaveState: SaveState = { status: "idle" };

export const invalidInput = (error: ZodError): SaveError => ({
  status: "error",
  message: "入力に問題があります。赤くなっている項目を直してください。",
  errors: fieldErrors(error),
});

export const saved = (slug: string, created: boolean): SaveOk => ({
  status: "ok",
  slug,
  created,
  message: created ? "公開ページを作成しました。" : "保存しました。",
});

export const missingEditToken = (): SaveError => ({
  status: "error",
  message:
    "このブラウザに編集キーがありません。作成したときと同じブラウザから開いてください。",
  errors: {},
});

/**
 * 保存に失敗した理由を画面の言葉に直す。
 * slug の衝突だけは直せるエラーなので、入力欄の横に出す。
 */
export const saveFailure = (error: unknown): SaveError => {
  if (error instanceof SlugTakenError) {
    return {
      status: "error",
      message: "その URL は使われています。別のものにしてください。",
      errors: { slug: "この URL は既に使われています" },
    };
  }
  if (error instanceof InvalidTokenError) {
    return { status: "error", message: "編集キーが一致しません。", errors: {} };
  }
  if (error instanceof ProfileNotFoundError) {
    return { status: "error", message: "編集対象が見つかりませんでした。", errors: {} };
  }
  return {
    status: "error",
    message: "保存できませんでした。しばらく待ってからもう一度試してください。",
    errors: {},
  };
};
