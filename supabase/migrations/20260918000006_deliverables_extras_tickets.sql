-- Contracted scope per client. Links to a contract when there is one
-- (optional — a client can have deliverables tracked before/without a
-- formal contract row) and optionally to the service/product catalog.
-- `delivered_count` is a plain counter the team updates manually — Fase
-- 9-era content/task data doesn't carry a reliable "which deliverable
-- does this fulfill" link, so automatic computation is left as a
-- documented post-MVP improvement rather than a fragile guess.
create table public.deliverables (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  client_id uuid not null references public.clients (id) on delete cascade,
  contract_id uuid references public.contracts (id) on delete set null,
  service_id uuid references public.services (id) on delete set null,
  name text not null,
  quantity integer not null default 1,
  billing_period text not null default 'mensal'
    check (billing_period in ('unico', 'semanal', 'mensal', 'trimestral', 'anual')),
  start_date date,
  end_date date,
  status text not null default 'ativo' check (status in ('ativo', 'pausado', 'encerrado')),
  delivered_count integer not null default 0,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger deliverables_set_updated_at
  before update on public.deliverables
  for each row execute function public.set_updated_at();

-- Out-of-scope work — can originate from a task, ticket or content (all
-- optional/nullable, exactly one is normally set) or stand alone with
-- just a description. Flagged in the UI as "EXTRA" wherever it's shown.
create table public.service_extras (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  client_id uuid not null references public.clients (id) on delete cascade,
  service_id uuid references public.services (id) on delete set null,
  task_id uuid references public.tasks (id) on delete set null,
  content_id uuid references public.contents (id) on delete set null,
  description text not null,
  occurred_on date not null default current_date,
  status text not null default 'registrado' check (status in ('registrado', 'cobrado', 'cortesia')),
  created_at timestamptz not null default now()
);

-- Internal tickets — organization-scoped, optionally tied to a client or
-- project for context, never a public/customer-facing support desk.
create table public.tickets (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  title text not null,
  description text,
  requester_id uuid references public.profiles (id) on delete set null,
  assignee_id uuid references public.profiles (id) on delete set null,
  client_id uuid references public.clients (id) on delete set null,
  project_id uuid references public.projects (id) on delete set null,
  category text,
  priority text not null default 'normal' check (priority in ('baixa', 'normal', 'alta', 'urgente')),
  status text not null default 'aberto'
    check (status in ('aberto', 'em_andamento', 'aguardando', 'resolvido', 'fechado')),
  due_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger tickets_set_updated_at
  before update on public.tickets
  for each row execute function public.set_updated_at();

create table public.ticket_comments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  ticket_id uuid not null references public.tickets (id) on delete cascade,
  author_id uuid references public.profiles (id) on delete set null,
  message text not null,
  created_at timestamptz not null default now()
);

do $$
declare
  scoped_tables text[] := array[
    'deliverables', 'service_extras', 'tickets', 'ticket_comments'
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
end $$;

-- deliverables/service_extras are Financeiro-adjacent commercial data —
-- gate the same way as contracts (finance.manage to write; readable by
-- finance.view or clients.view since they also surface on the client page).
drop policy if exists "deliverables_select_own_org" on public.deliverables;
create policy "deliverables_select_own_org" on public.deliverables
  for select using (
    organization_id = public.current_organization_id() and public.has_permission('clients.view')
  );
drop policy if exists "deliverables_insert_own_org" on public.deliverables;
create policy "deliverables_insert_own_org" on public.deliverables
  for insert with check (
    organization_id = public.current_organization_id() and public.has_permission('clients.manage')
  );
drop policy if exists "deliverables_update_own_org" on public.deliverables;
create policy "deliverables_update_own_org" on public.deliverables
  for update using (
    organization_id = public.current_organization_id() and public.has_permission('clients.manage')
  ) with check (
    organization_id = public.current_organization_id() and public.has_permission('clients.manage')
  );
drop policy if exists "deliverables_delete_own_org" on public.deliverables;
create policy "deliverables_delete_own_org" on public.deliverables
  for delete using (
    organization_id = public.current_organization_id() and public.has_permission('clients.manage')
  );

drop policy if exists "service_extras_select_own_org" on public.service_extras;
create policy "service_extras_select_own_org" on public.service_extras
  for select using (
    organization_id = public.current_organization_id() and public.has_permission('clients.view')
  );
drop policy if exists "service_extras_insert_own_org" on public.service_extras;
create policy "service_extras_insert_own_org" on public.service_extras
  for insert with check (
    organization_id = public.current_organization_id() and public.has_permission('clients.manage')
  );
drop policy if exists "service_extras_update_own_org" on public.service_extras;
create policy "service_extras_update_own_org" on public.service_extras
  for update using (
    organization_id = public.current_organization_id() and public.has_permission('clients.manage')
  ) with check (
    organization_id = public.current_organization_id() and public.has_permission('clients.manage')
  );
drop policy if exists "service_extras_delete_own_org" on public.service_extras;
create policy "service_extras_delete_own_org" on public.service_extras
  for delete using (
    organization_id = public.current_organization_id() and public.has_permission('clients.manage')
  );

drop policy if exists "tickets_select_own_org" on public.tickets;
create policy "tickets_select_own_org" on public.tickets
  for select using (
    organization_id = public.current_organization_id() and public.has_permission('tickets.view')
  );
drop policy if exists "tickets_insert_own_org" on public.tickets;
create policy "tickets_insert_own_org" on public.tickets
  for insert with check (
    organization_id = public.current_organization_id() and public.has_permission('tickets.manage')
  );
drop policy if exists "tickets_update_own_org" on public.tickets;
create policy "tickets_update_own_org" on public.tickets
  for update using (
    organization_id = public.current_organization_id() and public.has_permission('tickets.manage')
  ) with check (
    organization_id = public.current_organization_id() and public.has_permission('tickets.manage')
  );
drop policy if exists "tickets_delete_own_org" on public.tickets;
create policy "tickets_delete_own_org" on public.tickets
  for delete using (
    organization_id = public.current_organization_id() and public.has_permission('tickets.manage')
  );

drop policy if exists "ticket_comments_select_own_org" on public.ticket_comments;
create policy "ticket_comments_select_own_org" on public.ticket_comments
  for select using (
    organization_id = public.current_organization_id() and public.has_permission('tickets.view')
  );
drop policy if exists "ticket_comments_insert_own_org" on public.ticket_comments;
create policy "ticket_comments_insert_own_org" on public.ticket_comments
  for insert with check (
    organization_id = public.current_organization_id() and public.has_permission('tickets.manage')
  );
