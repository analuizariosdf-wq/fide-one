# FIDE ONE — Estado do Projeto

> Checkpoint para retomar o desenvolvimento em uma nova sessão. Leia este
> arquivo (e `docs/supabase-deployment.md` se for mexer em infraestrutura)
> antes de alterar qualquer código.

Branch de trabalho: `claude/fide-one-initialization-dy5ijl`.

## 1. Visão geral do produto

FIDE ONE é o sistema operacional interno da Fide Comunicação (agência de
comunicação/marketing). Módulos previstos: Dashboard, Clientes, Projetos,
Tarefas (Kanban), Conteúdos (fluxo editorial), Calendário, Financeiro,
Equipe/permissões, Relatórios. Design deliberadamente "não parece um app de
IA" — sem gradientes/glow/chat-UI, ícones Lucide, fonte Inter.

## 2. Arquitetura

- Next.js (App Router) + TypeScript + Tailwind v4 + primitivas próprias no
  estilo shadcn/ui (`src/components/ui/`).
- Supabase: Postgres + Auth (GoTrue) + Storage. Projeto hospedado real já
  conectado e provisionado (ver seção 3).
- Padrão de Data Layer: cada módulo tem hooks (`useX`/`useXs`) + funções
  CRUD assíncronas em `src/lib/data/` (real) ou `src/lib/services/` (mock).
  Consultas ao Supabase são sempre flat queries + join em JS — nunca
  embedded selects do PostgREST (ver seção 10).
- Auth/organização: contexto resolvido uma vez por request no Server
  Component `src/app/(app)/layout.tsx` via `getCurrentActor()`
  (`src/lib/auth/get-current-actor.ts`) e disponibilizado por
  `useCurrentActor()` (`src/lib/auth/current-actor-context.tsx`). Não busca
  de novo em cada componente.
- Deploy de infraestrutura: `.github/workflows/deploy-supabase.yml`,
  disparado manualmente na aba Actions do GitHub (nunca automático em push).
  Runbook completo em `docs/supabase-deployment.md`.

## 3. Banco de dados

