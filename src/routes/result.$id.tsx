import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AlertTriangle, ArrowLeft, MessageSquareText } from "lucide-react";
import { Gauge } from "@/components/gauge";
import { Button } from "@/components/ui/button";
import { SYMPTOMS } from "@/lib/ml/taxonomy";
import { explainDiagnosis } from "@/lib/ml/explanation";
import { getDiagnosis, type StoredDiagnosis } from "@/lib/data";
import { ProtectedPage } from "@/components/protected-page";

export const Route = createFileRoute("/result/$id")({ component: () => <ProtectedPage><ResultPage /></ProtectedPage> });
function ResultPage() {
  const { id } = Route.useParams();
  const [row, setRow] = useState<StoredDiagnosis | null>(null);
  const [ready, setReady] = useState(false);
  const [explanation, setExplanation] = useState<string | null>(null);
  useEffect(() => { void getDiagnosis({ data: Number(id) }).then(setRow).catch(() => setRow(null)).finally(() => setReady(true)); }, [id]);
  if (!ready) return <div className="mx-auto max-w-4xl px-4 py-12 text-sm text-muted">Загружаем результат…</div>;
  if (!row) return <div className="mx-auto max-w-2xl px-4 py-12 text-center"><h1 className="font-display text-3xl">Результат не найден</h1><p className="mt-2 text-sm text-muted">Запись отсутствует или принадлежит другому аккаунту.</p><Link to="/history" className="mt-4 inline-block text-sm text-primary">К истории диагностик</Link></div>;
  const active = SYMPTOMS.filter((s) => row.input[s.id]).map((s) => s.label);
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 md:py-10">
      <Link to="/history" className="inline-flex min-h-10 items-center gap-2 text-sm text-muted hover:text-fg"><ArrowLeft className="size-4"/>История диагностик</Link>
      <p className="mt-5 text-xs font-semibold uppercase tracking-[0.16em] text-muted">AutoFix AI · Diagnostic report</p>
      <h1 className="mt-2 font-display text-4xl tracking-tight">{row.carLabel}</h1>
      <p className="mt-1 text-sm text-muted">{new Date(row.createdAt).toLocaleString("ru-RU")} · исследовательская модель</p>
      <section className="mt-5 grid items-center gap-5 rounded-lg border border-border bg-surface p-5 md:grid-cols-[auto_1fr] md:p-7"><Gauge value={row.result.winner.probability}/><div><p className="text-xs uppercase tracking-widest text-muted">Предварительная гипотеза</p><h2 className="mt-1 font-display text-3xl">{row.result.winner.label}</h2><p className="mt-3 text-sm leading-6 text-muted">{row.result.winner.recommendation}</p></div></section>
      <div className="mt-4 flex items-start gap-2 rounded-md border border-primary/30 bg-primary/5 p-4 text-sm leading-6 text-muted"><AlertTriangle className="mt-0.5 size-4 shrink-0 text-primary"/>Эта вероятность не является калиброванной оценкой риска и не заменяет инструментальную диагностику.</div>
      <section className="mt-7"><h2 className="border-b border-border pb-2 font-display text-2xl">Альтернативные гипотезы</h2><ul className="mt-2 divide-y divide-border">{row.result.ranking.slice(0, 4).map((item) => <li key={item.id} className="flex items-center gap-3 py-3"><span className="w-12 font-mono text-sm text-primary">{Math.round(item.probability * 100)}%</span><span className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-2"><span className="block h-full rounded-full bg-primary" style={{ width: `${Math.round(item.probability * 100)}%` }}/></span><span className="w-44 text-right text-sm">{item.short}</span></li>)}</ul></section>
      <section className="mt-7"><h2 className="border-b border-border pb-2 font-display text-2xl">Сравнение алгоритмов</h2><div className="mt-2 overflow-x-auto"><table className="w-full text-left text-sm"><thead><tr className="text-muted"><th className="py-2 pr-3">Модель</th><th className="py-2 pr-3">Гипотеза</th><th className="py-2">Оценка</th></tr></thead><tbody>{row.result.models.map((model) => <tr key={model.model} className="border-t border-border"><td className="py-3 pr-3 font-medium">{model.model}</td><td className="py-3 pr-3">{model.fault}</td><td className="py-3 font-mono">{Math.round(model.probability * 100)}%</td></tr>)}</tbody></table></div><p className="mt-2 text-xs text-muted">Совпадение моделей не подтверждает правильность гипотезы: необходима проверка на размеченных сервисных данных.</p></section>
      <section className="mt-7 rounded-lg border border-border bg-surface p-5"><h2 className="flex items-center gap-2 font-medium"><MessageSquareText className="size-4 text-primary"/>Объяснение простым языком</h2><p className="mt-1 text-xs text-muted">Формируется локально по признакам результата, без внешнего LLM-сервиса.</p>{explanation ? <p className="mt-3 text-sm leading-6">{explanation}</p> : <Button variant="outline" className="mt-4" onClick={() => setExplanation(explainDiagnosis(row.result.winner, active))}>Показать объяснение</Button>}</section>
      <Link to="/diagnose" className="mt-6 inline-block"><Button>Новая диагностика</Button></Link>
    </div>
  );
}
