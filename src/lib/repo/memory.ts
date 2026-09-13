import { randomUUID } from "node:crypto";
import type { ProfileInput } from "@/lib/profile/schema";
import type { Profile } from "@/lib/profile/types";
import {
  InvalidTokenError,
  ProfileNotFoundError,
  SlugTakenError,
  type ProfileRepository,
  type StoredProfile,
} from "./types";

const publicView = ({ editToken: _editToken, ...rest }: StoredProfile): Profile => rest;

/**
 * テストとローカル確認用のインメモリ実装。
 * Supabase の環境変数が無いときはこちらに落ちるので、クローンしてすぐ動かせる。
 */
export class InMemoryProfileRepository implements ProfileRepository {
  private readonly store = new Map<string, StoredProfile>();

  constructor(seed: StoredProfile[] = []) {
    for (const p of seed) this.store.set(p.slug, p);
  }

  async findBySlug(slug: string): Promise<Profile | null> {
    const found = this.store.get(slug);
    return found ? publicView(found) : null;
  }

  async findForEdit(slug: string, editToken: string): Promise<StoredProfile> {
    const found = this.store.get(slug);
    if (!found) throw new ProfileNotFoundError(slug);
    if (found.editToken !== editToken) throw new InvalidTokenError();
    return found;
  }

  async create(input: ProfileInput): Promise<StoredProfile> {
    if (this.store.has(input.slug)) throw new SlugTakenError(input.slug);
    const created: StoredProfile = {
      ...input,
      editToken: randomUUID(),
      updatedAt: new Date().toISOString(),
    };
    this.store.set(created.slug, created);
    return created;
  }

  async update(slug: string, editToken: string, input: ProfileInput): Promise<Profile> {
    const existing = await this.findForEdit(slug, editToken);
    // slug の変更は引っ越しなので、衝突チェックと旧キーの削除まで面倒を見る。
    if (input.slug !== slug && this.store.has(input.slug)) throw new SlugTakenError(input.slug);

    const updated: StoredProfile = {
      ...input,
      editToken: existing.editToken,
      updatedAt: new Date().toISOString(),
    };
    if (input.slug !== slug) this.store.delete(slug);
    this.store.set(updated.slug, updated);
    return publicView(updated);
  }

  async listPublished(limit = 20): Promise<Profile[]> {
    return [...this.store.values()]
      .filter((p) => p.published)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .slice(0, limit)
      .map(publicView);
  }
}
