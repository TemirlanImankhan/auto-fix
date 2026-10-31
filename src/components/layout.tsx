import { Link, useRouterState } from "@tanstack/react-router";
import { Activity, CalendarClock, CarFront, ClipboardList, FlaskConical, Menu, Wrench, X } from "lucide-react";
import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { UserButton } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";

const NAV = [
  { to: "/", label: "Обзор", icon: Wrench },
  { to: "/diagnose", label: "Диагностика", icon: Activity },
  { to: "/cars", label: "Автомобили", icon: CarFront },
  { to: "/maintenance", label: "Обслуживание", icon: CalendarClock },
  { to: "/history", label: "История", icon: ClipboardList },
  { to: "/research", label: "Исследование", icon: FlaskConical },
] as const;

export function AppLayout({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);
  const { user, isPending } = useCurrentUserState();

  return (
    <div className="min-h-dvh flex flex-col">
      <header className="sticky top-0 z-30 border-b border-border bg-bg/95 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-3 px-4">
          <Link to="/" className="flex min-h-11 items-center gap-2.5">
            <span className="grid size-8 place-items-center rounded-lg border border-border bg-surface text-primary"><Wrench className="size-4" /></span>
            <span className="font-display text-xl tracking-tight text-fg">AutoFix AI</span>
            <span className="hidden rounded-full border border-border px-2 py-0.5 text-[10px] text-muted sm:inline-flex">CAR DIAGNOSTICS</span>
          </Link>
          <nav className="hidden lg:flex items-center gap-1">
            {NAV.map((item) => {
              const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
              return (
                <Link key={item.to} to={item.to} className={cn(
                  "inline-flex min-h-10 items-center gap-2 rounded-md px-3 text-sm transition-colors",
                  active ? "bg-surface text-fg" : "text-muted hover:bg-surface hover:text-fg",
                )}>
                  <item.icon className="size-4" />{item.label}
                </Link>
              );
            })}
          </nav>
          <div className="hidden sm:block">
            {isPending ? <span className="block h-9 w-24 animate-pulse rounded-md bg-surface" /> : user ? <UserButton /> : (
              <Link to="/login" className="inline-flex min-h-10 items-center rounded-md border border-border px-3 text-sm text-fg hover:bg-surface">Войти</Link>
            )}
          </div>
          <button type="button" className="grid size-10 place-items-center rounded-md border border-border text-fg lg:hidden" onClick={() => setOpen((v) => !v)} aria-label={open ? "Закрыть меню" : "Открыть меню"}>
            {open ? <X className="size-4" /> : <Menu className="size-4" />}
          </button>
        </div>
        {open ? <nav className="grid gap-1 border-t border-border bg-bg px-3 py-2 lg:hidden">
          {NAV.map((item) => <Link key={item.to} to={item.to} onClick={() => setOpen(false)} className="flex min-h-11 items-center gap-2 rounded-md px-3 text-sm text-fg hover:bg-surface"><item.icon className="size-4 text-primary" />{item.label}</Link>)}
          <div className="border-t border-border pt-2">{isPending ? null : user ? <UserButton /> : <Link to="/login" onClick={() => setOpen(false)} className="flex min-h-11 items-center px-3 text-sm text-fg">Войти или создать аккаунт</Link>}</div>
        </nav> : null}
      </header>
      <main className="flex-1">{children}</main>
      <footer className="border-t border-border px-4 py-5 text-center text-xs text-muted">
        AutoFix AI · предварительная диагностика автомобиля · <Link to="/about" className="text-primary hover:underline">О проекте</Link> · 2026
      </footer>
    </div>
  );
}
