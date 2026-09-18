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

## 4d. Tarefas — Fase 5.4 (feita nesta sessão)

Estava 100% mockado (listagem, Kanban, detalhe, comentários e "histórico"
ad hoc em `src/lib/mock-data/tasks.ts` + `store/tasks-store.ts` +
`services/tasks-service.ts`). Agora Tarefas é o terceiro módulo
**REAL/SUPABASE**:

- Novo Data Layer real: `src/lib/data/tasks.ts` + `task-schema.ts` (mesmo
  padrão de Clientes/Projetos: flat queries + join em JS, Zod antes do
  Supabase, `organization_id` via `getCurrentOrganizationId()`). Listar,
  Kanban, detalhe, criar, editar, excluir, status, prioridade, prazo,
  cliente, projeto, responsável, conclusão e comentários — tudo real.
- **Status**: o schema/constraint da tabela `tasks` sempre teve 7 valores
  (`backlog, a_fazer, em_producao, em_revisao, aguardando_cliente,
  concluido, cancelado`), mas o tipo `TaskWorkflowStatus` e
  `taskWorkflowConfig`/`taskWorkflowOrder` (`src/lib/status.ts`) só tinham
  6 — faltava `cancelado`. Corrigido (era uma lacuna pré-existente do mock,
  não uma mudança de domínio). O Kanban ganhou uma 7ª coluna; sem
  redesenho, com o mesmo scroll horizontal já existente.
- **Prioridade**: `baixa/normal/alta/urgente` já batia exatamente com o
  schema — sem mudanças.
- **Cliente/Projeto/Responsável**: os seletores usam exclusivamente
  `clients`/`projects`/`profiles` reais (nunca os mocks). O seletor de
  Projeto é filtrado pelo cliente selecionado no formulário (cascata
  Cliente → Projeto, preservando a UX já existente). Antes de gravar, o
  Data Layer valida no servidor (consultas próprias, sob RLS) que o
  cliente/projeto/responsável informados realmente pertencem à organização
  autenticada — nunca confia só no dropdown do formulário — e que o
  projeto informado pertence ao cliente informado.
- **Responsável ausente**: `assignee_id` é opcional no schema; a UI mostra
  "Sem responsável" (não um mock fictício) quando não há um definido.
- **completed_at**: passa a refletir `now()` só na transição real para
  "concluído" (não é reescrito a cada edição de uma tarefa que já estava
  concluída) e volta a `null` assim que a tarefa sai desse status.
- **Kanban**: sem drag-and-drop na versão mockada (já era por menu "Mover
  para") — mantido; mover agora chama `updateTaskStatus()` (persiste no
  Supabase) e só atualiza a tela após confirmação do servidor, com toast de
  erro e sem alterar a UI se a escrita falhar.
- **Comentários** (`task_comments`, já existia no schema): migrados para
  Supabase real — `task_id`, `author_id` (usuário autenticado),
  `organization_id`, `message`, `created_at`. Sem menções, notificações ou
  edição/exclusão de comentário (não existiam na UX mockada).
- **Conteúdo relacionado** (campo ad hoc do mock, sem coluna própria na
  tabela `tasks` — a relação real seria via `content_tasks`, que exige
  Conteúdos real): removido do formulário e, no detalhe da tarefa,
  substituído por um aviso "Ainda não disponível — Fase 5.5", em vez de
  mostrar conteúdo mock associado a uma tarefa real.
- **Histórico** (`task.history` do mock, sem tabela própria — `activity_logs`
  já existe no schema mas não há nenhuma infraestrutura de gravação para
  ela em nenhum módulo ainda): substituído pelo mesmo tipo de aviso
  "Ainda não disponível", em vez de inventar um sistema de auditoria nesta
  fase. Fica documentado aqui para uma etapa futura.
- **Breadcrumb**: `src/lib/breadcrumb.ts` resolvia o título da tarefa via
  `getTask()` do mock — para uma tarefa real (UUID), isso sempre retornava
  "Não encontrado". Corrigido com o mesmo padrão de bridge já usado para
  perfis (`registerSupabaseProfile`): `registerSupabaseTask()` em
  `mock-data/tasks.ts`, populado pelo Data Layer real a cada tarefa
  carregada. **Observação**: o mesmo problema existia para Clientes e
  Projetos (`getClient`/`getProject` do mock, sem bridge equivalente) — não
  corrigido nesta fase por estar fora do escopo de Tarefas. **Corrigido na
  Fase 5.8** (ver seção 4h), incluindo um bug adicional de re-render
  descoberto só então (cache não-reativo em navegação direta por URL).
- Removido `src/lib/services/tasks-service.ts` (sem consumidores restantes
  após migrar Tarefas, Cliente → Tarefas e Projeto → Tarefas). **Mantidos**
  `src/lib/store/tasks-store.ts` (ainda importado diretamente por
  `calendar-service.ts`) e `src/lib/mock-data/tasks.ts` (ainda usado por
  Conteúdos, Calendário e pelo breadcrumb) — Conteúdos/Calendário continuam
  mockados e referenciam tarefas pelos IDs antigos (`task-1`, ...).
- **Cliente → Tarefas** e **Projeto → Tarefas**: as abas/cards passaram a
  usar o Data Layer real (aviso de mock removido dessas duas áreas
  especificamente). O KPI "Tarefas abertas" no Cliente também passou a ser
  real; "Publicações" e "Aguardando aprovação" continuam mock (Conteúdos).
- **Dashboard**: não foi tocado nesta fase — o widget "Minhas tarefas" usava
  o modelo `TaskItem`/`myTasks`, deliberadamente separado do `Task` completo
  desde a Etapa 1, e continuava 100% mockado. **Migrado na Fase 5.8** (ver
  seção 4h) — `TaskItem`/`myTasks` não existem mais.

## 4e. Conteúdos — Fase 5.5 (feita nesta sessão)

Estava 100% mockado. Agora Conteúdos é o quarto módulo **REAL/SUPABASE**:

- Novo Data Layer real: `src/lib/data/contents.ts` + `content-schema.ts`
  (mesmo padrão de Clientes/Projetos/Tarefas). Listar, detalhe, criar,
  editar, excluir, status editorial, cliente, projeto, responsável,
  tipo/formato, canal, agendamento, legenda, CTA e Conteúdo ↔ Tarefas —
  tudo real.
- **Status editorial/tipo/canal**: conferidos contra o schema antes de
  implementar — os 8 status (`ideia...publicado`), 9 tipos e 7 canais do
  `CHECK` da tabela `contents` já batiam exatamente com
  `contentEditorialConfig`/`CONTENT_TYPE_OPTIONS`/`CHANNEL_OPTIONS`
  existentes. Nenhum enum novo, nenhuma mudança de domínio — só passou a
  validar contra o Supabase em vez do mock.
- **Cliente/Projeto/Responsável**: seletores usam exclusivamente dados
  reais; cascata Cliente → Projeto preservada. Antes de gravar, valida no
  servidor (sob RLS) que cliente/projeto/responsável pertencem à
  organização e que o projeto pertence ao cliente informado — mesmo
  padrão do Fase 5.4.
- **scheduled_date/scheduled_time vs. published_at**: mantidos como
  conceitos distintos. `scheduled_date`/`scheduled_time` (campos
  "Data de publicação"/"Horário" do formulário) são sempre a data
  planejada e nunca são tocados automaticamente. `published_at` só é
  gravado (`now()`) numa transição real para "publicado", preservado se o
  conteúdo já estava publicado, e volta a `null` ao sair desse status —
  mesma regra do `completed_at` de Tarefas (Fase 5.4), aplicada aqui de
  forma consistente.
- **Conteúdo ↔ Tarefas (`content_tasks`)**: implementada a relação real
  (many-to-many, `unique(content_id, task_id)`). A UX já existente (chips
  de tarefas para marcar/desmarcar, filtrados pelo cliente selecionado)
  foi preservada e migrada — no submit, sincroniza via delete-then-insert
  (mesmo padrão de `client_services`). O card "Tarefas relacionadas" no
  detalhe do conteúdo mostra as tarefas reais vinculadas.
