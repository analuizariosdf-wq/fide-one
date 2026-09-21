"use client";

/** Hits the server-only /api/settings/test-email route — never calls Resend from the browser. */
export async function sendTestEmail(to: string): Promise<void> {
  const response = await fetch("/api/settings/test-email", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ to }),
  });
  if (!response.ok) {
    const data = await response.json().catch(() => null);
    throw new Error(data?.error ?? "Não foi possível enviar o e-mail de teste.");
  }
}
