-- ============================================================
-- Verificação de estrutura — só leitura, seguro rodar quantas vezes
-- quiser, a qualquer momento (FASE B e FASE G do runbook em
-- /docs/supabase-deployment.md).
--
-- Cole cada bloco (ou o arquivo inteiro) no SQL Editor do Supabase.
-- Nenhuma dessas queries modifica dados.
-- ============================================================

-- ---------- 1) As 19 tabelas de negócio existem? ----------
-- Esperado: 19 linhas.
select table_name
from information_schema.tables
where table_schema = 'public'
order by table_name;

-- ---------- 2) Colunas obrigatórias em cada tabela ----------
-- Esperado: toda tabela (exceto as de junção puras) com id (uuid),
-- created_at e, quando listado nas migrations, updated_at.
select table_name, column_name, data_type, is_nullable, column_default
from information_schema.columns
where table_schema = 'public'
order by table_name, ordinal_position;

-- ---------- 3) organization_id presente e NOT NULL nas tabelas de negócio ----------
-- Esperado: uma linha por tabela listada, is_nullable = 'NO'.
select table_name, is_nullable
from information_schema.columns
where table_schema = 'public'
  and column_name = 'organization_id'
order by table_name;

-- ---------- 4) Foreign keys ----------
select
  tc.table_name, kcu.column_name,
  ccu.table_name as referenced_table, ccu.column_name as referenced_column,
  rc.delete_rule
from information_schema.table_constraints tc
join information_schema.key_column_usage kcu on kcu.constraint_name = tc.constraint_name
join information_schema.constraint_column_usage ccu on ccu.constraint_name = tc.constraint_name
join information_schema.referential_constraints rc on rc.constraint_name = tc.constraint_name
where tc.constraint_type = 'FOREIGN KEY' and tc.table_schema = 'public'
order by tc.table_name, kcu.column_name;

-- ---------- 5) Primary keys são uuid? ----------
select tc.table_name, kcu.column_name, c.data_type
from information_schema.table_constraints tc
join information_schema.key_column_usage kcu on kcu.constraint_name = tc.constraint_name
join information_schema.columns c
  on c.table_name = tc.table_name and c.column_name = kcu.column_name and c.table_schema = 'public'
where tc.constraint_type = 'PRIMARY KEY' and tc.table_schema = 'public'
order by tc.table_name;

-- ---------- 6) Índices criados ----------
-- Esperado: 45 índices "idx_*" além dos automáticos de PK/UNIQUE.
select indexname, tablename
from pg_indexes
where schemaname = 'public' and indexname like 'idx_%'
order by tablename, indexname;

-- ---------- 7) Triggers ----------
-- Esperado: um "..._set_updated_at" por tabela com updated_at, mais
-- "on_auth_user_created" em auth.users.
select event_object_schema, event_object_table, trigger_name, action_timing, event_manipulation
from information_schema.triggers
where trigger_schema in ('public', 'auth')
order by event_object_table, trigger_name;

-- ---------- 8) Funções relevantes ----------
-- Esperado: current_organization_id, handle_new_user, set_updated_at,
-- e (se a migration de storage rodou) organization_folder.
select routine_schema, routine_name, security_type
from information_schema.routines
where routine_schema in ('public', 'storage')
  and routine_name in ('current_organization_id', 'handle_new_user', 'set_updated_at', 'organization_folder')
order by routine_schema, routine_name;

-- ---------- 9) RLS habilitado em todas as tabelas de negócio ----------
-- Esperado: rowsecurity = true em todas as 19 linhas.
select schemaname, tablename, rowsecurity
from pg_tables
where schemaname = 'public'
order by tablename;

-- ---------- 10) Políticas RLS criadas ----------
-- Esperado: 4 políticas (select/insert/update/delete) por tabela
-- "comum", só select+insert em activity_logs, e o conjunto específico
-- de organizations/roles/profiles/notifications (ver migration de RLS).
select tablename, policyname, cmd, roles
from pg_policies
where schemaname = 'public'
order by tablename, cmd;

-- ---------- 11) Buckets de Storage ----------
-- Esperado: logos (public=true), client-files, project-files,
-- content-media (public=false).
select id, name, public from storage.buckets order by id;

-- ---------- 12) Políticas de Storage ----------
-- Esperado: 16 políticas (4 buckets × select/insert/update/delete).
select policyname, cmd
from pg_policies
where schemaname = 'storage' and tablename = 'objects'
order by policyname;

-- ---------- 13) Roles fixos (taxonomia dos 10 papéis) ----------
-- Esperado: 10 linhas.
select slug, name from public.roles order by name;

-- ---------- 14) Organização(ões) e contagem de profiles por org ----------
select o.id, o.name, o.slug, count(p.id) as total_profiles
from public.organizations o
left join public.profiles p on p.organization_id = o.id
group by o.id, o.name, o.slug
order by o.name;
