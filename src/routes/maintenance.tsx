import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { CalendarClock, CarFront, Check, ClipboardCheck, Pencil, Plus, Trash2, Wrench } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProtectedPage } from "@/components/protected-page";
import { listCars, listMaintenance, MAINTENANCE_TYPES, removeMaintenance, saveMaintenance, type MaintenanceRecord, type MaintenanceType, type StoredCar } from "@/lib/data";

export const Route = createFileRoute("/maintenance")({ component: () => <ProtectedPage><MaintenancePage /></ProtectedPage> });

type FormState = {
  carId: string; serviceType: MaintenanceType; serviceDate: string; mileage: string;
  notes: string; nextServiceDate: string; nextServiceMileage: string;
};
const today = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};
const emptyForm = (carId = ""): FormState => ({ carId, serviceType: "oil", serviceDate: today(), mileage: "", notes: "", nextServiceDate: "", nextServiceMileage: "" });

function MaintenancePage() {
  const [cars, setCars] = useState<StoredCar[]>([]);
  const [rows, setRows] = useState<MaintenanceRecord[]>([]);
  const [form, setForm] = useState<FormState>(emptyForm());
  const [editing, setEditing] = useState<number | null>(null);
  const [filter, setFilter] = useState("all");
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function refresh() {
    try {
      const [carRows, serviceRows] = await Promise.all([listCars(), listMaintenance()]);
      setCars(carRows); setRows(serviceRows);
      setForm((old) => old.carId ? old : emptyForm(carRows[0] ? String(carRows[0].id) : ""));
      setError("");
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Не удалось загрузить записи обслуживания"); }
    finally { setReady(true); }
  }
  useEffect(() => { void refresh(); }, []);

  const visibleRows = useMemo(() => filter === "all" ? rows : rows.filter((row) => String(row.carId) === filter), [filter, rows]);
  const dueCount = rows.filter((row) => getDueState(row) === "due").length;

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setBusy(true);
    try {
      await saveMaintenance({ data: {
        ...(editing === null ? {} : { id: editing }), carId: Number(form.carId), serviceType: form.serviceType,
        serviceDate: form.serviceDate, mileage: Number(form.mileage), notes: form.notes,
        nextServiceDate: form.nextServiceDate || null,
        nextServiceMileage: form.nextServiceMileage ? Number(form.nextServiceMileage) : null,
      } });
      setEditing(null); setForm(emptyForm(form.carId)); await refresh();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Не удалось сохранить обслуживание"); }
    finally { setBusy(false); }
  }
  function edit(row: MaintenanceRecord) {
    setEditing(row.id);
    setForm({ carId: String(row.carId), serviceType: row.serviceType, serviceDate: row.serviceDate,
      mileage: String(row.mileage), notes: row.notes, nextServiceDate: row.nextServiceDate ?? "",
      nextServiceMileage: row.nextServiceMileage === null ? "" : String(row.nextServiceMileage) });
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 md:py-10">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">Личный аккаунт · Vehicle care</p>
      <div className="mt-2 flex flex-wrap items-end justify-between gap-4 border-b border-border pb-5">
        <div><h1 className="font-display text-4xl tracking-tight md:text-5xl">Обслуживание</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-muted">Журнал выполненных работ и следующие плановые отметки по каждому автомобилю.</p></div>
        <div className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm ${dueCount ? "border-primary/40 bg-primary/10 text-primary" : "border-border bg-surface text-muted"}`}><CalendarClock className="size-4"/>{dueCount ? `${dueCount} пора проверить` : "План под контролем"}</div>
      </div>

      {error ? <p role="alert" className="mt-4 rounded-md border border-danger/40 bg-danger/10 p-3 text-sm text-danger">{error}</p> : null}
      {!ready ? <p className="py-10 text-sm text-muted">Загружаем журнал…</p> : cars.length === 0 ? (
        <div className="mt-6 rounded-xl border border-dashed border-border p-10 text-center"><CarFront className="mx-auto size-7 text-muted"/><h2 className="mt-3 font-display text-2xl">Сначала добавьте автомобиль</h2><p className="mt-1 text-sm text-muted">Журнал обслуживания привязывается к автомобилю из вашего гаража.</p><Link to="/cars" className="mt-4 inline-flex"><Button><CarFront className="size-4"/>Открыть гараж</Button></Link></div>
      ) : (
        <div className="mt-6 grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <section className="min-w-0">
            <div className="flex flex-wrap items-center justify-between gap-3"><h2 className="font-display text-2xl">Журнал работ</h2><label className="text-xs text-muted">Автомобиль<select value={filter} onChange={(e) => setFilter(e.target.value)} className="ml-2 min-h-10 rounded-md border border-border bg-surface px-3 text-sm text-fg"><option value="all">Все</option>{cars.map((car) => <option key={car.id} value={car.id}>{car.brand} {car.model}</option>)}</select></label></div>
            {visibleRows.length === 0 ? <div className="mt-3 rounded-lg border border-dashed border-border p-8 text-center"><ClipboardCheck className="mx-auto size-6 text-muted"/><p className="mt-3 text-sm text-muted">Записей пока нет. Добавьте первое обслуживание справа.</p></div> : <ol className="mt-3 divide-y divide-border rounded-lg border border-border bg-surface">{visibleRows.map((row) => <ServiceRow key={row.id} row={row} onEdit={() => edit(row)} onDelete={() => void removeMaintenance({ data: row.id }).then(refresh).catch((cause: unknown) => setError(cause instanceof Error ? cause.message : "Не удалось удалить запись"))}/>)}</ol>}
          </section>

          <form onSubmit={submit} className="rounded-lg border border-border bg-surface p-4 md:p-5">
            <h2 className="flex items-center gap-2 font-medium"><Plus className="size-4 text-primary"/>{editing === null ? "Новая запись" : "Редактировать запись"}</h2>
            <label className="mt-4 block text-sm text-muted">Автомобиль<select required value={form.carId} onChange={(e) => setForm({ ...form, carId: e.target.value })} className="mt-1 min-h-11 w-full rounded-md border border-border bg-bg px-3 text-fg">{cars.map((car) => <option key={car.id} value={car.id}>{car.brand} {car.model} {car.year}</option>)}</select></label>
            <label className="mt-3 block text-sm text-muted">Работа<select value={form.serviceType} onChange={(e) => setForm({ ...form, serviceType: e.target.value as MaintenanceType })} className="mt-1 min-h-11 w-full rounded-md border border-border bg-bg px-3 text-fg">{MAINTENANCE_TYPES.map((type) => <option value={type.id} key={type.id}>{type.label}</option>)}</select></label>
            <div className="mt-3 grid grid-cols-2 gap-3"><label className="block text-sm text-muted">Дата<input required type="date" value={form.serviceDate} onChange={(e) => setForm({ ...form, serviceDate: e.target.value })} className="mt-1 min-h-11 w-full rounded-md border border-border bg-bg px-2 text-sm text-fg"/></label><label className="block text-sm text-muted">Пробег<input required type="number" min={0} max={2000000} value={form.mileage} onChange={(e) => setForm({ ...form, mileage: e.target.value })} placeholder="км" className="mt-1 min-h-11 w-full rounded-md border border-border bg-bg px-3 text-fg"/></label></div>
            <div className="mt-4 border-t border-border pt-3"><h3 className="text-sm font-medium">Следующее обслуживание <span className="font-normal text-muted">(необязательно)</span></h3><div className="mt-2 grid grid-cols-2 gap-3"><label className="text-xs text-muted">Дата<input type="date" value={form.nextServiceDate} onChange={(e) => setForm({ ...form, nextServiceDate: e.target.value })} className="mt-1 min-h-10 w-full rounded-md border border-border bg-bg px-2 text-sm text-fg"/></label><label className="text-xs text-muted">Пробег<input type="number" min={Number(form.mileage) || 0} max={2000000} value={form.nextServiceMileage} onChange={(e) => setForm({ ...form, nextServiceMileage: e.target.value })} placeholder="км" className="mt-1 min-h-10 w-full rounded-md border border-border bg-bg px-3 text-sm text-fg"/></label></div></div>
            <label className="mt-3 block text-sm text-muted">Заметка<textarea rows={3} maxLength={1000} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder="Работы, детали, стоимость…" className="mt-1 w-full rounded-md border border-border bg-bg p-3 text-fg"/></label>
            <div className="mt-4 flex gap-2"><Button type="submit" disabled={busy}>{busy ? "Сохраняем…" : editing === null ? "Добавить запись" : "Сохранить"}</Button>{editing !== null ? <Button variant="ghost" type="button" onClick={() => { setEditing(null); setForm(emptyForm(cars[0] ? String(cars[0].id) : "")); }}>Отмена</Button> : null}</div>
          </form>
        </div>
      )}
      <div className="mt-6 flex items-start gap-2 rounded-md border border-border p-3 text-xs leading-5 text-muted"><Wrench className="mt-0.5 size-4 shrink-0 text-primary"/>Плановые отметки — напоминание по введённым вами датам и пробегу. Они не учитывают регламент конкретной комплектации; сверяйтесь с руководством автомобиля.</div>
    </div>
  );
}

function getDueState(row: MaintenanceRecord): "due" | "soon" | "planned" {
  const todayIso = today();
  const days = row.nextServiceDate ? Math.round((new Date(`${row.nextServiceDate}T00:00:00`).getTime() - new Date(`${todayIso}T00:00:00`).getTime()) / 86400000) : Infinity;
  const km = row.nextServiceMileage === null ? Infinity : row.nextServiceMileage - row.currentMileage;
  if (days < 0 || km <= 0) return "due";
  if (days <= 30 || km <= 1000) return "soon";
  return "planned";
}

function ServiceRow({ row, onEdit, onDelete }: { row: MaintenanceRecord; onEdit: () => void; onDelete: () => void }) {
  const label = MAINTENANCE_TYPES.find((type) => type.id === row.serviceType)?.label ?? "Обслуживание";
  const state = row.nextServiceDate || row.nextServiceMileage !== null ? getDueState(row) : "planned";
  const stateLabel = state === "due" ? "Пора запланировать" : state === "soon" ? "Скоро" : "Записано";
  return <li className="flex gap-3 p-4"><div className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-full border border-border bg-bg text-primary"><Check className="size-4"/></div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><h3 className="font-medium">{label}</h3><span className={`rounded-full px-2 py-0.5 text-[10px] ${state === "due" ? "bg-primary/15 text-primary" : "border border-border text-muted"}`}>{stateLabel}</span></div><p className="mt-1 text-sm text-muted">{row.carLabel} · {new Date(`${row.serviceDate}T00:00:00`).toLocaleDateString("ru-RU")} · {row.mileage.toLocaleString("ru-RU")} км</p>{row.notes ? <p className="mt-2 whitespace-pre-wrap text-sm leading-5 text-fg">{row.notes}</p> : null}{row.nextServiceDate || row.nextServiceMileage !== null ? <p className="mt-2 text-xs text-muted">Следующее: {row.nextServiceDate ? new Date(`${row.nextServiceDate}T00:00:00`).toLocaleDateString("ru-RU") : "дата не задана"}{row.nextServiceMileage !== null ? ` · ${row.nextServiceMileage.toLocaleString("ru-RU")} км` : ""}</p> : null}</div><div className="flex shrink-0 gap-1"><Button variant="ghost" size="sm" aria-label="Изменить запись" onClick={onEdit}><Pencil className="size-4"/></Button><Button variant="ghost" size="sm" aria-label="Удалить запись" onClick={onDelete}><Trash2 className="size-4"/></Button></div></li>;
}
