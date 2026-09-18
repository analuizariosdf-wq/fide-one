"use client";

import { Suspense, useEffect, useState, type FormEvent } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { toast } from "sonner";

import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (searchParams.get("passwordReset") === "1") {
      toast.success("Senha atualizada. Faça login com sua nova senha.");
    }
    // Only meant to fire once, on arrival from /reset-password.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    // createClient() itself throws synchronously if NEXT_PUBLIC_SUPABASE_URL
    // is missing/malformed (e.g. still a placeholder) — without this
    // try/catch that exception is uncaught, and the button is stuck on
    // "Entrando..." forever with no explanation. Same friendly message as
    // the network-failure case below, since from the user's side it's the
    // same problem: can't reach the server.
    try {
      const supabase = createClient();
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (signInError) {
        if (signInError.name === "AuthRetryableFetchError") {
          setError("Não foi possível conectar ao servidor. Tente novamente em instantes.");
        } else if (signInError.code === "invalid_credentials") {
          setError("E-mail ou senha incorretos. Tente novamente.");
        } else {
          setError("Não foi possível entrar agora. Tente novamente.");
        }
        return;
      }

      toast.success("Login realizado com sucesso.");
      router.push(searchParams.get("redirectTo") || "/");
      router.refresh();
    } catch {
      setError("Não foi possível conectar ao servidor. Tente novamente em instantes.");
    } finally {
      setLoading(false);
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
          <CardTitle className="pt-3">Entrar</CardTitle>
          <CardDescription>Acesse o sistema operacional da Fide Comunicação.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">E-mail</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="password">Senha</Label>
              <Input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
              />
            </div>
            {error && <p className="text-[13px] text-destructive">{error}</p>}
            <Button type="submit" disabled={loading} className="mt-1">
              {loading ? "Entrando..." : "Entrar"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
