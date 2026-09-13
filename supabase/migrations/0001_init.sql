-- devshowcase の初期スキーマ。
-- Supabase の SQL Editor にそのまま貼るか、supabase CLI で適用する。

create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique,
  -- ログイン機構を入れるまでの所有権の証明。作成時に一度だけ返し、以降は編集時に検証する。
  edit_token   uuid not null default gen_random_uuid(),
  display_name text not null default '',
  headline     text not null default '',
  bio          text not null default '',
  location     text,
  links        jsonb not null default '{}'::jsonb,
  skills       jsonb not null default '[]'::jsonb,
  experiences  jsonb not null default '[]'::jsonb,
  projects     jsonb not null default '[]'::jsonb,
  published    boolean not null default false,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists profiles_published_idx on public.profiles (published, updated_at desc);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- RLS は有効にしたうえでポリシーを一切作らない。
-- anon キーからは読み書きできず、すべてのアクセスはサーバー側の service role 経由になる。
-- edit_token をクライアントに晒さないための作りなので、ここは緩めないこと。
alter table public.profiles enable row level security;
