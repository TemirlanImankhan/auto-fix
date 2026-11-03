import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Activity, ArrowRight, ArrowUpRight, CalendarClock, CarFront, ClipboardList, FlaskConical, Gauge, ShieldAlert, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { listCars, listDiagnoses, listMaintenance } from "@/lib/data";
import { useCurrentUserState } from "@/lib/auth/use-current-user";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  const { user, isPending } = useCurrentUserState();
  const [counts, setCounts] = useState<{ cars: number; diagnoses: number; maintenance: number } | null>(null);

  useEffect(() => {
    if (!user) { setCounts(null); return; }
    let active = true;
    void Promise.all([listCars(), listDiagnoses(), listMaintenance()]).then(([cars, diagnoses, maintenance]) => {
      if (active) setCounts({ cars: cars.length, diagnoses: diagnoses.length, maintenance: maintenance.length });
    }).catch(() => { if (active) setCounts({ cars: 0, diagnoses: 0, maintenance: 0 }); });
    return () => { active = false; };
  }, [user]);

  return (
    <div className="mx-auto max-w-7xl px-4 pb-16 pt-5 md:px-6 md:pt-8">
      <section className="autofix-panel relative isolate overflow-hidden rounded-[1.5rem] px-5 py-8 sm:px-8 md:min-h-[390px] md:px-12 md:py-12">
        <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_84%_46%,rgb(153_202_92_/_15%),transparent_43%)]" />
        <div className="pointer-events-none absolute -right-16 -top-24 -z-10 size-80 rounded-full border border-primary/10 md:right-16 md:top-1/2 md:size-[410px] md:-translate-y-1/2" />
        <div className="pointer-events-none absolute -right-2 -top-10 -z-10 size-60 rounded-full border border-primary/10 md:right-28 md:top-1/2 md:size-[290px] md:-translate-y-1/2" />
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/5 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-primary"><Sparkles className="size-3.5"/>Auto care, made clearer</div>
          <h1 className="mt-6 max-w-xl font-display text-4xl font-semibold leading-[1.04] tracking-[-0.045em] sm:text-5xl md:text-6xl">Автомобиль<br className="hidden sm:block"/> под контролем<span className="text-primary">.</span></h1>
          <p className="mt-5 max-w-lg text-sm leading-6 text-muted sm:text-base sm:leading-7">Соберите историю автомобиля в одном месте: предварительная проверка симптомов, гараж и плановое обслуживание.</p>
          <div className="mt-7 flex flex-wrap gap-3">
            <Link to="/diagnose"><Button size="lg" className="min-h-12 rounded-xl px-5"><Activity className="size-4"/>Проверить симптомы<ArrowRight className="size-4"/></Button></Link>
            <Link to="/cars"><Button variant="outline" size="lg" className="min-h-12 rounded-xl border-border bg-surface/70 px-5"><CarFront className="size-4"/>Мой гараж</Button></Link>
          </div>
          <div className="mt-7 flex items-center gap-2 text-xs text-muted"><span className="size-1.5 rounded-full bg-primary"/>Личные данные хранятся отдельно в вашем аккаунте</div>
        </div>
        <div aria-hidden="true" className="pointer-events-none absolute bottom-0 right-3 hidden h-[340px] w-[450px] md:block">
          <div className="absolute bottom-7 left-4 right-4 h-px bg-gradient-to-r from-transparent via-primary/35 to-transparent" />
          <div className="absolute bottom-9 left-10 right-10 h-28 rounded-[50%] border border-primary/10" />
          <svg viewBox="0 0 460 300" fill="none" className="absolute inset-0 h-full w-full drop-shadow-[0_24px_45px_rgb(0_0_0_/_45%)]">
            <defs><linearGradient id="car-body" x1="104" y1="110" x2="382" y2="226" gradientUnits="userSpaceOnUse"><stop stopColor="#d7f39a"/><stop offset=".48" stopColor="#91b965"/><stop offset="1" stopColor="#46694a"/></linearGradient><linearGradient id="glass" x1="175" y1="105" x2="302" y2="166" gradientUnits="userSpaceOnUse"><stop stopColor="#263c36"/><stop offset="1" stopColor="#101918"/></linearGradient></defs>
            <ellipse cx="249" cy="236" rx="153" ry="19" fill="#000" fillOpacity=".38"/>
            <path d="m89 196 17-43c5-13 15-22 29-26l45-14 41-45c8-9 18-14 30-14h65c16 0 29 7 39 19l34 43 34 16c10 5 16 13 18 24l5 30c2 11-6 21-18 22l-19 2h-23c-3-25-23-43-48-43s-45 18-48 43H189c-3-25-23-43-48-43s-45 18-48 43l-7-1c-12-1-19-13-15-24Z" fill="url(#car-body)" stroke="#e2f5bb" strokeOpacity=".72" strokeWidth="2"/>
            <path d="m188 117 39-43c7-8 16-12 26-12h58c13 0 24 6 32 16l30 39H188Z" fill="url(#glass)" stroke="#e3f7be" strokeOpacity=".3" strokeWidth="2"/>
            <path d="m259 64-2 53m56-53 30 53" stroke="#c6f36b" strokeOpacity=".28" strokeWidth="2"/>
            <path d="m119 154 34-10m194-1 35 12" stroke="#fff4c8" strokeLinecap="round" strokeWidth="6"/>
            <path d="M96 201h18m272-1h25" stroke="#c6f36b" strokeLinecap="round" strokeOpacity=".8" strokeWidth="4"/>
            <circle cx="141" cy="217" r="31" fill="#0c1210" stroke="#6a8070" strokeWidth="4"/><circle cx="141" cy="217" r="17" fill="#24352d" stroke="#c6f36b" strokeOpacity=".75" strokeWidth="3"/><circle cx="141" cy="217" r="5" fill="#c6f36b"/>
            <circle cx="337" cy="217" r="31" fill="#0c1210" stroke="#6a8070" strokeWidth="4"/><circle cx="337" cy="217" r="17" fill="#24352d" stroke="#c6f36b" strokeOpacity=".75" strokeWidth="3"/><circle cx="337" cy="217" r="5" fill="#c6f36b"/>
            <path d="M90 174h-24m-4 0h-15m392-15h18m9 0h11" stroke="#c6f36b" strokeLinecap="round" strokeOpacity=".55" strokeWidth="2"/>
          </svg>
          <div className="absolute right-0 top-10 rounded-2xl border border-border/80 bg-bg/80 px-4 py-3 shadow-xl backdrop-blur"><div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-muted"><Gauge className="size-3.5 text-primary"/>Car overview</div><p className="mt-1 font-mono text-sm text-fg">CARE · LOG · CHECK</p></div>
        </div>
        <div aria-hidden="true" className="pointer-events-none absolute -bottom-16 right-[-4rem] -z-10 size-64 rounded-full bg-primary/5 blur-3xl md:hidden" />
      </section>

      <section className="mt-5 grid gap-3 sm:grid-cols-3" aria-label="Сводка аккаунта">
        <Metric icon={CarFront} label="Автомобили в гараже" value={user ? counts?.cars : null} />
        <Metric icon={Activity} label="Отчёты диагностики" value={user ? counts?.diagnoses : null} />
        <Metric icon={CalendarClock} label="Записи обслуживания" value={user ? counts?.maintenance : null} />
      </section>

      <section className="mt-12">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-primary">AutoFix tools</p><h2 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">Всё важное для вашего авто</h2></div>
          <span className="text-sm text-muted">Три простых шага к порядку</span>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-3">
          <FeatureCard icon={Activity} number="01" title="Проверить симптомы" text="Отметьте наблюдаемые признаки и получите предварительную гипотезу с объяснением." to="/diagnose" action="Начать проверку" />
          <FeatureCard icon={CarFront} number="02" title="Собрать гараж" text="Храните параметры своих машин, чтобы быстрее запускать диагностику и вести историю." to="/cars" action="Открыть гараж" />
          <FeatureCard icon={CalendarClock} number="03" title="Планировать обслуживание" text="Записывайте работы, расходы и следующие даты или пробеги для ТО." to="/maintenance" action="Вести журнал" />
        </div>
      </section>

      <section className="mt-5 grid gap-3 md:grid-cols-[minmax(0,1fr)_minmax(260px,0.72fr)]">
        <Link to="/history" className="autofix-panel group flex min-h-36 items-center gap-4 p-5 transition-colors hover:border-primary/40 sm:p-6"><span className="grid size-12 shrink-0 place-items-center rounded-2xl border border-border bg-surface-2 text-primary"><ClipboardList className="size-5"/></span><span className="min-w-0 flex-1"><span className="block text-lg font-semibold">История проверок</span><span className="mt-1 block text-sm leading-5 text-muted">Возвращайтесь к сохранённым результатам диагностики.</span></span><ArrowUpRight className="size-5 shrink-0 text-muted transition-transform group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-primary"/></Link>
        <Link to="/research" className="group flex min-h-36 items-center gap-4 rounded-2xl border border-border bg-surface/60 p-5 transition-colors hover:border-primary/40 sm:p-6"><span className="grid size-12 shrink-0 place-items-center rounded-2xl border border-border bg-bg text-primary"><FlaskConical className="size-5"/></span><span className="min-w-0 flex-1"><span className="block text-lg font-semibold">Методика проекта</span><span className="mt-1 block text-sm leading-5 text-muted">Алгоритмы, метрики и ограничения модели.</span></span><ArrowUpRight className="size-5 shrink-0 text-muted transition-transform group-hover:-translate-y-1 group-hover:translate-x-1 group-hover:text-primary"/></Link>
      </section>

      <div className="mt-6 flex items-start gap-3 rounded-2xl border border-primary/20 bg-primary/[0.045] p-4 sm:p-5"><ShieldAlert className="mt-0.5 size-4 shrink-0 text-primary"/><p className="text-xs leading-5 text-muted sm:text-sm">AutoFix — исследовательский прототип. Результат помогает структурировать симптомы, но не заменяет осмотр автомобиля и заключение автомеханика.</p></div>
      {!isPending && !user ? <div className="mt-5 text-center"><Link to="/login" className="inline-flex"><Button variant="outline" className="rounded-xl">Создать личный аккаунт<ArrowRight className="size-4"/></Button></Link></div> : null}
    </div>
  );
}

