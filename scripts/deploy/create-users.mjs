// Cria (via convite por e-mail, sem senha nenhuma passando por aqui) os 5
// usuários de desenvolvimento do FIDE ONE no projeto Supabase hospedado.
//
// Roda dentro do workflow .github/workflows/deploy-supabase.yml — nunca
// localmente com uma service_role key real, para não expor a chave fora
// do ambiente de CI.
//
// Idempotente: rodar de novo só pula quem já existe, nunca duplica nem
// falha o workflow inteiro por causa de um usuário já criado antes.
import { createClient } from "@supabase/supabase-js";

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

  let hadError = false;

  for (const persona of PERSONAS) {
    const { error } = await supabase.auth.admin.inviteUserByEmail(persona.email, {
      data: {
        organization_id: org.id,
        name: persona.name,
        role_slug: persona.role_slug,
      },
    });

    if (error) {
      if (isAlreadyRegistered(error)) {
        console.log(`- ${persona.email}: já existe, convite não reenviado.`);
        continue;
      }
      console.error(`- ${persona.email}: falha ao convidar — ${error.message}`);
      hadError = true;
      continue;
    }

    console.log(`- ${persona.email}: convite de e-mail enviado (o usuário define a própria senha ao aceitar).`);
  }

  if (hadError) process.exit(1);
}

main();
