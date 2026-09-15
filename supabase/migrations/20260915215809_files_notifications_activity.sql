-- Metadata for files stored in Supabase Storage (see storage migration for
-- the actual buckets). Kept separate from Storage's own object table so we
-- can attach a file to any of several entity types without a wide table.
create table public.files (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  client_id uuid references public.clients (id) on delete cascade,
  project_id uuid references public.projects (id) on delete cascade,
  content_id uuid references public.contents (id) on delete cascade,
  task_id uuid references public.tasks (id) on delete cascade,
  bucket text not null,
  path text not null,
  name text not null,
  size_bytes bigint,
  mime_type text,
  uploaded_by uuid references public.profiles (id),
  created_at timestamptz not null default now()
);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  title text not null,
  message text,
  link text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

-- Append-only audit trail. `metadata` carries whatever the calling
-- service considers relevant (before/after values, field names, etc.).
create table public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  actor_id uuid references public.profiles (id),
  entity_type text not null,
  entity_id uuid,
  action text not null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
