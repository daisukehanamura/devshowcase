import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { ProfileInput } from "@/lib/profile/schema";
import type { Experience, Links, Profile, Project, Skill } from "@/lib/profile/types";
import {
  InvalidTokenError,
  ProfileNotFoundError,
  SlugTakenError,
  type ProfileRepository,
  type StoredProfile,
} from "./types";

type Row = {
  slug: string;
  edit_token: string;
  display_name: string;
  headline: string;
  bio: string;
  location: string | null;
  links: Links;
  skills: Skill[];
  experiences: Experience[];
  projects: Project[];
  published: boolean;
  updated_at: string;
};

const PUBLIC_COLUMNS =
  "slug, display_name, headline, bio, location, links, skills, experiences, projects, published, updated_at";
const ALL_COLUMNS = `${PUBLIC_COLUMNS}, edit_token`;

const toProfile = (row: Row): Profile => ({
  slug: row.slug,
  displayName: row.display_name,
  headline: row.headline,
  bio: row.bio,
  location: row.location,
  links: row.links ?? { github: null, x: null, website: null, email: null },
  skills: row.skills ?? [],
  experiences: row.experiences ?? [],
  projects: row.projects ?? [],
  published: row.published,
  updatedAt: row.updated_at,
});

const toRow = (input: ProfileInput) => ({
  slug: input.slug,
  display_name: input.displayName,
  headline: input.headline,
  bio: input.bio,
  location: input.location,
  links: input.links,
  skills: input.skills,
  experiences: input.experiences,
  projects: input.projects,
  published: input.published,
});

/** unique 制約違反。Postgres のエラーコードで見る。 */
const isUniqueViolation = (error: { code?: string } | null) => error?.code === "23505";

export class SupabaseProfileRepository implements ProfileRepository {
  constructor(private readonly client: SupabaseClient) {}

  async findBySlug(slug: string): Promise<Profile | null> {
    const { data, error } = await this.client
      .from("profiles")
      .select(PUBLIC_COLUMNS)
      .eq("slug", slug)
      .maybeSingle();

    if (error) throw error;
    return data ? toProfile(data as Row) : null;
  }

  async findForEdit(slug: string, editToken: string): Promise<StoredProfile> {
    const { data, error } = await this.client
      .from("profiles")
      .select(ALL_COLUMNS)
      .eq("slug", slug)
      .maybeSingle();

    if (error) throw error;
    if (!data) throw new ProfileNotFoundError(slug);

    const row = data as Row;
    if (row.edit_token !== editToken) throw new InvalidTokenError();
    return { ...toProfile(row), editToken: row.edit_token };
  }

  async create(input: ProfileInput): Promise<StoredProfile> {
    const { data, error } = await this.client
      .from("profiles")
      .insert(toRow(input))
      .select(ALL_COLUMNS)
      .single();

    if (isUniqueViolation(error)) throw new SlugTakenError(input.slug);
    if (error) throw error;

    const row = data as Row;
    return { ...toProfile(row), editToken: row.edit_token };
  }

  async update(slug: string, editToken: string, input: ProfileInput): Promise<Profile> {
    // 先にトークンを検証する。ここを WHERE 句に混ぜると存在しない場合と権限違反が区別できない。
    await this.findForEdit(slug, editToken);

    const { data, error } = await this.client
      .from("profiles")
      .update(toRow(input))
      .eq("slug", slug)
      .eq("edit_token", editToken)
      .select(PUBLIC_COLUMNS)
      .single();

    if (isUniqueViolation(error)) throw new SlugTakenError(input.slug);
    if (error) throw error;
    return toProfile(data as Row);
  }

  async listPublished(limit = 20): Promise<Profile[]> {
    const { data, error } = await this.client
      .from("profiles")
      .select(PUBLIC_COLUMNS)
      .eq("published", true)
      .order("updated_at", { ascending: false })
      .limit(limit);

    if (error) throw error;
    return (data as Row[]).map(toProfile);
  }
}

export const createSupabaseRepository = (url: string, serviceRoleKey: string) =>
  new SupabaseProfileRepository(
    createClient(url, serviceRoleKey, { auth: { persistSession: false } }),
  );
