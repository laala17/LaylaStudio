-- Copy/paste into Supabase SQL Editor (Run SQL)
-- This creates `public.app_users` used by /api/register, /api/login, /api/forgot-password, /api/reset-password.

-- 1) Table
create table if not exists public.app_users (
  id text primary key,

  email text not null unique,

  password_hash text not null,

  is_verified boolean not null default false,

  verification_token text null,
  reset_password_token text null,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 2) Helpful indexes
create index if not exists app_users_verification_token_idx on public.app_users (verification_token);
create index if not exists app_users_reset_password_token_idx on public.app_users (reset_password_token);

-- 3) updated_at trigger
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_app_users_updated_at on public.app_users;
create trigger trg_app_users_updated_at
before update on public.app_users
for each row execute function public.set_updated_at();
