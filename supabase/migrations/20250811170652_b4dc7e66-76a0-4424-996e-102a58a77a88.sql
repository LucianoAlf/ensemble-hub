-- 1) Create profiles table to map users to tenant_id
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  tenant_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Enable RLS on profiles
alter table public.profiles enable row level security;

-- Drop old policies if they exist (idempotent)
do $$ begin
  if exists (select 1 from pg_policies where schemaname='public' and tablename='profiles' and policyname='Profiles are viewable by owner') then
    drop policy "Profiles are viewable by owner" on public.profiles;
  end if;
  if exists (select 1 from pg_policies where schemaname='public' and tablename='profiles' and policyname='Users can insert own profile') then
    drop policy "Users can insert own profile" on public.profiles;
  end if;
  if exists (select 1 from pg_policies where schemaname='public' and tablename='profiles' and policyname='Users can update own profile') then
    drop policy "Users can update own profile" on public.profiles;
  end if;
end $$;

-- Policies to allow each user to manage only their own profile
create policy "Profiles are viewable by owner"
  on public.profiles
  for select
  to authenticated
  using (auth.uid() = id);

create policy "Users can insert own profile"
  on public.profiles
  for insert
  to authenticated
  with check (auth.uid() = id);

create policy "Users can update own profile"
  on public.profiles
  for update
  to authenticated
  using (auth.uid() = id);

-- Trigger to maintain updated_at
do $$ begin
  if not exists (
    select 1 from pg_trigger 
    where tgname = 'update_profiles_updated_at'
  ) then
    create trigger update_profiles_updated_at
    before update on public.profiles
    for each row execute function public.update_updated_at_column();
  end if;
end $$;

-- 2) Optional: auto-create profile on user signup using metadata (safe if metadata absent)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name, tenant_id)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'display_name', new.email),
    nullif(new.raw_user_meta_data->>'tenant_id','')::uuid
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

-- Create trigger only if it doesn't exist
do $$ begin
  if not exists (
    select 1 from pg_trigger t
    join pg_class c on c.oid = t.tgrelid
    join pg_namespace n on n.oid = c.relnamespace
    where t.tgname = 'on_auth_user_created' and n.nspname = 'auth' and c.relname = 'users'
  ) then
    create trigger on_auth_user_created
      after insert on auth.users
      for each row execute procedure public.handle_new_user();
  end if;
end $$;

-- 3) Lock down the sensitive view from direct access
revoke all on public.vw_alunos_participantes from anon;
revoke all on public.vw_alunos_participantes from authenticated;

-- 4) Secure function to expose only tenant-scoped data to authenticated users
create or replace function public.get_alunos_participantes()
returns setof public.vw_alunos_participantes
language sql
stable
security definer
set search_path = public
as $$
  select v.*
  from public.vw_alunos_participantes v
  join public.profiles p on p.id = auth.uid()
  where p.tenant_id is not null
    and v.tenant_id = p.tenant_id
$$;

grant execute on function public.get_alunos_participantes() to authenticated;