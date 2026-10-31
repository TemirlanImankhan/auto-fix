import type { RankedFault } from "./engine";

/** Build a repeatable, offline explanation for a model prediction. */
export function explainDiagnosis(winner: RankedFault, symptoms: string[]): string {
  const confidence =
    winner.probability >= 0.7
      ? "Для введённых данных модель оценивает этот вариант как наиболее вероятный."
      : winner.probability >= 0.4
        ? "Оценка умеренная: возможны и другие причины неисправности."
        : "Оценка невысокая, поэтому результат особенно важно перепроверить.";
  const symptomText = symptoms.length
    ? `При оценке учтены отмеченные признаки: ${symptoms.join(", ")}.`
    : "Симптомы не отмечены, поэтому оценка основана только на характеристиках автомобиля.";

  return `${symptomText} Модель отнесла результат к категории «${winner.label}» с оценкой ${(winner.probability * 100).toFixed(0)}%. ${confidence} Это статистическая оценка прототипа, а не подтверждённый диагноз. ${winner.recommendation}`;
}
