"use client";

import { Suspense, useEffect, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { createClient } from "@/lib/supabase/client";
import { getErrorMessage } from "@/lib/error-message";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

const MIN_PASSWORD_LENGTH = 8;
const INVALID_LINK_MESSAGE =
  "Este link de redefinição de senha é inválido ou expirou. Solicite um novo link.";

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordForm />
    </Suspense>
  );
}

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [checkingSession, setCheckingSession] = useState(true);
  const [sessionReady, setSessionReady] = useState(false);
  const [linkError, setLinkError] = useState<string | null>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // The recovery link puts the caller in one of two shapes depending on the
  // Supabase project's auth flow: a `?code=` query param (PKCE — needs an
  // explicit exchange) or a `#access_token=...` URL hash (implicit — the
  // client SDK parses it on its own and fires PASSWORD_RECOVERY). Handling
  // both means this works without knowing which one the hosted project
  // uses, and without any server-side callback route.
  useEffect(() => {
    let active = true;
    const supabase = createClient();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return;
      if ((event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") && session) {
        setSessionReady(true);
        setCheckingSession(false);
      }
    });

    async function run() {
      const code = searchParams.get("code");

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        if (!active) return;
        if (error) {
          setLinkError(INVALID_LINK_MESSAGE);
          setCheckingSession(false);
        }
        // On success, onAuthStateChange above flips sessionReady.
        return;
      }

      const { data } = await supabase.auth.getSession();
      if (!active || data.session) return;

      // No `code` and no session yet — the hash fragment (if any) may
      // still be mid-parse. Give it a short grace period instead of
      // deciding the link is invalid immediately.
      window.setTimeout(() => {
        if (!active) return;
        setCheckingSession((stillChecking) => {
          if (stillChecking) setLinkError(INVALID_LINK_MESSAGE);
          return false;
        });
      }, 1500);
    }

    run();

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [searchParams]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError(null);

    if (password.length < MIN_PASSWORD_LENGTH) {
      setFormError(`A senha precisa ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`);
      return;
    }
    if (password !== confirmPassword) {
      setFormError("As senhas não coincidem.");
      return;
    }

    setSubmitting(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.updateUser({ password });

      if (error) {
        setFormError(getErrorMessage(error, "Não foi possível atualizar a senha. Tente novamente."));
        return;
      }

      // Sign out the temporary recovery session so the user lands on a
      // clean /login and confirms access with the new password.
      await supabase.auth.signOut();
      router.push("/login?passwordReset=1");
    } catch (err) {
      setFormError(getErrorMessage(err, "Não foi possível atualizar a senha. Tente novamente."));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="flex-col items-start gap-1">
          <div className="flex items-center gap-2.5">
            <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary text-[13px] font-bold text-primary-foreground">
              F
            </span>
            <span className="text-[14px] font-semibold tracking-tight text-foreground">
              FIDE ONE
            </span>
          </div>
          <CardTitle className="pt-3">Definir nova senha</CardTitle>
          <CardDescription>Escolha uma nova senha para acessar sua conta.</CardDescription>
        </CardHeader>
        <CardContent>
          {checkingSession ? (
            <p className="text-[13px] text-muted-foreground">Verificando link de redefinição...</p>
          ) : linkError ? (
            <div className="flex flex-col gap-3">
              <p className="text-[13px] text-destructive">{linkError}</p>
              <Button variant="outline" onClick={() => router.push("/login")}>
                Voltar para o login
              </Button>
            </div>
          ) : sessionReady ? (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="password">Nova senha</Label>
                <PasswordInput
                  id="password"
                  autoComplete="new-password"
                  required
                  minLength={MIN_PASSWORD_LENGTH}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <Label htmlFor="confirmPassword">Confirmar nova senha</Label>
                <PasswordInput
                  id="confirmPassword"
                  autoComplete="new-password"
                  required
                  minLength={MIN_PASSWORD_LENGTH}
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                />
              </div>
              {formError && <p className="text-[13px] text-destructive">{formError}</p>}
              <Button type="submit" disabled={submitting} className="mt-1">
                {submitting ? "Salvando..." : "Salvar nova senha"}
              </Button>
            </form>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}