- **Tarefa → Conteúdo**: o card "Conteúdo relacionado" no detalhe da
  Tarefa (que na Fase 5.4 mostrava "ainda não disponível") agora consulta
  `content_tasks` e mostra os conteúdos reais relacionados àquela tarefa.
- **content_comments**: NÃO implementado. Auditoria confirmou que o
  detalhe de Conteúdo nunca teve UI de comentários (diferente de Tarefas,
  que já tinha) — implementar isso agora seria criar uma tela nova, fora
  do escopo desta fase. Documentado aqui para uma etapa futura.
- **Arquivos/mídia**: card "Mídia" já era um estado honesto de "ainda não
  implementado" (Supabase Storage) — mantido como estava, sem expandir
  para um sistema de upload/DAM nesta fase.
- **Calendário**: não tocado. `scheduled_date`/`scheduled_time`/`status`/
  `channel`/`content_type` do Conteúdo real já existem com os nomes e
  domínios corretos para quando o Calendário for migrado (Fase 5.6) — não
  foi necessária nenhuma mudança de schema para isso.
- Removido `src/lib/services/contents-service.ts` (sem consumidores
  restantes). **Mantidos** `src/lib/store/contents-store.ts` (ainda
  importado diretamente por `calendar-service.ts`) e
  `src/lib/mock-data/contents.ts` (`contents`/`ContentItem[]` do Dashboard,
  `editorialContents`, `CONTENT_TYPE_OPTIONS`, `CHANNEL_OPTIONS`,
  `getContent`, `getContentsByClient/Project` — ainda usados pelo
  Calendário, pelo breadcrumb e pelo widget do Dashboard).
- **Breadcrumb**: mesmo padrão de bridge da Fase 5.4 —
  `registerSupabaseContent()` populei o cache que `getContent()` consulta,
  corrigindo "Conteúdos / <título>" para UUIDs reais.
- **Cliente → Conteúdos** e **Projeto → Conteúdos**: passaram a usar dados
  reais (aviso de mock removido dessas duas áreas). O KPI do Cliente
  ("Publicações" e "Aguardando aprovação") também passou a ser calculado
  com conteúdos reais — com isso, todo o card de KPIs do Cliente
  (Publicações, Tarefas abertas, Aguardando aprovação, Receita mensal) é
  real, e `MockModuleNotice` foi removida de lá.
- `src/components/clients/mock-module-notice.tsx` foi **removido**: ficou
  sem nenhum consumidor depois desta fase (Clientes, Projetos, Tarefas e
  Conteúdos já são todos reais — só falta Calendário, que não usava esse
  aviso).
- **Dashboard**: não tocado nesta fase — continuava usando `contents`/
  `ContentItem[]` (mock leve da Etapa 1). **Migrado na Fase 5.8** (ver
  seção 4h) — `ContentItem`/`contents` não existem mais.

## 4f. Calendário — Fase 5.6 (feita nesta sessão)

Estava 100% mockado. Agora Calendário é o quinto módulo **REAL/SUPABASE**
— último do grupo Clientes/Projetos/Tarefas/Conteúdos/Calendário.

**Arquitetura: projeção, não cópia.** O Calendário nunca teve (e continua
sem ter) sua própria tabela de "itens do calendário" para Conteúdos/
Tarefas. Ele é uma agregação em tempo real de 3 fontes:

```
CONTENTS (scheduled_date/scheduled_time)
   +
TASKS (due_date)
   +
CALENDAR_EVENTS (event_date/event_time — só para reunião/evento/prazo manual)
   =
useCalendarItems() → CalendarItem[]
```

- `src/lib/services/calendar-service.ts` (mantido, só reescrito por dentro):
  continua expondo `useCalendarItems(filters)`, mas agora compõe
  `useContents()` + `useTasks()` + a nova `useCalendarEvents()` em vez de
  `useSyncExternalStore` sobre os stores mock. Um conteúdo/tarefa nunca é
  copiado para `calendar_events` — mudar a data de publicação do Conteúdo
  ou o prazo da Tarefa já muda o Calendário automaticamente, porque é a
  mesma linha sendo lida, não uma cópia sincronizada.
- Novo Data Layer real só para `calendar_events`:
  `src/lib/data/calendar.ts` + `calendar-schema.ts`. CRUD completo (criar/
  editar/excluir), sempre com `organization_id` via
  `getCurrentOrganizationId()`, e as mesmas validações server-side (sob
  RLS) de cliente/projeto pertencerem à organização e o projeto pertencer
  ao cliente — mesmo padrão de Tarefas/Conteúdos.
- **Tipos de `calendar_events`**: o `CHECK` da tabela tem 5 valores
  (`publication, meeting, task, event, deadline`), mas o app só cria 3 daqui
  em diante (`meeting/event/deadline` → "Reunião"/"Evento"/"Deadline" na
  UI). `publication`/`task` são legado: a coluna `content_id`/`task_id`
  permitia um evento "apontar" para um conteúdo/tarefa existente em vez de
  duplicá-lo, mas agora que Contents/Tasks são fontes reais agregadas
  diretamente, criar um evento desses seria exatamente a duplicação que
  este módulo evita. Nenhuma mudança de schema — a leitura ainda mapeia os
  5 valores (para nunca quebrar se uma linha legada existir), só a escrita
  fica restrita a 3.
- **CRUD de eventos**: não existia NENHUMA UI de criar/editar/excluir
  evento antes desta fase (só havia um diálogo somente-leitura). Criado
  `src/components/calendar/event-form-drawer.tsx` (novo) e adicionados
  botões Editar/Excluir em `event-detail-dialog.tsx` — só aparecem quando
  o item é um evento manual (`item.sourceEvent` presente), nunca para
  Conteúdo/Tarefa (que abrem via `href`, navegando para a tela real —
  clicar num Conteúdo/Tarefa no Calendário nunca abre um formulário
  genérico de edição aqui, evitando editar 3 entidades no mesmo lugar).
- **Datas/horário**: sem UTC em nenhum ponto. `event_date`/`scheduled_date`/
  `due_date` continuam strings `YYYY-MM-DD` locais, comparadas por string
  (`toISODate`, `startOfDay` com `Date(y,m,d)`, nunca `toISOString()`).
  `event_time`/`scheduled_time` voltam do Postgres como `"HH:MM:SS"` — nova
  função `toHoursMinutes()` (`src/lib/format.ts`) corta para `"HH:MM"` (o
  formato que todo `<input type="time">` e todo mock sempre usaram);
  aplicada tanto em `calendar.ts` quanto retroativamente em
  `contents.ts` (mesma lacuna existia desde a Fase 5.5, só ficou visível
  agora com Conteúdos e Eventos lado a lado no mesmo Calendário). Itens
  sem horário (`time` ausente) nunca ganham um horário inventado — nem no
  agregador, nem na Week view, nem no chip.
- **Semântica de agregação**: `buildItems()` filtra fora qualquer Conteúdo/
  Tarefa cuja data real seja nula (`scheduled_date`/`due_date` nulos no
  banco) antes de agrupar por dia — evita colidir tudo isso sob uma chave
  de data vazia.
- **Views Month/Week/List**: não precisaram de nenhuma mudança —
  `month-view.tsx`/`week-view.tsx`/`list-view.tsx` sempre foram puramente
  apresentacionais sobre `CalendarItem[]`, sem nenhum import de mock.
  Continuam recebendo exatamente a mesma forma de dado.
- **Filtro de Projeto** (novo, seção 10/12 da fase): `CalendarItem` e
  `CalendarEvent` ganharam `projectId?: string | null` (campo aditivo);
  `CalendarFiltersBar` ganhou o filtro "Projeto", com clientes/projetos/
  responsáveis agora vindos de dados reais (nunca mais de
  `mock-data/clients`/`mock-data/team`).
- Removidos (sem consumidores restantes após esta fase):
  `mock-data/calendar.ts`, `store/tasks-store.ts`, `store/contents-store.ts`
  e `store/create-entity-store.ts` (a factory genérica só era usada pelos
  dois stores acima). `mock-data/index.ts` teve o `export * from "./calendar"`
  removido (módulo apagado).
