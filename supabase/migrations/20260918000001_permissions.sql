-- Extensible permissions/RBAC layer on top of the existing `roles` table
-- (its own comment already anticipated this: "a real table ... so future
-- permission rules can hang off role_id without a schema migration").
-- Adding a class means inserting a row into `roles` + `role_permissions`,
-- never a code change or a new migration for the class itself.

create table public.permissions (
  key text primary key,
  description text not null
);

create table public.role_permissions (
  id uuid primary key default gen_random_uuid(),
  role_id uuid not null references public.roles (id) on delete cascade,
  permission_key text not null references public.permissions (key) on delete cascade,
  created_at timestamptz not null default now(),
  unique (role_id, permission_key)
);

insert into public.permissions (key, description) values
  ('dashboard.view', 'Ver o dashboard operacional'),
  ('clients.view', 'Ver clientes'),
  ('clients.manage', 'Criar/editar/excluir clientes'),
  ('projects.view', 'Ver projetos'),
  ('projects.manage', 'Criar/editar/excluir projetos'),
  ('tasks.view', 'Ver tarefas'),
  ('tasks.manage', 'Criar/editar/excluir tarefas'),
  ('contents.view', 'Ver conteúdos'),
  ('contents.manage', 'Criar/editar/excluir conteúdos'),
  ('calendar.view', 'Ver calendário'),
  ('calendar.manage', 'Criar/editar/excluir eventos e etiquetas do calendário'),
  ('crm.view', 'Ver CRM/comercial'),
  ('crm.manage', 'Gerenciar pipelines, etapas e negócios do CRM'),
  ('growth.view', 'Ver metas e produtos de Crescimento'),
  ('growth.manage', 'Gerenciar metas e produtos de Crescimento'),
  ('tickets.view', 'Ver tickets'),
  ('tickets.manage', 'Criar/editar/excluir tickets'),
  ('reports.view', 'Ver relatórios'),
  ('finance.view', 'Ver dados financeiros'),
  ('finance.manage', 'Criar/editar/excluir lançamentos e contratos financeiros'),
  ('team.view', 'Ver a equipe'),
  ('team.manage', 'Convidar, editar e desativar membros da equipe'),
  ('settings.view', 'Ver configurações'),
  ('settings.manage', 'Editar personalização e configurações administrativas');

-- `administrador` becomes the "Diretor" class in the product UI — same
-- slug (nothing referencing it by slug elsewhere breaks), new display name.
update public.roles set name = 'Diretor' where slug = 'administrador';

-- New class: Head de Operação — full operational access, no Financeiro,
-- no administrative settings, no team management.
insert into public.roles (slug, name)
values ('head_operacao', 'Head de Operação')
on conflict (slug) do nothing;

-- Diretor: every permission.
insert into public.role_permissions (role_id, permission_key)
select r.id, p.key
from public.roles r
cross join public.permissions p
where r.slug = 'administrador'
on conflict do nothing;

-- Head de Operação, and every other existing job-title role (gestor,
-- comercial, estrategia, social_media, copy, design, trafego,
-- audiovisual) default to the same operational set — full access to the
-- day-to-day modules, nothing financial or administrative. `financeiro`
-- is the one exception below, since that role exists specifically to
-- work with money.
insert into public.role_permissions (role_id, permission_key)
select r.id, p.key
from public.roles r
cross join public.permissions p
where r.slug in (
    'head_operacao', 'gestor', 'comercial', 'estrategia',
    'social_media', 'copy', 'design', 'trafego', 'audiovisual'
  )
  and p.key in (
    'dashboard.view',
    'clients.view', 'clients.manage',
    'projects.view', 'projects.manage',
    'tasks.view', 'tasks.manage',
    'contents.view', 'contents.manage',
    'calendar.view', 'calendar.manage',
    'crm.view', 'crm.manage',
    'growth.view',
    'tickets.view', 'tickets.manage',
    'reports.view',
    'team.view',
    'settings.view'
  )
on conflict do nothing;

-- `financeiro` role: the operational set above plus full finance access.
insert into public.role_permissions (role_id, permission_key)
select r.id, p.key
from public.roles r
cross join public.permissions p
where r.slug = 'financeiro'
  and p.key in ('finance.view', 'finance.manage')
on conflict do nothing;

-- Mirrors current_organization_id()'s shape/security model exactly.
create or replace function public.has_permission(perm text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.profiles pr
    join public.role_permissions rp on rp.role_id = pr.role_id
    where pr.id = auth.uid() and rp.permission_key = perm
  );
$$;

-- Mirrors the Admin API ban applied by src/app/api/team/[id]/route.ts —
-- the browser client has no RLS-safe way to read auth.users.banned_until,
-- so this column is what the Equipe UI actually reads/filters on. The
-- route handler is the only writer, and always sets both together.
alter table public.profiles add column if not exists deactivated_at timestamptz;

-- Lets a team.manage holder change a colleague's role/name — the existing
-- profiles_update_self policy only ever allowed id = auth.uid(), so there
-- was no way for anyone to manage anyone else's profile before this.
-- Postgres OR's multiple USING policies for the same command together,
-- so this only adds a second allowed path; it never narrows self-update.
create policy "profiles_update_team_manager" on public.profiles
  for update using (
    organization_id = public.current_organization_id() and public.has_permission('team.manage')
  ) with check (
    organization_id = public.current_organization_id() and public.has_permission('team.manage')
  );

-- permissions/role_permissions: global reference data, same read model as
-- `roles` (readable by any authenticated user, never writable from the
-- client — only future migrations change these).
alter table public.permissions enable row level security;
create policy "permissions_select_authenticated" on public.permissions
  for select using (auth.uid() is not null);

alter table public.role_permissions enable row level security;
create policy "role_permissions_select_authenticated" on public.role_permissions
  for select using (auth.uid() is not null);

-- Tighten Financeiro specifically, per the requirement that "Financeiro
-- deve ser protegido também no servidor/RLS" — not just hidden in the UI.
-- Everything else keeps the generic organization_id-only policies from
-- the Etapa 4 RLS migration; only these two tables gain a permission
-- check on top of the existing tenant isolation.
drop policy if exists "financial_transactions_select_own_org" on public.financial_transactions;
create policy "financial_transactions_select_own_org" on public.financial_transactions
  for select using (
    organization_id = public.current_organization_id()
    and public.has_permission('finance.view')
  );

drop policy if exists "financial_transactions_insert_own_org" on public.financial_transactions;
create policy "financial_transactions_insert_own_org" on public.financial_transactions
  for insert with check (
    organization_id = public.current_organization_id()
    and public.has_permission('finance.manage')
  );

drop policy if exists "financial_transactions_update_own_org" on public.financial_transactions;
create policy "financial_transactions_update_own_org" on public.financial_transactions
  for update using (
    organization_id = public.current_organization_id()
    and public.has_permission('finance.manage')
  ) with check (
    organization_id = public.current_organization_id()
    and public.has_permission('finance.manage')
  );

drop policy if exists "financial_transactions_delete_own_org" on public.financial_transactions;
create policy "financial_transactions_delete_own_org" on public.financial_transactions
  for delete using (
    organization_id = public.current_organization_id()
    and public.has_permission('finance.manage')
  );

drop policy if exists "financial_categories_select_own_org" on public.financial_categories;
create policy "financial_categories_select_own_org" on public.financial_categories
  for select using (
    organization_id = public.current_organization_id()
    and public.has_permission('finance.view')
  );

drop policy if exists "financial_categories_insert_own_org" on public.financial_categories;
create policy "financial_categories_insert_own_org" on public.financial_categories
  for insert with check (
    organization_id = public.current_organization_id()
    and public.has_permission('finance.manage')
  );

drop policy if exists "financial_categories_update_own_org" on public.financial_categories;
create policy "financial_categories_update_own_org" on public.financial_categories
  for update using (
    organization_id = public.current_organization_id()
    and public.has_permission('finance.manage')
  ) with check (
    organization_id = public.current_organization_id()
    and public.has_permission('finance.manage')
  );

drop policy if exists "financial_categories_delete_own_org" on public.financial_categories;
create policy "financial_categories_delete_own_org" on public.financial_categories
  for delete using (
    organization_id = public.current_organization_id()
    and public.has_permission('finance.manage')
  );
