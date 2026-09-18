-- Labels belong to the organization (one shared palette), attached
-- many-to-many to both Contents and standalone Calendar events so the
-- same "Urgente"/"Cliente"/"Aprovação" tag works on either without two
-- separate label tables.
create table public.labels (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  name text not null,
  color text not null default '#6B6B6B',
  created_at timestamptz not null default now(),
  unique (organization_id, name)
);

create table public.content_labels (
  content_id uuid not null references public.contents (id) on delete cascade,
  label_id uuid not null references public.labels (id) on delete cascade,
  organization_id uuid not null references public.organizations (id) on delete cascade,
  primary key (content_id, label_id)
);

create table public.calendar_event_labels (
  calendar_event_id uuid not null references public.calendar_events (id) on delete cascade,
  label_id uuid not null references public.labels (id) on delete cascade,
  organization_id uuid not null references public.organizations (id) on delete cascade,
  primary key (calendar_event_id, label_id)
);

-- Task reminders: a rule (offset + optional time), not a queue entry —
-- the cron job computes "is this due today" on read. `sent_at` marks a
-- specific occurrence as dispatched so a daily cron run never re-sends
-- the same reminder. Channel is a plain text column, not an enum, so
-- adding "whatsapp" later needs no migration — see src/lib/notifications.
create table public.task_reminders (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  task_id uuid not null references public.tasks (id) on delete cascade,
  offset_days integer not null default 0,
  remind_time time,
  channel text not null default 'email' check (channel in ('email', 'whatsapp')),
  sent_at timestamptz,
  created_at timestamptz not null default now()
);

do $$
declare
  scoped_tables text[] := array['labels', 'task_reminders'];
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

alter table public.content_labels enable row level security;
create policy "content_labels_select_own_org" on public.content_labels
  for select using (organization_id = public.current_organization_id());
create policy "content_labels_insert_own_org" on public.content_labels
  for insert with check (organization_id = public.current_organization_id());
create policy "content_labels_delete_own_org" on public.content_labels
  for delete using (organization_id = public.current_organization_id());

alter table public.calendar_event_labels enable row level security;
create policy "calendar_event_labels_select_own_org" on public.calendar_event_labels
  for select using (organization_id = public.current_organization_id());
create policy "calendar_event_labels_insert_own_org" on public.calendar_event_labels
  for insert with check (organization_id = public.current_organization_id());
create policy "calendar_event_labels_delete_own_org" on public.calendar_event_labels
  for delete using (organization_id = public.current_organization_id());

-- The reminders cron runs as service_role (server-only, see
-- src/app/api/cron/task-reminders/route.ts) and reads/writes across every
-- organization in one pass, which is exactly what service_role bypassing
-- RLS is for — no additional policy needed for it.
