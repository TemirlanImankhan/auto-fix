import { FAULTS } from "./taxonomy";
import { FEATURE_NAMES } from "./features";
import type { Sample } from "./dataset";
import { mulberry32 } from "./rng";
import type { DiagnosisInput } from "./taxonomy";

export type TreeNode =
  | { leaf: true; cls: number; dist: number[] }
  | { leaf: false; feat: number; thresh: number; left: TreeNode; right: TreeNode };

export type Forest = { trees: TreeNode[] };
export type LogReg = { weights: number[][]; bias: number[] };

function classDist(ys: number[], k = FAULTS.length) {
  const dist = Array(k).fill(0);
  for (const y of ys) dist[y] += 1;
  const n = ys.length || 1;
  return dist.map((c) => c / n);
}

function majority(dist: number[]) {
  let best = 0;
  for (let i = 1; i < dist.length; i++) if (dist[i] > dist[best]) best = i;
  return best;
}

function gini(ys: number[]) {
  const dist = classDist(ys);
  let s = 1;
  for (const p of dist) s -= p * p;
  return s;
}

function bestSplit(samples: Sample[], featIdx: number[]): { feat: number; thresh: number; gain: number } | null {
  const parent = gini(samples.map((s) => s.y));
  let best: { feat: number; thresh: number; gain: number } | null = null;
  for (const f of featIdx) {
    const vals = [...new Set(samples.map((s) => s.x[f]))].sort((a, b) => a - b);
    if (vals.length < 2) continue;
    const candidates =
      vals.length > 8
        ? Array.from({ length: 7 }, (_, i) => vals[Math.floor(((i + 1) * vals.length) / 8)])
        : vals.slice(0, -1).map((v, i) => (v + vals[i + 1]) / 2);
    for (const thresh of candidates) {
      const left: number[] = [];
      const right: number[] = [];
      for (const s of samples) (s.x[f] <= thresh ? left : right).push(s.y);
      if (left.length < 4 || right.length < 4) continue;
      const gain =
        parent - (left.length / samples.length) * gini(left) - (right.length / samples.length) * gini(right);
      if (!best || gain > best.gain) best = { feat: f, thresh, gain };
    }
  }
  return best && best.gain > 1e-4 ? best : null;
}

function buildTree(
  samples: Sample[],
  depth: number,
  maxDepth: number,
  rand: () => number,
  randomFeat: boolean,
): TreeNode {
  const dist = classDist(samples.map((s) => s.y));
  const cls = majority(dist);
  if (depth >= maxDepth || samples.length < 8 || dist[cls] > 0.94) {
    return { leaf: true, cls, dist };
  }
  const nFeat = FEATURE_NAMES.length;
  const featIdx = randomFeat
    ? (() => {
        const idx = [...Array(nFeat).keys()];
        for (let i = idx.length - 1; i > 0; i--) {
          const j = Math.floor(rand() * (i + 1));
          const t = idx[i];
          idx[i] = idx[j];
          idx[j] = t;
        }
        return idx.slice(0, Math.max(4, Math.floor(Math.sqrt(nFeat) + 1)));
      })()
    : [...Array(nFeat).keys()];
  const split = bestSplit(samples, featIdx);
  if (!split) return { leaf: true, cls, dist };
  const left = samples.filter((s) => s.x[split.feat] <= split.thresh);
  const right = samples.filter((s) => s.x[split.feat] > split.thresh);
  if (left.length === 0 || right.length === 0) return { leaf: true, cls, dist };
  return {
    leaf: false,
    feat: split.feat,
    thresh: split.thresh,
    left: buildTree(left, depth + 1, maxDepth, rand, randomFeat),
    right: buildTree(right, depth + 1, maxDepth, rand, randomFeat),
  };
}

export function trainDecisionTree(train: Sample[], maxDepth = 7, seed = 1): TreeNode {
  return buildTree(train, 0, maxDepth, mulberry32(seed), false);
}

export function trainRandomForest(train: Sample[], nTrees = 17, maxDepth = 6, seed = 11): Forest {
  const rand = mulberry32(seed);
  const trees: TreeNode[] = [];
  for (let t = 0; t < nTrees; t++) {
    const bag: Sample[] = [];
    for (let i = 0; i < train.length; i++) bag.push(train[Math.floor(rand() * train.length)]);
    trees.push(buildTree(bag, 0, maxDepth, rand, true));
  }
  return { trees };
}

