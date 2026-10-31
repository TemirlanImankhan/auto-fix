import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, KeyRound, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth/client";

export const Route = createFileRoute("/two-factor")({ component: TwoFactorPage });

function TwoFactorPage() {
  const navigate = useNavigate();
  const [code, setCode] = useState("");
  const [backup, setBackup] = useState(false);
  const [trustDevice, setTrustDevice] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true); setError("");
    try {
      const result = backup
        ? await authClient.twoFactor.verifyBackupCode({ code: code.trim() })
        : await authClient.twoFactor.verifyTotp({ code: code.replace(/\D/g, ""), trustDevice });
      if (result.error) throw new Error(result.error.message || "Код не принят");
      await authClient.getSession();
      await navigate({ to: "/account" });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Не удалось подтвердить код");
    } finally { setBusy(false); }
  }

  return <main className="mx-auto grid min-h-[70dvh] max-w-xl content-center px-4 py-12">
    <Link to="/login" className="inline-flex min-h-10 items-center gap-2 text-sm text-muted hover:text-fg"><ArrowLeft className="size-4"/>Ко входу</Link>
    <section className="mt-5 rounded-xl border border-border bg-surface p-6 md:p-8">
      <span className="grid size-11 place-items-center rounded-lg border border-border bg-bg text-primary"><ShieldCheck className="size-5"/></span>
      <h1 className="mt-5 font-display text-4xl">Подтвердите вход</h1>
      <p className="mt-2 text-sm leading-6 text-muted">{backup ? "Введите одноразовый резервный код восстановления." : "Введите шестизначный код из приложения-аутентификатора."}</p>
      <form onSubmit={submit} className="mt-6">
        <label className="block text-sm text-muted">{backup ? "Резервный код" : "Код подтверждения"}
          <span className="relative mt-1 block"><KeyRound className="pointer-events-none absolute left-3 top-3.5 size-4"/><input autoFocus required autoComplete="one-time-code" inputMode={backup ? "text" : "numeric"} pattern={backup ? undefined : "[0-9]{6}"} maxLength={backup ? 24 : 6} value={code} onChange={(e) => setCode(e.target.value)} className="min-h-12 w-full rounded-lg border border-border bg-bg pl-10 pr-3 font-mono tracking-[0.2em] text-fg"/></span>
        </label>
        {!backup ? <label className="mt-4 flex items-start gap-2 text-xs leading-5 text-muted"><input type="checkbox" checked={trustDevice} onChange={(e) => setTrustDevice(e.target.checked)} className="mt-1 accent-primary"/>Доверять этому устройству 30 дней</label> : null}
        {error ? <p role="alert" className="mt-4 rounded-lg border border-danger/40 bg-danger/10 p-3 text-sm text-danger">{error}</p> : null}
        <Button className="mt-5 w-full" size="lg" disabled={busy || code.trim().length < (backup ? 6 : 6)}>{busy ? "Проверяем…" : "Подтвердить"}</Button>
      </form>
      <button type="button" onClick={() => { setBackup((value) => !value); setCode(""); setError(""); }} className="mt-4 min-h-10 text-sm text-primary hover:underline">{backup ? "Ввести код из приложения" : "Использовать резервный код"}</button>
    </section>
  </main>;
}
