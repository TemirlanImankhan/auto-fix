import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AlertTriangle, CarFront, CircleHelp } from "lucide-react";
import { BRANDS, ENGINE_TYPES, SYMPTOMS, type DiagnosisInput, type EngineType, type SymptomId, type SymptomMap } from "@/lib/ml/taxonomy";
import { createDiagnosis, listCars, type StoredCar } from "@/lib/data";
import { ProtectedPage } from "@/components/protected-page";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/diagnose")({ component: () => <ProtectedPage><DiagnosePage /></ProtectedPage> });
const blankSymptoms = Object.fromEntries(SYMPTOMS.map((s) => [s.id, false])) as SymptomMap;

function DiagnosePage() {
  const navigate = useNavigate();
  const [cars, setCars] = useState<StoredCar[]>([]);
  const [carId, setCarId] = useState("manual");
  const [brand, setBrand] = useState<string>("Toyota");
  const [model, setModel] = useState("Camry");
  const [year, setYear] = useState(2018);
  const [mileage, setMileage] = useState(180000);
  const [engineType, setEngineType] = useState<EngineType>("petrol");
  const [symptoms, setSymptoms] = useState<SymptomMap>(blankSymptoms);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => { void listCars().then((rows) => setCars(rows)).catch((cause: unknown) => setError(cause instanceof Error ? cause.message : "Не удалось загрузить гараж")); }, []);
  function selectCar(value: string) {
    setCarId(value);
    const car = cars.find((item) => String(item.id) === value);
    if (car) { setBrand(car.brand); setModel(car.model); setYear(car.year); setMileage(car.mileage); setEngineType(car.engineType); }
  }
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault(); setBusy(true); setError("");
    const car = cars.find((item) => String(item.id) === carId);
    const input: DiagnosisInput = { brand, model, year, mileage, engineType, ...symptoms };
    try {
      const row = await createDiagnosis({ data: { carId: car?.id ?? null, input } });
      await navigate({ to: "/result/$id", params: { id: String(row.id) } });
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Не удалось выполнить диагностику"); }
    finally { setBusy(false); }
  }
  return (
    <div className="mx-auto max-w-4xl px-4 py-8 md:py-10">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">AutoFix AI · Diagnosis</p>
      <h1 className="mt-2 font-display text-4xl tracking-tight">Новая диагностика</h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">Опишите автомобиль и отметьте только те признаки, которые действительно наблюдаете.</p>
      {error ? <p role="alert" className="mt-4 rounded-md border border-danger/40 bg-danger/10 p-3 text-sm text-danger">{error}</p> : null}
      <form onSubmit={submit} className="mt-6 grid gap-5">
        <section className="rounded-lg border border-border bg-surface p-4 md:p-5">
          <h2 className="flex items-center gap-2 font-medium"><CarFront className="size-4 text-primary"/>Автомобиль</h2>
          <label className="mt-4 block text-sm text-muted">Выбрать из гаража<select value={carId} onChange={(e) => selectCar(e.target.value)} className="mt-1 min-h-11 w-full rounded-md border border-border bg-bg px-3 text-fg"><option value="manual">Ввести вручную</option>{cars.map((car) => <option value={car.id} key={car.id}>{car.brand} {car.model} {car.year}</option>)}</select></label>
          <div className="mt-3 grid gap-3 sm:grid-cols-2"><label className="text-sm text-muted">Марка<select value={brand} onChange={(e) => setBrand(e.target.value)} className="mt-1 min-h-11 w-full rounded-md border border-border bg-bg px-3 text-fg">{BRANDS.map((value) => <option key={value}>{value}</option>)}</select></label><label className="text-sm text-muted">Модель<input required minLength={1} maxLength={100} value={model} onChange={(e) => setModel(e.target.value)} className="mt-1 min-h-11 w-full rounded-md border border-border bg-bg px-3 text-fg"/></label><label className="text-sm text-muted">Год<input required type="number" min={1900} max={2100} value={year} onChange={(e) => setYear(Number(e.target.value))} className="mt-1 min-h-11 w-full rounded-md border border-border bg-bg px-3 text-fg"/></label><label className="text-sm text-muted">Пробег, км<input required type="number" min={0} max={2000000} value={mileage} onChange={(e) => setMileage(Number(e.target.value))} className="mt-1 min-h-11 w-full rounded-md border border-border bg-bg px-3 text-fg"/></label></div>
          <label className="mt-3 block text-sm text-muted">Тип двигателя<select value={engineType} onChange={(e) => setEngineType(e.target.value as EngineType)} className="mt-1 min-h-11 w-full rounded-md border border-border bg-bg px-3 text-fg">{ENGINE_TYPES.map((type) => <option key={type.id} value={type.id}>{type.label}</option>)}</select></label>
        </section>
        <section className="rounded-lg border border-border bg-surface p-4 md:p-5">
          <h2 className="font-medium">Наблюдаемые симптомы</h2><p className="mt-1 text-sm text-muted">Можно выбрать несколько пунктов.</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">{SYMPTOMS.map((item) => <label key={item.id} className="flex min-h-16 cursor-pointer items-start gap-3 rounded-md border border-border bg-bg p-3 hover:border-primary/50"><input type="checkbox" checked={symptoms[item.id as SymptomId]} onChange={(e) => setSymptoms((old) => ({ ...old, [item.id]: e.target.checked }))} className="mt-1 accent-primary"/><span><span className="block text-sm font-medium">{item.label}</span><span className="mt-1 block text-xs text-muted">{item.hint}</span></span></label>)}</div>
        </section>
        <div className="flex items-start gap-2 rounded-md border border-primary/30 bg-primary/5 p-3 text-xs leading-5 text-muted"><AlertTriangle className="mt-0.5 size-4 shrink-0 text-primary"/><p>Результат является предварительным и не заменяет осмотр, OBD-II считывание и заключение автомеханика.</p><CircleHelp className="hidden"/></div>
        <Button type="submit" size="lg" disabled={busy}>{busy ? "Анализируем…" : "Получить предварительный результат"}</Button>
      </form>
    </div>
  );
}
