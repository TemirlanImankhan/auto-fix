import { BRANDS, ENGINE_TYPES, FAULTS, type DiagnosisInput, type EngineType, type FaultId } from "./taxonomy";
import { encodeInput } from "./features";
import { bernoulli, choice, clamp, mulberry32 } from "./rng";

export type Sample = { x: number[]; y: number; raw: DiagnosisInput; fault: FaultId };

const SYMPTOM_PROFILES: Record<FaultId, Record<string, number>> = {
  battery: {
    startingProblem: 0.95,
    vibration: 0.08,
    noise: 0.06,
    overheating: 0.02,
    checkEngine: 0.1,
    brakeProblem: 0.02,
    fuelHigh: 0.05,
  },
  ignition: {
    startingProblem: 0.8,
    vibration: 0.48,
    noise: 0.18,
    overheating: 0.05,
    checkEngine: 0.88,
    brakeProblem: 0.02,
    fuelHigh: 0.22,
  },
  fuel: {
    startingProblem: 0.62,
    vibration: 0.18,
    noise: 0.1,
    overheating: 0.06,
    checkEngine: 0.42,
    brakeProblem: 0.02,
    fuelHigh: 0.92,
  },
  cooling: {
    startingProblem: 0.08,
    vibration: 0.12,
    noise: 0.14,
    overheating: 0.96,
    checkEngine: 0.28,
    brakeProblem: 0.02,
    fuelHigh: 0.12,
  },
  engine: {
    startingProblem: 0.12,
    vibration: 0.92,
    noise: 0.88,
    overheating: 0.22,
    checkEngine: 0.28,
    brakeProblem: 0.04,
    fuelHigh: 0.22,
  },
  brakes: {
    startingProblem: 0.03,
    vibration: 0.22,
    noise: 0.42,
    overheating: 0.03,
    checkEngine: 0.06,
    brakeProblem: 0.97,
    fuelHigh: 0.04,
  },
  sensors: {
    startingProblem: 0.18,
    vibration: 0.12,
    noise: 0.08,
    overheating: 0.08,
    checkEngine: 0.96,
    brakeProblem: 0.03,
    fuelHigh: 0.18,
  },
  exhaust: {
    startingProblem: 0.08,
    vibration: 0.1,
    noise: 0.16,
    overheating: 0.06,
    checkEngine: 0.78,
    brakeProblem: 0.02,
    fuelHigh: 0.88,
  },
};

export function generateDataset(n = 900, seed = 2026): Sample[] {
  const rand = mulberry32(seed);
  const samples: Sample[] = [];
  for (let i = 0; i < n; i++) {
    const y = Math.floor(rand() * FAULTS.length);
    const fault = FAULTS[y].id;
    const brand = choice(rand, BRANDS);
    const engineType = choice(rand, ENGINE_TYPES).id as EngineType;
    const year = 2004 + Math.floor(rand() * 22);
    const baseMileage = (2026 - year) * (9000 + rand() * 14000);
    const mileage = Math.round(clamp(baseMileage + (rand() - 0.5) * 40000, 8000, 380000));
    const profile = SYMPTOM_PROFILES[fault];
    const raw: DiagnosisInput = {
      brand,
      model: "Demo",
      year,
      mileage,
      engineType,
      startingProblem: bernoulli(rand, profile.startingProblem),
      vibration: bernoulli(rand, profile.vibration),
      noise: bernoulli(rand, profile.noise),
      overheating: bernoulli(rand, profile.overheating),
      checkEngine: bernoulli(rand, profile.checkEngine),
      brakeProblem: bernoulli(rand, profile.brakeProblem),
      fuelHigh: bernoulli(rand, profile.fuelHigh),
    };
    let label = y;
    if (rand() < 0.06) label = Math.floor(rand() * FAULTS.length);
    samples.push({ x: encodeInput(raw), y: label, raw, fault: FAULTS[label].id });
  }
  return samples;
}

export function splitDataset(samples: Sample[], testRatio = 0.2, seed = 7) {
  const rand = mulberry32(seed);
  const shuffled = [...samples];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    const tmp = shuffled[i];
    shuffled[i] = shuffled[j];
    shuffled[j] = tmp;
  }
  const cut = Math.floor(shuffled.length * (1 - testRatio));
  return { train: shuffled.slice(0, cut), test: shuffled.slice(cut) };
}
