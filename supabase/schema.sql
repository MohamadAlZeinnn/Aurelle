-- AURELLE storage schema. Run in the Supabase SQL editor.
-- The website writes with the service-role key from the server only, so RLS
-- is enabled with no public policies (nothing is readable from the browser).

create table if not exists public.orders (
  id            uuid primary key default gen_random_uuid(),
  reference     text not null unique,
  status        text not null check (status in ('pending', 'awaiting_payment', 'paid', 'confirmed', 'shipped', 'delivered', 'cancelled')),
  payment_method text not null check (payment_method in ('cod', 'card')),
  currency      text not null default 'USD',
  subtotal      numeric(10, 2) not null,
  delivery_fee  numeric(10, 2) not null,
  total         numeric(10, 2) not null,
  lines         jsonb not null,
  full_name     text not null,
  email         text not null,
  phone         text not null,
  country       text not null,
  city          text not null,
  area          text not null,
  street        text not null,
  notes         text,
  created_at    timestamptz not null default now()
);

create table if not exists public.newsletter_subscribers (
  email       text primary key,
  consent_at  timestamptz not null,
  source      text,
  created_at  timestamptz not null default now()
);

create table if not exists public.contact_messages (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  email       text not null,
  subject     text,
  message     text not null,
  created_at  timestamptz not null default now()
);

alter table public.orders enable row level security;
alter table public.newsletter_subscribers enable row level security;
alter table public.contact_messages enable row level security;
