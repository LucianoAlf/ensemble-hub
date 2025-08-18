-- Migration: create unidade table for bands dropdown
-- Ensures gen_random_uuid() is available
create extension if not exists pgcrypto;

create table if not exists public.unidade (
  id uuid primary key default gen_random_uuid(),
  nome text not null unique,
  created_at timestamptz not null default now()
);

-- Enable RLS and allow selecting unidades from the client
alter table public.unidade enable row level security;

do $$
begin
  if not exists (
    select 1 from pg_policies 
    where schemaname = 'public' and tablename = 'unidade' and policyname = 'Unidade select for all'
  ) then
    create policy "Unidade select for all" on public.unidade
      for select
      using (true);
  end if;
end
$$;