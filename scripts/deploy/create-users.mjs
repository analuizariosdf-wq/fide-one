// Convida (por e-mail, sem senha nenhuma passando por aqui) os 5 usuários
// de desenvolvimento do FIDE ONE no projeto Supabase hospedado.
//
// Roda dentro do workflow .github/workflows/deploy-supabase.yml — nunca
// localmente com uma service_role key real, para não expor a chave fora
// do ambiente de CI.
//
// Isto é DADO DE DESENVOLVIMENTO, não infraestrutura: se o Supabase
// limitar o envio de e-mails (plano gratuito manda pouquíssimos e-mails
// por hora sem um provedor de SMTP próprio configurado), este script
// nunca deve travar o deploy da infraestrutura (migrations, RLS,
// Storage, organização) nem impedir o seed/testes de rodarem depois —
// por isso ele sempre termina com sucesso (exit 0) a menos que algo
// realmente inesperado aconteça (ver isUnexpectedFailure). Rodar de novo
// só tenta convidar quem ainda não existe; nunca duplica, nunca reenvia
// para quem já foi convidado ou já aceitou.
import { createClient } from "@supabase/supabase-js";
import { appendFileSync } from "node:fs";

const SUPABASE_URL = process.env.SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error("SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY são obrigatórios.");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const PERSONAS = [
  { email: "daniel@fide.com.br", name: "Daniel", role_slug: "administrador" },
  { email: "fernanda@fide.com.br", name: "Fernanda", role_slug: "social_media" },
  { email: "mariana@fide.com.br", name: "Mariana", role_slug: "gestor" },
  { email: "bruno@fide.com.br", name: "Bruno", role_slug: "copy" },
  { email: "camila@fide.com.br", name: "Camila", role_slug: "design" },
];

// "email_exists" / "user_already_exists" são os códigos estáveis que o
// GoTrue devolve nesse caso (node_modules/@supabase/auth-js/src/lib/error-codes.ts)
// — checar error.code é mais confiável do que procurar texto na mensagem,
// que pode mudar de redação. Mantemos a checagem por mensagem/status como
// reforço, caso uma versão futura da API devolva só isso.
function isAlreadyRegistered(error) {
  if (error?.code === "email_exists" || error?.code === "user_already_exists") {
    return true;
  }
  const message = (error?.message ?? "").toLowerCase();
  return (
    error?.status === 422 ||
    message.includes("already been registered") ||
    message.includes("already registered") ||
    message.includes("already exists")
  );
}

// "over_email_send_rate_limit" é o código estável do GoTrue para isso.
// Nunca tentamos contornar (sem retry, sem backoff, sem trocar de
// provedor) — só classificamos como "esperado, não é um bug nosso" para
// não travar o resto do deploy por causa de um limite externo.
function isRateLimited(error) {
  if (error?.code === "over_email_send_rate_limit") {
    return true;
  }
  const message = (error?.message ?? "").toLowerCase();
  return error?.status === 429 || message.includes("rate limit");
}

async function main() {
  const { data: org, error: orgError } = await supabase
    .from("organizations")
    .select("id")
    .eq("slug", "fide")
    .single();

  if (orgError || !org) {
    console.error(
      "Organização 'fide' não encontrada. O passo anterior do workflow (criar organização) deveria ter rodado antes deste.",
    );
    process.exit(1);
  }

  const results = [];

  for (const persona of PERSONAS) {
    const { error } = await supabase.auth.admin.inviteUserByEmail(persona.email, {
      data: {
        organization_id: org.id,
        name: persona.name,
        role_slug: persona.role_slug,
      },
    });

    if (!error) {
      results.push({ email: persona.email, status: "invited" });
      console.log(`- ${persona.email}: convite de e-mail enviado (o usuário define a própria senha ao aceitar).`);
      continue;
    }

    if (isAlreadyRegistered(error)) {
      results.push({ email: persona.email, status: "already_exists" });
      console.log(`- ${persona.email}: já existe, convite não reenviado.`);
      continue;
    }

    if (isRateLimited(error)) {
      results.push({ email: persona.email, status: "rate_limited" });
      console.warn(
        `- ${persona.email}: limite de envio de e-mail do Supabase atingido — não é um erro do código, é um limite temporário do provedor. Tente convidar esta pessoa de novo mais tarde (rodando o workflow outra vez, ou pelo Dashboard → Authentication → Users).`,
      );
      continue;
    }

    results.push({ email: persona.email, status: "failed", message: error.message });
    console.error(`- ${persona.email}: falha ao convidar — ${error.message}`);
  }

  const summaryPath = process.env.GITHUB_STEP_SUMMARY;
  if (summaryPath) {
    const labels = {
      invited: "✅ convite enviado agora",
      already_exists: "✅ já existia (nada a fazer)",
      rate_limited: "⚠️ limite de e-mail do Supabase — tentar de novo mais tarde",
      failed: "❌ falha inesperada",
    };
    const lines = [
      "## Convites de usuários de desenvolvimento",
      "",
      "| E-mail | Resultado |",
      "|---|---|",
      ...results.map((r) => `| ${r.email} | ${labels[r.status]}${r.message ? ` — ${r.message}` : ""} |`),
      "",
      "Isto é dado de desenvolvimento (usuários fictícios de teste), não faz parte da infraestrutura — mesmo com itens ⚠️ ou ❌ aqui, migrations, RLS e Storage acima já estão aplicados normalmente.",
      "",
    ];
    appendFileSync(summaryPath, lines.join("\n") + "\n");
  }

  // Só uma falha genuinamente inesperada (nem "já existe" nem "limite de
  // e-mail") deve travar o deploy — é justamente o tipo de erro que
  // precisa de atenção humana, ao contrário dos outros dois casos.
  const hadUnexpectedFailure = results.some((r) => r.status === "failed");
  if (hadUnexpectedFailure) process.exit(1);
}

main();
