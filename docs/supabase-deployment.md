# FIDE ONE — Deploy no Supabase hospedado

Runbook objetivo para colocar o projeto Supabase hospedado no mesmo estado
já validado localmente (migrations, RLS, seed, Storage). Execute as fases
**em ordem**, tudo pelo **SQL Editor** e pela aba **Authentication** do
Supabase Dashboard.

> Este ambiente de desenvolvimento não tem acesso de rede a `*.supabase.co`
> — por isso nada aqui foi rodado contra o projeto real, só contra um
> Postgres equivalente local. Cada fase diz exatamente o que copiar e o
> que me mandar de volta (resultado ou erro) para eu revisar.

Arquivos usados neste runbook:

| Arquivo | Fase | O que faz |
|---|---|---|
| `supabase/manual/apply-migrations.sql` | B | As 13 migrations, concatenadas na ordem certa |
| `supabase/manual/seed-hosted.sql` | F | Dados de exemplo (clientes, projetos, tarefas, conteúdos, eventos) |
| `supabase/manual/rls-tests.sql` | H | Testes de isolamento entre organizações, notifications, profiles, activity_logs |
| `supabase/manual/verification.sql` | B, G | Conferência de tabelas, colunas, FKs, RLS, policies, triggers, funções, buckets |

---

## FASE A — Verificação inicial

1. Confirme que o projeto Supabase hospedado existe e está com status "Active" no Dashboard.
2. Vá em **Project Settings → API** e anote (não me envie):
   - **Project URL** (`https://xxxxxxxx.supabase.co`)
   - **anon / publishable key**
   - **service_role / secret key**
3. No seu ambiente local do FIDE ONE, copie `.env.local.example` para `.env.local` e preencha os 3 valores acima.
4. Confirme que `.env.local` **não** aparece em `git status` (já está no `.gitignore`).
5. Confirme no SQL Editor que o schema `public` está vazio (projeto novo):
   ```sql
   select count(*) from information_schema.tables where table_schema = 'public';
   ```
   Esperado: `0`. Se não for zero, pare e me avise antes de continuar — não rode a Fase B por cima de tabelas que já existem.

**Me envie:** o resultado do passo 5 (só o número, nunca as chaves).

---

## FASE B — Aplicação das migrations

1. Abra o SQL Editor → New query.
2. Cole o conteúdo inteiro de `supabase/manual/apply-migrations.sql`.
3. Clique em Run **uma única vez**.
4. Rode as seções 1, 4, 5, 6, 7, 8, 9, 10 de `supabase/manual/verification.sql` (tabelas, colunas, FKs, PKs, índices, triggers, funções, RLS habilitado).

Esperado: sem erros no passo 3; 19 tabelas na seção 1 da verificação; RLS `true` em todas as 19 linhas da seção 9.

**Me envie:** qualquer erro do passo 3 (mensagem completa) e o resultado da seção 9 de `verification.sql`.

---

## FASE C — Criação da organização

No SQL Editor:

```sql
insert into public.organizations (name, slug) values ('Fide Comunicação', 'fide')
on conflict (slug) do nothing;

select id from public.organizations where slug = 'fide';
```

**Guarde o `id` retornado** — você vai usar exatamente esse valor na Fase D (metadados de cada usuário).

---

## FASE D — Criação dos usuários

Feito pelo **Dashboard → Authentication → Users**, nunca por INSERT manual em
`auth.users` (é exatamente o que a Etapa 4B pediu para evitar).

Cinco usuários de desenvolvimento:

| Nome | E-mail | `role_slug` |
|---|---|---|
| Daniel | `daniel@fide.com.br` | `administrador` |
| Fernanda | `fernanda@fide.com.br` | `social_media` |
| Mariana | `mariana@fide.com.br` | `gestor` |
| Bruno | `bruno@fide.com.br` | `copy` |
| Camila | `camila@fide.com.br` | `design` |

Para **cada** um:

