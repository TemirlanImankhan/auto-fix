import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/about")({ component: AboutPage });
function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-8 md:py-10">
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted">AutoFix AI · о проекте</p>
      <h1 className="mt-2 font-display text-4xl tracking-tight">Система предварительной диагностики автомобиля</h1>
      <p className="mt-4 leading-7 text-muted">AutoFix AI — веб-прототип для исследования того, как методы классификации могут ранжировать возможные неисправности по параметрам автомобиля и отмеченным симптомам.</p>
      <h2 className="mt-8 font-display text-2xl">Что доступно</h2>
      <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-muted"><li>Регистрация и вход по email и паролю.</li><li>Приватный гараж автомобилей с добавлением, редактированием и удалением записей.</li><li>Диагностическая анкета, результаты, локальное объяснение и личная история.</li><li>Серверные запросы проверяют сессию и привязывают данные к вошедшему пользователю.</li></ul>
      <h2 className="mt-8 font-display text-2xl">Научное ограничение</h2>
      <p className="mt-3 text-sm leading-6 text-muted">Текущая версия использует демонстрационный синтетический набор данных и не была валидирована на реальных сервисных записях. Значения в сравнении моделей не следует выдавать за реальные результаты испытаний. Для дипломной версии нужны открытый размеченный датасет, фиксированное разделение train/test и воспроизводимые метрики по классам.</p>
      <Link to="/research" className="mt-6 inline-flex min-h-11 items-center text-sm text-primary hover:underline">Методика и ограничения →</Link>
    </div>
  );
}
