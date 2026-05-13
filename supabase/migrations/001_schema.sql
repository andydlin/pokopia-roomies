-- profiles: one row per auth user, created automatically on signup
create table public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  nickname   text not null unique,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;
-- Nicknames are public — anyone can look up a profile by ID.
create policy "profiles: public read" on public.profiles for select using (true);
-- Only the owner can write their own profile.
create policy "profiles: owner write" on public.profiles
  for insert with check (auth.uid() = id);
create policy "profiles: owner update" on public.profiles
  for update using (auth.uid() = id);

-- builds: replaces localStorage SavedHome[] for authenticated users
create table public.builds (
  id                text primary key,
  owner_id          uuid not null references public.profiles(id) on delete cascade,
  name              text not null,
  pokemon_ids       text[] not null default '{}',
  item_ids          text[] not null default '{}',
  item_quantities   jsonb not null default '{}',
  material_progress jsonb not null default '{}',
  habitat_id        text,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

alter table public.builds enable row level security;

-- owner has full CRUD
create policy "builds: owner all" on public.builds
  for all using (auth.uid() = owner_id);

-- anyone with the ID (including anon) can read a build via its link
create policy "builds: link read" on public.builds
  for select using (true);

create index builds_owner_updated on public.builds(owner_id, updated_at desc);

-- auto-update updated_at on every row update
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger builds_updated_at
  before update on public.builds
  for each row execute function update_updated_at();

-- auto-create a profile row when a new auth user is created
-- nickname must be passed in options.data.nickname during signUp()
create or replace function handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.profiles (id, nickname)
  values (new.id, new.raw_user_meta_data->>'nickname');
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();