1. Clique em **Add user**.
2. Preencha o e-mail.
3. **Senha**: prefira **"Send invite email"** (o próprio usuário define a senha ao aceitar o convite — nenhuma senha passa pela sua mão nem pela minha). Se seu plano/projeto não tiver envio de e-mail configurado, use **"Auto Confirm User"** com uma senha forte gerada por um gerenciador de senhas (16+ caracteres, única por pessoa) — guarde-a só no seu gerenciador de senhas, nunca em arquivo do repositório, nunca me envie.
4. Se o formulário tiver um campo **"User Metadata" (JSON)**, preencha exatamente (trocando o e-mail/nome/role_slug pela linha da tabela acima, e `SEU_ORG_ID` pelo id da Fase C):
   ```json
   { "organization_id": "SEU_ORG_ID", "name": "Daniel", "role_slug": "administrador" }
   ```
   Isso faz o trigger `handle_new_user` criar o `profile` automaticamente, já correto.
5. Se **não** houver esse campo no seu Dashboard, prossiga mesmo assim — a Fase E tem um passo alternativo para esse caso.

**Nunca** use a senha `fideone123` (era só para o teste local, nunca para o projeto real).

---

## FASE E — Profiles e roles

1. Verifique se os 5 profiles foram criados automaticamente:
   ```sql
   select p.name, p.email, r.slug as role_slug, p.organization_id
   from public.profiles p
   join public.roles r on r.id = p.role_id
   order by p.name;
   ```
   Esperado: 5 linhas, uma por usuário, todas com o mesmo `organization_id` da Fase C.

2. **Se alguma linha estiver faltando** (Dashboard sem campo de metadata na Fase D), crie o profile manualmente para aquele usuário específico:
   ```sql
   insert into public.profiles (id, organization_id, name, email, role_id)
   select u.id,
          (select id from public.organizations where slug = 'fide'),
          'Daniel',                          -- troque pelo nome certo
          u.email,
          (select id from public.roles where slug = 'administrador')  -- troque pelo role_slug certo
   from auth.users u
   where u.email = 'daniel@fide.com.br'      -- troque pelo e-mail certo
   on conflict (id) do nothing;
   ```

**Me envie:** o resultado do passo 1 (a tabela com as 5 linhas).

---

## FASE F — Seed dos dados de desenvolvimento

Só depois da Fase E confirmada (5 profiles existindo).

1. Cole `supabase/manual/seed-hosted.sql` inteiro no SQL Editor e rode uma vez.
2. Esperado: mensagem final `Seed hospedado concluído: 7 clientes, 7 serviços, 9 projetos, 20 tarefas, 10 conteúdos, 5 eventos.`, sem erros.

Não rode este arquivo duas vezes (ele não tem `on conflict` de propósito, para nunca duplicar dados silenciosamente). Se precisar recomeçar, apague antes as linhas destas tabelas (nunca as de `profiles`/`organizations`/`auth.users`).

**Me envie:** a mensagem final e qualquer erro.

---

## FASE G — Storage

Os 4 buckets (`logos`, `client-files`, `project-files`, `content-media`) e as 16 políticas já foram criados na Fase B (fazem parte da migration 13). Só confirme:

```sql
select id, public from storage.buckets order by id;
```

Esperado: as 4 linhas, `logos` com `public = true`, as outras 3 com `false`. Nenhuma ação manual é necessária aqui — não crie bucket nenhum pela UI do Storage, ou vai ficar duplicado/sem política.

**Me envie:** o resultado da query acima.

---

## FASE H — Testes de RLS

1. Cole `supabase/manual/rls-tests.sql` inteiro e rode uma vez.
2. O arquivo tem 4 seções, cada uma com comentários `-- ESPERADO: ...` acima da query relevante.
3. As únicas duas mensagens de erro esperadas no output inteiro são `new row violates row-level security policy for table "clients"` (aparecem 2 vezes). Qualquer outro erro, ou qualquer `ESPERADO` que não bateu, é um problema real.