19 tabelas, migrations em `supabase/migrations/*.sql` (fonte de verdade —
nunca editar uma já aplicada; nova mudança de schema = nova migration).
Já aplicadas no Supabase hospedado real (confirmado, workflow #5 = SUCCESS):

`organizations, roles, profiles, services, clients, client_services,
campaigns, projects, tasks, task_comments, contents, content_tasks,
content_comments, calendar_events, financial_categories,
financial_transactions, files, notifications, activity_logs`.

Todas com UUID PK, a maioria com `created_at`/`updated_at` (trigger
`set_updated_at`). `financial_*` e `files`/`notifications`/`activity_logs`
são schema-only (sem UI ainda). Tipos TypeScript em
`src/lib/supabase/database.types.ts` (escritos à mão, verificados contra o
schema real — `supabase gen types` não disponível neste sandbox).

## 4. Autenticação (Fase 5.1 — feita nesta sessão)

- `/login`: `supabase.auth.signInWithPassword`, com distinção de erro
  (falha de rede/config vs. credencial errada vs. genérico) —
  `src/app/login/page.tsx`.
- `middleware.ts` (raiz) → `src/lib/supabase/middleware.ts`: redireciona
  não-autenticado para `/login?redirectTo=...`; autenticado em `/login`
  volta para `/`. Roda em toda request (exceto assets estáticos).
- Logout real: `src/components/shell/header.tsx` (`supabase.auth.signOut()`).
- Contexto único: `getCurrentActor()` (server) resolve
  `user/profile/organization/organizationId/role` numa passada só, sempre
  que uma página de `(app)` é servida; `useCurrentActor()` (client) lê esse
  valor já pronto — nenhum componente busca isso de novo.
- `src/app/error.tsx`: error boundary raiz — pega qualquer falha ao
  renderizar `(app)/layout.tsx` (ex.: Supabase inacessível/mal configurado)
  e mostra uma mensagem amigável com botão "Tentar novamente" em vez do
  erro técnico do Next.js. Fica em `app/`, não em `app/(app)/`, porque
  `error.tsx` nunca captura erro do `layout.tsx` do próprio segmento — só
  de segmentos filhos.
- `middleware.ts` nunca deixa uma falha do Supabase virar um 500 sem corpo
  (Edge Runtime não passa por error boundary do React): se não conseguir
  verificar a sessão, deixa a request passar e a falha aparece de forma
  tratada na camada de baixo (o error boundary acima).
- `organization_id` nunca é aceito do navegador: toda escrita resolve pelo
  profile do usuário autenticado (`getCurrentOrganizationId()` em
  `src/lib/data/organization.ts`, usado por `src/lib/data/clients.ts`), e o
  RLS reforça isso de qualquer forma no banco.
- `SUPABASE_SERVICE_ROLE_KEY`/`SUPABASE_SECRET_KEY` só existe em
  `src/lib/supabase/server.ts` (`createServiceRoleClient`, hoje sem uso —
  reservado para uma necessidade server-only futura) e no workflow de
  deploy. Nunca em `NEXT_PUBLIC_*`, nunca importado por Client Component
  (confirmado inspecionando o bundle gerado pelo build).

## 4b. Clientes — Fase 5.2 (feita nesta sessão)

Já estava com CRUD real desde a Etapa 4 (`src/lib/data/clients.ts`); esta
sessão auditou, removeu mock morto e deixou explícito o que ainda é mock:

- `src/lib/services/clients-service.ts` e `src/lib/store/clients-store.ts`
  (mock antigo de Clientes) removidos — confirmado zero uso em qualquer
  outro arquivo antes de apagar.
- `src/components/clients/mock-module-notice.tsx` (novo): banner
  "ainda usa dados de exemplo" aplicado nas abas Projetos/Tarefas/
  Conteúdos e no card de KPIs da página de detalhe do cliente — esses
  dados vêm de Projetos/Tarefas/Conteúdos (ainda mock, Fases 5.3–5.5),
  filtrados por um UUID de cliente que o mock não conhece, então sempre
  aparecem vazios; o aviso evita que isso pareça "cliente sem nada" real.
- Nenhuma mudança em `src/lib/data/clients.ts`, migrations ou RLS —
  já corretos (organization_id nunca vem do formulário, sempre resolvido
  via `getCurrentOrganizationId()` a partir da sessão + profile).
- `src/lib/mock-data/clients.ts` (dados brutos) **não** foi removido —
  ainda é usado por Projetos/Tarefas/Conteúdos/Calendário.

## 4c. Projetos — Fase 5.3 (feita nesta sessão)

Estava 100% mockado (UI e navegação prontas, dados de `src/lib/mock-data/projects.ts`
+ `src/lib/store/projects-store.ts` + `src/lib/services/projects-service.ts`).
Agora Projetos é o segundo módulo **REAL/SUPABASE**:

- Novo Data Layer real: `src/lib/data/projects.ts` + `project-schema.ts`
  (mesmo padrão de `clients.ts`: flat queries + join em JS, Zod antes do
  Supabase, `organization_id` sempre via `getCurrentOrganizationId()`).
  Listar, criar, editar, excluir, status, cliente, responsável, datas,
  descrição, campanha — tudo real.
- **Cliente**: o seletor de cliente do formulário e da listagem usa
  exclusivamente `clients` reais (`select id, name` da tabela `clients`),
  nunca `src/lib/mock-data/clients.ts`.
- **Responsável**: idem, usa `profiles` reais da organização
  (`select id, name`), nunca `src/lib/mock-data/team.ts`.
- **Campanha**: a tabela `campaigns` já existia no schema (Etapa 4) como
  relacionamento simples de Projeto (`client_id`, `name`), sem módulo de UI
  próprio. Mantido assim — não foi criado um módulo de Campanhas. O campo
  "Campanha" continua sendo um texto livre no formulário (UX inalterada);
  ao salvar, o Data Layer resolve isso internamente (busca uma campanha com
  esse nome para aquele cliente e reaproveita, ou cria uma nova) e grava só
  o `campaign_id`. Nenhuma tela nova, nenhuma tabela nova.
- Removidos `src/lib/services/projects-service.ts` e
  `src/lib/store/projects-store.ts` (mock antigo de Projetos) — confirmado
  zero uso restante antes de apagar.
- `src/lib/mock-data/projects.ts` (`projects`, `getProject`,
  `getProjectsByClient`) **não** foi removido — ainda é usado por
  Tarefas/Conteúdos/Calendário/breadcrumb, que continuam mockados e
  referenciam projetos pelos IDs mock antigos (ex.: `proj-inovar-...`),
  não pelos UUIDs reais.
- A aba "Projetos" dentro do detalhe do Cliente (`clients/[id]`) passou a
  consultar o Data Layer real também (antes usava o mock) — já que ambos os
  lados da relação (Cliente e Projeto) são reais agora, o aviso de mock foi
  removido dessa aba especificamente. As abas Tarefas/Conteúdos/KPIs do
  Cliente continuam mockadas e mantêm o aviso (nenhuma mudança nelas).
- Dentro do detalhe do Projeto (`projects/[id]`), as seções "Tarefas do
  projeto" e "Conteúdos relacionados" continuam mockadas (Fases 5.4/5.5) e
  agora mostram `MockModuleNotice` — como esses mocks filtram por um UUID
  de projeto que não existe nos dados de exemplo, sempre apareceriam vazios
  sem o aviso, o que poderia parecer "projeto sem nada" real.

## 5. RLS / multi-tenancy

Toda tabela de negócio isolada por `organization_id = current_organization_id()`
(função `security definer` que lê `profiles.organization_id` do usuário
logado). `notifications` também exige `user_id = auth.uid()`.
`activity_logs` é append-only (sem policy de update/delete). Testado de
verdade (dois usuários, duas organizações) em `supabase/manual/rls-tests.sql`
— roda pelo workflow de deploy.

## 6. Storage

4 buckets: `logos` (público), `client-files`, `project-files`,
`content-media` (privados). Isolamento por organização via
`public.organization_folder(name)` (não pode viver no schema `storage` num
projeto hospedado — permissão negada; ver commit `529e6a6`). Caminho:
`<bucket>/<organization_id>/...`. Sem UI de upload ainda.

## 7. Módulos concluídos

- **App Shell + Dashboard** (Fase 1): visual completo, dados mockados.
- **Clientes** (Fase 2 visual + Etapa 4 + Fase 5.2 backend): **REAL/SUPABASE**
  — único módulo com CRUD real contra o Supabase hospedado
  (`src/lib/data/clients.ts`). Listar, criar, editar, excluir, filtrar,
  status, serviços contratados — tudo real, sem mock residual. A página de
  detalhe do cliente ainda mostra abas de Tarefas/Conteúdos vindas de mock
  (claramente sinalizado com um aviso — ver seção 4b), pois esses módulos
  não foram migrados ainda. A aba Projetos do detalhe do cliente já é real
  (ver seção 4c).
- **Projetos** (Fase 2 visual + Fase 5.3 backend): **REAL/SUPABASE**
  — segundo módulo com CRUD real (`src/lib/data/projects.ts`). Listar,
  criar, editar, excluir, status, cliente, responsável, datas, descrição,
  campanha — tudo real, sem mock residual. O detalhe do projeto ainda
  mostra Tarefas/Conteúdos vindos de mock (sinalizado — ver seção 4c).
- **Tarefas (Kanban), Conteúdos, Calendário** (Fases 2/3): UI e navegação
  completas, mas dados ainda mockados
  (`src/lib/mock-data/*`, `src/lib/services/*-service.ts`,
  `src/lib/store/*-store.ts`).

## 8. Módulos ainda mockados / não iniciados

- Tarefas, Conteúdos, Calendário: UI pronta, sem ligação ao Supabase (é a
  Fase 5.4–5.6).
- Financeiro, Equipe, Relatórios: só placeholders de tela
  (`src/app/(app)/financeiro`, `/equipe`, `/relatorios`) — nenhuma lógica.
- Upload de arquivos (Storage): infraestrutura pronta, sem UI (Fase 5.7).

## 9. Roadmap

```
FASE 1 — Fundação/App Shell/Dashboard         ✅ concluída
FASE 2 — Clientes/Projetos/Tarefas/Kanban      ✅ concluída visualmente
FASE 3 — Conteúdos/Calendário                  ✅ concluída visualmente
FASE 4 — Infraestrutura Supabase               ✅ concluída e validada no Supabase real
FASE 5 — Conectar frontend ao Supabase real    🔶 em andamento
  5.1 Auth + sessão + organização              ✅ concluída (esta sessão)
  5.2 Clientes                                 ✅ concluída (esta sessão) — REAL/SUPABASE
  5.3 Projetos                                 ✅ concluída (esta sessão) — REAL/SUPABASE
  5.4 Tarefas + Kanban                         ⏳ pendente
  5.5 Conteúdos                                ⏳ pendente
  5.6 Calendário                               ⏳ pendente
  5.7 Arquivos / Supabase Storage              ⏳ pendente
  5.8 Remoção final dos mocks + validação      ⏳ pendente
FASE 6 — Financeiro                            ⏳ não iniciada
FASE 7 — Equipe / permissões                   ⏳ não iniciada
FASE 8 — Relatórios                            ⏳ não iniciada
FASE 9 — Rentabilidade / carga de trabalho     ⏳ não iniciada
FASE 10 — Auditoria UX/UI                      ⏳ não iniciada
```

## 10. Decisões técnicas importantes

- **Sem embedded selects do PostgREST**: toda query é flat + join em JS,
  por não ter sido possível validar o formato inferido dos embeds sem um
  projeto Supabase ao vivo no início da Etapa 4. Mantido por consistência.
- **Migração gradual, não big-bang**: mock e Supabase coexistem
  deliberadamente; um módulo só perde o mock quando sua Fase 5.x for feita.
- **Bridge de perfis** (`registerSupabaseProfile` em
  `src/lib/mock-data/team.ts`): deixa componentes já aprovados (tabelas que
  mostram "responsável") resolverem tanto IDs mockados quanto UUIDs reais
  do Supabase sem precisar redesenhar nada.
- **Deploy via GitHub Actions, não localmente**: o ambiente de
  desenvolvimento (sandbox) não alcança `*.supabase.co` nem por HTTPS nem
  por conexão direta de banco — bloqueio de política confirmado, não
  contornado. Todo deploy de infraestrutura roda pelo workflow
  `deploy-supabase.yml`, com o usuário só configurando 4 Secrets no GitHub
  (nunca SQL manual).
- **Convites de usuários de desenvolvimento são dados de teste, não
  infraestrutura**: podem esbarrar no limite de e-mail do Supabase; isso
  nunca bloqueia migrations/RLS/Storage/seed. Usuários reais devem entrar
  pela tela Equipe (ainda não construída) no futuro, não pelo deploy.
- **Contexto de autenticação resolvido uma vez, no servidor** (Fase 5.1):
  `getCurrentActor()` roda no layout de `(app)`, não em cada componente —
  evita chamadas duplicadas ao Supabase e elimina o estado de loading que
  existia antes no Header.

## 11. Variáveis de ambiente

`.env.local` (não commitado) precisa de:
`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
`SUPABASE_SERVICE_ROLE_KEY` — ver `.env.local.example`. **Neste sandbox de
desenvolvimento, `NEXT_PUBLIC_SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY`
ainda são placeholders** (só `NEXT_PUBLIC_SUPABASE_ANON_KEY` foi
preenchido). Sem a URL real, o login não pode ser testado de ponta a ponta
dentro deste ambiente — ver `docs/supabase-deployment.md` para onde
encontrar os valores reais (Supabase Dashboard → Settings → API / Connect →
Server).

## Arquivos-chave para orientação rápida

| Área | Arquivo |
|---|---|
| Cliente Supabase (browser) | `src/lib/supabase/client.ts` |
| Cliente Supabase (server) | `src/lib/supabase/server.ts` |
| Middleware de sessão | `src/lib/supabase/middleware.ts`, `middleware.ts` |
| Contexto de usuário/org | `src/lib/auth/get-current-actor.ts`, `src/lib/auth/current-actor-context.tsx` |
| Error boundary raiz | `src/app/error.tsx` |
| Login | `src/app/login/page.tsx` |
| Data Layer real (Clientes) | `src/lib/data/clients.ts`, `client-schema.ts`, `organization.ts` |
| Data Layer real (Projetos) | `src/lib/data/projects.ts`, `project-schema.ts` |
| Migrations | `supabase/migrations/*.sql` |
| Seed hospedado | `supabase/manual/seed-hosted.sql` |
| Testes de RLS | `supabase/manual/rls-tests.sql` |
| Deploy automatizado | `.github/workflows/deploy-supabase.yml`, `scripts/deploy/create-users.mjs` |
| Runbook de deploy | `docs/supabase-deployment.md` |
