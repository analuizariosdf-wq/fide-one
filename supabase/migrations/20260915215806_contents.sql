create table public.contents (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  client_id uuid not null references public.clients (id) on delete cascade,
  project_id uuid references public.projects (id) on delete set null,
  title text not null,
  content_type text not null
    check (content_type in (
      'Post', 'Carrossel', 'Reels', 'Story', 'Vídeo', 'Artigo', 'Blog', 'LinkedIn', 'Anúncio'
    )),
  channel text not null
    check (channel in (
      'Instagram', 'Facebook', 'LinkedIn', 'TikTok', 'YouTube', 'Site', 'Google'
    )),
  status text not null default 'ideia'
    check (status in (
      'ideia', 'briefing', 'copy', 'design', 'revisao', 'aprovacao', 'agendado', 'publicado'
    )),
  scheduled_date date,
  scheduled_time time,
  description text,
  caption text,
  cta text,
  responsible_id uuid references public.profiles (id),
  created_by uuid references public.profiles (id),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger contents_set_updated_at
  before update on public.contents
  for each row execute function public.set_updated_at();

-- Many-to-many: a content piece is produced through several tasks.
-- organization_id is denormalized from contents.organization_id, same
-- reasoning as client_services above.
create table public.content_tasks (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  content_id uuid not null references public.contents (id) on delete cascade,
  task_id uuid not null references public.tasks (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (content_id, task_id)
);

create table public.content_comments (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  content_id uuid not null references public.contents (id) on delete cascade,
  author_id uuid references public.profiles (id),
  message text not null,
  created_at timestamptz not null default now()
);