- **Mantidos**: `mock-data/tasks.ts` e `mock-data/contents.ts` continuam
  necessários — `getTask`/`getContent` (via os bridges das Fases 5.4/5.5)
  ainda resolvem o breadcrumb, e o Dashboard (`myTasks`,
  `contents: ContentItem[]`) continua usando os dois, sem nenhuma mudança
  nesta fase.
- **Testes de datas/agregação**: como o projeto não tem nenhum test
  runner configurado (`package.json` sem `test` script, sem
  Jest/Vitest), rodei um script Node avulso (`npx tsx`, fora do repo)
  exercitando as funções reais de `calendar-utils.ts`/`format.ts` — 15
  verificações (grade de 42 dias Monday-first, `toISODate` sem shift de
  UTC, `addDays`/`addMonths` cruzando mês/ano, `isSameDay`/`isSameMonth`,
  ausência de horário inventado, `isOverdue` sem off-by-one, ordenação
  data+horário, agrupamento por dia cruzando mês, exclusão de item sem
  data) — todas passaram. Não foi necessário Supabase hospedado para isso.

## 4g. Arquivos / Storage — Fase 5.7 (feita nesta sessão)

Infraestrutura de arquivos passa a ser **REAL/SUPABASE** para Conteúdo,
Cliente e Projeto. Tarefa fica documentada como pendência (ver abaixo).

**Infraestrutura já existente (Etapa 4), confirmada antes de implementar:**
- 4 buckets: `logos` (público, não usado nesta fase — é logo de
  organização/cliente, fora do escopo de anexos), `client-files`,
  `project-files`, `content-media` (privados).
- Isolamento por organização: todo objeto é salvo como
  `{organization_id}/{...}`; as policies de `storage.objects` (uma por
  bucket, para select/insert/update/delete) comparam o primeiro segmento
  do path com `current_organization_id()` via `public.organization_folder()`.
- Tabela `files`: metadados + relacionamento (`client_id`, `project_id`,
  `content_id`, `task_id` — todos nullable, `task_id` incluído). RLS
  genérica por `organization_id` (mesmo padrão das outras tabelas).
- Nenhuma migration foi necessária — schema e policies já suportavam
  exatamente o fluxo implementado.

**Novo Data Layer**: `src/lib/files-utils.ts` (puro, sem Supabase —
allowlist de MIME, limite de tamanho, geração segura de path, formatação)
+ `src/lib/data/files.ts` (`useEntityFiles`, `uploadEntityFile`,
`removeEntityFile`, `getFileSignedUrl`).

- **Entidades suportadas**: `client`, `project`, `content` — as três com
  bucket próprio. **Tarefa ficou de fora**: `files.task_id` existe na
  tabela, mas não existe bucket `task-files` na infraestrutura da Etapa 4.
  Criar um agora seria alterar infraestrutura sem necessidade comprovada
  (proibido nesta fase) — o card "Arquivos" da Tarefa continua como
  placeholder, documentado aqui para decisão em fase futura (criar bucket
  dedicado, ou reaproveitar `project-files` quando a tarefa tiver
  projeto — nenhuma das duas foi decidida ainda).
- **Path**: `{organization_id}/{uuid}.{extensão}` — nunca o nome original,
  nunca fornecido pelo navegador. `organization_id` vem de
  `getCurrentOrganizationId()` no servidor; o nome original só é guardado
  como metadado (`files.name`), nunca faz parte do path (evita colisão,
  overwrite e path injection).
- **MIME allowlist** (`src/lib/files-utils.ts`): imagens
  (jpeg/png/webp/gif), vídeo (mp4/webm/quicktime) e documentos comuns de
  agência (pdf, doc/docx, xls/xlsx, ppt/pptx, txt, zip). Validado tanto no
  input do navegador (`accept`) quanto antes do upload — nunca confia só
  na extensão.
- **Limite de tamanho**: nenhum limite estava documentado ou configurado
  nos buckets; defini um teto único e centralizado de 25 MB
  (`MAX_FILE_SIZE_BYTES`), deliberadamente conservador e abaixo do limite
  padrão de 50 MB por objeto do Supabase Storage. Um único ponto para
  ajustar, sem magic numbers espalhados.
- **Upload**: valida MIME + tamanho → confirma que a entidade pertence à
  organização (consulta própria sob RLS, nunca confia só no ID do
  navegador) → sobe pro Storage → insere em `files`. Se o insert falhar
  depois do upload ter funcionado, o objeto é removido do Storage (evita
  arquivo órfão que a UI nunca mais conseguiria ver/gerenciar).
- **Exclusão**: sempre a partir de um `file_id` que já veio de
  `useEntityFiles()` (lista RLS-scoped) — nunca de um path arbitrário.
  Remove do Storage primeiro; se o delete de `files` falhar depois, o erro
  é reportado com uma mensagem específica em vez de falha silenciosa.
- **Visualização/download**: signed URL gerada sob demanda
  (`createSignedUrl`, 60s de validade), aberta imediatamente numa nova
  aba — nunca salva no banco, nunca tratada como identificador permanente.
  Buckets privados continuam privados; nenhum bucket foi tornado público.
- **Preview de imagem**: não implementado na listagem (evitaria N chamadas
  de signed URL só para renderizar miniaturas); abrir a imagem já mostra o
  arquivo real via signed URL. Decisão deliberada para não expandir escopo.
- **Componentes reutilizáveis**: `FileUploader`, `FileList` (+ `FileItem`
  interno) e `EntityFilesPanel` (combina os dois + `useEntityFiles` +
  confirmação de exclusão) em `src/components/files/`. Cada tela
  (`contents/[id]`, `projects/[id]`, `clients/[id]`) só usa
  `<EntityFilesPanel entityType="..." entityId="..." />` — nenhuma
  reimplementação de upload por tela.
- **Cliente → Arquivos**: a aba "Arquivos" (antes um placeholder genérico
  dentro de `PLACEHOLDER_TABS`) virou uma aba própria, conectada.
- **Falhas parciais**: os 3 cenários do enunciado foram tratados
  explicitamente — (A) upload ok + insert falha → remove o objeto do
  Storage; (B) delete do Storage ok + delete de `files` falha → erro
  específico ao usuário, sem exclusão "pela metade" silenciosa; (C)
  registro existe mas objeto sumiu do Storage → `createSignedUrl` falha e
  a UI mostra "Não foi possível abrir o arquivo. Ele pode ter sido
  removido do armazenamento." em vez de travar.
- **Testes sem rede**: como o projeto não tem test runner, rodei um script
  Node avulso (`npx tsx`, fora do repo) contra as funções reais de
  `files-utils.ts` — 13 checagens (allowlist de MIME, rejeição de
  executável/script, limite de tamanho no limite exato e acima,
  sanitização de extensão contra path traversal/injeção, geração de path
  sempre prefixado por `organization_id`, nome original nunca vazando pro
  path, duas uploads do mesmo nome nunca colidindo, formatação de
  tamanho) — todas passaram. Não foi possível (nem necessário, já que
  nenhuma policy/schema mudou) testar upload/policy contra o Supabase
  hospedado real neste sandbox.

## 4h. Auditoria final, remoção de mocks e validação — Fase 5.8 (feita nesta sessão)

Fase transversal de auditoria/limpeza — não implementou nenhum módulo novo
(Financeiro/Equipe/Relatórios permanecem placeholders, sem lógica).

**Bug de breadcrumb corrigido (não era conhecido antes desta fase):** os
bridges `getClient`/`getProject`/`getTask`/`getContent` (mocks → cache
populado pelo Data Layer real) funcionavam para consumidores na mesma
árvore de render da página que faz o fetch, mas o `Header` (que renderiza o
breadcrumb) é uma árvore irmã da página de detalhe, não descendente — nada
forçava o `Header` a re-renderizar depois do fetch resolver. Em navegação
direta por URL (`/clients/<uuid>` digitado ou colado, sem navegar pela SPA),
o breadcrumb podia ficar permanentemente preso em "Não encontrado" mesmo
com a página renderizando corretamente. Corrigido com uma factory de cache
observável (`src/lib/name-cache.ts`, contador de versão + subscribers) e um
novo hook `useBreadcrumb()` (`src/lib/breadcrumb.ts`, via
`useSyncExternalStore`) que o `Header` agora usa em vez do antigo
`getBreadcrumb()` puro. `mock-data/team.ts` deliberadamente **não** recebeu
o mesmo tratamento — seus consumidores (`ClientTable`/`ClientHeader`) estão
na mesma árvore de render que popula o cache, então o bug não se aplica lá.

