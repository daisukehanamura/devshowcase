import type { Profile } from "@/lib/profile/types";
import type { ProfileInput } from "@/lib/profile/schema";

export type StoredProfile = Profile & {
  /** 作成者だけが持つ編集キー。公開レスポンスには絶対に含めない。 */
  editToken: string;
};

export class SlugTakenError extends Error {
  constructor(slug: string) {
    super(`スラッグ "${slug}" は既に使われています`);
    this.name = "SlugTakenError";
  }
}

export class ProfileNotFoundError extends Error {
  constructor(slug: string) {
    super(`プロフィール "${slug}" が見つかりません`);
    this.name = "ProfileNotFoundError";
  }
}

export class InvalidTokenError extends Error {
  constructor() {
    super("編集キーが一致しません");
    this.name = "InvalidTokenError";
  }
}

export interface ProfileRepository {
  /** 公開ページ用。editToken は落として返す。 */
  findBySlug(slug: string): Promise<Profile | null>;
  /** 編集画面用。トークンが合わなければ InvalidTokenError。 */
  findForEdit(slug: string, editToken: string): Promise<StoredProfile>;
  create(input: ProfileInput): Promise<StoredProfile>;
  update(slug: string, editToken: string, input: ProfileInput): Promise<Profile>;
  /** トップに出す公開済みプロフィール。 */
  listPublished(limit?: number): Promise<Profile[]>;
}
