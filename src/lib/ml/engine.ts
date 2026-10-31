import { FAULTS, faultById, type DiagnosisInput, type FaultId } from "./taxonomy";
import { encodeInput, FEATURE_LABELS, FEATURE_NAMES } from "./features";
import { generateDataset, splitDataset, type Sample } from "./dataset";
import {
  featureImportance,
  predictForest,
  predictLogReg,
  predictRules,
  predictTree,
  trainDecisionTree,
  trainLogReg,
  trainRandomForest,
  type Forest,
  type LogReg,
  type TreeNode,
} from "./models";

export type Metrics = {
  accuracy: number;
  precision: number;
  recall: number;
  f1: number;
};

export type ModelName = "Logistic Regression" | "Decision Tree" | "Random Forest" | "Rule-Based";

export type ExperimentResult = {
  nTrain: number;
  nTest: number;
  rows: { model: ModelName; metrics: Metrics }[];
  importance: { name: string; label: string; value: number }[];
  winner: ModelName;
};

export type RankedFault = {
  id: FaultId;
  label: string;
  short: string;
  probability: number;
  recommendation: string;
};

export type DiagnosisResult = {
  input: DiagnosisInput;
  winner: RankedFault;
  ranking: RankedFault[];
  models: { model: ModelName; fault: string; probability: number }[];
  agreement: boolean;
};

function metricsFrom(yTrue: number[], yPred: number[]): Metrics {
  const k = FAULTS.length;
  let correct = 0;
  const tp = Array(k).fill(0);
  const fp = Array(k).fill(0);
  const fn = Array(k).fill(0);
  for (let i = 0; i < yTrue.length; i++) {
    if (yTrue[i] === yPred[i]) correct += 1;
    for (let c = 0; c < k; c++) {
      if (yPred[i] === c && yTrue[i] === c) tp[c] += 1;
      else if (yPred[i] === c && yTrue[i] !== c) fp[c] += 1;
      else if (yPred[i] !== c && yTrue[i] === c) fn[c] += 1;
    }
  }
  const prec: number[] = [];
  const rec: number[] = [];
  for (let c = 0; c < k; c++) {
    prec.push(tp[c] + fp[c] ? tp[c] / (tp[c] + fp[c]) : 0);
    rec.push(tp[c] + fn[c] ? tp[c] / (tp[c] + fn[c]) : 0);
  }
  const precision = prec.reduce((a, b) => a + b, 0) / k;
  const recall = rec.reduce((a, b) => a + b, 0) / k;
  const f1 = precision + recall ? (2 * precision * recall) / (precision + recall) : 0;
  return { accuracy: correct / yTrue.length, precision, recall, f1 };
}

type Bundle = {
  tree: TreeNode;
  forest: Forest;
  logreg: LogReg;
  experiment: ExperimentResult;
};

let bundle: Bundle | null = null;

function evalModel(test: Sample[], pred: (s: Sample) => number): Metrics {
  return metricsFrom(
    test.map((s) => s.y),
    test.map(pred),
  );
}

export function getBundle(): Bundle {
  if (bundle) return bundle;
  const data = generateDataset(960, 2026);
  const { train, test } = splitDataset(data, 0.2, 9);
  const tree = trainDecisionTree(train, 8, 2);
  const forest = trainRandomForest(train, 21, 7, 11);
  const logreg = trainLogReg(train, 80, 0.28, 4);
  const rows: ExperimentResult["rows"] = [
    { model: "Logistic Regression", metrics: evalModel(test, (s) => predictLogReg(logreg, s.x).cls) },
    { model: "Decision Tree", metrics: evalModel(test, (s) => predictTree(tree, s.x).cls) },
    { model: "Random Forest", metrics: evalModel(test, (s) => predictForest(forest, s.x).cls) },
    { model: "Rule-Based", metrics: evalModel(test, (s) => predictRules(s.raw).cls) },
  ];
  const winner = [...rows].sort((a, b) => b.metrics.f1 - a.metrics.f1)[0].model;
  const importance = featureImportance(forest)
    .map((x) => ({
      name: x.name,
      label: FEATURE_LABELS[x.name as (typeof FEATURE_NAMES)[number]] ?? x.name,
      value: x.value,
    }))
    .sort((a, b) => b.value - a.value);
  bundle = {
    tree,
    forest,
    logreg,
    experiment: { nTrain: train.length, nTest: test.length, rows, importance, winner },
  };
  return bundle;
}

function rankedFromDist(dist: number[]): RankedFault[] {
  return dist
    .map((probability, i) => ({
      id: FAULTS[i].id,
      label: FAULTS[i].label,
      short: FAULTS[i].short,
      probability,
      recommendation: FAULTS[i].recommendation,
    }))
    .sort((a, b) => b.probability - a.probability);
}

export function diagnose(input: DiagnosisInput): DiagnosisResult {
  const { tree, forest, logreg } = getBundle();
  const x = encodeInput(input);
  const rf = predictForest(forest, x);
  const dt = predictTree(tree, x);
  const lr = predictLogReg(logreg, x);
  const rules = predictRules(input);
  const ranking = rankedFromDist(rf.dist);
  const models: DiagnosisResult["models"] = [
    { model: "Random Forest", fault: faultById(FAULTS[rf.cls].id).label, probability: rf.dist[rf.cls] },
    { model: "Decision Tree", fault: faultById(FAULTS[dt.cls].id).label, probability: dt.dist[dt.cls] },
    { model: "Logistic Regression", fault: faultById(FAULTS[lr.cls].id).label, probability: lr.dist[lr.cls] },
    { model: "Rule-Based", fault: faultById(FAULTS[rules.cls].id).label, probability: rules.dist[rules.cls] },
  ];
  return {
    input,
    winner: ranking[0],
    ranking,
    models,
    agreement: rf.cls === rules.cls,
  };
}

export function pct(n: number) {
  return `${Math.round(n * 1000) / 10}%`;
}
