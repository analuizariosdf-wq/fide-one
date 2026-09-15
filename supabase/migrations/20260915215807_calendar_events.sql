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
