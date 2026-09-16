-- ============================================================
-- APPLY ALL MIGRATIONS — script gerado, NÃO é fonte de verdade
--
-- Este arquivo é uma concatenação literal, na ordem correta, dos
-- 13 arquivos em supabase/migrations/. Ele existe só para colar
-- de uma vez no SQL Editor do Supabase (sem Docker/CLI disponível
-- neste ambiente para rodar 'supabase db push').
--
-- A fonte de verdade continua sendo supabase/migrations/*.sql.
-- Se as migrations mudarem, regenere este arquivo — nunca edite
-- ele à mão nem crie tabelas aqui que não existam lá.
--
-- Seguro rodar em um projeto novo (schema public vazio). Se
-- alguma tabela already existir, o Postgres vai parar com um erro
-- claro (relation already exists) em vez de duplicar algo.
-- ============================================================

-- ------------------------------------------------------------
-- Fonte: supabase/migrations/20260915215800_extensions_and_helpers.sql
-- ------------------------------------------------------------
-- Extensions
create extension if not exists "pgcrypto" with schema extensions;

-- Generic trigger to keep `updated_at` current on any table that has it.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ------------------------------------------------------------
-- Fonte: supabase/migrations/20260915215801_roles_and_organizations.sql
-- ------------------------------------------------------------
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

-- ------------------------------------------------------------
-- Fonte: supabase/migrations/20260915215802_profiles.sql
-- ------------------------------------------------------------
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

-- ------------------------------------------------------------
-- Fonte: supabase/migrations/20260915215803_clients.sql
-- ------------------------------------------------------------
create table public.services (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now(),
  unique (organization_id, name)
);

create table public.clients (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  name text not null,
  trade_name text,
  cnpj text,
  segment text,
  website text,
  instagram text,
  email text,
  phone text,
  responsible_id uuid references public.profiles (id),
  start_date date,
  status text not null default 'lead'
    check (status in ('lead', 'ativo', 'pausado', 'encerrado')),
  monthly_fee numeric(12, 2) not null default 0,
  due_day smallint check (due_day between 1 and 31),
  payment_method text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger clients_set_updated_at
  before update on public.clients
  for each row execute function public.set_updated_at();

-- organization_id is denormalized from clients.organization_id (a service
-- and the client using it always belong to the same org) purely so RLS
-- here doesn't need a join.
create table public.client_services (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  client_id uuid not null references public.clients (id) on delete cascade,
  service_id uuid not null references public.services (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (client_id, service_id)
);

-- ------------------------------------------------------------
-- Fonte: supabase/migrations/20260915215804_projects.sql
-- ------------------------------------------------------------
create table public.campaigns (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  client_id uuid not null references public.clients (id) on delete cascade,
  name text not null,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger campaigns_set_updated_at
  before update on public.campaigns
  for each row execute function public.set_updated_at();

create table public.projects (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  client_id uuid not null references public.clients (id) on delete cascade,
  campaign_id uuid references public.campaigns (id) on delete set null,
  name text not null,
  description text,
  responsible_id uuid references public.profiles (id),
  start_date date,
  end_date date,
  status text not null default 'planejamento'
    check (status in ('planejamento', 'em_andamento', 'em_pausa', 'concluido', 'cancelado')),
  progress smallint not null default 0 check (progress between 0 and 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger projects_set_updated_at
  before update on public.projects
  for each row execute function public.set_updated_at();

-- ------------------------------------------------------------
-- Fonte: supabase/migrations/20260915215805_tasks.sql
-- ------------------------------------------------------------
create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  client_id uuid references public.clients (id) on delete set null,
  project_id uuid references public.projects (id) on delete set null,
  title text not null,
  description text,
  status text not null default 'backlog'
    check (status in (
      'backlog', 'a_fazer', 'em_producao', 'em_revisao',
      'aguardando_cliente', 'concluido', 'cancelado'
    )),
  priority text not null default 'normal'
    check (priority in ('baixa', 'normal', 'alta', 'urgente')),
  assignee_id uuid references public.profiles (id),
  creator_id uuid references public.profiles (id),
  due_date date,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger tasks_set_updated_at
  before update on public.tasks
  for each row execute function public.set_updated_at();

create table public.task_comments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  task_id uuid not null references public.tasks (id) on delete cascade,
  author_id uuid references public.profiles (id),
  message text not null,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- Fonte: supabase/migrations/20260915215806_contents.sql
-- ------------------------------------------------------------
create table public.contents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  client_id uuid not null references public.clients (id) on delete cascade,
  project_id uuid references public.projects (id) on delete set null,
  title text not null,
  content_type text not null
    check (content_type in (
      'Post', 'Carrossel', 'Reels', 'Story', 'Vídeo', 'Artigo', 'Blog', 'LinkedIn', 'Anúncio'
    )),
  channel text not null
    check (channel in (
      'Instagram', 'Facebook', 'LinkedIn', 'TikTok', 'YouTube', 'Site', 'Google'
    )),
  status text not null default 'ideia'
    check (status in (
      'ideia', 'briefing', 'copy', 'design', 'revisao', 'aprovacao', 'agendado', 'publicado'
    )),
  scheduled_date date,
  scheduled_time time,
  description text,
  caption text,
  cta text,
  responsible_id uuid references public.profiles (id),
  created_by uuid references public.profiles (id),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger contents_set_updated_at
  before update on public.contents
  for each row execute function public.set_updated_at();

-- Many-to-many: a content piece is produced through several tasks.
-- organization_id is denormalized from contents.organization_id, same
-- reasoning as client_services above.
create table public.content_tasks (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  content_id uuid not null references public.contents (id) on delete cascade,
  task_id uuid not null references public.tasks (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (content_id, task_id)
);

create table public.content_comments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  content_id uuid not null references public.contents (id) on delete cascade,
  author_id uuid references public.profiles (id),
  message text not null,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- Fonte: supabase/migrations/20260915215807_calendar_events.sql
-- ------------------------------------------------------------
-- Standalone calendar entries (meetings, generic events, deadlines) plus
-- the ability to point at an existing content/task when the event
-- represents one of those, instead of duplicating their data here.
create table public.calendar_events (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  title text not null,
  type text not null
    check (type in ('publication', 'meeting', 'task', 'event', 'deadline')),
  event_date date not null,
  event_time time,
  client_id uuid references public.clients (id) on delete set null,
  project_id uuid references public.projects (id) on delete set null,
  task_id uuid references public.tasks (id) on delete cascade,
  content_id uuid references public.contents (id) on delete cascade,
  description text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger calendar_events_set_updated_at
  before update on public.calendar_events
  for each row execute function public.set_updated_at();

-- ------------------------------------------------------------
-- Fonte: supabase/migrations/20260915215808_financial.sql
-- ------------------------------------------------------------
-- Schema only for this etapa — no UI is built on top of these yet.
create table public.financial_categories (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  name text not null,
  type text not null check (type in ('receita', 'despesa')),
  created_at timestamptz not null default now()
);

create table public.financial_transactions (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  client_id uuid references public.clients (id) on delete set null,
  category_id uuid references public.financial_categories (id) on delete set null,
  description text not null,
  amount numeric(12, 2) not null,
  due_date date,
  paid_at date,
  status text not null default 'previsto'
    check (status in ('previsto', 'proximo', 'pago', 'atrasado')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger financial_transactions_set_updated_at
  before update on public.financial_transactions
  for each row execute function public.set_updated_at();

-- ------------------------------------------------------------
-- Fonte: supabase/migrations/20260915215809_files_notifications_activity.sql
-- ------------------------------------------------------------
-- Metadata for files stored in Supabase Storage (see storage migration for
-- the actual buckets). Kept separate from Storage's own object table so we
-- can attach a file to any of several entity types without a wide table.
create table public.files (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  client_id uuid references public.clients (id) on delete cascade,
  project_id uuid references public.projects (id) on delete cascade,
  content_id uuid references public.contents (id) on delete cascade,
  task_id uuid references public.tasks (id) on delete cascade,
  bucket text not null,
  path text not null,
  name text not null,
  size_bytes bigint,
  mime_type text,
  uploaded_by uuid references public.profiles (id),
  created_at timestamptz not null default now()
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  message text,
  link text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

-- Append-only audit trail. `metadata` carries whatever the calling
-- service considers relevant (before/after values, field names, etc.).
create table public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  actor_id uuid references public.profiles (id),
  entity_type text not null,
  entity_id uuid,
  action text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- ------------------------------------------------------------
-- Fonte: supabase/migrations/20260915215810_indexes.sql
-- ------------------------------------------------------------
-- organization_id: every business table is filtered by tenant on every
-- request (RLS enforces it too, so these are load-bearing for performance,
-- not just convenience).
create index idx_clients_organization_id on public.clients (organization_id);
create index idx_campaigns_organization_id on public.campaigns (organization_id);
create index idx_projects_organization_id on public.projects (organization_id);
create index idx_tasks_organization_id on public.tasks (organization_id);
create index idx_contents_organization_id on public.contents (organization_id);
create index idx_calendar_events_organization_id on public.calendar_events (organization_id);
create index idx_financial_transactions_organization_id on public.financial_transactions (organization_id);
create index idx_files_organization_id on public.files (organization_id);
create index idx_notifications_organization_id on public.notifications (organization_id);
create index idx_activity_logs_organization_id on public.activity_logs (organization_id);
create index idx_services_organization_id on public.services (organization_id);
create index idx_profiles_organization_id on public.profiles (organization_id);
create index idx_client_services_organization_id on public.client_services (organization_id);
create index idx_content_tasks_organization_id on public.content_tasks (organization_id);
create index idx_task_comments_organization_id on public.task_comments (organization_id);
create index idx_content_comments_organization_id on public.content_comments (organization_id);

-- client_id: client detail pages (Projetos/Tarefas/Conteúdos tabs) filter by this.
create index idx_campaigns_client_id on public.campaigns (client_id);
create index idx_projects_client_id on public.projects (client_id);
create index idx_tasks_client_id on public.tasks (client_id);
create index idx_contents_client_id on public.contents (client_id);
create index idx_calendar_events_client_id on public.calendar_events (client_id);
create index idx_financial_transactions_client_id on public.financial_transactions (client_id);

-- project_id: project detail pages filter tasks/contents by this.
create index idx_tasks_project_id on public.tasks (project_id);
create index idx_contents_project_id on public.contents (project_id);
create index idx_calendar_events_project_id on public.calendar_events (project_id);

-- assignee_id / responsible_id: "minhas tarefas" style filters.
create index idx_tasks_assignee_id on public.tasks (assignee_id);
create index idx_clients_responsible_id on public.clients (responsible_id);
create index idx_projects_responsible_id on public.projects (responsible_id);
create index idx_contents_responsible_id on public.contents (responsible_id);

-- due_date / scheduled_date: Kanban due-filters, calendar range queries.
create index idx_tasks_due_date on public.tasks (due_date);
create index idx_contents_scheduled_date on public.contents (scheduled_date);
create index idx_calendar_events_event_date on public.calendar_events (event_date);

-- status: Kanban columns and status filters.
create index idx_tasks_status on public.tasks (status);
create index idx_contents_status on public.contents (status);
create index idx_projects_status on public.projects (status);
create index idx_clients_status on public.clients (status);

-- join tables and comment threads.
create index idx_client_services_client_id on public.client_services (client_id);
create index idx_client_services_service_id on public.client_services (service_id);
create index idx_content_tasks_content_id on public.content_tasks (content_id);
create index idx_content_tasks_task_id on public.content_tasks (task_id);
create index idx_task_comments_task_id on public.task_comments (task_id);
create index idx_content_comments_content_id on public.content_comments (content_id);
create index idx_calendar_events_task_id on public.calendar_events (task_id);
create index idx_calendar_events_content_id on public.calendar_events (content_id);
create index idx_notifications_user_id on public.notifications (user_id);

-- ------------------------------------------------------------
-- Fonte: supabase/migrations/20260915215811_rls.sql
-- ------------------------------------------------------------
-- ============================================================
-- Row Level Security — every business table is isolated by
-- organization_id. This is enforced in the database, not just in the
-- frontend Data Layer: an authenticated user can only ever
-- SELECT/INSERT/UPDATE/DELETE rows belonging to their own organization.
-- ============================================================

-- organizations: members can see their own org; only admins can edit it.
-- Row creation is deliberately left to service_role (onboarding flow is
-- out of scope for this etapa).
alter table public.organizations enable row level security;

create policy "organizations_select_own" on public.organizations
  for select using (id = public.current_organization_id());

create policy "organizations_update_admin" on public.organizations
  for update using (
    id = public.current_organization_id()
    and exists (
      select 1 from public.profiles p
      join public.roles r on r.id = p.role_id
      where p.id = auth.uid() and r.slug = 'administrador'
    )
  )
  with check (id = public.current_organization_id());

-- roles: global read-only reference data, needed for every "responsável"
-- dropdown. Not organization-scoped, not writable by end users.
alter table public.roles enable row level security;

create policy "roles_select_authenticated" on public.roles
  for select using (auth.uid() is not null);

-- profiles: colleagues in the same org are visible to each other; a user
-- may only edit their own profile.
alter table public.profiles enable row level security;

create policy "profiles_select_same_org" on public.profiles
  for select using (organization_id = public.current_organization_id());

create policy "profiles_update_self" on public.profiles
  for update using (id = auth.uid())
  with check (id = auth.uid());

-- Generic org-isolation policy set, applied to every straightforward
-- org-scoped table below.
do $$
declare
  scoped_tables text[] := array[
    'services', 'clients', 'client_services', 'campaigns', 'projects',
    'tasks', 'task_comments', 'contents', 'content_tasks', 'content_comments',
    'calendar_events', 'financial_categories', 'financial_transactions',
    'files', 'activity_logs'
  ];
  t text;
begin
  foreach t in array scoped_tables loop
    execute format('alter table public.%I enable row level security;', t);

    execute format(
      'create policy "%1$s_select_own_org" on public.%1$s for select using (organization_id = public.current_organization_id());',
      t
    );
    execute format(
      'create policy "%1$s_insert_own_org" on public.%1$s for insert with check (organization_id = public.current_organization_id());',
      t
    );
    execute format(
      'create policy "%1$s_update_own_org" on public.%1$s for update using (organization_id = public.current_organization_id()) with check (organization_id = public.current_organization_id());',
      t
    );
    execute format(
      'create policy "%1$s_delete_own_org" on public.%1$s for delete using (organization_id = public.current_organization_id());',
      t
    );
  end loop;
end;
$$;

-- activity_logs is an append-only audit trail: drop the update/delete
-- policies the loop above created for it, keeping only select + insert.
drop policy "activity_logs_update_own_org" on public.activity_logs;
drop policy "activity_logs_delete_own_org" on public.activity_logs;

-- notifications: org-scoped like the rest, but a user should only ever
-- see and modify their own notifications, not a teammate's.
alter table public.notifications enable row level security;

create policy "notifications_select_own" on public.notifications
  for select using (
    organization_id = public.current_organization_id() and user_id = auth.uid()
  );

create policy "notifications_insert_own_org" on public.notifications
  for insert with check (organization_id = public.current_organization_id());

create policy "notifications_update_own" on public.notifications
  for update using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "notifications_delete_own" on public.notifications
  for delete using (user_id = auth.uid());

-- ------------------------------------------------------------
-- Fonte: supabase/migrations/20260915215812_storage.sql
-- ------------------------------------------------------------
-- ============================================================
-- Storage — bucket infrastructure only. No upload UI is built on top
-- of these yet; this just creates the buckets and the RLS policies
-- that will scope every future upload to the caller's organization.
--
-- Objects are keyed as "<organization_id>/<...rest>", e.g.
--   logos/a0000000-0000-0000-0000-000000000001/logo.png
-- so policies can check the first path segment against the caller's
-- organization without needing an organization_id column on
-- storage.objects itself.
-- ============================================================

insert into storage.buckets (id, name, public)
values
  ('logos', 'logos', true),
  ('client-files', 'client-files', false),
  ('project-files', 'project-files', false),
  ('content-media', 'content-media', false)
on conflict (id) do nothing;

-- Precisa viver em `public`, não em `storage`: num projeto Supabase
-- hospedado, o schema `storage` pertence ao papel interno
-- `supabase_storage_admin` — o `postgres` usado para rodar migrations
-- tem USAGE nesse schema (pode chamar `storage.foldername()`, criar
-- policies em `storage.objects`), mas não tem CREATE nele, então
-- `create function storage.x(...)` falha com "permission denied for
-- schema storage" (confirmado: foi exatamente o erro desta migration
-- na primeira aplicação contra o projeto real). `storage.foldername()`
-- em si é uma função pronta do Supabase, só chamada aqui, não criada.
create or replace function public.organization_folder(object_name text)
returns uuid
language sql
stable
as $$
  select (storage.foldername(object_name))[1]::uuid;
$$;

do $$
declare
  bucket_id text;
begin
  foreach bucket_id in array array['logos', 'client-files', 'project-files', 'content-media']
  loop
    execute format(
      'create policy "%1$s_select_own_org" on storage.objects
         for select using (
           bucket_id = %2$L
           and public.organization_folder(name) = public.current_organization_id()
         );',
      bucket_id, bucket_id
    );

    execute format(
      'create policy "%1$s_insert_own_org" on storage.objects
         for insert with check (
           bucket_id = %2$L
           and public.organization_folder(name) = public.current_organization_id()
         );',
      bucket_id, bucket_id
    );

    execute format(
      'create policy "%1$s_update_own_org" on storage.objects
         for update using (
           bucket_id = %2$L
           and public.organization_folder(name) = public.current_organization_id()
         );',
      bucket_id, bucket_id
    );

    execute format(
      'create policy "%1$s_delete_own_org" on storage.objects
         for delete using (
           bucket_id = %2$L
           and public.organization_folder(name) = public.current_organization_id()
         );',
      bucket_id, bucket_id
    );
  end loop;
end $$;

-- "logos" is a public bucket (client/org logos shown in the UI without
-- auth), but writes still require membership in the owning organization
-- via the policies above — public only relaxes anonymous SELECT of the
-- underlying file, which Supabase Storage handles outside RLS for
-- public buckets.

