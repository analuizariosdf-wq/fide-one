-- ============================================================
-- Testes de RLS — isolamento entre organizações, notifications,
-- profiles e activity_logs (FASE H do runbook em
-- /docs/supabase-deployment.md).
--
-- Pré-requisito: Fases C a G já concluídas (organização "Fide
-- Comunicação", os 5 usuários de desenvolvimento e o seed de dados já
-- existem — rode verification.sql se tiver dúvida).
--
-- Como funciona: cada bloco troca a sessão do SQL Editor (que roda
-- como "postgres", ignorando RLS) para o papel "authenticated" e
-- injeta o claim JWT "sub" com o id de um profile real — exatamente o
-- que o PostgREST faz com o token de um usuário logado de verdade.
-- `auth.uid()` (usado em toda política) lê esse claim.
--
-- Todo INSERT que ESPERA dar erro de RLS fica entre "savepoint" e
-- "rollback to savepoint": sem isso, um erro deixaria o resto da
-- transação inteira abortado (Postgres exige isso; não é bug do
-- script). Se um "ESPERADO: ERRO" não der erro nenhum, é sinal real de
-- falha na política — me avise imediatamente.
--
-- Rode este arquivo INTEIRO de uma vez (um único "Run" no SQL Editor).
-- A seção 1 cria uma organização e um usuário rival DENTRO de uma
-- transação com ROLLBACK no final — nada disso fica salvo, é só para
-- provar o isolamento; nunca insira usuários de teste fora de uma
-- transação como essa.
--
-- Cada query importante vem com um comentário "ESPERADO:" logo acima.
-- Copie os resultados reais (e qualquer erro) e me mande de volta.
-- ============================================================

-- ============================================================
-- SEÇÃO 1 — Isolamento entre organizações (o teste mais importante)
-- ============================================================
begin;

insert into public.organizations (id, name, slug) values
  ('99999999-9999-9999-9999-999999999999', 'Organização Rival (teste, será desfeito)', 'rival-teste-temporario');

insert into auth.users (id, email, raw_user_meta_data, created_at, updated_at)
values (
  '99999999-9999-9999-9999-999999999998',
  'rival-teste@example.com',
  jsonb_build_object(
    'organization_id', '99999999-9999-9999-9999-999999999999',
    'name', 'Rival Teste',
    'role_slug', 'administrador'
  ),
  now(), now()
);

-- ESPERADO: 1 linha — confirma que handle_new_user criou o profile do rival.
select id, organization_id, name from public.profiles where email = 'rival-teste@example.com';

-- Como o rival, cria um cliente na própria organização (deve funcionar).
-- IMPORTANTE: o set_config roda ANTES do "set role" — se rodasse
-- depois, a própria consulta que busca o id do rival já seria
-- bloqueada pelo RLS (ainda sem claim nenhum definido).
select set_config('request.jwt.claim.sub', (select id::text from public.profiles where email = 'rival-teste@example.com'), false);
set role authenticated;

insert into public.clients (organization_id, name, segment)
values ('99999999-9999-9999-9999-999999999999', 'Cliente do Rival', 'Teste');

-- ESPERADO: 1 (o rival vê o próprio cliente que acabou de criar)
select count(*) as rival_ve_proprios_clientes from public.clients;

-- ESPERADO: 0 (o rival NÃO vê nenhum dado da Fide Comunicação)
select count(*) as rival_ve_clientes_fide from public.clients
  where organization_id = (select id from public.organizations where slug = 'fide');
select count(*) as rival_ve_tasks_fide from public.tasks
  where organization_id = (select id from public.organizations where slug = 'fide');
select count(*) as rival_ve_contents_fide from public.contents
  where organization_id = (select id from public.organizations where slug = 'fide');

-- ESPERADO: ERRO "new row violates row-level security policy" — o
-- rival tenta forjar organization_id da Fide num INSERT.
savepoint before_rival_attack;
insert into public.clients (organization_id, name, segment)
values ((select id from public.organizations where slug = 'fide'), 'Cliente invasor', 'Ataque');
rollback to savepoint before_rival_attack;

reset role;

-- Agora como o Daniel (Fide), confirma a visão simétrica.
select set_config('request.jwt.claim.sub', (select id::text from public.profiles where email = 'daniel@fide.com.br'), false);
set role authenticated;

-- ESPERADO: 7 (só os clientes da Fide, nunca o do rival)
select count(*) as daniel_ve_clientes_fide from public.clients;