**Mock morto removido (consequência direta das Fases 5.5–5.7 + do
redesenho do Dashboard nesta fase, nunca antes auditado):**
- `src/lib/mock-data/{clients,projects,tasks,contents}.ts`: os arrays de
  entidade fake (`clients`, `projects`, `tasks`, `contents`,
  `editorialContents`) e os helpers `getXByY` ficaram inalcançáveis assim
  que Conteúdos/Calendário (últimos consumidores) migraram — confirmado com
  busca de consumidores (`grep`) antes de cada remoção. Restou só o bridge
  (`registerSupabaseX`/`getX`/cache) e, em `contents.ts`, o vocabulário de
  domínio genuinamente reutilizado (`CONTENT_TYPE_OPTIONS`, `CHANNEL_OPTIONS`
  — batem exatamente com os `CHECK` da tabela `contents`).
- `src/lib/mock-data/team.ts`: `currentUser`/`team` (elenco fake de 5
  pessoas) removidos — o Dashboard era o único consumidor restante, agora
  usa `useCurrentActor()` (sessão autenticada real).
- `src/lib/mock-data/{index,stats,attention,activity,financeiro}.ts`
  apagados por inteiro — cada um só existia para alimentar o Dashboard
  mockado da Etapa 1 (`dashboardStats`, `attentionItems`, `recentActivity`,
  `upcomingPayments`), sem nenhum outro consumidor.
- **Dashboard reescrito para dados reais**
  (`src/lib/services/dashboard-service.ts`, agora um hook
  `useDashboardData()`): KPI "Tarefas abertas" e "Publicações esta semana",
  "Minhas tarefas" (via `useCurrentActor()` + `useTasks()`) e "Próximas
  publicações" (via `useContents()`) passam a ser 100% reais. **Financeiro
  nunca foi fabricado**: o card "A receber" mostra `—` com a legenda
  explícita "Financeiro ainda não disponível" (nenhum número inventado), e
  nenhum item de atenção financeiro é criado. "Atividade recente" mostra um
  estado vazio honesto ("Ainda não disponível") em vez de inventar
  atividade — não há infraestrutura de gravação em `activity_logs` em
  nenhum módulo ainda.
- **Tipos órfãos removidos** de `src/lib/types/index.ts` (confirmado via
  `grep` que só tinham referências entre si, nenhum consumidor real):
  `ContentStatus`, `ContentItem`, `TaskPriority`, `TaskStatus`, `TaskItem`,
  `Payment`, `ActivityType`, `ActivityItem` — todos existiam só para o
  Dashboard leve da Etapa 1, agora substituído pelos modelos completos
  (`Task`/`Content`) nas seções 4d/4e. Dois comentários que citavam
  `TaskItem`/`ContentItem` por nome (nas interfaces `Task`/`Content`) foram
  atualizados. `src/lib/status.ts` teve `contentStatusConfig`/
  `taskStatusConfig`/`taskPriorityConfig` removidos pelo mesmo motivo
  (substituídos por `contentEditorialConfig`/`taskWorkflowConfig`/
  `taskUrgencyConfig`).

**Módulos já reais (Clientes, Projetos, Tarefas, Conteúdos, Calendário,
Arquivos) re-auditados:** nenhuma dependência residual de mock encontrada
em nenhum deles — todos os seletores (cliente/projeto/responsável) já
usavam dados reais desde suas respectivas Fases 5.2–5.7; `client_services`
(`syncClientServices`) e `campaigns` (`resolveCampaignId`) confirmados
intactos e funcionando, sem expansão. Estados de loading/erro/vazio
(`Skeleton`/`ErrorState`/`EmptyState`) confirmados presentes nas 10 telas
reais (Dashboard, listagem + detalhe de Clientes/Projetos/Tarefas/
Conteúdos, Calendário) e no `EntityFilesPanel` (Arquivos).

**Padrões legados varridos** (busca por `grep` em todo `src/`): nenhum uso
de `localStorage`, nenhum ID mock hardcoded (`client-1`/`project-1`/
`task-1`/`content-1`), nenhum `TODO`/`FIXME` restante, `useSyncExternalStore`
presente só nos dois arquivos esperados (`name-cache.ts`/`breadcrumb.ts`).

**Segurança/`.env`**: `SUPABASE_SERVICE_ROLE_KEY` só aparece em
`src/lib/supabase/server.ts` (`createServiceRoleClient`, ainda sem uso —
reservado) — nenhum uso em código client-reachable. `.env.local` não está
versionado (`.gitignore`: `.env*` com exceção só para
`.env.local.example`); `git ls-files` confirma que nenhum `.env*` real está
rastreado. Nenhum valor de secret foi impresso durante esta auditoria.

**Fluxo operacional validado estaticamente** (Cliente → Projeto → Tarefa ↔
Conteúdo → Calendário → Arquivos): confirmado por leitura de código, não
por teste E2E contra o Supabase hospedado (ver limitação abaixo) — cada
Data Layer (`clients.ts`, `projects.ts`, `tasks.ts`, `contents.ts`,
`calendar.ts`, `files.ts`) popula os bridges/registra os relacionamentos de
forma consistente; `useCalendarItems()` agrega Tarefas/Conteúdos/eventos
reais diretamente (nunca copia dado), com `href` de volta para
`/tasks/:id`/`/contents/:id`; `EntityFilesPanel` conectado nas 3 entidades
com bucket (Cliente/Projeto/Conteúdo), gap de Tarefa (`task-files`)
permanece documentado, não implementado.

**O que foi validado e como (diferenciação explícita):**
- **(A) Análise estática + build**: `npm run lint`, `npx tsc --noEmit` e
  `npm run build` rodados e limpos após cada lote de mudanças desta fase
  (14 rotas geradas, sem warnings novos).
- **(B) Testes puros**: nenhum script novo nesta fase (não havia lógica
  pura nova para testar — só remoção de mock e composição de hooks já
  testados em fases anteriores). O projeto continua sem test runner
  configurado (`package.json` sem script `test`); os scripts ad hoc de
  fases anteriores (`npx tsx`, fora do repo, contra `calendar-utils.ts` e
  `files-utils.ts`) não foram recriados nem versionados — mesmo precedente
  das Fases 5.6/5.7 mantido.
- **(C) Execuções anteriores do GitHub Actions**: `deploy-supabase.yml`
  (`workflow_dispatch` manual) já validou schema/RLS/Storage no Supabase
  hospedado em fase anterior; nenhuma migration ou policy nova nesta fase,
  então nenhuma nova execução foi necessária — avaliado e descartado por
  não haver mudança de infraestrutura para verificar (item 26 do escopo).
- **(D) NÃO validado end-to-end**: login real, navegação e escrita contra o
  Supabase hospedado **não foram exercitados nesta sessão** — o sandbox não
  alcança `*.supabase.co` (bloqueio de rede confirmado em fases anteriores,
  não re-testado por já ser conhecido). Isso inclui o próprio bug de
  breadcrumb corrigido acima: a correção foi validada por leitura do
  código/comportamento do `useSyncExternalStore`, não observando o
  breadcrumb realmente recarregar no navegador contra dados reais.

**Checklist de encerramento da Fase 5 (10 critérios) — autoavaliação:**
1. ✅ Clientes/Projetos/Tarefas/Conteúdos/Calendário/Arquivos são
   REAL/SUPABASE, sem mock residual — confirmado por auditoria.
2. ✅ Dashboard não fabrica dado de módulo já migrado — reescrito nesta
   fase; Financeiro mostra `—` honesto.
3. ✅ Breadcrumb resolve entidades reais em todos os módulos, inclusive em
   navegação direta por URL — corrigido nesta fase.
