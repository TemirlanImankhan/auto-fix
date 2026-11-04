import { useEffect, useRef, useState, type FormEvent } from "react";
import { Bot, MessageCircle, Send, Sparkles, X } from "lucide-react";

type SourceLink = { label: string; href: string };
type ChatMessage = { id: number; role: "assistant" | "user"; text: string; source?: SourceLink };

const QUICK_QUESTIONS = [
  "Как добавить машину?",
  "Горит Check Engine",
  "Что делать при перегреве?",
  "Как включить 2FA?",
];

function getAnswer(question: string) {
  const text = question.toLocaleLowerCase("ru-RU").replaceAll("ё", "е");
  if (/привет|здравств|добрый день|доброе утро/.test(text)) {
    return { text: "Здравствуйте! Подскажу про функции AutoFix и базовые действия при типичных вопросах об автомобиле. Напишите, что случилось или какой раздел хотите найти." };
  }
  if (/перегрев|закип|кипит|антифриз|температур.*(красн|высок)|пар.*капот/.test(text)) {
    return { text: "Если температура в красной зоне или появился пар, остановитесь в безопасном месте и выключите двигатель. Не открывайте крышку системы охлаждения, пока двигатель горячий. Дайте ему остыть и сверьтесь с руководством именно вашей модели; если предупреждение повторяется — обратитесь в сервис.", source: { label: "Руководство владельца: перегрев двигателя", href: "https://static.nhtsa.gov/odi/inv/2024/INRD-PE24023-27810.pdf" } };
  }
  if (/давлен.*масл|ламп.*масл|масло.*ламп|горит.*масл|масл.*горит/.test(text)) {
    return { text: "Если горит красный индикатор давления масла, безопасно остановитесь и выключите двигатель. Не продолжайте поездку: при низком давлении двигатель может быстро повредиться. Проверьте инструкцию автомобиля и вызовите помощь или сервис.", source: { label: "NHTSA: предупреждение о давлении масла", href: "https://www.nhtsa.gov/interpretations/nht92-94" } };
  }
  if (/тормоз.*(горит|ламп|плохо|слаб)|педал.*тормоз|тормозная жидкост|не тормоз/.test(text)) {
    return { text: "Если торможение стало слабее, педаль изменилась или предупреждение тормозной системы не гаснет, остановитесь в безопасном месте и не продолжайте движение до проверки. Значение индикатора зависит от модели — сверьтесь с руководством автомобиля." };
  }
  if (/check\s?engine|чек(?!лист)|obd|ошибк.*двигател|двигател.*ошибк/.test(text)) {
    return { text: "Считайте код ошибки OBD-II и запишите его вместе с симптомами. Код помогает сузить поиск, но сам по себе не всегда указывает на деталь, которую нужно заменить. Если индикатор мигает, двигатель сильно трясёт, пропала мощность или загорелось красное предупреждение — остановитесь безопасно и обратитесь в сервис." };
  }
  if (/давлен.*шин|шина.*спуст|колес.*спуст|tpms|давлен.*колес/.test(text)) {
    return { text: "Снизьте скорость без резких манёвров и остановитесь там, где это безопасно. Проверьте давление на холодных шинах и сравните с табличкой автомобиля или руководством. При спущенной шине, порезе или вздутии не продолжайте поездку.", source: { label: "NHTSA: безопасность шин и TPMS", href: "https://www.nhtsa.gov/vehicle-safety/tires" } };
  }
  if (/точн|достовер|вероят|результат|полом|симптом|диагност/.test(text)) {
    return { text: "Чтобы получить отчёт, откройте «Диагностика», выберите автомобиль и отметьте наблюдаемые симптомы. Результат AutoFix — предварительная оценка по введённым данным; она не подтверждает поломку и не заменяет диагностику специалиста или чтение кодов OBD-II." };
  }
  if (/гараж|машин|автомобил|добавить авто/.test(text)) {
    return { text: "В разделе «Автомобили» добавьте марку, модель, год, пробег и тип двигателя. Затем выберите эту машину в форме диагностики или привяжите к ней записи обслуживания." };
  }
  if (/обслуж|то |то$|масл|стоим|расход|сервис|csv|экспорт/.test(text)) {
    return { text: "В разделе «Обслуживание» добавьте работу, дату, пробег и стоимость в тенге. Можно указать следующий срок или пробег ТО, посмотреть расходы по выбранной машине и скачать записи кнопкой «Экспорт CSV»." };
  }
  if (/истори|отчет|отчёт|сохран/.test(text)) {
    return { text: "Сохранённые отчёты диагностики находятся в разделе «История». Откройте запись, чтобы посмотреть введённые симптомы и результат." };
  }
  if (/2fa|2-фактор|двухфактор|безопас|резервн.*код/.test(text)) {
    return { text: "В «Личном кабинете» откройте блок «Двухфакторная защита», подключите приложение-аутентификатор и сохраните резервные коды отдельно от телефона." };
  }
  if (/вход|парол|аккаунт|регистрац|почт/.test(text)) {
    return { text: "Войдите или создайте аккаунт через кнопку в верхней панели. Гараж, отчёты и обслуживание доступны в рамках вашей учётной записи." };
  }
  if (/grok|внешн.*ии|передает.*данн|передаёт.*данн/.test(text)) {
    return { text: "Этот справочный помощник работает по встроенному набору ответов и не отправляет вопрос во внешний AI-сервис. Переписка не сохраняется после закрытия или перезагрузки страницы." };
  }
  return { text: "Пока я отвечаю на базовые вопросы по AutoFix и простые вопросы о предупреждениях автомобиля. Спросите про Check Engine, перегрев, шины, гараж, обслуживание, историю или 2FA." };
}