-- ESPERADO: 0 — Daniel não enxerga o cliente do rival mesmo filtrando pelo id dele.
select count(*) as daniel_ve_cliente_rival from public.clients
  where organization_id = '99999999-9999-9999-9999-999999999999';

-- ESPERADO: UPDATE 0 — não é erro, é RLS filtrando a linha antes do
-- UPDATE enxergar; a linha do rival simplesmente não existe do ponto
-- de vista do Daniel.
update public.clients set name = 'Hackeado'
  where organization_id = '99999999-9999-9999-9999-999999999999';

-- ESPERADO: DELETE 0, pelo mesmo motivo.
delete from public.clients where organization_id = '99999999-9999-9999-9999-999999999999';

-- ESPERADO: ERRO de RLS — Daniel tenta criar um cliente forjando o
-- organization_id do rival.
savepoint before_fide_attack;
insert into public.clients (organization_id, name, segment)
values ('99999999-9999-9999-9999-999999999999', 'Cliente forjado pela Fide', 'Ataque');
rollback to savepoint before_fide_attack;

reset role;
rollback; -- desfaz TUDO desta seção (org rival, usuário rival, cliente do rival).


-- ============================================================
-- SEÇÃO 2 — notifications (user_id = auth.uid())
-- ============================================================
begin;

-- Como postgres (sem RLS), cria uma notificação para o Daniel e outra
-- para a Fernanda, na mesma organização.
insert into public.notifications (organization_id, user_id, title)
select (select id from public.organizations where slug = 'fide'),
       (select id from public.profiles where email = 'daniel@fide.com.br'),
       'Notificação de teste — Daniel';

insert into public.notifications (organization_id, user_id, title)
select (select id from public.organizations where slug = 'fide'),
       (select id from public.profiles where email = 'fernanda@fide.com.br'),
       'Notificação de teste — Fernanda';

select set_config('request.jwt.claim.sub', (select id::text from public.profiles where email = 'daniel@fide.com.br'), false);
set role authenticated;

-- ESPERADO: 1 — só a notificação do próprio Daniel, mesmo estando na
-- mesma organização da Fernanda.
select count(*) as daniel_ve_proprias_notificacoes from public.notifications;
select title from public.notifications;

reset role;
rollback;


-- ============================================================
-- SEÇÃO 3 — profiles (colegas visíveis, edição só do próprio)
-- ============================================================
begin;

select set_config('request.jwt.claim.sub', (select id::text from public.profiles where email = 'daniel@fide.com.br'), false);
set role authenticated;

-- ESPERADO: 5 — Daniel vê todos os colegas da própria organização.
select count(*) as daniel_ve_colegas from public.profiles;

-- ESPERADO: UPDATE 1 — Daniel pode atualizar o próprio profile.
update public.profiles set name = 'Daniel Atualizado'
  where id = (select id from public.profiles where email = 'daniel@fide.com.br');

-- ESPERADO: UPDATE 0 — Daniel NÃO pode atualizar o profile da Fernanda.
update public.profiles set name = 'Fernanda Hackeada'
  where email = 'fernanda@fide.com.br';

reset role;
rollback;


-- ============================================================
-- SEÇÃO 4 — activity_logs (append-only: select + insert, sem update/delete)
-- ============================================================
begin;

select set_config('request.jwt.claim.sub', (select id::text from public.profiles where email = 'daniel@fide.com.br'), false);
set role authenticated;

-- ESPERADO: INSERT 1 — funciona normalmente.
insert into public.activity_logs (organization_id, actor_id, entity_type, entity_id, action)
values (
  (select id from public.organizations where slug = 'fide'),
  (select id from public.profiles where email = 'daniel@fide.com.br'),
  'client', 'a0000000-0000-0000-0000-000000000201', 'test.created'
);

-- ESPERADO: 1 — o registro criado é visível.
select count(*) as daniel_ve_log_criado from public.activity_logs where action = 'test.created';

-- ESPERADO: UPDATE 0 (não é erro). Sem política de UPDATE nesta
-- tabela, o Postgres trata como "using (false)" pra esse comando — a
-- linha existe, mas fica invisível para UPDATE/DELETE. Resultado: o
-- log nunca é alterado nem apagado por ninguém além do service_role.
savepoint before_update_log;
update public.activity_logs set action = 'test.tampered' where action = 'test.created';
rollback to savepoint before_update_log;

-- ESPERADO: DELETE 0, pelo mesmo motivo (sem política de DELETE).
savepoint before_delete_log;
delete from public.activity_logs where action = 'test.created';
rollback to savepoint before_delete_log;

reset role;
rollback;
