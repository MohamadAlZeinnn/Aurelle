-- AURELLE storage schema (newsletter sign-ups & contact messages; orders are taken on WhatsApp). Run in the Supabase SQL editor.
-- The website writes with the service-role key from the server only, so RLS
-- is enabled with no public policies (nothing is readable from the browser).

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

alter table public.newsletter_subscribers enable row level security;
alter table public.contact_messages enable row level security;