export function AssistantWidget() {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 1, role: "assistant", text: "Привет! Я помощник AutoFix. Подскажу, как пользоваться приложением, и дам базовую справку по типичным вопросам об автомобиле." },
  ]);
  const endRef = useRef<HTMLDivElement>(null);
  const nextMessageId = useRef(2);

  useEffect(() => {
    if (open) endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages, open]);

  useEffect(() => {
    if (!open) return;
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [open]);

  function ask(rawQuestion: string) {
    const question = rawQuestion.trim();
    if (!question) return;
    const id = nextMessageId.current;
    nextMessageId.current += 2;
    const answer = getAnswer(question);
    setMessages((current) => [
      ...current,
      { id, role: "user" as const, text: question },
      { id: id + 1, role: "assistant" as const, ...answer },
    ].slice(-60));
    setDraft("");
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    ask(draft);
  }

  return (
    <div className="fixed bottom-4 right-4 z-[60] sm:bottom-6 sm:right-6">
      {open ? (
        <section role="dialog" aria-modal="false" aria-labelledby="autofix-assistant-title" className="autofix-panel flex h-[min(620px,calc(100dvh-6rem))] w-[min(390px,calc(100vw-2rem))] flex-col overflow-hidden rounded-2xl border-border bg-bg shadow-[0_24px_90px_rgb(0_0_0_/_55%)]">
          <header className="flex items-center gap-3 border-b border-border bg-surface/95 px-4 py-3.5">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary text-primary-fg"><Bot className="size-5"/></span>
            <div className="min-w-0 flex-1"><h2 id="autofix-assistant-title" className="text-sm font-semibold">Помощник AutoFix</h2><p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-muted"><Sparkles className="size-3 text-primary"/>Приложение · базовая авто-справка</p></div>
            <button type="button" onClick={() => setOpen(false)} aria-label="Закрыть помощника" className="grid size-9 place-items-center rounded-lg text-muted transition-colors hover:bg-surface-2 hover:text-fg"><X className="size-4"/></button>
          </header>

          <div className="flex-1 space-y-3 overflow-y-auto p-4" aria-live="polite">
            {messages.map((message) => <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[88%] rounded-2xl px-3.5 py-2.5 text-[13px] leading-5 ${message.role === "user" ? "rounded-br-md bg-primary text-primary-fg" : "rounded-bl-md border border-border bg-surface text-fg"}`}><p className="whitespace-pre-wrap">{message.text}</p>{message.source ? <a href={message.source.href} target="_blank" rel="noreferrer" className="mt-2 inline-block border-t border-border/70 pt-2 text-[11px] text-primary underline underline-offset-2">Источник: {message.source.label}</a> : null}</div>
            </div>)}
            {messages.length === 1 ? <div className="pt-2"><p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.13em] text-muted">Популярные вопросы</p><div className="flex flex-wrap gap-2">{QUICK_QUESTIONS.map((question) => <button key={question} type="button" onClick={() => ask(question)} className="rounded-xl border border-border bg-surface px-3 py-2 text-left text-xs text-fg transition-colors hover:border-primary/50 hover:bg-surface-2">{question}</button>)}</div></div> : null}
            <div ref={endRef}/>
          </div>

          <form onSubmit={submit} className="flex items-center gap-2 border-t border-border bg-surface/70 p-3">
            <label className="sr-only" htmlFor="autofix-assistant-question">Ваш вопрос</label>
            <input id="autofix-assistant-question" value={draft} onChange={(event) => setDraft(event.target.value)} maxLength={400} placeholder="Напишите вопрос…" className="min-h-11 min-w-0 flex-1 rounded-xl border border-border bg-bg px-3 text-sm text-fg placeholder:text-muted/70"/>
            <button type="submit" aria-label="Отправить вопрос" disabled={!draft.trim()} className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary text-primary-fg transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"><Send className="size-4"/></button>
          </form>
          <p className="border-t border-border/70 px-3 py-2 text-center text-[10px] text-muted">Справка не заменяет руководство автомобиля или осмотр механика</p>
        </section>
      ) : (
        <button type="button" onClick={() => setOpen(true)} aria-label="Открыть помощника AutoFix" className="group flex min-h-14 items-center gap-3 rounded-full border border-primary/30 bg-primary px-5 text-primary-fg shadow-[0_12px_38px_rgb(0_0_0_/_36%),0_0_34px_rgb(198_243_107_/_14%)] transition-all hover:-translate-y-0.5 hover:bg-primary/95">
          <span className="grid size-8 place-items-center rounded-full bg-primary-fg/10"><MessageCircle className="size-4"/></span>
          <span className="text-left"><span className="block text-sm font-semibold">Есть вопрос?</span><span className="block text-[10px] opacity-75">Помощник AutoFix</span></span>
        </button>
      )}
    </div>
  );
}