function Metric({ icon: Icon, label, value }: { icon: typeof Activity; label: string; value: number | undefined | null }) {
  return <div className="rounded-2xl border border-border/80 bg-surface/70 p-4 sm:p-5"><div className="flex items-center gap-2 text-xs text-muted"><Icon className="size-4 text-primary"/>{label}</div><div className="mt-3 font-display text-3xl font-semibold tracking-tight text-fg">{value === undefined ? <span className="inline-block h-8 w-10 animate-pulse rounded bg-surface-2 align-middle"/> : value ?? "—"}</div></div>;
}

function FeatureCard({ icon: Icon, number, title, text, to, action }: { icon: typeof Activity; number: string; title: string; text: string; to: "/diagnose" | "/cars" | "/maintenance"; action: string }) {
  return <Link to={to} className="autofix-panel group flex min-h-60 flex-col p-5 transition-all duration-200 hover:-translate-y-1 hover:border-primary/45 sm:p-6"><div className="flex items-start justify-between"><span className="grid size-11 place-items-center rounded-2xl border border-primary/20 bg-primary/10 text-primary"><Icon className="size-5"/></span><span className="font-mono text-xs text-muted">{number}</span></div><h3 className="mt-6 text-xl font-semibold tracking-tight">{title}</h3><p className="mt-2 flex-1 text-sm leading-6 text-muted">{text}</p><span className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-primary">{action}<ArrowRight className="size-4 transition-transform group-hover:translate-x-1"/></span></Link>;
}
