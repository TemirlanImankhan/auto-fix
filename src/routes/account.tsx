import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Activity, ArrowRight, CalendarClock, CarFront, ClipboardList, ShieldCheck, Wrench } from "lucide-react";
import { ProtectedPage } from "@/components/protected-page";
import { useCurrentUserState } from "@/lib/auth/use-current-user";
import { authClient } from "@/lib/auth/client";
import { listCars, listDiagnoses, listMaintenance, type StoredCar, type StoredDiagnosis, type MaintenanceRecord } from "@/lib/data";

export const Route = createFileRoute("/account")({ component: () => <ProtectedPage><AccountPage /></ProtectedPage> });

function AccountPage() {
  const { user } = useCurrentUserState();
  const [cars, setCars] = useState<StoredCar[]>([]);
  const [diagnoses, setDiagnoses] = useState<StoredDiagnosis[]>([]);
  const [maintenance, setMaintenance] = useState<MaintenanceRecord[]>([]);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const [securityPassword, setSecurityPassword] = useState("");
  const [securityCode, setSecurityCode] = useState("");
  const [securityBusy, setSecurityBusy] = useState(false);
  const [securityError, setSecurityError] = useState("");
  const [totpSetup, setTotpSetup] = useState<{ uri: string; codes: string[] } | null>(null);
  const [backupCodes, setBackupCodes] = useState<string[] | null>(null);

  async function startTwoFactor() {
    setSecurityBusy(true); setSecurityError("");
    try {
      const result = await authClient.twoFactor.enable({ password: securityPassword, issuer: "AutoFix AI" });
      if (result.error) throw new Error(result.error.message || "Не удалось включить защиту");
      if (!result.data) throw new Error("Сервер не вернул данные настройки");
      setTotpSetup({ uri: result.data.totpURI, codes: result.data.backupCodes });
      setBackupCodes(result.data.backupCodes); setSecurityPassword("");
    } catch (cause) { setSecurityError(cause instanceof Error ? cause.message : "Не удалось включить 2FA"); }
    finally { setSecurityBusy(false); }
  }

  async function confirmTwoFactor() {
    setSecurityBusy(true); setSecurityError("");
    try {
      const result = await authClient.twoFactor.verifyTotp({ code: securityCode.replace(/\D/g, "") });
      if (result.error) throw new Error(result.error.message || "Код не принят");
      setTotpSetup(null); setSecurityCode("");
      await authClient.getSession();
    } catch (cause) { setSecurityError(cause instanceof Error ? cause.message : "Не удалось подтвердить код"); }
    finally { setSecurityBusy(false); }
  }

  async function disableTwoFactor() {
    setSecurityBusy(true); setSecurityError("");
    try {
      const result = await authClient.twoFactor.disable({ password: securityPassword });
      if (result.error) throw new Error(result.error.message || "Не удалось отключить 2FA");
      setSecurityPassword(""); setBackupCodes(null);
      await authClient.getSession();
    } catch (cause) { setSecurityError(cause instanceof Error ? cause.message : "Не удалось отключить 2FA"); }
    finally { setSecurityBusy(false); }
  }

  useEffect(() => {
    let active = true;
    void Promise.all([listCars(), listDiagnoses(), listMaintenance()])
      .then(([carRows, diagnosisRows, maintenanceRows]) => {
        if (!active) return;
        setCars(carRows); setDiagnoses(diagnosisRows); setMaintenance(maintenanceRows);
      })
      .catch((cause: unknown) => { if (active) setError(cause instanceof Error ? cause.message : "Не удалось загрузить кабинет"); })
      .finally(() => { if (active) setReady(true); });
    return () => { active = false; };
  }, []);

  const displayName = user?.displayName || "Владелец AutoFix";
  const initials = displayName.trim().split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
  const cards = [
    { label: "Автомобили", count: cars.length, icon: CarFront, to: "/cars", action: "Открыть гараж" },
    { label: "Диагностики", count: diagnoses.length, icon: Activity, to: "/history", action: "История отчётов" },
    { label: "Записи ТО", count: maintenance.length, icon: CalendarClock, to: "/maintenance", action: "Журнал обслуживания" },
  ] as const;

  return <div className="mx-auto max-w-5xl px-4 py-8 md:py-12">
    <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">Ваш профиль · AutoFix</p>
    <section className="mt-4 flex flex-wrap items-center gap-4 rounded-xl border border-border bg-surface p-5 md:p-7">
      {user?.profileImageUrl ? <img src={user.profileImageUrl} alt="" className="size-16 rounded-full border border-border object-cover" /> : <div className="grid size-16 place-items-center rounded-full border border-border bg-bg font-display text-2xl text-primary">{initials || "A"}</div>}
      <div className="min-w-0 flex-1"><h1 className="font-display text-4xl tracking-tight">Личный кабинет</h1><p className="mt-1 truncate text-sm text-fg">{displayName}</p><p className="mt-1 truncate text-sm text-muted">{user?.primaryEmail || "Email не указан"}</p></div>
      <div className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-xs text-muted"><ShieldCheck className="size-4 text-primary"/> Личные данные аккаунта</div>
    </section>

    {error ? <p role="alert" className="mt-4 rounded-md border border-danger/40 bg-danger/10 p-3 text-sm text-danger">{error}</p> : null}
    <div className="mt-6 grid gap-3 sm:grid-cols-3">
      {cards.map((card) => <Link key={card.label} to={card.to} className="group rounded-xl border border-border bg-surface p-4 transition-colors hover:border-primary/50"><div className="flex items-center justify-between"><span className="grid size-9 place-items-center rounded-lg border border-border bg-bg text-primary"><card.icon className="size-4"/></span><ArrowRight className="size-4 text-muted transition-transform group-hover:translate-x-1 group-hover:text-primary"/></div><p className="mt-4 font-mono text-3xl">{ready ? card.count : "—"}</p><p className="mt-1 text-sm text-muted">{card.label}</p><p className="mt-4 border-t border-border pt-3 text-xs text-primary">{card.action}</p></Link>)}
    </div>

    <div className="mt-8 grid gap-8 md:grid-cols-[1.15fr_.85fr]">
      <section><div className="flex items-center justify-between border-b border-border pb-3"><h2 className="font-display text-2xl">Мой гараж</h2><Link to="/cars" className="text-sm text-primary hover:underline">Управлять →</Link></div>
        {!ready ? <p className="py-5 text-sm text-muted">Загружаем автомобили…</p> : cars.length ? <ul className="divide-y divide-border">{cars.slice(0, 4).map((car) => <li key={car.id} className="flex items-center gap-3 py-4"><CarFront className="size-5 shrink-0 text-primary"/><div className="min-w-0 flex-1"><p className="truncate font-medium">{car.brand} {car.model} <span className="text-muted">{car.year}</span></p><p className="mt-1 text-xs text-muted">{car.mileage.toLocaleString("ru-RU")} км · {car.engineType === "petrol" ? "Бензин" : car.engineType === "diesel" ? "Дизель" : "Гибрид"}</p></div><Link to="/diagnose" className="rounded-md border border-border px-3 py-2 text-xs hover:bg-bg">Диагностика</Link></li>)}</ul> : <div className="py-8 text-center"><CarFront className="mx-auto size-6 text-muted"/><p className="mt-2 text-sm text-muted">Добавьте первый автомобиль — он появится здесь.</p><Link to="/cars" className="mt-3 inline-flex min-h-10 items-center text-sm text-primary hover:underline">Перейти в гараж →</Link></div>}
      </section>
      <section><div className="flex items-center justify-between border-b border-border pb-3"><h2 className="font-display text-2xl">Последняя активность</h2><Link to="/history" className="text-sm text-primary hover:underline">Вся история →</Link></div>
        {!ready ? <p className="py-5 text-sm text-muted">Загружаем…</p> : diagnoses.length || maintenance.length ? <ul className="divide-y divide-border">{[...diagnoses.slice(0, 3).map((row) => ({ key: `d-${row.id}`, title: row.carLabel, detail: `Диагностика · ${new Date(row.createdAt).toLocaleDateString("ru-RU")}`, icon: Activity, to: "/history" as const })), ...maintenance.slice(0, 3).map((row) => ({ key: `m-${row.id}`, title: row.carLabel, detail: `Обслуживание · ${new Date(`${row.serviceDate}T00:00:00`).toLocaleDateString("ru-RU")}`, icon: Wrench, to: "/maintenance" as const }))].slice(0, 5).map((item) => <li key={item.key}><Link to={item.to} className="flex items-center gap-3 py-4"><item.icon className="size-4 shrink-0 text-primary"/><span className="min-w-0 flex-1"><span className="block truncate text-sm font-medium">{item.title}</span><span className="mt-1 block text-xs text-muted">{item.detail}</span></span><ArrowRight className="size-4 text-muted"/></Link></li>)}</ul> : <div className="py-8 text-center"><ClipboardList className="mx-auto size-6 text-muted"/><p className="mt-2 text-sm text-muted">Здесь появятся диагностики и обслуживание.</p></div>}
      </section>
    </div>
    <section className="mt-8 rounded-xl border border-border bg-surface p-5 md:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div><p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted">Безопасность аккаунта</p><h2 className="mt-2 font-display text-2xl">Двухфакторная защита</h2><p className="mt-1 max-w-2xl text-sm leading-6 text-muted">Одноразовый код из приложения-аутентификатора при входе по паролю. Резервные коды помогут восстановить доступ.</p></div>
        <span className={"rounded-full border px-3 py-1.5 text-xs " + (user?.twoFactorEnabled ? "border-primary/50 text-primary" : "border-border text-muted")}>{user?.twoFactorEnabled ? "Включена" : "Выключена"}</span>
      </div>
      {securityError ? <p role="alert" className="mt-4 rounded-md border border-danger/40 bg-danger/10 p-3 text-sm text-danger">{securityError}</p> : null}
      {user?.twoFactorEnabled ? <div className="mt-5 max-w-md"><label className="block text-sm text-muted">Подтвердите пароль для отключения<input type="password" autoComplete="current-password" value={securityPassword} onChange={(e) => setSecurityPassword(e.target.value)} className="mt-1 min-h-11 w-full rounded-md border border-border bg-bg px-3 text-fg"/></label><button type="button" onClick={() => void disableTwoFactor()} disabled={securityBusy || !securityPassword} className="mt-3 min-h-10 rounded-md border border-border px-3 text-sm text-fg hover:bg-bg disabled:opacity-50">{securityBusy ? "Обрабатываем…" : "Отключить двухфакторную защиту"}</button></div> : totpSetup ? <div className="mt-5 max-w-xl rounded-lg border border-border bg-bg p-4">
        <h3 className="font-medium">1. Подключите приложение-аутентификатор</h3><p className="mt-1 text-sm text-muted">Добавьте этот ключ вручную в Google Authenticator, Microsoft Authenticator, 1Password или другое приложение:</p>
        <code className="mt-3 block break-all rounded-md border border-border bg-surface p-3 text-sm text-primary">{new URL(totpSetup.uri).searchParams.get("secret")}</code>
        <p className="mt-4 text-sm font-medium">2. Сохраните резервные коды</p><div className="mt-2 grid grid-cols-2 gap-2 rounded-md border border-border bg-surface p-3 font-mono text-xs">{totpSetup.codes.map((code) => <code key={code}>{code}</code>)}</div>
        <label className="mt-4 block text-sm text-muted">3. Введите код из приложения<input inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={securityCode} onChange={(e) => setSecurityCode(e.target.value)} className="mt-1 min-h-11 w-full rounded-md border border-border bg-surface px-3 font-mono tracking-widest text-fg"/></label>
        <button type="button" onClick={() => void confirmTwoFactor()} disabled={securityBusy || securityCode.replace(/\D/g, "").length !== 6} className="mt-3 min-h-10 rounded-md bg-primary px-4 text-sm font-medium text-bg disabled:opacity-50">{securityBusy ? "Проверяем…" : "Подтвердить и включить"}</button>
      </div> : <div className="mt-5 max-w-md"><label className="block text-sm text-muted">Пароль аккаунта<input type="password" autoComplete="current-password" value={securityPassword} onChange={(e) => setSecurityPassword(e.target.value)} className="mt-1 min-h-11 w-full rounded-md border border-border bg-bg px-3 text-fg"/></label><button type="button" onClick={() => void startTwoFactor()} disabled={securityBusy || !securityPassword} className="mt-3 min-h-10 rounded-md bg-primary px-4 text-sm font-medium text-bg disabled:opacity-50">{securityBusy ? "Создаём настройку…" : "Настроить приложение-аутентификатор"}</button></div>}
      {backupCodes ? <div className="mt-4 max-w-xl rounded-md border border-border p-3 text-xs leading-5 text-muted">Резервные коды показаны только во время настройки. Сохраните их в безопасном месте до завершения подключения.</div> : null}
      <p className="mt-4 text-xs leading-5 text-muted">Проверка 2FA применяется к входу по email и паролю. Google/X проверяют вход у внешнего провайдера и не проходят дополнительную проверку AutoFix.</p>
    </section>
    <div className="mt-4 rounded-lg border border-border p-4 text-xs leading-5 text-muted"><ShieldCheck className="mr-2 inline size-4 text-primary"/>Данные автомобилей, отчёты и записи обслуживания доступны только в вашем аккаунте.</div>
  </div>;
}