function walkTree(node: TreeNode, x: number[]): number[] {
  if (node.leaf) return node.dist;
  return x[node.feat] <= node.thresh ? walkTree(node.left, x) : walkTree(node.right, x);
}

export function predictTree(node: TreeNode, x: number[]) {
  const dist = walkTree(node, x);
  return { cls: majority(dist), dist };
}

export function predictForest(forest: Forest, x: number[]) {
  const acc = Array(FAULTS.length).fill(0);
  for (const tree of forest.trees) {
    const dist = walkTree(tree, x);
    for (let i = 0; i < acc.length; i++) acc[i] += dist[i];
  }
  const n = forest.trees.length;
  const dist = acc.map((v) => v / n);
  return { cls: majority(dist), dist };
}

function sigmoid(z: number) {
  if (z < -20) return 0;
  if (z > 20) return 1;
  return 1 / (1 + Math.exp(-z));
}

export function trainLogReg(train: Sample[], epochs = 70, lr = 0.35, seed = 3): LogReg {
  const k = FAULTS.length;
  const d = FEATURE_NAMES.length;
  const rand = mulberry32(seed);
  const weights = Array.from({ length: k }, () => Array.from({ length: d }, () => (rand() - 0.5) * 0.08));
  const bias = Array(k).fill(0);
  for (let e = 0; e < epochs; e++) {
    for (let c = 0; c < k; c++) {
      const gw = Array(d).fill(0);
      let gb = 0;
      for (const s of train) {
        let z = bias[c];
        for (let j = 0; j < d; j++) z += weights[c][j] * s.x[j];
        const p = sigmoid(z);
        const y = s.y === c ? 1 : 0;
        const err = p - y;
        gb += err;
        for (let j = 0; j < d; j++) gw[j] += err * s.x[j];
      }
      const n = train.length;
      bias[c] -= (lr * gb) / n;
      for (let j = 0; j < d; j++) weights[c][j] -= (lr * (gw[j] / n + 0.01 * weights[c][j]));
    }
  }
  return { weights, bias };
}

export function predictLogReg(model: LogReg, x: number[]) {
  const scores = model.weights.map((w, c) => {
    let z = model.bias[c];
    for (let j = 0; j < w.length; j++) z += w[j] * x[j];
    return sigmoid(z);
  });
  const sum = scores.reduce((a, b) => a + b, 0) || 1;
  const dist = scores.map((s) => s / sum);
  return { cls: majority(dist), dist };
}

export function predictRules(input: DiagnosisInput) {
  const dist = Array(FAULTS.length).fill(0.04);
  const set = (id: string, v: number) => {
    dist[FAULTS.findIndex((f) => f.id === id)] += v;
  };
  if (input.overheating) set("cooling", 0.72);
  if (input.brakeProblem) set("brakes", 0.8);
  if (input.startingProblem && !input.checkEngine) set("battery", 0.55);
  if (input.startingProblem && input.checkEngine) set("ignition", 0.48);
  if (input.vibration && input.noise) set("engine", 0.5);
  if (input.checkEngine && input.fuelHigh) set("exhaust", 0.28);
  if (input.checkEngine && input.fuelHigh) set("sensors", 0.22);
  if (input.checkEngine && !input.overheating && !input.brakeProblem) set("sensors", 0.2);
  if (input.startingProblem && input.fuelHigh) set("fuel", 0.32);
  if (input.vibration && !input.noise) set("engine", 0.18);
  const sum = dist.reduce((a, b) => a + b, 0);
  const norm = dist.map((v) => v / sum);
  return { cls: majority(norm), dist: norm };
}

export function featureImportance(forest: Forest) {
  const counts = Array(FEATURE_NAMES.length).fill(0);
  const walk = (n: TreeNode) => {
    if (n.leaf) return;
    counts[n.feat] += 1;
    walk(n.left);
    walk(n.right);
  };
  for (const t of forest.trees) walk(t);
  const sum = counts.reduce((a, b) => a + b, 0) || 1;
  return FEATURE_NAMES.map((name, i) => ({ name, value: counts[i] / sum }));
}
