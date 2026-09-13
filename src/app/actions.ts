"use server";

import { revalidatePath } from "next/cache";
import { moveEditToken, readEditToken, writeEditToken } from "@/lib/edit-token";
import {
  invalidInput,
  missingEditToken,
  saved,
  saveFailure,
  type SavePayload,
  type SaveState,
} from "@/lib/profile/save";
import { profileInputSchema } from "@/lib/profile/schema";
import { getRepository } from "@/lib/repo";

/**
 * プロフィールの保存。新規作成と更新の両方を受ける。
 *
 * 認証が無いので、更新は Cookie の編集キーが一致することだけを根拠にする。
 * この関数は POST で直接叩けるため、権限の確認はここ（サーバ側）でやりきる。
 */
export async function saveProfile(_prev: SaveState, payload: SavePayload): Promise<SaveState> {
  const parsed = profileInputSchema.safeParse(payload.profile);
  if (!parsed.success) return invalidInput(parsed.error);

  const input = parsed.data;
  const repo = getRepository();
  const { originalSlug } = payload;

  try {
    if (originalSlug) {
      const token = await readEditToken(originalSlug);
      if (!token) return missingEditToken();

      await repo.update(originalSlug, token, input);
      await moveEditToken(originalSlug, input.slug);
    } else {
      const created = await repo.create(input);
      await writeEditToken(created.slug, created.editToken);
    }
  } catch (error) {
    return saveFailure(error);
  }

  // 公開ページとトップの一覧を作り直す。
  revalidatePath(`/p/${input.slug}`);
  if (originalSlug && originalSlug !== input.slug) revalidatePath(`/p/${originalSlug}`);
  revalidatePath("/");

  return saved(input.slug, !originalSlug);
}
