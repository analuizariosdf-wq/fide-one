-- White-label identity for the organization. `name`/`logo_url` already
-- existed (Etapa 4) — this only adds the handful of extra fields needed
-- for a configurable brand, all nullable so every existing organization
-- keeps rendering the current FIDE ONE identity (app code falls back to
-- "FIDE ONE" + the current accent purple when these are null).
alter table public.organizations
  add column if not exists display_name text,
  add column if not exists accent_color text,
  add column if not exists favicon_url text;

comment on column public.organizations.display_name is
  'System/brand name shown in sidebar, header, login and <title> — falls back to `name` when null.';
comment on column public.organizations.accent_color is
  'Hex color (e.g. #5B3CC4) applied as the app''s primary/accent color — falls back to the default FIDE purple when null.';
comment on column public.organizations.favicon_url is
  'Optional favicon override, same "logos" bucket as logo_url.';

-- Generalize the admin-only update policy to the new permission system
-- instead of hardcoding the role slug — same access (only the Diretor
-- role holds settings.manage today), but extensible without editing RLS
-- again if a future role should also manage organization settings.
drop policy if exists "organizations_update_admin" on public.organizations;
create policy "organizations_update_admin" on public.organizations
  for update using (
    id = public.current_organization_id()
    and public.has_permission('settings.manage')
  )
  with check (id = public.current_organization_id());
