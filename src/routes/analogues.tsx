import { createFileRoute } from "@tanstack/react-router";
import { Activity, Cable, ClipboardCheck, ScanLine, Scale } from "lucide-react";

export const Route = createFileRoute("/analogues")({ component: AnaloguesPage });
const approaches = [
  { title: "Ручной осмотр", icon: ClipboardCheck, strength: "Контекст и опыт мастера; может заметить механические признаки.", limit: "Требует времени, навыка и физического доступа к автомобилю." },
  { title: "OBD-II сканер", icon: Cable, strength: "Считывает коды и отдельные параметры электронных блоков.", limit: "Код указывает на систему или цепь, но не всегда на конкретную деталь." },
  { title: "Симптомный ML-прототип", icon: Activity, strength: "Быстро ранжирует гипотезы по введённым признакам.", limit: "Зависит от качества и репрезентативности обучающих данных; текущая модель синтетическая." },
];
function AnaloguesPage() {
  return <div className="mx-auto max-w-5xl px-4 py-8 md:py-10"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">AutoFix AI · Сравнение</p><h1 className="mt-2 flex items-center gap-3 font-display text-4xl tracking-tight"><Scale className="size-7 text-primary"/>Подходы к первичной диагностике</h1><p className="mt-2 max-w-3xl text-sm leading-6 text-muted">Сравнение показывает место прототипа среди способов первичной оценки и не является тестом коммерческих устройств или сервисов.</p><div className="mt-6 grid gap-3 md:grid-cols-3">{approaches.map(({ title, icon: Icon, strength, limit }) => <article key={title} className="rounded-lg border border-border bg-surface p-5"><Icon className="size-5 text-primary"/><h2 className="mt-4 font-display text-2xl">{title}</h2><p className="mt-3 text-sm leading-6"><span className="font-medium text-fg">Сильная сторона: </span><span className="text-muted">{strength}</span></p><p className="mt-3 text-sm leading-6"><span className="font-medium text-fg">Ограничение: </span><span className="text-muted">{limit}</span></p></article>)}</div><div className="mt-5 flex items-start gap-3 rounded-lg border border-border p-4"><ScanLine className="mt-0.5 size-4 shrink-0 text-primary"/><p className="text-sm leading-6 text-muted">AutoFix стоит рассматривать только как информационный дополнительный сигнал. При критичных признаках — тормоза, перегрев, давление масла — прекратите движение и обратитесь к специалисту.</p></div></div>;
}
