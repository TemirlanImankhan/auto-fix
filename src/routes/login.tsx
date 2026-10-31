import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, LockKeyhole, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { authClient, authEnabled } from "@/lib/auth/client";
import { useCurrentUserState } from "@/lib/auth/use-current-user";

export const Route = createFileRoute("/login")({ component: LoginPage });

function LoginPage() {
  const navigate = useNavigate();
  const { user, isPending } = useCurrentUserState();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!isPending && user) void navigate({ to: "/" });
  }, [isPending, navigate, user]);

  if (isPending) return <div className="mx-auto max-w-md px-4 py-20 text-center text-muted">Проверяем сессию…</div>;
  if (user) return null;

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const result = mode === "signup"
        ? await authClient.signUp.email({ email: email.trim(), password, name: name.trim() })
        : await authClient.signIn.email({ email: email.trim(), password });
      if (result.error) throw new Error(result.error.message || "Не удалось выполнить вход");
      if (result.data && "twoFactorRedirect" in result.data && result.data.twoFactorRedirect) {
        await navigate({ to: "/two-factor" });
        return;
      }
      await authClient.getSession();
      await navigate({ to: "/" });
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "Не удалось выполнить запрос";
      setError(message.includes("already exists") ? "Аккаунт с такой почтой уже существует." : message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto grid min-h-[70dvh] max-w-5xl items-center gap-10 px-4 py-10 md:grid-cols-[1fr_420px]">
      <section>
        <Link to="/" className="inline-flex min-h-11 items-center gap-2 text-sm text-muted hover:text-fg">
          <ArrowLeft className="size-4" /> На главную
        </Link>
        <p className="mt-8 text-xs uppercase tracking-[0.2em] text-primary">AutoFix AI · личный аккаунт</p>
        <h1 className="mt-3 text-5xl tracking-tight">Ваш гараж и история диагностик</h1>
        <p className="mt-4 max-w-xl text-muted">Войдите или создайте аккаунт, чтобы сохранять автомобили и результаты предварительной диагностики в личной базе.</p>
      </section>

      <form onSubmit={submit} className="rounded-2xl border border-border bg-surface p-6">
        <div className="flex gap-2 rounded-lg bg-bg p-1">
          {(["signin", "signup"] as const).map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => { setMode(item); setError(""); }}
              className={`min-h-11 flex-1 rounded-md px-3 text-sm ${mode === item ? "bg-surface-2 text-fg" : "text-muted"}`}
            >
              {item === "signin" ? "Войти" : "Создать аккаунт"}
            </button>
          ))}
        </div>
        {!authEnabled ? <p className="mt-4 text-sm text-danger">Вход отключён в конфигурации приложения.</p> : null}
        {mode === "signup" ? (
          <label className="mt-5 block text-sm text-muted">
            Имя
            <input autoComplete="name" required minLength={2} maxLength={80} value={name} onChange={(e) => setName(e.target.value)} className="mt-1 min-h-11 w-full rounded-lg border border-border bg-bg px-3 text-fg" />
          </label>
        ) : null}
        <label className="mt-5 block text-sm text-muted">
          Электронная почта
          <span className="relative mt-1 block">
            <Mail className="pointer-events-none absolute left-3 top-3.5 size-4" />
            <input autoComplete="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="min-h-11 w-full rounded-lg border border-border bg-bg pl-10 pr-3 text-fg" />
          </span>
        </label>
        <label className="mt-4 block text-sm text-muted">
          Пароль
          <span className="relative mt-1 block">
            <LockKeyhole className="pointer-events-none absolute left-3 top-3.5 size-4" />
            <input autoComplete={mode === "signin" ? "current-password" : "new-password"} type="password" required minLength={8} maxLength={128} value={password} onChange={(e) => setPassword(e.target.value)} className="min-h-11 w-full rounded-lg border border-border bg-bg pl-10 pr-3 text-fg" />
          </span>
        </label>
        {error ? <p role="alert" className="mt-4 rounded-lg border border-danger/40 bg-danger/10 p-3 text-sm text-danger">{error}</p> : null}
        <Button className="mt-6 w-full" size="lg" type="submit" disabled={busy || !authEnabled}>
          {busy ? "Подождите…" : mode === "signin" ? "Войти в аккаунт" : "Зарегистрироваться"}
        </Button>
        <p className="mt-4 text-xs leading-relaxed text-muted">Автомобили и история диагностик доступны только после входа в этот аккаунт.</p>
      </form>
    </main>
  );
}
