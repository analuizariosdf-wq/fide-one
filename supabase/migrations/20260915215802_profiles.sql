-- Profiles: the app-facing user record, 1:1 with auth.users. We never
-- duplicate auth data (email/password) here beyond a denormalized email
-- for convenient display/joins.
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  organization_id uuid not null references public.organizations (id) on delete cascade,
  name text not null,
  email text not null,
  avatar_url text,
  role_id uuid references public.roles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

-- Auto-provisions a profile whenever a new auth.users row is created.
-- Expects organization_id, name and role_slug in raw_user_meta_data —
-- this is how both real invites and the local seed create profiles,
-- so there is a single source of truth for "how a user gets a profile".
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  target_role_id uuid;
begin
  select id into target_role_id
  from public.roles
  where slug = coalesce(new.raw_user_meta_data ->> 'role_slug', 'gestor');

  insert into public.profiles (id, organization_id, name, email, role_id)
  values (
    new.id,
    (new.raw_user_meta_data ->> 'organization_id')::uuid,
    coalesce(new.raw_user_meta_data ->> 'name', split_part(new.email, '@', 1)),
    new.email,
    target_role_id
  );

  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Returns the organization_id of the currently authenticated user.
-- Used throughout RLS policies to scope every business table by tenant.
-- `security definer` is required so the policies below (which run as the
-- querying user) can still read `profiles` to resolve this, even though
-- `profiles` itself is RLS-protected.
create or replace function public.current_organization_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select organization_id from public.profiles where id = auth.uid();
$$;
