# FIDE ONE — Deploy no Supabase hospedado

Agora existe uma automação (`.github/workflows/deploy-supabase.yml`) que faz
sozinha tudo que antes precisava ser feito manualmente no SQL Editor do
Supabase: aplicar as 13 migrations, criar a organização, convidar os 5
usuários de desenvolvimento por e-mail, popular os dados de exemplo, testar
o isolamento entre organizações e conferir a estrutura final. Você só
precisa colocar 3 informações no GitHub e clicar em um botão — nada de SQL.

> Por que pelo GitHub e não direto por aqui? Este ambiente de desenvolvimento
> não tem saída de rede para `*.supabase.co` (nem via HTTPS nem via conexão
> direta de banco de dados) — é um bloqueio de política, confirmado nos
> testes, não algo que se contorna. O GitHub Actions roda em outra rede, sem
> essa restrição, então é ele quem efetivamente conecta no seu projeto
> Supabase — eu só preparo e reviso o que acontece lá.

---

## PASSO 1 — Colocar 3 informações no GitHub (5 minutos, só copiar e colar)

No site do Supabase (**supabase.com**, projeto do FIDE ONE), abra
**Project Settings**:

| Vá em... | Copie... | Nome exato do segredo no GitHub |
|---|---|---|
| Settings → Database → Connection string → aba **URI** | A string inteira, substituindo `[YOUR-PASSWORD]` pela senha do banco do projeto | `SUPABASE_DB_URL` |
| Settings → API → **Project URL** | A URL (tipo `https://xxxxxxxx.supabase.co`) | `SUPABASE_URL` |
| Settings → API → **service_role** (clique em "Reveal" para mostrar) | A chave inteira | `SUPABASE_SERVICE_ROLE_KEY` |

Agora, no GitHub (**github.com**, no repositório do FIDE ONE):

1. Vá em **Settings** (do repositório, não da sua conta) → **Secrets and variables** → **Actions**.
2. Clique em **New repository secret**.
3. Em "Name", cole exatamente `SUPABASE_DB_URL`. Em "Secret", cole o valor copiado. Clique **Add secret**.
4. Repita para `SUPABASE_URL` e `SUPABASE_SERVICE_ROLE_KEY`.

Pronto — essas 3 informações ficam guardadas só pelo GitHub, criptografadas;
nem eu nem mais ninguém consegue vê-las depois de salvas, só usá-las dentro
da automação.

---

## PASSO 2 — Rodar a automação

1. No GitHub, vá na aba **Actions** do repositório.
2. Na lista à esquerda, clique em **Deploy infraestrutura Supabase**.
3. Clique no botão **Run workflow** (canto direito) → deixe as duas opções
   marcadas (seed de dados + testes de isolamento) → **Run workflow**.
4. Espere terminar (1 a 3 minutos). Um ✔️ verde aparece quando concluir; um
   ❌ vermelho indica que algo falhou.
5. Clique na execução que acabou de rodar → role até **Resumo em português
   (leia isto primeiro)**, perto do final da página. Ele mostra em
   linguagem simples o que funcionou.

**Se aparecer algum ❌:** copie a página inteira (o resumo em português +
as seções técnicas logo abaixo dele) e me envie — eu leio e corrijo.

**Sobre os 5 usuários:** cada pessoa (Daniel, Fernanda, Mariana, Bruno,
Camila) recebe um e-mail de convite do Supabase para o respectivo endereço
`@fide.com.br` — ela mesma define a própria senha ao clicar no link. Nenhuma
senha passa por mim, pelo GitHub ou por este chat em nenhum momento. Se o
e-mail não chegar, veja a caixa de spam; se mesmo assim não chegar, me avise
(pode ser necessário configurar o envio de e-mail do projeto no Supabase —
resolvo isso quando você confirmar).

**Rodar de novo é seguro:** a automação não duplica nada — migrations já
aplicadas são ignoradas, a organização e os usuários já existentes são
pulados. Só desmarque "seed de dados" na segunda vez (senão ela tenta criar
os clientes de exemplo de novo e dá erro de duplicidade, de propósito, pra
nunca duplicar dado silenciosamente).

---

## PASSO 3 — Testar a aplicação de verdade

Isto aqui eu não consigo automatizar — precisa ser você clicando na
aplicação, porque roda no seu navegador com a sua sessão de login.

