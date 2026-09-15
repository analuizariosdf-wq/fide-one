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
