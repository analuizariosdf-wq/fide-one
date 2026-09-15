-- Organizations: the tenant boundary for the whole app.
create table public.organizations (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  logo_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger organizations_set_updated_at
  before update on public.organizations
  for each row execute function public.set_updated_at();

-- Roles: fixed taxonomy today, but a real table (not an enum) so future
-- permission rules can hang off role_id without a schema migration.
create table public.roles (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  created_at timestamptz not null default now()
);

insert into public.roles (slug, name) values
  ('administrador', 'Administrador'),
  ('gestor', 'Gestor'),
  ('comercial', 'Comercial'),
  ('estrategia', 'Estratégia'),
  ('social_media', 'Social Media'),
  ('copy', 'Copy'),
  ('design', 'Design'),
  ('trafego', 'Tráfego'),
  ('audiovisual', 'Audiovisual'),
  ('financeiro', 'Financeiro');