4. ✅ Nenhum padrão legado (`localStorage`, IDs mock hardcoded,
   `useSyncExternalStore` fora do lugar esperado) restante.
5. ✅ Nenhuma duplicação perigosa de tipos/config — tipos órfãos do
   Dashboard leve removidos.
6. ✅ `client_services`/`campaigns` intactos, sem expansão indevida.
7. ✅ Financeiro/Equipe/Relatórios/Configurações permanecem placeholders
   honestos, sem mock vazando.
8. ✅ Segurança: sem `service_role` client-reachable, `.env.local` não
   versionado, nenhum secret impresso.
9. ✅ `lint`/`tsc`/`build` limpos.
10. ⚠️ **Parcial**: validação E2E contra o Supabase hospedado real não foi
    (e não pôde ser) executada neste sandbox — limitação de rede conhecida
    desde a Fase 4, não uma falha desta fase. Todos os outros 9 critérios
    são satisfeitos por análise estática + build, o que é o máximo
    verificável neste ambiente.

**Conclusão**: a Fase 5 é considerada concluída dentro do que este ambiente
consegue validar (critérios 1–9 completos); o critério 10 (E2E hospedado)
fica como validação pendente para quando alguém puder testar fora deste
sandbox — não é um bloqueio de qualidade de código, é uma limitação de
ambiente já conhecida e documentada desde a Fase 4.

## 4i. Financeiro + Equipe — Fase 6 (feita nesta sessão)

**Financeiro** passa a ser **REAL/SUPABASE**, usando o schema já existente
desde a Etapa 4 (`financial_categories`/`financial_transactions`) — nenhuma
migration foi necessária, RLS genérica por `organization_id` já cobria as
duas tabelas com CRUD completo.

- Novo Data Layer: `src/lib/data/financial.ts` + `financial-schema.ts`.
  CRUD de lançamentos, criação simples de categoria (inline, no próprio
  formulário), fluxo de caixa (`computeCashFlowSummary`) e status efetivo
  derivado (`getEffectiveStatus`).
- **Decisão importante — tipo (receita/despesa)**: a tabela
  `financial_transactions` não tem coluna `type`; o tipo é sempre derivado
  da categoria vinculada (`financial_categories.type`). Por isso o app
  exige categoria no formulário (Zod), mesmo a coluna `category_id` sendo
  nullable no banco — nenhum lançamento sem categoria é criado pela UI.
- **Gap de schema conhecido, não bloqueante**: `financial_transactions`
  não tem `project_id` nem `notes` — só `client_id`. Um lançamento pode
  ser vinculado a um cliente, nunca a um projeto específico, e não há
  campo de observações. Documentado aqui como pendência de schema para
  quando houver necessidade real comprovada; não foi feita migration
  silenciosa para isso.
- **Status "atrasado"**: já existe no `CHECK` (`previsto/proximo/pago/
  atrasado`), mas nada escreve essa transição automaticamente. A UI calcula
  o status efetivo (`vencimento < hoje && status != pago` → "Atrasado")
  só para exibição/filtro, sem sobrescrever o valor persistido.
- **Recorrência**: schema não suporta — não foi criado nenhum motor de
  recorrência; lançamentos são cadastrados individualmente (pendência
  pós-MVP, como já era esperado).
- Tela `/financeiro`: KPIs (entradas, saídas, saldo, a receber, a pagar,
  aviso de vencidos), filtros (tipo, status, categoria, cliente, período),
  tabela com criar/editar/excluir/marcar como pago-recebido.
- Cliente → Financeiro: a aba (antes placeholder) agora mostra uma lista
  simples e somente-leitura dos lançamentos daquele cliente
  (`TransactionTable` com `readOnly`), com atalho para o módulo completo.
- Dashboard: card "A receber" agora é real (`useCashFlowSummary`), com
  "a pagar"/vencidos na legenda; item de atenção adicionado quando há
  lançamento vencido. Nenhum outro card do Dashboard foi alterado.

**Equipe** passa a ser **REAL/SUPABASE** (leitura + edição do próprio
perfil); permissões continuam sendo aplicadas pelo RLS, não pela UI.

- Novo Data Layer: `src/lib/data/team.ts` (`useTeam()`, join `profiles` +
  `roles` em JS). `mock-data/team.ts` não é mais usado por esta tela — só
  segue como bridge para `ClientTable`/`ClientHeader` (fora de escopo).
- Tela `/equipe`: lista real de perfis (nome, e-mail, avatar/iniciais,
  função) com "Editar meu perfil" visível somente no próprio card.
- **Decisão importante — sem gestão de outros usuários**: a policy
  `profiles_update_self` só permite `id = auth.uid()` — não existe forma
  de um perfil editar o de outro colega sem `service_role` (proibido no
  frontend). Por isso não há edição de `role_id` nem convite de usuário
  nesta fase — inclusão de membros continua pelo fluxo de admin do
  Supabase (`deploy-supabase.yml`), como já documentado desde a Fase 4/5.
- `role_id` não é editável nem para o próprio usuário (evita
  auto-promoção), embora a RLS atual tecnicamente não distinga colunas —
  a restrição é só de UI, registrada aqui para não ser reintroduzida sem
  decisão explícita.
- Configurações: não expandido — segue placeholder, não havia necessidade
  clara para a Equipe funcionar.

**Validação**: `npm run lint`, `npx tsc --noEmit` e `npm run build`
limpos (14 rotas, sem warnings novos). Nenhum script de teste ad hoc foi
necessário — a lógica nova (`computeCashFlowSummary`/`getEffectiveStatus`)
é simples o suficiente para revisão direta, sem estado de tempo real
imprevisível.

## 4j. Relatórios / Rentabilidade / Workload — Fase 7 (feita nesta sessão)

**Relatórios** passa a ser **REAL/SUPABASE**. Nenhuma migration — tudo
derivado dos dados já reais de Clientes/Projetos/Tarefas/Conteúdos/Equipe/
Financeiro, compostos em `src/lib/data/reports.ts` (reaproveita os hooks
`useClients`/`useProjects`/`useTasks`/`useContents`/`useTeam`/
`useFinancialData` já existentes — nenhuma query nova ao Supabase).

- Tela `/relatorios`: filtros (período, cliente, projeto, responsável) +
  4 abas — Visão geral (KPIs de clientes/projetos/tarefas/conteúdos/
  financeiro + tarefas por status + receita x despesa), Clientes (tabela
  com projetos/tarefas/conteúdos/receita/despesa/resultado + top 8 por
  receita), Projetos (tabela operacional + progresso), Equipe (workload +
  tarefas sem responsável). Gráficos são barras simples com o `Progress`
  já existente — nenhuma biblioteca de charts foi adicionada.
- **Rentabilidade por cliente**: real. `financial_transactions.client_id`
  é uma coluna de verdade, então receita/despesa por cliente vêm
  diretamente dela (nunca uma alocação inventada); "Resultado" =
  receita paga − despesa paga daquele cliente.
- **Rentabilidade por projeto**: **não implementada de propósito** —
  `financial_transactions` continua sem `project_id` (confirmado de novo
  nesta fase, mesma limitação já registrada na Fase 6). A aba Projetos
  mostra só desempenho operacional (tarefas, conteúdos, progresso) e
  exibe um aviso explícito de que a rentabilidade financeira por projeto
  não está disponível no schema atual — sem migration para viabilizar isso.
- **Workload**: baseado em volume de tarefas (abertas/em andamento/
  atrasadas/concluídas/total por pessoa), nunca em horas — não existe
  estimativa, apontamento nem timesheet no schema. A sinalização "Volume
  acima da média" compara tarefas abertas de cada pessoa com a média do
  time (>1.5x); rotulada explicitamente como volume, não produtividade.
  "Tarefas sem responsável" listadas à parte.
- Dashboard: não alterado nesta fase (já tinha "A receber" real desde a
  Fase 6).

**Validação**: `npm run lint`, `npx tsc --noEmit` e `npm run build`
limpos (14 rotas). Sem script de teste novo — os cálculos
(`computeOverview`/`computeClientReports`/`computeProjectReports`/
`computeWorkloadReport`) são funções puras simples, revisadas
diretamente, sem estado assíncrono próprio.

