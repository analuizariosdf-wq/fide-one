"use client";

import { useEffect } from "react";
import { AlertTriangle } from "lucide-react";

import { Button } from "@/components/ui/button";

/**
 * Root error boundary. Lives at app/ (not app/(app)/) on purpose: Next.js
 * error.tsx never catches an error thrown by the layout.tsx of its own
 * segment, only by child segments — and (app)/layout.tsx (getCurrentActor)
 * is exactly what throws when Supabase is unreachable/misconfigured, so
 * the boundary has to sit one level up to catch it. Next.js also strips
 * the real error message from what reaches this boundary in production,
 * so this can only ever show a generic, honest explanation — never a raw
 * stack trace.
 */
export default function AppError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 px-4 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-destructive/10 text-destructive">
        <AlertTriangle className="size-6" />
      </div>
      <div className="flex flex-col gap-1">
        <p className="text-[15px] font-medium text-foreground">
          Não foi possível carregar o FIDE ONE agora
        </p>
        <p className="max-w-sm text-[13px] text-muted-foreground">
          Isso costuma acontecer quando a conexão com o Supabase ainda não está
          configurada neste ambiente, ou está temporariamente indisponível.
        </p>
      </div>
      <Button onClick={reset}>Tentar novamente</Button>
    </div>
  );
}