**Me envie:** a saída completa do Run (ou pelo menos os valores de cada `ESPERADO`, na ordem).

---

## FASE I — Testes de CRUD

**Clientes** — único módulo já conectado ao Supabase no frontend hoje (decisão já aprovada na Etapa 4; os demais seguem no mock, ver Fase J):
1. Rode `npm run dev` com o `.env.local` da Fase A preenchido.
2. Acesse `/login`, entre com um dos 5 usuários da Fase D.
3. Vá em `/clients`: confirme que os 7 clientes do seed aparecem.
4. Crie um cliente novo → confirme que aparece na lista sem reload manual.
5. Edite esse cliente → confirme que a alteração persiste.
6. Abra o detalhe de um cliente do seed → confirme os dados.

**Projetos / Tarefas / Conteúdos / Calendário** — ainda rodam sobre mock data no frontend (não foram religados nesta etapa, só a infraestrutura foi validada). Não dá para testar isso pela UI ainda. O que dá para confirmar agora é que o **banco** aceita esse CRUD corretamente, direto pelo SQL Editor, por exemplo:
```sql
select set_config('request.jwt.claim.sub', (select id::text from public.profiles where email = 'daniel@fide.com.br'), false);
set role authenticated;
select count(*) from public.projects;  -- deve mostrar 9
select count(*) from public.tasks;     -- deve mostrar 20
reset role;
```
Religar essas telas ao Supabase é trabalho de uma etapa futura de migração — sinalizo isso explicitamente para não passar a impressão de que já está pronto.

**Me envie:** confirmação de cada passo do bloco "Clientes" (ok ou o que deu errado) e o resultado da query acima.

---

## FASE J — Teste de autenticação

Com a app rodando localmente contra o projeto real:

1. Login com um usuário válido → deve entrar e mostrar nome/cargo reais no Header (não mais "Carregando...").
2. Logout → deve voltar para `/login`.
3. Acessar uma rota protegida (ex.: `/clients`) sem estar logado → deve redirecionar para `/login?redirectTo=/clients`.
4. Login com credencial errada → mensagem de erro amigável (não deve aparecer stack trace nem mensagem técnica do Supabase).
5. Estando logado, fechar e reabrir o navegador → sessão deve continuar válida (cookie/refresh token).

**Me envie:** resultado de cada item (ok / não ok + descrição).

---

## FASE K — Checklist final

Marque conforme for confirmando (ou me diga o que ainda falhou):

```
[ ] Projeto Supabase hospedado conectado (.env.local com valores reais)
[ ] 13 migrations aplicadas sem erro (Fase B)
[ ] 19 tabelas confirmadas por verification.sql (Fase B)
[ ] Organização "Fide Comunicação" criada (Fase C)
[ ] 5 usuários criados pelo Dashboard, sem senha "fideone123" (Fase D)
[ ] 5 profiles criados corretamente pelo trigger handle_new_user (Fase E)
[ ] Roles (10 papéis fixos) presentes (verification.sql seção 13)
[ ] Seed de dados aplicado sem erro (Fase F)
[ ] Buckets de Storage confirmados (Fase G)
[ ] RLS testado: isolamento entre organizações OK (Fase H, seção 1)
[ ] RLS testado: notifications OK (Fase H, seção 2)
[ ] RLS testado: profiles OK (Fase H, seção 3)
[ ] RLS testado: activity_logs append-only OK (Fase H, seção 4)
[ ] CRUD real de Clientes testado pela UI (Fase I)
[ ] CRUD de Projetos/Tarefas/Conteúdos/Calendário confirmado só no banco (Fase I) — ainda mock na UI
[ ] Autenticação testada (login, logout, proteção de rota, erro de credencial) (Fase J)
[ ] npm run build / lint / typecheck sem erro
```

Depois de completar isto, **não avançar para o Financeiro** — aguardar aprovação explícita.
