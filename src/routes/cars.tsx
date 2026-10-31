import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CarFront, Plus, Trash2 } from "lucide-react";
import { BRANDS, ENGINE_TYPES, type EngineType } from "@/lib/ml/taxonomy";
import { listCars, removeCar, saveCar, type StoredCar } from "@/lib/data";
import { ProtectedPage } from "@/components/protected-page";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/cars")({ component: () => <ProtectedPage><CarsPage /></ProtectedPage> });
const carLabel = (car: Pick<StoredCar, "brand" | "model" | "year">) => `${car.brand} ${car.model} ${car.year}`;
const emptyForm = (): Omit<StoredCar, "id"> => ({ brand: "Toyota", model: "", year: 2018, mileage: 120000, engineType: "petrol" });

function CarsPage() {
  const [cars, setCars] = useState<StoredCar[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editing, setEditing] = useState<number | null>(null);
  const [error, setError] = useState("");
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  async function refresh() {
    try { setCars(await listCars()); setError(""); }
    catch (cause) { setError(cause instanceof Error ? cause.message : "Не удалось загрузить гараж"); }
    finally { setReady(true); }
  }
  useEffect(() => { void refresh(); }, []);
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(""); setBusy(true);
    try {
      await saveCar({ data: editing ? { ...form, id: editing } : form });
      setForm(emptyForm()); setEditing(null); await refresh();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Не удалось сохранить автомобиль"); }
    finally { setBusy(false); }
  }
  async function deleteCar(car: StoredCar) {
    if (!window.confirm(`Удалить ${carLabel(car)} из гаража? Записи обслуживания этого автомобиля тоже будут удалены.`)) return;
    setError("");
    try {
      await removeCar({ data: car.id });
      if (editing === car.id) { setEditing(null); setForm(emptyForm()); }
      await refresh();
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Не удалось удалить автомобиль"); }
  }
  return (
    <div className="mx-auto max-w-5xl px-4 py-8 md:py-10">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">Личный кабинет · Гараж</p>
      <div className="mt-2 flex flex-wrap items-end justify-between gap-3 border-b border-border pb-4"><div><h1 className="font-display text-4xl tracking-tight">Мой гараж</h1><p className="mt-2 text-sm text-muted">Автомобили, пробег и данные для быстрой диагностики.</p></div><span className="font-mono text-xs text-muted">{cars.length} автомобилей</span></div>
      {error ? <p role="alert" className="mt-4 rounded-md border border-danger/40 bg-danger/10 p-3 text-sm text-danger">{error}</p> : null}
      <div className="mt-6 grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <section>
          <h2 className="border-b border-border pb-2 font-display text-2xl">Гараж</h2>
          {!ready ? <p className="py-8 text-sm text-muted">Загружаем список…</p> : cars.length === 0 ? <div className="mt-3 rounded-lg border border-dashed border-border p-8 text-center"><CarFront className="mx-auto size-6 text-muted"/><h3 className="mt-3 font-medium">Гараж пока пуст</h3><p className="mt-1 text-sm text-muted">Добавьте автомобиль, чтобы быстрее заполнять диагностику.</p></div> : <ul className="divide-y divide-border">{cars.map((car) => <li key={car.id} className="flex flex-wrap items-center gap-3 py-4"><CarFront className="size-4 shrink-0 text-primary"/><div className="min-w-0 flex-1"><div className="font-medium">{carLabel(car)}</div><div className="mt-1 text-sm text-muted">{car.mileage.toLocaleString("ru-RU")} км · {ENGINE_TYPES.find((t) => t.id === car.engineType)?.label}</div></div><Button variant="ghost" size="sm" onClick={() => { setEditing(car.id); setForm({ brand: car.brand, model: car.model, year: car.year, mileage: car.mileage, engineType: car.engineType }); }}>Изменить</Button><Button variant="ghost" size="sm" aria-label={`Удалить ${carLabel(car)}`} onClick={() => void removeCar({ data: car.id }).then(refresh).catch((cause: unknown) => setError(cause instanceof Error ? cause.message : "Не удалось удалить автомобиль"))}><Trash2 className="size-4"/></Button></li>)}</ul>}
        </section>
        <form onSubmit={submit} className="rounded-lg border border-border bg-surface p-4">
          <h2 className="flex items-center gap-2 font-medium"><Plus className="size-4 text-primary"/>{editing ? "Изменить автомобиль" : "Добавить автомобиль"}</h2>
          <label className="mt-4 block text-sm text-muted">Марка<select className="mt-1 min-h-11 w-full rounded-md border border-border bg-bg px-3 text-fg" value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })}>{BRANDS.map((brand) => <option key={brand}>{brand}</option>)}</select></label>
          <label className="mt-3 block text-sm text-muted">Модель<input required minLength={1} maxLength={100} className="mt-1 min-h-11 w-full rounded-md border border-border bg-bg px-3 text-fg" value={form.model} onChange={(e) => setForm({ ...form, model: e.target.value })}/></label>
          <div className="mt-3 grid grid-cols-2 gap-3"><label className="block text-sm text-muted">Год<input type="number" min={1900} max={2100} required className="mt-1 min-h-11 w-full rounded-md border border-border bg-bg px-3 text-fg" value={form.year} onChange={(e) => setForm({ ...form, year: Number(e.target.value) })}/></label><label className="block text-sm text-muted">Пробег<input type="number" min={0} max={2000000} required className="mt-1 min-h-11 w-full rounded-md border border-border bg-bg px-3 text-fg" value={form.mileage} onChange={(e) => setForm({ ...form, mileage: Number(e.target.value) })}/></label></div>
          <label className="mt-3 block text-sm text-muted">Тип двигателя<select value={form.engineType} onChange={(e) => setForm({ ...form, engineType: e.target.value as EngineType })} className="mt-1 min-h-11 w-full rounded-md border border-border bg-bg px-3 text-fg">{ENGINE_TYPES.map((type) => <option key={type.id} value={type.id}>{type.label}</option>)}</select></label>
          <div className="mt-4 flex gap-2"><Button type="submit" disabled={busy}>{busy ? "Сохраняем…" : editing ? "Сохранить" : "Добавить"}</Button>{editing ? <Button variant="ghost" type="button" onClick={() => { setEditing(null); setForm(emptyForm()); }}>Отмена</Button> : null}</div>
        </form>
      </div>
    </div>
  );
}
