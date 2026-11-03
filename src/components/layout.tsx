import { Link, useRouterState } from "@tanstack/react-router";
import { Activity, CalendarClock, CarFront, ClipboardList, FlaskConical, Menu, Wrench, X } from "lucide-react";
import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils";
import { UserButton } from "@/lib/auth/gates";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { AssistantWidget } from "@/components/assistant-widget";
import { useSettings } from "@/lib/settings";

const NAV = {
  ru: ["Обзор", "Диагностика", "Автомобили", "Обслуживание", "История", "Исследование"],
  kk: ["Шолу", "Диагностика", "Көліктер", "Қызмет көрсету", "Тарих", "Зерттеу"],
  en: ["Overview", "Diagnostics", "Cars", "Maintenance", "History", "Research"],
} as const;
const NAV_ITEMS = [
  { to: "/", icon: Wrench }, { to: "/diagnose", icon: Activity }, { to: "/cars", icon: CarFront },
  { to: "/maintenance", icon: CalendarClock }, { to: "/history", icon: ClipboardList }, { to: "/research", icon: FlaskConical },
] as const;

export function AppLayout({ children }: { children: ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);
  const { user, isPending } = useCurrentUserState();
  const { settings } = useSettings();
  const labels = NAV[settings.language];
  const signInLabel = settings.language === "en" ? "Sign in" : settings.language === "kk" ? "Кіру" : "Войти";

  return (
    <div className="min-h-dvh flex flex-col">
      <header className="sticky top-0 z-30 border-b border-border/80 bg-bg/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-3 px-4 md:px-6">
          <Link to="/" className="flex min-h-11 items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-xl bg-primary text-primary-fg shadow-[0_0_28px_rgb(198_243_107_/_18%)]"><Wrench className="size-4" strokeWidth={2.4} /></span>
            <span className="font-display text-xl font-semibold tracking-tight text-fg">AutoFix<span className="text-primary">.</span></span>
            <span className="hidden rounded-full border border-border px-2.5 py-1 text-[9px] font-semibold tracking-[0.16em] text-muted sm:inline-flex">CAR CARE</span>
          </Link>
          <nav className="hidden lg:flex items-center gap-1 rounded-xl border border-border/70 bg-surface/70 p-1">
            {NAV_ITEMS.map((item, index) => {
              const active = item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
              return (
                <Link key={item.to} to={item.to} className={cn(
                  "inline-flex min-h-10 items-center gap-2 rounded-lg px-3 text-[13px] font-medium transition-colors",
                  active ? "bg-surface-2 text-primary shadow-sm" : "text-muted hover:bg-surface-2 hover:text-fg",
                )}>
                  <item.icon className="size-4" />{labels[index]}
                </Link>
              );
            })}
          </nav>
          <div className="hidden sm:block">
            {isPending ? <span className="block h-9 w-24 animate-pulse rounded-md bg-surface" /> : user ? <UserButton /> : (
              <Link to="/login" className="inline-flex min-h-10 items-center rounded-lg border border-border px-4 text-sm font-medium text-fg transition-colors hover:border-primary/60 hover:bg-surface">{signInLabel}</Link>
            )}
          </div>
          <button type="button" className="grid size-10 place-items-center rounded-xl border border-border bg-surface text-fg lg:hidden" onClick={() => setOpen((v) => !v)} aria-label={open ? "Закрыть меню" : "Открыть меню"}>
            {open ? <X className="size-4" /> : <Menu className="size-4" />}
          </button>
        </div>
        {open ? <nav className="grid gap-1 border-t border-border bg-bg px-3 py-3 lg:hidden">
          {NAV_ITEMS.map((item, index) => <Link key={item.to} to={item.to} onClick={() => setOpen(false)} className="flex min-h-11 items-center gap-2 rounded-lg px-3 text-sm text-fg hover:bg-surface"><item.icon className="size-4 text-primary" />{labels[index]}</Link>)}
          <div className="border-t border-border pt-2">{isPending ? null : user ? <UserButton /> : <Link to="/login" onClick={() => setOpen(false)} className="flex min-h-11 items-center px-3 text-sm text-fg">{signInLabel}</Link>}</div>
        </nav> : null}
      </header>
      <main className="flex-1">{children}</main>
      {settings.showAssistant ? <AssistantWidget /> : null}
      <footer className="border-t border-border/80 px-4 py-6 text-center text-xs text-muted">
        <span className="font-semibold text-fg">AutoFix<span className="text-primary">.</span></span> · {settings.language === "en" ? "Digital car ownership assistant" : settings.language === "kk" ? "Көлік иесіне арналған цифрлық көмекші" : "цифровой помощник владельца автомобиля"} · <Link to="/about" className="text-primary hover:underline">{settings.language === "en" ? "About" : settings.language === "kk" ? "Жоба туралы" : "О проекте"}</Link> · 2026
      </footer>
    </div>
  );
}
