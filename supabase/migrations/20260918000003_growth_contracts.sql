-- Growth module: reuses the existing `services` table as the product
-- catalog (it already backs client_services) instead of a parallel
-- `products` table — extra columns only, every existing `select("id,
-- name")` query keeps working unchanged.
alter table public.services
  add column if not exists description text,
  add column if not exists default_price numeric(12, 2),
  add column if not exists billing_type text check (billing_type in ('recorrente', 'pontual')),
  add column if not exists billing_period text,
  add column if not exists category text,
  add column if not exists active boolean not null default true;

-- Contracts: real start/end + recurring value per client, not a
-- simplified start_date/end_date on `clients` (would lose history on
-- renewal/renegotiation). Feeds both Growth's "quantidade vendida" and
-- Financeiro's previsibilidade — both read this table, no duplicate
-- tracking of the same commercial fact.
create table public.contracts (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  client_id uuid not null references public.clients (id) on delete cascade,
  service_id uuid references public.services (id) on delete set null,
  start_date date not null,
  end_date date,
  monthly_value numeric(12, 2),
  billing_period text not null default 'mensal'
    check (billing_period in ('unico', 'mensal', 'trimestral', 'semestral', 'anual')),
  status text not null default 'ativo' check (status in ('ativo', 'suspenso', 'encerrado')),
  auto_renew boolean not null default false,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger contracts_set_updated_at
  before update on public.contracts
  for each row execute function public.set_updated_at();

-- Monthly revenue target + the planned composition of services/quantities
-- to reach it ("esteira de meta"). `revenue_targets` holds the number,
-- `revenue_target_items` the plan; the *actual* sold quantity/revenue is
-- never stored here — it's always computed live from `contracts` so the
-- two can never drift apart.
create table public.revenue_targets (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  period date not null,
  target_amount numeric(12, 2) not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (organization_id, period)
);

create trigger revenue_targets_set_updated_at
  before update on public.revenue_targets
  for each row execute function public.set_updated_at();

create table public.revenue_target_items (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  revenue_target_id uuid not null references public.revenue_targets (id) on delete cascade,
  service_id uuid not null references public.services (id) on delete cascade,
  planned_quantity integer not null default 0,
  created_at timestamptz not null default now(),
  unique (revenue_target_id, service_id)
);

do $$
declare
  scoped_tables text[] := array[
    'contracts', 'revenue_targets', 'revenue_target_items'
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
      'create policy "%1$s_insert_own_org" on public.%1$s for insert with check (organization_id = public.current_organization_id() and public.has_permission(''finance.manage''));',
      t
    );
    execute format(
      'create policy "%1$s_update_own_org" on public.%1$s for update using (organization_id = public.current_organization_id() and public.has_permission(''finance.manage'')) with check (organization_id = public.current_organization_id() and public.has_permission(''finance.manage''));',
      t
    );
    execute format(
      'create policy "%1$s_delete_own_org" on public.%1$s for delete using (organization_id = public.current_organization_id() and public.has_permission(''finance.manage''));',
      t
    );
  end loop;
end $$;

-- Contracts feed both Financeiro (finance.manage to write) and Growth's
-- read-only "quantidade vendida" (growth.view) — select needs either.
drop policy if exists "contracts_select_own_org" on public.contracts;
create policy "contracts_select_own_org" on public.contracts
  for select using (
    organization_id = public.current_organization_id()
    and (public.has_permission('finance.view') or public.has_permission('growth.view'))
  );

-- revenue_targets/revenue_target_items are Growth's own data — gate on
-- growth.manage for writes, growth.view for reads, not finance at all.
drop policy if exists "revenue_targets_select_own_org" on public.revenue_targets;
create policy "revenue_targets_select_own_org" on public.revenue_targets
  for select using (
    organization_id = public.current_organization_id() and public.has_permission('growth.view')
  );
drop policy if exists "revenue_targets_insert_own_org" on public.revenue_targets;
create policy "revenue_targets_insert_own_org" on public.revenue_targets
  for insert with check (
    organization_id = public.current_organization_id() and public.has_permission('growth.manage')
  );
drop policy if exists "revenue_targets_update_own_org" on public.revenue_targets;
create policy "revenue_targets_update_own_org" on public.revenue_targets
  for update using (
    organization_id = public.current_organization_id() and public.has_permission('growth.manage')
  ) with check (
    organization_id = public.current_organization_id() and public.has_permission('growth.manage')
  );
drop policy if exists "revenue_targets_delete_own_org" on public.revenue_targets;
create policy "revenue_targets_delete_own_org" on public.revenue_targets
  for delete using (
    organization_id = public.current_organization_id() and public.has_permission('growth.manage')
  );

drop policy if exists "revenue_target_items_select_own_org" on public.revenue_target_items;
create policy "revenue_target_items_select_own_org" on public.revenue_target_items
  for select using (
    organization_id = public.current_organization_id() and public.has_permission('growth.view')
  );
drop policy if exists "revenue_target_items_insert_own_org" on public.revenue_target_items;
create policy "revenue_target_items_insert_own_org" on public.revenue_target_items
  for insert with check (
    organization_id = public.current_organization_id() and public.has_permission('growth.manage')
  );
drop policy if exists "revenue_target_items_update_own_org" on public.revenue_target_items;
create policy "revenue_target_items_update_own_org" on public.revenue_target_items
  for update using (
    organization_id = public.current_organization_id() and public.has_permission('growth.manage')
  ) with check (
    organization_id = public.current_organization_id() and public.has_permission('growth.manage')
  );
drop policy if exists "revenue_target_items_delete_own_org" on public.revenue_target_items;
create policy "revenue_target_items_delete_own_org" on public.revenue_target_items
  for delete using (
    organization_id = public.current_organization_id() and public.has_permission('growth.manage')
  );
