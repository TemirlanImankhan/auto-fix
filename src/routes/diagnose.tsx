import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AlertTriangle, CarFront, CircleHelp } from "lucide-react";
import { BRANDS, ENGINE_TYPES, SYMPTOMS, type DiagnosisInput, type EngineType, type SymptomId, type SymptomMap } from "@/lib/ml/taxonomy";
import { lookupObdCode, parseObdCodeText } from "@/lib/ml/obd";
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
  const [obdCodeText, setObdCodeText] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => { void listCars().then((rows) => setCars(rows)).catch((cause: unknown) => setError(cause instanceof Error ? cause.message : "Не удалось загрузить гараж")); }, []);
  function selectCar(value: string) {
    setCarId(value);
    const car = cars.find((item) => String(item.id) === value);
    if (car) { setBrand(car.brand); setModel(car.model); setYear(car.year); setMileage(car.mileage); setEngineType(car.engineType); }
  }
  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const parsedCodes = parseObdCodeText(obdCodeText);
    if (parsedCodes.invalid.length || parsedCodes.tooMany) {
      setError(parsedCodes.tooMany ? "Можно указать не более 10 OBD-II кодов." : `Проверьте формат кодов: ${parsedCodes.invalid.join(", ")}. Пример: P0300.`);
      return;
    }
    setBusy(true); setError("");
    const car = cars.find((item) => String(item.id) === carId);
    const input: DiagnosisInput = { brand, model, year, mileage, engineType, ...symptoms, obdCodes: parsedCodes.codes };
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
          <h2 className="font-medium">Коды OBD-II (по желанию)</h2>
          <p className="mt-1 text-sm leading-5 text-muted">Считайте коды сканером и введите их через запятую или пробел. AutoFix распознаёт распространённые стандартные коды; приложение не подключается к адаптеру напрямую.</p>
          <label className="mt-4 block text-sm text-muted" htmlFor="obd-codes">Коды неисправностей
            <input id="obd-codes" value={obdCodeText} onChange={(event) => setObdCodeText(event.target.value)} placeholder="Например: P0300, P0420" autoCapitalize="characters" className="mt-1 min-h-11 w-full rounded-md border border-border bg-bg px-3 font-mono text-fg placeholder:font-sans placeholder:text-muted/70" />
          </label>
          <p className="mt-2 text-xs text-muted">До 10 кодов. Коды производителя могут требовать документацию конкретной марки. Справочная расшифровка кода показывается отдельно от гипотезы модели.</p>
          {obdCodeText.trim() ? <ObdCodePreview value={obdCodeText} /> : null}
        </section>
        <section className="rounded-lg border border-border bg-surface p-4 md:p-5">
          <h2 className="font-medium">Наблюдаемые симптомы</h2><p className="mt-1 text-sm text-muted">Можно отметить несколько симптомов. Выбирайте только то, что действительно наблюдаете.</p>
          <div className="mt-3 grid gap-2 sm:grid-cols-2">{SYMPTOMS.map((item) => <label key={item.id} className="flex min-h-16 cursor-pointer items-start gap-3 rounded-md border border-border bg-bg p-3 hover:border-primary/50"><input type="checkbox" checked={symptoms[item.id as SymptomId]} onChange={(e) => setSymptoms((old) => ({ ...old, [item.id]: e.target.checked }))} className="mt-1 accent-primary"/><span><span className="block text-sm font-medium">{item.label}</span><span className="mt-1 block text-xs text-muted">{item.hint}</span></span></label>)}</div>
        </section>
        <div className="flex items-start gap-2 rounded-md border border-primary/30 bg-primary/5 p-3 text-xs leading-5 text-muted"><AlertTriangle className="mt-0.5 size-4 shrink-0 text-primary"/><p>Если горит красный индикатор давления масла, немедленно безопасно остановитесь и заглушите двигатель. При запахе или утечке топлива выключите двигатель и не создавайте искр. Результат AutoFix предварительный и не заменяет осмотр и считывание кодов OBD-II.</p><CircleHelp className="hidden"/></div>
        <Button type="submit" size="lg" disabled={busy}>{busy ? "Анализируем…" : "Получить предварительный результат"}</Button>
      </form>
    </div>
  );
}

function ObdCodePreview({ value }: { value: string }) {
  const parsed = parseObdCodeText(value);
  if (parsed.invalid.length) return <p role="alert" className="mt-3 text-xs text-danger">Неверный формат: {parsed.invalid.join(", ")}. Пример: P0300.</p>;
  return <ul className="mt-3 grid gap-2">{parsed.codes.map((code) => {
    const info = lookupObdCode(code);
    return <li key={code} className="rounded-md border border-border bg-bg p-3 text-xs leading-5"><span className="font-mono font-semibold text-primary">{code}</span>{info ? <><span className="ml-2 font-medium text-fg">{info.title}</span><p className="mt-1 text-muted">{info.detail}</p></> : <p className="mt-1 text-muted">Код по формату корректен, но его нет во встроенном справочнике. Проверьте описание по документации автомобиля.</p>}</li>;
  })}</ul>;
}
