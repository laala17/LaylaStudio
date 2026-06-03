-- Migration: create app_orders table (orders + editorState persistence)
-- Expected by:
-- - POST /api/orders
-- - GET  /api/orders
-- - GET  /api/admin/orders

create table if not exists public.app_orders (
  id text primary key,

  -- We store our custom auth session id from cookie "authSession".
  -- If you later migrate to Supabase Auth, you can switch this to uuid referencing auth.users.
  user_id text null,

  created_at timestamptz not null default now(),
  status text not null default 'pending',

  -- Customer (contact + delivery)
  customer_first_name text not null default '',
  customer_last_name  text not null default '',
  customer_email      text not null default '',
  customer_phone      text not null default '',

  delivery_street         text not null default '',
  delivery_street_number text null,
  delivery_city           text not null default '',
  delivery_zip_code       text not null default '',
  delivery_country        text not null default '',

  total_price numeric not null default 0,

  -- Editor state (grouped decorations + background)
  editor_state jsonb not null default '{}'::jsonb,

  -- Snapshot of cart items (for admin/job context)
  items_snapshot jsonb not null default '[]'::jsonb
);

create index if not exists app_orders_created_at_idx on public.app_orders (created_at desc);
create index if not exists app_orders_user_id_idx on public.app_orders (user_id);
create index if not exists app_orders_customer_email_idx on public.app_orders (customer_email);

-- Optional: status constraint
do $$
begin
  if not exists (
    select 1 from pg_constraint where conname = 'app_orders_status_check'
  ) then
    alter table public.app_orders
      add constraint app_orders_status_check
      check (status in ('pending','paid','shipped','delivered'));
  end if;
end $$;

-- RLS is not strictly required because we use service_role key server-side.
-- If you enable RLS later, you should add policies allowing only the owner/admin to read.
