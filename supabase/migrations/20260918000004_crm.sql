-- CRM: fully user-configurable pipelines/stages (no fixed stage list —
-- the app never hardcodes stage names). `source`/`service_id` on leads
-- double as the integration point for future Meta Leads/site form/
-- WhatsApp ingestion: those would just insert a crm_leads row with
-- `source` set accordingly, no schema change needed later.
create table public.crm_pipelines (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  name text not null,
  position integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.crm_stages (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  pipeline_id uuid not null references public.crm_pipelines (id) on delete cascade,
  name text not null,
  color text not null default '#6B6B6B',
  position integer not null default 0,
  is_won boolean not null default false,
  is_lost boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.crm_leads (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  pipeline_id uuid not null references public.crm_pipelines (id) on delete cascade,
  stage_id uuid not null references public.crm_stages (id) on delete cascade,
  name text not null,
  company text,
  phone text,
  whatsapp text,
  email text,
  responsible_id uuid references public.profiles (id) on delete set null,
  source text,
  service_id uuid references public.services (id) on delete set null,
  expected_value numeric(12, 2),
  entry_date date not null default current_date,
  expected_close_date date,
  notes text,
  status text not null default 'aberto' check (status in ('aberto', 'ganho', 'perdido')),
  lost_reason text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger crm_leads_set_updated_at
  before update on public.crm_leads
  for each row execute function public.set_updated_at();

-- Minimal movement history (who moved the card, from/to which stage,
-- when) — enough for a lead's "histórico mínimo de movimentação"
-- without turning this into a full activity log.
create table public.crm_lead_stage_history (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  lead_id uuid not null references public.crm_leads (id) on delete cascade,
  from_stage_id uuid references public.crm_stages (id) on delete set null,
  to_stage_id uuid not null references public.crm_stages (id) on delete set null,
  moved_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

do $$
declare
  scoped_tables text[] := array[
    'crm_pipelines', 'crm_stages', 'crm_leads', 'crm_lead_stage_history'
  ];
  t text;
begin
  foreach t in array scoped_tables loop
    execute format('alter table public.%I enable row level security;', t);
    execute format(
      'create policy "%1$s_select_own_org" on public.%1$s for select using (organization_id = public.current_organization_id() and public.has_permission(''crm.view''));',
      t
    );
    execute format(
      'create policy "%1$s_insert_own_org" on public.%1$s for insert with check (organization_id = public.current_organization_id() and public.has_permission(''crm.manage''));',
      t
    );
    execute format(
      'create policy "%1$s_update_own_org" on public.%1$s for update using (organization_id = public.current_organization_id() and public.has_permission(''crm.manage'')) with check (organization_id = public.current_organization_id() and public.has_permission(''crm.manage''));',
      t
    );
    execute format(
      'create policy "%1$s_delete_own_org" on public.%1$s for delete using (organization_id = public.current_organization_id() and public.has_permission(''crm.manage''));',
      t
    );
  end loop;
end $$;
