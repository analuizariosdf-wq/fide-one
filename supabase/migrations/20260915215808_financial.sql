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
