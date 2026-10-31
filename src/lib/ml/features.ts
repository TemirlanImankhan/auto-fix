import type { DiagnosisInput, EngineType } from "./taxonomy";
import { BRANDS } from "./taxonomy";

export const FEATURE_NAMES = [
  "age",
  "mileage",
  "diesel",
  "hybrid",
  "brandJp",
  "brandEu",
  "brandRu",
  "startingProblem",
  "vibration",
  "noise",
  "overheating",
  "checkEngine",
  "brakeProblem",
  "fuelHigh",
] as const;

export const FEATURE_LABELS: Record<(typeof FEATURE_NAMES)[number], string> = {
  age: "Возраст авто",
  mileage: "Пробег",
  diesel: "Дизель",
  hybrid: "Гибрид",
  brandJp: "Японский бренд",
  brandEu: "Европейский бренд",
  brandRu: "Российский бренд",
  startingProblem: "Трудный запуск",
  vibration: "Вибрация",
  noise: "Шум",
  overheating: "Перегрев",
  checkEngine: "Check Engine",
  brakeProblem: "Тормоза",
  fuelHigh: "Расход топлива",
};

const JP = new Set(["Toyota", "Nissan", "Hyundai", "Kia"]);
const EU = new Set(["Volkswagen", "BMW", "Mercedes-Benz"]);
const RU = new Set(["Lada"]);

export function encodeInput(input: DiagnosisInput, now = 2026): number[] {
  const age = Math.min(1, Math.max(0, (now - input.year) / 25));
  const mileage = Math.min(1, Math.max(0, input.mileage / 350000));
  const diesel = input.engineType === "diesel" ? 1 : 0;
  const hybrid = input.engineType === "hybrid" ? 1 : 0;
  const brandJp = JP.has(input.brand) ? 1 : 0;
  const brandEu = EU.has(input.brand) ? 1 : 0;
  const brandRu = RU.has(input.brand) ? 1 : 0;
  return [
    age,
    mileage,
    diesel,
    hybrid,
    brandJp,
    brandEu,
    brandRu,
    input.startingProblem ? 1 : 0,
    input.vibration ? 1 : 0,
    input.noise ? 1 : 0,
    input.overheating ? 1 : 0,
    input.checkEngine ? 1 : 0,
    input.brakeProblem ? 1 : 0,
    input.fuelHigh ? 1 : 0,
  ];
}

export function engineFromBits(diesel: number, hybrid: number): EngineType {
  if (hybrid > 0.5) return "hybrid";
  if (diesel > 0.5) return "diesel";
  return "petrol";
}

export { BRANDS };
