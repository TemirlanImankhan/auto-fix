import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Activity, ArrowRight, CalendarClock, CarFront, ClipboardList, FlaskConical, GitCompare, ShieldAlert, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { listCars, listDiagnoses, listMaintenance } from "@/lib/data";
import { useCurrentUserState } from "@/lib/auth/use-current-user";

export const Route = createFileRoute("/")({ component: Home });

const pinned = [
  { title: "AI-диагностика", subtitle: "Оценить симптомы и получить предварительную гипотезу", tag: "DIAGNOSTIC", icon: Activity, to: "/diagnose" as const },
  { title: "Мой гараж", subtitle: "Сохранённые автомобили и их характеристики", tag: "GARAGE", icon: CarFront, to: "/cars" as const },
  { title: "Обслуживание", subtitle: "История работ и плановые отметки по пробегу", tag: "SERVICE", icon: CalendarClock, to: "/maintenance" as const },
  { title: "История", subtitle: "Ранее созданные диагностические отчёты", tag: "PRIVATE", icon: ClipboardList, to: "/history" as const },
  { title: "Исследование", subtitle: "Методика, модели и ограничения прототипа", tag: "RESEARCH", icon: FlaskConical, to: "/research" as const },
];

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
    <div className="mx-auto max-w-6xl px-4 pb-16 pt-7 md:pt-10">
      <div className="grid gap-8 lg:grid-cols-[248px_minmax(0,1fr)] lg:gap-10">
        <aside className="min-w-0">
          <div className="flex items-center gap-4 lg:block">
            <div className="grid size-20 shrink-0 place-items-center rounded-full border border-border bg-surface text-primary shadow-sm md:size-28 lg:size-52"><Wrench className="size-9 md:size-12 lg:size-20" strokeWidth={1.4} /></div>
            <div className="min-w-0 lg:mt-4"><h1 className="font-display text-3xl leading-none tracking-tight md:text-4xl">AutoFix AI</h1><p className="mt-1 text-base text-muted">Предварительная диагностика</p></div>
          </div>
          <p className="mt-5 text-sm leading-6 text-fg">Исследовательский прототип для оценки вероятных неисправностей автомобиля по введённым характеристикам и симптомам.</p>
          <div className="mt-4 flex items-center gap-2 text-sm text-muted"><span className="size-2 rounded-full bg-primary" /> Автомобильная диагностика</div>
          <div className="mt-5 grid gap-2 text-sm text-muted"><div className="flex items-center gap-2"><ShieldAlert className="size-4 text-primary" /> Результат требует проверки специалистом</div><div className="flex items-center gap-2"><ClipboardList className="size-4 text-primary" /> Личная история по аккаунту</div></div>
          <div className="mt-6 flex flex-wrap gap-2"><span className="rounded-full border border-border px-2.5 py-1 text-xs text-muted">ML prototype</span><span className="rounded-full border border-border px-2.5 py-1 text-xs text-muted">Web app</span><span className="rounded-full border border-border px-2.5 py-1 text-xs text-muted">RU</span></div>
          {!isPending && !user ? <Link to="/login" className="mt-6 block"><Button className="w-full">Создать аккаунт</Button></Link> : null}
        </aside>

        <section className="min-w-0">
          <div className="border-b border-border pb-5"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">Обзор проекта</p><h2 className="mt-2 font-display text-4xl leading-none tracking-tight md:text-5xl">Разберитесь в симптомах автомобиля</h2><p className="mt-3 max-w-2xl text-sm leading-6 text-muted">Сохраните автомобиль в гараже, отметьте наблюдаемые признаки и получите объяснимый предварительный результат.</p></div><Link to="/diagnose"><Button variant="outline"><Activity className="size-4" /> Начать диагностику</Button></Link></div></div>
          <div className="mt-5 flex gap-6 overflow-x-auto border-b border-border text-sm"><span className="relative -mb-px inline-flex min-h-11 items-center gap-2 border-b-2 border-primary px-1 font-medium text-fg"><Wrench className="size-4" /> Обзор</span><Link to="/diagnose" className="inline-flex min-h-11 items-center gap-2 px-1 text-muted hover:text-fg"><Activity className="size-4" /> Диагностика</Link><Link to="/cars" className="inline-flex min-h-11 items-center gap-2 px-1 text-muted hover:text-fg"><CarFront className="size-4" /> Автомобили</Link><Link to="/maintenance" className="inline-flex min-h-11 items-center gap-2 px-1 text-muted hover:text-fg"><CalendarClock className="size-4" /> Обслуживание</Link><Link to="/history" className="inline-flex min-h-11 items-center gap-2 px-1 text-muted hover:text-fg"><ClipboardList className="size-4" /> История</Link><Link to="/research" className="inline-flex min-h-11 items-center gap-2 px-1 text-muted hover:text-fg"><FlaskConical className="size-4" /> Исследование</Link></div>

          <div className="mt-6 flex flex-wrap items-center justify-between gap-3"><h3 className="font-display text-2xl tracking-tight">Закреплённые разделы</h3>{user && counts ? <p className="text-xs text-muted">{counts.cars} авто · {counts.diagnoses} отчётов · {counts.maintenance} работ</p> : null}</div>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">{pinned.map(({ title, subtitle, tag, icon: Icon, to }) => <Link key={title} to={to} className="group rounded-lg border border-border bg-surface p-4 transition-colors hover:border-primary/50 hover:bg-surface-2"><div className="flex items-start justify-between gap-3"><span className="flex items-center gap-2 font-medium text-primary"><Icon className="size-4" />{title}</span><span className="rounded-full border border-border px-2 py-0.5 font-mono text-[10px] tracking-wide text-muted">{tag}</span></div><p className="mt-3 min-h-10 text-sm leading-5 text-muted">{subtitle}</p><span className="mt-3 inline-flex items-center gap-1 text-xs text-muted group-hover:text-fg">Открыть <ArrowRight className="size-3" /></span></Link>)}</div>

          <div className="mt-8 flex items-center justify-between border-b border-border pb-2"><h3 className="font-display text-2xl tracking-tight">Возможности AutoFix</h3><span className="text-xs text-muted">обзор</span></div>
          <div className="divide-y divide-border"><Feature icon={Activity} title="Симптомы и классификация" label="DIAGNOSIS" text="Ввод характеристик автомобиля и наблюдаемых признаков для формирования предварительной гипотезы."/><Feature icon={CarFront} title="Личный гараж" label="ACCOUNT" text="Сохраняйте автомобили отдельно в своём аккаунте и выбирайте их при следующей проверке."/><Feature icon={CalendarClock} title="История обслуживания" label="SERVICE LOG" text="Записывайте выполненные работы и планируйте напоминания по дате или пробегу."/><Feature icon={GitCompare} title="Исследовательский раздел" label="THESIS" text="Сравнение алгоритмов и описание того, какие проверки нужны для дипломной валидации."/></div>
          <div className="mt-7 flex items-start gap-3 rounded-lg border border-primary/30 bg-primary/5 p-4 text-sm"><ShieldAlert className="mt-0.5 size-4 shrink-0 text-primary"/><p className="leading-6 text-muted">Модель пока остаётся демонстрационным прототипом; её прогноз нельзя использовать как подтверждённый технический диагноз.</p></div>
        </section>
      </div>
    </div>
  );
}

function Feature({ icon: Icon, title, label, text }: { icon: typeof Activity; title: string; label: string; text: string }) {
  return <div className="flex gap-3 py-4"><Icon className="mt-0.5 size-4 shrink-0 text-primary"/><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h4 className="text-sm font-medium">{title}</h4><span className="font-mono text-[10px] text-muted">{label}</span></div><p className="mt-1 text-sm leading-5 text-muted">{text}</p></div></div>;
}