1. Preencha `.env.local` (copie de `.env.local.example`) com os mesmos 3
   valores do Passo 1 — troque `SUPABASE_URL` por `NEXT_PUBLIC_SUPABASE_URL`,
   e adicione também a chave **anon / publishable** (Settings → API, a que
   fica ao lado da service_role) em `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
2. Rode a aplicação (`npm run dev`) e acesse `/login`.
3. Entre com um dos 5 e-mails (depois que a pessoa já tiver aceitado o
   convite e definido a senha).
4. Confirme: nome e cargo reais aparecem no cabeçalho; `/clients` mostra os
   7 clientes de exemplo; dá para criar/editar um cliente novo e ele
   continua lá depois de recarregar a página.
5. Projetos, Tarefas, Conteúdos e Calendário continuam nas mesmas telas de
   antes — ainda não foram ligadas ao banco real nesta etapa (isso é
   trabalho de uma etapa futura), então não vão refletir os dados do seed
   ainda.

**Me envie:** ok / não ok de cada item, e o que exatamente deu errado se
algo não funcionou.

---

## Checklist final

```
[ ] 3 segredos configurados no GitHub (Passo 1)
[ ] Workflow "Deploy infraestrutura Supabase" rodou com ✔️ verde (Passo 2)
[ ] Resumo em português sem nenhum ❌
[ ] Convites de e-mail recebidos e senha definida por cada um dos 5 usuários
[ ] Login funcionando na aplicação (Passo 3)
[ ] Clientes: listar/criar/editar funcionando contra o banco real (Passo 3)
[ ] npm run build / lint / typecheck sem erro
```

Depois de completar isto, **não avançar para o Financeiro** — aguardar
aprovação explícita.

---

## Plano B — passo a passo manual pelo SQL Editor

Só use isto se o workflow do Passo 2 falhar de um jeito que eu não consiga
corrigir pela automação. Cada fase abaixo já foi validada previamente contra
um Postgres equivalente, mas exige que você mesmo cole comandos no painel do
Supabase — é o caminho mais trabalhoso, mantido aqui só como reserva.

Arquivos usados neste plano B (os mesmos que o workflow automatizado usa
por trás dos panos):

| Arquivo | O que faz |
|---|---|
| `supabase/manual/apply-migrations.sql` | As 13 migrations, concatenadas na ordem certa |
| `supabase/manual/seed-hosted.sql` | Dados de exemplo (clientes, projetos, tarefas, conteúdos, eventos) |
| `supabase/manual/rls-tests.sql` | Testes de isolamento entre organizações, notifications, profiles, activity_logs |
| `supabase/manual/verification.sql` | Conferência de tabelas, colunas, FKs, RLS, policies, triggers, funções, buckets |

### FASE A — Verificação inicial

1. Confirme que o projeto Supabase hospedado existe e está "Active".
2. Preencha `.env.local` com URL / anon key / service_role key (Settings → API).
3. Confirme no SQL Editor que o schema `public` está vazio:
   ```sql
   select count(*) from information_schema.tables where table_schema = 'public';
   ```
   Esperado: `0`.

### FASE B — Aplicação das migrations

1. Cole `supabase/manual/apply-migrations.sql` inteiro no SQL Editor, rode uma vez.
2. Rode `supabase/manual/verification.sql` — esperado: 19 tabelas, RLS `true` em todas.

### FASE C — Criação da organização

```sql
insert into public.organizations (name, slug) values ('Fide Comunicação', 'fide')
on conflict (slug) do nothing;
select id from public.organizations where slug = 'fide';
```
Guarde o `id` retornado.

### FASE D — Criação dos usuários

Pelo Dashboard → Authentication → Users → Add user, um por um:

| Nome | E-mail | `role_slug` |
|---|---|---|
| Daniel | `daniel@fide.com.br` | `administrador` |
| Fernanda | `fernanda@fide.com.br` | `social_media` |
| Mariana | `mariana@fide.com.br` | `gestor` |
| Bruno | `bruno@fide.com.br` | `copy` |
| Camila | `camila@fide.com.br` | `design` |

Use "Send invite email" (sem senha manual). Se houver campo "User Metadata"
(JSON), preencha `{ "organization_id": "SEU_ORG_ID", "name": "Daniel", "role_slug": "administrador" }`
trocando os valores por linha.

### FASE E — Profiles

```sql
select p.name, p.email, r.slug as role_slug, p.organization_id
from public.profiles p join public.roles r on r.id = p.role_id order by p.name;
```
Esperado: 5 linhas. Se faltar alguma (Dashboard sem campo de metadata), use o fallback:
```sql
insert into public.profiles (id, organization_id, name, email, role_id)
select u.id, (select id from public.organizations where slug = 'fide'),
       'Daniel', u.email, (select id from public.roles where slug = 'administrador')
from auth.users u where u.email = 'daniel@fide.com.br'
on conflict (id) do nothing;
```

### FASE F — Seed

Cole `supabase/manual/seed-hosted.sql` inteiro, rode uma vez (só depois da Fase E confirmada). Não rode duas vezes.

### FASE G — Storage

```sql
select id, public from storage.buckets order by id;
```
Esperado: `logos` (public=true), `client-files`, `project-files`, `content-media` (public=false).

### FASE H — Testes de RLS

Cole `supabase/manual/rls-tests.sql` inteiro, rode uma vez. As únicas duas mensagens de erro esperadas são `new row violates row-level security policy for table "clients"` (2 vezes). Qualquer outra coisa é problema real.
