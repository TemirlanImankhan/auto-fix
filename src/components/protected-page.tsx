import type { ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { Button } from "@/components/ui/button";

export function ProtectedPage({ children }: { children: ReactNode }) {
  const { user, isPending } = useCurrentUserState();
  if (isPending) return <div className="mx-auto max-w-4xl px-4 py-16 text-muted">Загружаем личные данные…</div>;
  if (!user) {
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center">
        <h1 className="text-3xl tracking-wide">Войдите, чтобы продолжить</h1>
        <p className="mt-3 text-muted">Автомобили и история диагностики хранятся в личном аккаунте.</p>
        <Link to="/login"><Button className="mt-6">Войти или зарегистрироваться</Button></Link>
      </div>
    );
  }
  return <>{children}</>;
}
