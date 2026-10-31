export const ENGINE_TYPES = [
  { id: "petrol", label: "Бензин" },
  { id: "diesel", label: "Дизель" },
  { id: "hybrid", label: "Гибрид" },
] as const;

export const BRANDS = [
  "Toyota",
  "Hyundai",
  "Kia",
  "Volkswagen",
  "Lada",
  "BMW",
  "Mercedes-Benz",
  "Chevrolet",
  "Nissan",
  "Geely",
] as const;

export const FAULTS = [
  {
    id: "battery",
    label: "Аккумулятор и система запуска",
    short: "Запуск / АКБ",
    recommendation:
      "Проверьте напряжение аккумулятора, клеммы и работу стартера. При повторных отказах запуска обратитесь в сервис — не ограничивайтесь «прикурить».",
  },
  {
    id: "ignition",
    label: "Система зажигания",
    short: "Зажигание",
    recommendation:
      "Рекомендуется диагностика свечей, катушек зажигания и связанных датчиков. Особенно при Check Engine и нестабильном запуске.",
  },
  {
    id: "fuel",
    label: "Топливная система",
    short: "Топливо",
    recommendation:
      "Стоит проверить давление топлива, насос, фильтр и форсунки. Повышенный расход и трудный запуск часто связаны именно с этой системой.",
  },
  {
    id: "cooling",
    label: "Система охлаждения",
    short: "Охлаждение",
    recommendation:
      "При перегреве не продолжайте движение на высоких оборотах. Проверьте уровень охлаждающей жидкости, радиатор, термостат и помпу.",
  },
  {
    id: "engine",
    label: "Механика двигателя",
    short: "Двигатель",
    recommendation:
      "Вибрация и шум при большом пробеге могут указывать на опоры, зажигание или износ ЦПГ. Нужна профессиональная диагностика, не только сброс ошибок.",
  },
  {
    id: "brakes",
    label: "Тормозная система",
    short: "Тормоза",
    recommendation:
      "Проблемы с тормозами критичны для безопасности. Проверьте колодки, диски, жидкость и датчики ABS у специалиста как можно скорее.",
  },
  {
    id: "sensors",
    label: "Датчики и электроника",
    short: "Датчики",
    recommendation:
      "Индикатор Check Engine часто связан с датчиками кислорода, массового расхода воздуха или положения коленвала. Считайте коды OBD-II в сервисе.",
  },
  {
    id: "exhaust",
    label: "Выхлоп и нейтрализатор",
    short: "Выхлоп",
    recommendation:
      "Повышенный расход и Check Engine при нормальном запуске могут указывать на катализатор или лямбда-зонды. Требуется проверка выхлопного тракта.",
  },
] as const;

export type FaultId = (typeof FAULTS)[number]["id"];
export type EngineType = (typeof ENGINE_TYPES)[number]["id"];

export const SYMPTOMS = [
  { id: "startingProblem", label: "Трудный запуск", hint: "Двигатель долго крутит или не схватывает" },
  { id: "vibration", label: "Вибрация", hint: "Тряска на холостых или при разгоне" },
  { id: "noise", label: "Посторонний шум", hint: "Стук, свист, гул из моторного отсека" },
  { id: "overheating", label: "Перегрев", hint: "Стрелка температуры выше нормы" },
  { id: "checkEngine", label: "Check Engine", hint: "Горит индикатор неисправности" },
  { id: "brakeProblem", label: "Проблема тормозов", hint: "Скрип, мягкая педаль, увод" },
  { id: "fuelHigh", label: "Повышенный расход", hint: "Топлива уходит заметно больше обычного" },
] as const;

export type SymptomId = (typeof SYMPTOMS)[number]["id"];

export type CarInput = {
  brand: string;
  model: string;
  year: number;
  mileage: number;
  engineType: EngineType;
};

export type SymptomMap = Record<SymptomId, boolean>;

export type DiagnosisInput = CarInput & SymptomMap;

export function faultById(id: string) {
  return FAULTS.find((f) => f.id === id) ?? FAULTS[6];
}

export function faultIndex(id: string) {
  const i = FAULTS.findIndex((f) => f.id === id);
  return i >= 0 ? i : 6;
}
