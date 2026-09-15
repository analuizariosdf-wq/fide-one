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
