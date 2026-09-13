import "server-only";
import { InMemoryProfileRepository } from "./memory";
import { createSupabaseRepository } from "./supabase";
import type { ProfileRepository } from "./types";

let cached: ProfileRepository | null = null;

/** Supabase の資格情報が揃っていれば本物、無ければインメモリ。 */
export const getRepository = (): ProfileRepository => {
  if (cached) return cached;

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  cached = url && key ? createSupabaseRepository(url, key) : new InMemoryProfileRepository();
  return cached;
};

export const isUsingSupabase = () =>
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