**Pendências pós-MVP**: rentabilidade por projeto (exige `project_id` em
`financial_transactions` — migration futura, não feita aqui), timesheet/
horas, exportação/PDF de relatórios, envio agendado, insights com IA.

## 4k. Acabamento do produto — Fase 8 (feita nesta sessão)

Fase de polimento — sem módulo novo, sem migration. Ajustes concretos
encontrados numa revisão prática das telas reais (não uma auditoria
completa):

- **Header**: removidas notificações fictícias hardcoded (texto fixo tipo
  "Mariana comentou no projeto..." desde a Etapa 1, nunca migrado — um
  placeholder-como-real que a Fase 5.8 não pegou por não estar em
  `mock-data/`) — agora mostra "Central de notificações ainda não
  disponível", honesto. Removida a busca global decorativa (`<input
  type="search">` sem `onChange`/ação nenhuma — parecia funcionar e não
  fazia nada). Os itens "Meu perfil"/"Configurações" do menu do avatar não
  tinham `onClick` (links mortos) — agora navegam para `/equipe` e
  `/configuracoes`.
- **Configurações**: deixou de ser `PlaceholderPage`. Mostra organização
  (nome/identificador, somente leitura — editar exige a policy
  `organizations_update_admin`, fora de escopo) e o próprio perfil
  (reaproveita `EditProfileDialog` da Equipe). Sem preferências — nada
  disso existe no schema.
- **Cliente → abas**: removidas as duas abas placeholder residuais
  ("Calendário", "Aprovações") que só mostravam "Em construção" — Fide já
  tem Calendário real (com filtro de cliente) e o conceito de aprovação já
  vive no status de Conteúdo; manter uma aba vazia ao lado das reais
  passava a impressão de produto incompleto.
- **Erros amigáveis**: novo `src/lib/error-message.ts` (`getErrorMessage`)
  centraliza a distinção entre um erro nosso (mensagem curta em português,
  sempre segura de mostrar) e um erro do Postgrest/Supabase (tem `code`,
  nunca deve aparecer cru pro usuário) — aplicado nos 9 pontos que
  faziam `toast.error(error.message)` sem essa checagem (formulários de
  Cliente/Projeto/Tarefa/Conteúdo/Evento/Transação/Categoria/Perfil,
  upload/exclusão de arquivo).
- **Duplo submit em exclusões**: `ConfirmDialog` (usado por toda exclusão
  do app) agora aguarda `onConfirm`, desabilita os botões e mostra
  "Aguarde..." enquanto a chamada está em andamento — antes fechava e
  disparava a ação sem nenhuma proteção contra clique duplo.
- **Dashboard**: "Minhas tarefas" e "Próximas publicações" não tinham
  nenhum link — clicar num item não fazia nada. Agora cada linha navega
  para a tarefa/conteúdo real, e cada card ganhou um link "Ver
  todas"/"Ver todos" para o módulo completo. Nenhum widget novo.
- **Confirmado, sem mudança necessária**: tabelas já têm
  `overflow-x-auto` (`src/components/ui/table.tsx`), Kanban e o grid do
  Calendário já tratam overflow horizontal, sidebar já colapsa para menu
  mobile abaixo de `md`, labels de formulário já usam `FormField`
  (associação `id`/`htmlFor` correta) ou `aria-label` nos Selects, `Table`
  → responsivo por padrão.

**Teste visual**: `next dev` local + `curl` na página de `/login`
confirmou HTML renderizado corretamente com o design system (cores,
Inter, componentes) — não foi possível (nem necessário) testar páginas
autenticadas, já que o Supabase hospedado não é alcançável neste sandbox
(limitação de rede conhecida desde a Fase 4).

**Pendências pós-MVP**: dark mode, customização de dashboard, busca
global real, central de notificações real (schema `notifications` já
existe, sem UI), edição de organização (RBAC admin), avatar upload.

## 4l. Validação final e preparação para publicação — Fase 9 (feita nesta sessão)

Fase de validação — sem feature nova, sem migration. `lint`/`tsc`/`build`
já estavam limpos no início; um bug real encontrado e corrigido:

- `src/components/shell/placeholder-page.tsx` (o componente
  `PlaceholderPage`) ficou órfão depois que Financeiro/Equipe/Relatórios
  (Fases 6/7) e Configurações (Fase 8) pararam de usá-lo — confirmado
  zero consumidores por busca antes de remover. Removido.

Checagem final de segurança (busca em todo `src/`, sem imprimir valores):
`service_role`/`SUPABASE_SERVICE_ROLE_KEY` só em `server.ts`
(`createServiceRoleClient`, nunca chamada), nenhum `sb_secret_`, nenhum
`organization_id` vindo do cliente, `createSignedUrl` sempre com
expiração, nenhum `getPublicUrl` (bucket privado nunca virou público),
`.env.local` fora do tracking. Nenhuma regressão da Fase 8.

Teste local: `next dev` + `curl` em `/login` e `/` — ambos respondem 200,
HTML renderiza o design system corretamente, sem erro de runtime no log
do servidor. Como o Supabase configurado neste sandbox não é alcançável,
o middleware degrada para um "ator vazio" em vez de travar (mesmo
comportamento documentado desde a Fase 5.1) — o redirecionamento real
para `/login` só é validável com um Supabase hospedado alcançável, o que
este ambiente não permite; isso não é um bug novo, é a mesma limitação de
rede conhecida desde a Fase 4.

Vercel: `next.config.ts` padrão, scripts `build`/`start` padrão, sem
`vercel.json` necessário, sem dependência de filesystem — projeto
compatível com deploy serverless padrão sem nenhuma mudança de código.

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
  — CRUD real contra o Supabase hospedado (`src/lib/data/clients.ts`).
  Listar, criar, editar, excluir, filtrar, status, serviços contratados —
  tudo real. As abas Projetos, Tarefas e Conteúdos do detalhe do cliente
  também já são reais (ver seções 4c/4d/4e); só o KPI de conteúdo é
  calculado, o resto (mensalidade) já era real desde a Fase 5.2.
- **Projetos** (Fase 2 visual + Fase 5.3 backend): **REAL/SUPABASE**
  — CRUD real (`src/lib/data/projects.ts`). Listar, criar, editar,
  excluir, status, cliente, responsável, datas, descrição, campanha —
  tudo real. Tarefas e Conteúdos relacionados no detalhe do projeto
  também já são reais (ver seções 4d/4e).
- **Tarefas** (Fase 2 visual + Fase 5.4 backend): **REAL/SUPABASE** —
  CRUD real (`src/lib/data/tasks.ts`). Listagem, Kanban, detalhe, criar,
  editar, status, prioridade, prazo, cliente, projeto, responsável,
  conclusão e comentários — tudo real. "Conteúdo relacionado" no detalhe
  também já é real (ver seção 4e); "Histórico" segue como "ainda não
  disponível" (sem infraestrutura de `activity_logs`).
- **Conteúdos** (Fase 3 visual + Fase 5.5 backend): **REAL/SUPABASE** —
  CRUD real (`src/lib/data/contents.ts`). Listagem, detalhe, criar,
  editar, status editorial, cliente, projeto, responsável, tipo, canal,
  agendamento, legenda, CTA e Conteúdo ↔ Tarefas (`content_tasks`) — tudo
  real. `content_comments` não tem UI (nunca teve, mesmo mockado) — ver
  seção 4e. Mídia agora é real (Storage — ver seção 4g).
- **Calendário** (Fase 3 visual + Fase 5.6 backend): **REAL/SUPABASE** —
  Month/Week/List agregam Conteúdos + Tarefas + `calendar_events` reais
  (ver seção 4f), sem nenhuma cópia de dados. CRUD completo de eventos
  manuais (reunião/evento/prazo) novo nesta fase.
- **Arquivos / Storage** (Fase 5.7): **REAL/SUPABASE** para Conteúdo,
  Cliente e Projeto (upload, listagem, download via signed URL, exclusão —
  ver seção 4g). Tarefa ainda não suportada (sem bucket dedicado).
- **Dashboard** (Fase 1 visual + Fase 5.8/6 backend): **REAL/SUPABASE**
  para tudo que representa módulo já migrado — KPIs de tarefas/
  publicações/a receber, "Minhas tarefas" (`useCurrentActor()` +
  `useTasks()`), "Próximas publicações" (`useContents()`). "Atividade
  recente" é um estado vazio honesto, sem `activity_logs` implementado.
- **Financeiro** (Fase 6): **REAL/SUPABASE** — CRUD real
  (`src/lib/data/financial.ts`). Contas a receber/pagar, categorias,
  status, cliente, fluxo de caixa, filtros — ver seção 4i. Projeto
  relacionado e recorrência não suportados (schema não tem essas colunas).
- **Equipe** (Fase 6): **REAL/SUPABASE** — leitura real de `profiles` +
  `roles` (`src/lib/data/team.ts`), edição do próprio perfil. Sem gestão
  de outros usuários/roles (RLS não permite sem `service_role`) — ver
  seção 4i.
- **Relatórios** (Fase 7): **REAL/SUPABASE** — Visão geral, Clientes,
  Projetos e Equipe, tudo derivado dos dados reais existentes
  (`src/lib/data/reports.ts`), sem nenhuma query nova ao Supabase. Ver
  seção 4j para o que é real vs. as limitações de schema (rentabilidade
  por projeto, workload em horas).

## 8. Módulos ainda mockados / não iniciados

- Gestão de outros usuários (convite, troca de role de colega): fora do
  MVP da Fase 6 — RLS só permite `profiles_update_self`; inclusão de
  membros continua pelo fluxo de admin do Supabase.
- Arquivos da Tarefa: `files.task_id` existe no schema, mas não há bucket
  `task-files` — card "Arquivos" da Tarefa continua placeholder (ver
  seção 4g; decisão de qual bucket usar fica para uma fase futura).
- `content_comments`: sem UI (nunca teve, mesmo mockado) — ver seção 4e.
- "Histórico" da Tarefa e "Atividade recente" do Dashboard: sem
  infraestrutura de gravação em `activity_logs` em nenhum módulo ainda —
  mostram estado "ainda não disponível" honesto em vez de dado fabricado.
- Após a Fase 5.8, os únicos arquivos em `src/lib/mock-data/` que restam
  são bridges de resolução de nome (`registerSupabaseX`/cache, usados pelo
  breadcrumb e por componentes de exibição) e vocabulário de domínio
  (`CONTENT_TYPE_OPTIONS`/`CHANNEL_OPTIONS`) — nenhuma entidade fake
  restante em lugar nenhum do `src/`.

## 9. Roadmap

```
FASE 1 — Fundação/App Shell/Dashboard         ✅ concluída
FASE 2 — Clientes/Projetos/Tarefas/Kanban      ✅ concluída visualmente
FASE 3 — Conteúdos/Calendário                  ✅ concluída visualmente
FASE 4 — Infraestrutura Supabase               ✅ concluída e validada no Supabase real
FASE 5 — Conectar frontend ao Supabase real    ✅ concluída (ver seção 4h — critério 10/10 parcial: E2E hospedado não validável neste sandbox)
  5.1 Auth + sessão + organização              ✅ concluída — REAL/SUPABASE
  5.2 Clientes                                 ✅ concluída — REAL/SUPABASE
  5.3 Projetos                                 ✅ concluída — REAL/SUPABASE
  5.4 Tarefas + Kanban                         ✅ concluída — REAL/SUPABASE
  5.5 Conteúdos                                ✅ concluída — REAL/SUPABASE
  5.6 Calendário                               ✅ concluída — REAL/SUPABASE
  5.7 Arquivos / Supabase Storage              ✅ concluída — REAL/SUPABASE (Conteúdo/Cliente/Projeto)
  5.8 Remoção final dos mocks + validação      ✅ concluída (esta sessão) — ver seção 4h
