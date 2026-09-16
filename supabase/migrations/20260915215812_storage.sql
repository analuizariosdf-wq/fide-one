-- ============================================================
-- Storage — bucket infrastructure only. No upload UI is built on top
-- of these yet; this just creates the buckets and the RLS policies
-- that will scope every future upload to the caller's organization.
--
-- Objects are keyed as "<organization_id>/<...rest>", e.g.
--   logos/a0000000-0000-0000-0000-000000000001/logo.png
-- so policies can check the first path segment against the caller's
-- organization without needing an organization_id column on
-- storage.objects itself.
-- ============================================================

insert into storage.buckets (id, name, public)
values
  ('logos', 'logos', true),
  ('client-files', 'client-files', false),
  ('project-files', 'project-files', false),
  ('content-media', 'content-media', false)
on conflict (id) do nothing;

-- Precisa viver em `public`, não em `storage`: num projeto Supabase
-- hospedado, o schema `storage` pertence ao papel interno
-- `supabase_storage_admin` — o `postgres` usado para rodar migrations
-- tem USAGE nesse schema (pode chamar `storage.foldername()`, criar
-- policies em `storage.objects`), mas não tem CREATE nele, então
-- `create function storage.x(...)` falha com "permission denied for
-- schema storage" (confirmado: foi exatamente o erro desta migration
-- na primeira aplicação contra o projeto real). `storage.foldername()`
-- em si é uma função pronta do Supabase, só chamada aqui, não criada.
create or replace function public.organization_folder(object_name text)
returns uuid
language sql
stable
as $$
  select (storage.foldername(object_name))[1]::uuid;
$$;

do $$
declare
  bucket_id text;
begin
  foreach bucket_id in array array['logos', 'client-files', 'project-files', 'content-media']
  loop
    execute format(
      'create policy "%1$s_select_own_org" on storage.objects
         for select using (
           bucket_id = %2$L
           and public.organization_folder(name) = public.current_organization_id()
         );',
      bucket_id, bucket_id
    );

    execute format(
      'create policy "%1$s_insert_own_org" on storage.objects
         for insert with check (
           bucket_id = %2$L
           and public.organization_folder(name) = public.current_organization_id()
         );',
      bucket_id, bucket_id
    );

    execute format(
      'create policy "%1$s_update_own_org" on storage.objects
         for update using (
           bucket_id = %2$L
           and public.organization_folder(name) = public.current_organization_id()
         );',
      bucket_id, bucket_id
    );

    execute format(
      'create policy "%1$s_delete_own_org" on storage.objects
         for delete using (
           bucket_id = %2$L
           and public.organization_folder(name) = public.current_organization_id()
         );',
      bucket_id, bucket_id
    );
  end loop;
end $$;

-- "logos" is a public bucket (client/org logos shown in the UI without
-- auth), but writes still require membership in the owning organization
-- via the policies above — public only relaxes anonymous SELECT of the
-- underlying file, which Supabase Storage handles outside RLS for
-- public buckets.
