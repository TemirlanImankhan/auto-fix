import { useEffect, useRef, useState, type FormEvent } from "react";
import { Bot, MessageCircle, Send, Sparkles, X } from "lucide-react";

type ChatMessage = { id: number; role: "assistant" | "user"; text: string };

const QUICK_QUESTIONS = [
  "Как начать диагностику?",
  "Как добавить автомобиль?",
  "Как включить 2FA?",
  "Насколько точен результат?",
];

function getAnswer(question: string) {
  const text = question.toLocaleLowerCase("ru-RU").replaceAll("ё", "е");
  if (/привет|здравств|добрый день|доброе утро/.test(text)) {
    return "Здравствуйте! Подскажу, как пользоваться AutoFix. Можно спросить про диагностику, гараж, обслуживание, историю или безопасность аккаунта.";
  }
  if (/точн|достовер|вер|результат|полом|ошибк|симптом|диагност/.test(text)) {
    return "Откройте раздел «Диагностика», выберите машину и отметьте только наблюдаемые симптомы. Результат AutoFix — предварительная гипотеза исследовательского прототипа, а не подтверждённый диагноз. При неисправности проверьте автомобиль у специалиста и считайте ошибки OBD-II.";
  }
  if (/гараж|машин|автомобил|добавить авто/.test(text)) {
    return "В разделе «Автомобили» укажите марку, модель, год, пробег и тип двигателя. Сохранённую машину можно выбрать при создании диагностики.";
  }
  if (/обслуж|то |то$|масл|стоим|расход|сервис|csv|экспорт/.test(text)) {
    return "В разделе «Обслуживание» добавьте работу, дату, пробег и стоимость в тенге. Для каждой записи можно указать следующее ТО по дате или пробегу. Кнопка «Экспорт CSV» выгружает записи с учётом выбранной машины.";
  }
  if (/истори|отчет|отчёт|сохран/.test(text)) {
    return "Результаты диагностики сохраняются в разделе «История» вашего аккаунта. Откройте запись, чтобы посмотреть детали отчёта.";
  }
  if (/2fa|2-фактор|двухфактор|безопас|резервн.*код/.test(text)) {
    return "Откройте «Личный кабинет» и блок «Двухфакторная защита». Подключите приложение-аутентификатор и сохраните резервные коды в надёжном месте.";
  }
  if (/вход|парол|аккаунт|регистрац|почт/.test(text)) {
    return "Войдите или создайте аккаунт через кнопку в верхней панели. Гараж, отчёты и обслуживание привязаны к вашей учётной записи.";
  }
  return "Пока я отвечаю на базовые вопросы по AutoFix. Спросите про диагностику, гараж, обслуживание, историю или защиту аккаунта.";
}

export function AssistantWidget() {
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: 1, role: "assistant", text: "Привет! Я помощник AutoFix. Помогу разобраться с функциями сайта и подскажу, с чего начать." },
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
    setMessages((current) => [
      ...current,
      { id, role: "user", text: question },
      { id: id + 1, role: "assistant", text: getAnswer(question) },
    ]);
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
            <div className="min-w-0 flex-1"><h2 id="autofix-assistant-title" className="text-sm font-semibold">Помощник AutoFix</h2><p className="mt-0.5 flex items-center gap-1.5 text-[11px] text-muted"><Sparkles className="size-3 text-primary"/>Базовые ответы о приложении</p></div>
            <button type="button" onClick={() => setOpen(false)} aria-label="Закрыть помощника" className="grid size-9 place-items-center rounded-lg text-muted transition-colors hover:bg-surface-2 hover:text-fg"><X className="size-4"/></button>
          </header>

          <div className="flex-1 space-y-3 overflow-y-auto p-4" aria-live="polite">
            {messages.map((message) => <div key={message.id} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
              <p className={`max-w-[88%] whitespace-pre-wrap rounded-2xl px-3.5 py-2.5 text-[13px] leading-5 ${message.role === "user" ? "rounded-br-md bg-primary text-primary-fg" : "rounded-bl-md border border-border bg-surface text-fg"}`}>{message.text}</p>
            </div>)}
            {messages.length === 1 ? <div className="pt-2"><p className="mb-2 text-[10px] font-semibold uppercase tracking-[0.13em] text-muted">Популярные вопросы</p><div className="flex flex-wrap gap-2">{QUICK_QUESTIONS.map((question) => <button key={question} type="button" onClick={() => ask(question)} className="rounded-xl border border-border bg-surface px-3 py-2 text-left text-xs text-fg transition-colors hover:border-primary/50 hover:bg-surface-2">{question}</button>)}</div></div> : null}
            <div ref={endRef}/>
          </div>

          <form onSubmit={submit} className="flex items-center gap-2 border-t border-border bg-surface/70 p-3">
            <label className="sr-only" htmlFor="autofix-assistant-question">Ваш вопрос</label>
            <input id="autofix-assistant-question" value={draft} onChange={(event) => setDraft(event.target.value)} maxLength={400} placeholder="Напишите вопрос…" className="min-h-11 min-w-0 flex-1 rounded-xl border border-border bg-bg px-3 text-sm text-fg placeholder:text-muted/70"/>
            <button type="submit" aria-label="Отправить вопрос" disabled={!draft.trim()} className="grid size-11 shrink-0 place-items-center rounded-xl bg-primary text-primary-fg transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40"><Send className="size-4"/></button>
          </form>
          <p className="border-t border-border/70 px-3 py-2 text-center text-[10px] text-muted">Справочные ответы работают без внешнего ИИ-сервиса</p>
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
