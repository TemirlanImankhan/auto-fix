import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Check, Moon, RotateCcw, Settings2, ShieldCheck, Sun } from "lucide-react";
import { useSettings } from "@/lib/settings";

export const Route = createFileRoute("/settings")({ component: SettingsPage });

function SettingsPage() {
  const { settings, updateSettings, resetSettings } = useSettings();

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 md:px-6 md:py-12">
      <Link to="/account" className="inline-flex min-h-10 items-center gap-2 text-sm text-muted transition-colors hover:text-fg"><ArrowLeft className="size-4"/>В личный кабинет</Link>
      <div className="mt-5 flex items-start gap-4 border-b border-border pb-6">
        <span className="grid size-12 shrink-0 place-items-center rounded-2xl border border-primary/20 bg-primary/10 text-primary"><Settings2 className="size-5"/></span>
        <div><p className="text-xs font-semibold uppercase tracking-[0.15em] text-primary">AutoFix · персонализация</p><h1 className="mt-1 font-display text-4xl font-semibold tracking-tight">Настройки</h1><p className="mt-2 text-sm leading-6 text-muted">Выберите удобное оформление и поведение помощника.</p></div>
      </div>

      <section className="mt-7">
        <div className="flex items-end justify-between gap-3"><div><h2 className="font-display text-2xl font-semibold">Внешний вид</h2><p className="mt-1 text-sm text-muted">Выберите тему для этого браузера.</p></div><span role="status" className="text-xs text-muted">Сохраняется автоматически</span></div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <ThemeOption active={settings.theme === "dark"} title="Тёмная" description="Графитовый фон и лаймовый акцент" icon={Moon} onClick={() => updateSettings({ theme: "dark" })} />
          <ThemeOption active={settings.theme === "light"} title="Светлая" description="Светлый фон для хорошо освещённых мест" icon={Sun} onClick={() => updateSettings({ theme: "light" })} />
        </div>
      </section>

      <section className="mt-8 rounded-2xl border border-border bg-surface p-5 sm:p-6">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0"><h2 className="font-display text-xl font-semibold">Помощник AutoFix</h2><p className="mt-1 text-sm leading-5 text-muted">Показывать плавающее окно справки внизу страниц.</p></div>
          <button type="button" role="switch" aria-checked={settings.showAssistant} aria-label="Показывать помощника AutoFix" onClick={() => updateSettings({ showAssistant: !settings.showAssistant })} className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${settings.showAssistant ? "bg-primary" : "bg-surface-2"}`}><span className={`absolute top-1 size-5 rounded-full bg-bg shadow transition-transform ${settings.showAssistant ? "translate-x-6" : "translate-x-1"}`}/></button>
        </div>
      </section>

      <section className="mt-4 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-surface p-5 sm:p-6">
        <div className="flex items-start gap-3"><ShieldCheck className="mt-0.5 size-5 shrink-0 text-primary"/><div><h2 className="font-medium">Безопасность аккаунта</h2><p className="mt-1 text-sm text-muted">Настройки двухфакторной защиты и данные профиля.</p></div></div>
        <Link to="/account" className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-border px-3 text-sm text-fg transition-colors hover:bg-surface-2">Открыть аккаунт</Link>
      </section>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5">
        <p className="max-w-xl text-xs leading-5 text-muted">Тема и видимость помощника сохраняются только в этом браузере. Они не меняют ваши автомобили, отчёты или другие данные аккаунта.</p>
        <button type="button" onClick={resetSettings} className="inline-flex min-h-10 items-center gap-2 rounded-lg px-3 text-sm text-muted transition-colors hover:bg-surface hover:text-fg"><RotateCcw className="size-4"/>Сбросить настройки</button>
      </div>
    </div>
  );
}

function ThemeOption({ active, title, description, icon: Icon, onClick }: { active: boolean; title: string; description: string; icon: typeof Moon; onClick: () => void }) {
  return <button type="button" aria-pressed={active} onClick={onClick} className={`flex min-h-24 items-center gap-4 rounded-2xl border p-4 text-left transition-colors ${active ? "border-primary/70 bg-primary/[0.06]" : "border-border bg-surface hover:border-primary/35"}`}>
    <span className={`grid size-11 shrink-0 place-items-center rounded-xl ${active ? "bg-primary text-primary-fg" : "bg-surface-2 text-muted"}`}><Icon className="size-5"/></span>
    <span className="min-w-0 flex-1"><span className="block font-medium">{title}</span><span className="mt-1 block text-xs leading-5 text-muted">{description}</span></span>
    {active ? <Check className="size-4 shrink-0 text-primary"/> : null}
  </button>;
}