FASE 6 — Financeiro + Equipe (MVP essencial)   ✅ concluída — ver seção 4i — REAL/SUPABASE
FASE 7 — Relatórios/Rentabilidade/Workload     ✅ concluída — ver seção 4j — REAL/SUPABASE
FASE 8 — Acabamento do produto                 ✅ concluída — ver seção 4k
FASE 9 — Validação final / preparação p/ deploy ✅ concluída (esta sessão) — ver seções 4l e 12 — PRONTO PARA PREVIEW
```

Próxima etapa: gerar o Vercel Preview Deployment (ver seção 12) e, quando
possível, validar end-to-end contra o Supabase hospedado fora deste
sandbox.

Pendências pós-MVP acumuladas (não bloqueiam a conclusão de nenhuma fase):
projeto relacionado e observações em lançamentos financeiros, rentabilidade
financeira por projeto, recorrência financeira, conciliação/boleto/Pix/
nota fiscal, timesheet/horas, gestão de outros usuários e troca de role
(exige `service_role`, fora do frontend), exportação/PDF/agendamento de
relatórios, insights com IA, busca global real, central de notificações
real, edição de organização (RBAC admin), avatar upload, dark mode.

## 10. Decisões técnicas importantes

- **Sem embedded selects do PostgREST**: toda query é flat + join em JS,
  por não ter sido possível validar o formato inferido dos embeds sem um
  projeto Supabase ao vivo no início da Etapa 4. Mantido por consistência.
- **Migração gradual, não big-bang**: mock e Supabase coexistem
  deliberadamente; um módulo só perde o mock quando sua Fase 5.x for feita.
- **Bridge de nomes** (`registerSupabaseX`/cache em cada
  `src/lib/mock-data/*.ts`): deixa componentes já aprovados (breadcrumb,
  tabelas que mostram "responsável") resolverem UUIDs reais do Supabase sem
  precisar redesenhar nada. Desde a Fase 5.8, os caches de
  clientes/projetos/tarefas/conteúdos são observáveis
  (`src/lib/name-cache.ts`, via `useSyncExternalStore`) para não ficarem
  presos quando o consumidor (`Header`) está numa árvore de render
  diferente de quem populou o cache — o de perfis (`team.ts`) continua um
  `Map` simples, porque seus consumidores estão sempre na mesma árvore de
  quem carrega o dado.
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

**Para deploy (Vercel ou qualquer host)**: confirmado por busca em todo o
`src/` (Fase 9) que só 2 variáveis são efetivamente necessárias para o
app funcionar —
`NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY` (ambas
seguras para o navegador — todo acesso é protegido por RLS). A terceira,
`SUPABASE_SERVICE_ROLE_KEY`, só é lida por `createServiceRoleClient()`
(`src/lib/supabase/server.ts`), uma função reservada que nenhum código do
app chama hoje — pode ficar de fora do ambiente de deploy sem quebrar
nada; só é necessária se/quando essa função passar a ser usada.

## 12. MVP / Versão inicial — pronta para preview

Critérios de "pronto para preview" (Fase 9) — todos atendidos:

- ✅ `npm run lint`, `npx tsc --noEmit` e `npm run build` limpos (14 rotas).
- ✅ Rotas coerentes: `/login`, `/`, `/clients(+[id])`, `/projects(+[id])`,
  `/tasks(+[id])`, `/contents(+[id])`, `/calendar`, `/financeiro`,
  `/equipe`, `/relatorios`, `/configuracoes` — todas existem, sem import
  quebrado, `/_not-found` cobre rota inválida.
- ✅ Auth coerente: middleware redireciona não-autenticado → `/login` e
  autenticado em `/login` → `/`; nenhum bypass. Falha do Supabase nunca
  vira tela branca (degrada para estado tratado — comportamento
  documentado desde a Fase 5.1).
- ✅ Nenhum módulo principal usa mock como fonte real — confirmado de novo
  nesta fase (busca por `TODO`, ID mock hardcoded, `localStorage`); os
  únicos arquivos em `mock-data/` que restam são bridges de nome e
  vocabulário de domínio (Fase 5.8).
- ✅ Sem secret no frontend: `SUPABASE_SERVICE_ROLE_KEY` só em
  `server.ts`, nunca chamada; `.env.local` fora do tracking.
- ✅ Sem quebra estrutural conhecida.
- ✅ Deploy Vercel padrão compatível: Next.js App Router puro,
  `next build`/`next start`, sem `vercel.json` necessário, sem
  dependência de filesystem local, sem `output: "export"`.

**Módulos concluídos (REAL/SUPABASE)**: Auth/Organização, Dashboard,
Clientes, Projetos, Tarefas, Conteúdos, Calendário, Arquivos, Financeiro,
Equipe, Relatórios, Configurações (org read-only + próprio perfil).

**Limitações conhecidas** (documentadas nas fases 5.7/6/7, reconfirmadas
aqui): arquivos de Tarefa sem bucket dedicado; rentabilidade financeira
por projeto não suportada (`financial_transactions` sem `project_id`);
workload por volume de tarefas, não por horas (sem timesheet);
`content_comments` e histórico de Tarefa sem UI (sem `activity_logs`);
gestão de outros usuários/roles fica pelo admin do Supabase (RLS só
permite `profiles_update_self`); validação E2E contra o Supabase
hospedado não é possível neste sandbox (rede bloqueada) — validado por
código, build e teste local (`next dev` + `curl` em `/login` e `/`, sem
erro de runtime, sem tela branca).

**Próxima ação**: gerar um Vercel Preview Deployment desta branch,
cadastrando `NEXT_PUBLIC_SUPABASE_URL` e `NEXT_PUBLIC_SUPABASE_ANON_KEY`
nas variáveis de ambiente do projeto na Vercel (ver instruções já
fornecidas anteriormente nesta sessão de trabalho).

## 13. Fase 10 — Grande evolução do FIDE ONE (feita nesta sessão)

Expansão completa: permissões/RBAC extensível, branding white-label,
convites reais, Crescimento/Comercial, Calendário redesenhado + Etiquetas,
Tarefas com Calendário + lembretes por e-mail, Financeiro com Contratos/
Previsibilidade, Workspace do Cliente + Entregáveis/Extras, Tickets, e
arquitetura (não implementação) de IA futura. Commits (nesta ordem):
"bloco A+D parcial", "bloco B", "bloco C" (x2), "bloco E".

**Migrations novas** (`supabase/migrations/2026091800000{1..6}_*.sql`,
ainda não aplicadas no Supabase hospedado — rede bloqueada neste sandbox,
aplicar via `deploy-supabase.yml`):
`permissions, role_permissions, has_permission()` (função RLS-friendly);
`organizations.display_name/accent_color/favicon_url`; `services`
estendida (description/default_price/billing_type/billing_period/
category/active) + `contracts` + `revenue_targets` +
`revenue_target_items`; `crm_pipelines/crm_stages/crm_leads/
crm_lead_stage_history`; `labels/content_labels/calendar_event_labels/
task_reminders`; `deliverables/service_extras/tickets/ticket_comments`.
`profiles.deactivated_at` (mirror do ban do Admin API, só a rota
server-side escreve nele).

**Permissões**: `PermissionKey` (24 chaves, `src/lib/auth/permissions.ts`)
— nada no app checa slug de role diretamente, sempre `has_permission()`
(SQL, usado em RLS) ou `useHasPermission()`/`RequirePermission` (UI).
Roles: `administrador` renomeada para "Diretor" (slug mantido, todas as
permissões); nova role `head_operacao` ("Head de Operação") + todas as
roles operacionais existentes ganham o mesmo conjunto (tudo exceto
`finance.*`, `settings.manage`, `team.manage`); `financeiro` ganha
`finance.view`+`finance.manage`. `financial_transactions`/
`financial_categories` tiveram as policies recriadas para exigir
`has_permission('finance.view'|'finance.manage')`, não só
`organization_id`.

**Módulos novos**: `/growth` (Crescimento — meta mensal + esteira +
produtos, produtos reaproveitam `services`), `/crm` (pipelines/etapas
editáveis, Kanban leads, histórico de movimentação), `/tickets` (+
`/tickets/[id]` com thread de comentários), `/assistente-ia` (stub
honesto — ver `src/lib/ai/types.ts`, zero integração real).

**Módulos estendidos**: Calendário (grade mais densa, "+" para criar
Conteúdo direto no dia, Etiquetas CRUD via "Gerenciar etiquetas"); Tarefas
(aba Calendário por `due_date`, lembretes configuráveis com envio por
e-mail); Financeiro (aba Contratos + aba Dashboard com Previsibilidade
3/6/12 meses, `src/lib/data/predictability.ts` — só dados reais de
`contracts`+`financial_transactions`, sem IA/estimativa); Dashboard geral
(zero dado financeiro — 3º KPI virou "Aguardando aprovação"); Cliente
(aba Workspace = Kanban de Contents por status, aba Escopo = Entregáveis
+ Serviço Extra); Equipe (convite real via Admin API, ativar/desativar
acesso, trocar role de colega); Configurações (branding: nome/cor/logo/
favicon, aplicado globalmente via CSS custom properties).

**Lembretes de tarefa**: `src/lib/notifications/` (abstração por canal;
`whatsapp` resolve para sender `null` de propósito — UI mostra
"WhatsApp — integração futura", nunca um botão que finge funcionar).
Cron em `/api/cron/task-reminders` (`vercel.json`, hora em hora),
autenticado por `CRON_SECRET` (Vercel injeta o header automaticamente
quando a env var existe no projeto), roda como `service_role`.

**Variáveis de ambiente novas** (nomes apenas — configurar na Vercel,
nunca commitar valor):
- `CRON_SECRET` — autentica o cron de lembretes.
- `RESEND_API_KEY` — envio de e-mail via Resend (chamada HTTP direta,
  sem novo pacote). Sem ela, lembretes não são enviados (e não marcam
  `sent_at`) — falha visível, não silenciosa.
- `RESEND_FROM_EMAIL` (opcional) — remetente; precisa de domínio
  verificado no Resend.
- `NEXT_PUBLIC_SITE_URL` (opcional) — base para os links nos e-mails de
  lembrete; sem ela usa `VERCEL_URL` ou a URL de produção conhecida.
- `SUPABASE_SERVICE_ROLE_KEY` já existia (Fase 5.1) mas passou a ser
  **usada de fato** pela primeira vez, pelas duas Route Handlers de
  Equipe (`/api/team/invite`, `/api/team/[id]`) e pelo cron — confirmar
  que está configurada na Vercel antes do deploy.

**Pendências conhecidas / não implementado nesta fase** (nenhuma
omitida — ver relatório final desta sessão para detalhe item a item):
Meta Leads/formulário do site/WhatsApp como origem real de Lead no CRM
(arquitetura pronta — `crm_leads.source`/`service_id` — sem integração);
WhatsApp como canal real de lembrete (schema e abstração prontos, sem
provedor); assistente de IA (só o limite arquitetural, zero integração);
`deliverables.delivered_count` é contador manual, não calculado
automaticamente a partir de Contents/Tasks (decisão documentada na
própria migration — não existe hoje um vínculo confiável para isso);
sem framework de testes no projeto — a lógica pura nova
(`reminder-schedule.ts`, `predictability.ts`) foi revisada manualmente,
não coberta por testes automatizados.

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
| Data Layer real (Tarefas) | `src/lib/data/tasks.ts`, `task-schema.ts` |
| Data Layer real (Conteúdos) | `src/lib/data/contents.ts`, `content-schema.ts` |
| Data Layer real (Calendário) | `src/lib/data/calendar.ts`, `calendar-schema.ts`, `src/lib/services/calendar-service.ts` (agregador) |
| Data Layer real (Arquivos) | `src/lib/data/files.ts`, `src/lib/files-utils.ts`, `src/components/files/*` |
| Migrations | `supabase/migrations/*.sql` |
| Seed hospedado | `supabase/manual/seed-hosted.sql` |
| Testes de RLS | `supabase/manual/rls-tests.sql` |
| Deploy automatizado | `.github/workflows/deploy-supabase.yml`, `scripts/deploy/create-users.mjs` |
| Runbook de deploy | `docs/supabase-deployment.md` |

Deployment V2 production trigger — 2026-09-18
