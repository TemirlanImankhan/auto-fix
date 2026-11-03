import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Check, Moon, RotateCcw, Settings2, ShieldCheck, Sun } from "lucide-react";
import { useSettings } from "@/lib/settings";

export const Route = createFileRoute("/settings")({ component: SettingsPage });

const COPY = {
  ru: { back: "В личный кабинет", eyebrow: "AutoFix · персонализация", title: "Настройки", intro: "Выберите язык, оформление и поведение помощника.", language: "Язык интерфейса", languageHint: "Выбор применяется сразу и сохраняется в этом браузере.", appearance: "Внешний вид", themeHint: "Выберите тему для этого браузера.", saved: "Сохраняется автоматически", dark: "Тёмная", darkHint: "Графитовый фон и лаймовый акцент", light: "Светлая", lightHint: "Светлый фон для хорошо освещённых мест", assistant: "Помощник AutoFix", assistantHint: "Показывать плавающее окно справки внизу страниц.", security: "Безопасность аккаунта", securityHint: "Настройки двухфакторной защиты и данные профиля.", openAccount: "Открыть аккаунт", note: "Язык и оформление сохраняются только в этом браузере. Они не меняют автомобили, отчёты или другие данные аккаунта.", reset: "Сбросить настройки" },
  kk: { back: "Жеке кабинетке", eyebrow: "AutoFix · жекелендіру", title: "Баптаулар", intro: "Интерфейс тілін, көрінісін және көмекшінің жұмысын таңдаңыз.", language: "Интерфейс тілі", languageHint: "Таңдау бірден қолданылады және осы браузерде сақталады.", appearance: "Сыртқы көрініс", themeHint: "Осы браузерге арналған тақырыпты таңдаңыз.", saved: "Автоматты түрде сақталады", dark: "Қараңғы", darkHint: "Графит түсті фон және әк түсті екпін", light: "Жарық", lightHint: "Жарық жерде қолдануға арналған ашық фон", assistant: "AutoFix көмекшісі", assistantHint: "Беттердің төменгі жағындағы анықтама терезесін көрсету.", security: "Аккаунт қауіпсіздігі", securityHint: "Екі факторлы қорғау және профиль баптаулары.", openAccount: "Аккаунтты ашу", note: "Тіл мен көрініс тек осы браузерде сақталады. Олар көліктерге, есептерге және аккаунт деректеріне әсер етпейді.", reset: "Баптауларды қалпына келтіру" },
  en: { back: "Back to account", eyebrow: "AutoFix · personalization", title: "Settings", intro: "Choose your language, appearance, and assistant preferences.", language: "Interface language", languageHint: "Your choice applies immediately and is saved in this browser.", appearance: "Appearance", themeHint: "Choose a theme for this browser.", saved: "Saved automatically", dark: "Dark", darkHint: "Graphite background with a lime accent", light: "Light", lightHint: "A bright theme for well-lit spaces", assistant: "AutoFix assistant", assistantHint: "Show the floating help window at the bottom of pages.", security: "Account security", securityHint: "Two-factor protection and profile settings.", openAccount: "Open account", note: "Language and appearance are saved only in this browser. They do not change your cars, reports, or other account data.", reset: "Reset settings" },
} as const;

function SettingsPage() {
  const { settings, updateSettings, resetSettings } = useSettings();
  const t = COPY[settings.language];

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 md:px-6 md:py-12">
      <Link to="/account" className="inline-flex min-h-10 items-center gap-2 text-sm text-muted transition-colors hover:text-fg"><ArrowLeft className="size-4"/>{t.back}</Link>
      <div className="mt-5 flex items-start gap-4 border-b border-border pb-6">
        <span className="grid size-12 shrink-0 place-items-center rounded-2xl border border-primary/20 bg-primary/10 text-primary"><Settings2 className="size-5"/></span>
        <div><p className="text-xs font-semibold uppercase tracking-[0.15em] text-primary">{t.eyebrow}</p><h1 className="mt-1 font-display text-4xl font-semibold tracking-tight">{t.title}</h1><p className="mt-2 text-sm leading-6 text-muted">{t.intro}</p></div>
      </div>

      <section className="mt-7 rounded-2xl border border-border bg-surface p-5 sm:p-6">
        <div><h2 className="font-display text-xl font-semibold">{t.language}</h2><p className="mt-1 text-sm text-muted">{t.languageHint}</p></div>
        <div className="mt-4 grid gap-2 sm:grid-cols-3" role="group" aria-label={t.language}>
          {([{ id: "ru", label: "Русский" }, { id: "kk", label: "Қазақша" }, { id: "en", label: "English" }] as const).map((language) => <button key={language.id} type="button" aria-pressed={settings.language === language.id} onClick={() => updateSettings({ language: language.id })} className={`min-h-11 rounded-xl border px-4 text-sm font-medium transition-colors ${settings.language === language.id ? "border-primary/70 bg-primary/[0.08] text-primary" : "border-border text-fg hover:bg-surface-2"}`}>{language.label}</button>)}
        </div>
      </section>

      <section className="mt-7">
        <div className="flex items-end justify-between gap-3"><div><h2 className="font-display text-2xl font-semibold">{t.appearance}</h2><p className="mt-1 text-sm text-muted">{t.themeHint}</p></div><span role="status" className="text-xs text-muted">{t.saved}</span></div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <ThemeOption active={settings.theme === "dark"} title={t.dark} description={t.darkHint} icon={Moon} onClick={() => updateSettings({ theme: "dark" })} />
          <ThemeOption active={settings.theme === "light"} title={t.light} description={t.lightHint} icon={Sun} onClick={() => updateSettings({ theme: "light" })} />
        </div>
      </section>

      <section className="mt-8 rounded-2xl border border-border bg-surface p-5 sm:p-6">
        <div className="flex items-center justify-between gap-4">
          <div className="min-w-0"><h2 className="font-display text-xl font-semibold">{t.assistant}</h2><p className="mt-1 text-sm leading-5 text-muted">{t.assistantHint}</p></div>
          <button type="button" role="switch" aria-checked={settings.showAssistant} aria-label={t.assistant} onClick={() => updateSettings({ showAssistant: !settings.showAssistant })} className={`relative h-7 w-12 shrink-0 rounded-full transition-colors ${settings.showAssistant ? "bg-primary" : "bg-surface-2"}`}><span className={`absolute top-1 size-5 rounded-full bg-bg shadow transition-transform ${settings.showAssistant ? "translate-x-6" : "translate-x-1"}`}/></button>
        </div>
      </section>

      <section className="mt-4 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-surface p-5 sm:p-6">
        <div className="flex items-start gap-3"><ShieldCheck className="mt-0.5 size-5 shrink-0 text-primary"/><div><h2 className="font-medium">{t.security}</h2><p className="mt-1 text-sm text-muted">{t.securityHint}</p></div></div>
        <Link to="/account" className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-border px-3 text-sm text-fg transition-colors hover:bg-surface-2">{t.openAccount}</Link>
      </section>

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5">
        <p className="max-w-xl text-xs leading-5 text-muted">{t.note}</p>
        <button type="button" onClick={resetSettings} className="inline-flex min-h-10 items-center gap-2 rounded-lg px-3 text-sm text-muted transition-colors hover:bg-surface hover:text-fg"><RotateCcw className="size-4"/>{t.reset}</button>
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
