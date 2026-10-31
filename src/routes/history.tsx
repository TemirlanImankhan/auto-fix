import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ClipboardList, Trash2 } from "lucide-react";
import { listDiagnoses, removeDiagnosis, type StoredDiagnosis } from "@/lib/data";
import { ProtectedPage } from "@/components/protected-page";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/history")({ component: () => <ProtectedPage><HistoryPage /></ProtectedPage> });
function HistoryPage() {
  const [rows, setRows] = useState<StoredDiagnosis[]>([]);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  async function refresh() {
    try { setRows(await listDiagnoses()); setError(""); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Не удалось загрузить историю"); }
    finally { setReady(true); }
  }
  useEffect(() => { void refresh(); }, []);
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 md:py-10">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">Личный аккаунт · History</p>
      <div className="mt-2 flex flex-wrap items-end justify-between gap-3 border-b border-border pb-4"><div><h1 className="font-display text-4xl tracking-tight">История диагностик</h1><p className="mt-2 text-sm text-muted">Результаты сохранены в вашем аккаунте.</p></div><span className="font-mono text-xs text-muted">{rows.length} отчётов</span></div>
      {error ? <p role="alert" className="mt-4 rounded-md border border-danger/40 bg-danger/10 p-3 text-sm text-danger">{error}</p> : null}
      {!ready ? <p className="py-10 text-sm text-muted">Загрузка истории…</p> : rows.length === 0 ? <div className="mt-5 rounded-lg border border-dashed border-border p-8 text-center"><ClipboardList className="mx-auto size-6 text-muted"/><h2 className="mt-3 font-medium">Отчётов пока нет</h2><p className="mt-1 text-sm text-muted">После диагностики её результат появится здесь.</p><Link to="/diagnose" className="mt-3 inline-flex min-h-10 items-center text-sm text-primary hover:underline">Запустить диагностику →</Link></div> : (
        <ul className="divide-y divide-border">{rows.map((row) => <li key={row.id} className="flex items-center gap-3 py-4"><Link to="/result/$id" params={{ id: String(row.id) }} className="min-w-0 flex-1"><div className="flex flex-wrap items-center justify-between gap-2"><span className="font-medium hover:text-primary">{row.carLabel}</span><span className="font-mono text-sm text-primary">{Math.round(row.result.winner.probability * 100)}%</span></div><p className="mt-1 text-sm text-muted">{new Date(row.createdAt).toLocaleString("ru-RU")} · {row.result.winner.label}</p></Link><Button variant="ghost" size="sm" aria-label="Удалить запись" onClick={() => void removeDiagnosis({ data: row.id }).then(refresh).catch((cause: unknown) => setError(cause instanceof Error ? cause.message : "Не удалось удалить запись"))}><Trash2 className="size-4"/></Button></li>)}</ul>
      )}
    </div>
  );
}
