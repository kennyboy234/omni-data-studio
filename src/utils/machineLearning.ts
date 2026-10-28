import { ModelArtifact, ModelEvaluationMetrics } from '../types';

/**
 * Sigmoid activation
 */
function sigmoid(z: number): number {
  if (z > 20) return 1.0;
  if (z < -20) return 0.0;
  return 1 / (1 + Math.exp(-z));
}

/**
 * Train Logistic Regression with gradient descent
 */
export function trainLogisticRegression(
  trainX: number[][],
  trainY: number[],
  testX: number[][],
  testY: number[],
  featureNames: string[],
  learningRate: number = 0.05,
  epochs: number = 200
): ModelEvaluationMetrics {
  const startTime = performance.now();
  const nFeatures = featureNames.length;
  const nSamples = trainX.length;

  if (nSamples === 0 || testX.length === 0) {
    throw new Error('Insufficient sample rows to train Logistic Regression');
  }

  // Initialize weights
  let weights = new Array(nFeatures).fill(0);
  let bias = 0;

  // Gradient descent
  for (let epoch = 0; epoch < epochs; epoch++) {
    const dw = new Array(nFeatures).fill(0);
    let db = 0;

    for (let i = 0; i < nSamples; i++) {
      let z = bias;
      for (let j = 0; j < nFeatures; j++) {
        z += trainX[i][j] * weights[j];
      }
      const yHat = sigmoid(z);
      const err = yHat - trainY[i];

      for (let j = 0; j < nFeatures; j++) {
        dw[j] += err * trainX[i][j];
      }
      db += err;
    }

    for (let j = 0; j < nFeatures; j++) {
      weights[j] -= (learningRate * dw[j]) / nSamples;
    }
    bias -= (learningRate * db) / nSamples;
  }

  // Evaluate on Test split
  let tp = 0, fp = 0, tn = 0, fn = 0;

  for (let i = 0; i < testX.length; i++) {
    let z = bias;
    for (let j = 0; j < nFeatures; j++) {
      z += testX[i][j] * weights[j];
    }
    const prob = sigmoid(z);
    const pred = prob >= 0.5 ? 1 : 0;
    const actual = testY[i];

    if (pred === 1 && actual === 1) tp++;
    else if (pred === 1 && actual === 0) fp++;
    else if (pred === 0 && actual === 0) tn++;
    else if (pred === 0 && actual === 1) fn++;
  }

  const total = tp + fp + tn + fn;
  const accuracy = total > 0 ? Number(((tp + tn) / total).toFixed(4)) : 0;
  const precision = tp + fp > 0 ? Number((tp / (tp + fp)).toFixed(4)) : 0;
  const recall = tp + fn > 0 ? Number((tp / (tp + fn)).toFixed(4)) : 0;
  const f1Score =
    precision + recall > 0 ? Number(((2 * precision * recall) / (precision + recall)).toFixed(4)) : 0;

  // Feature importances from absolute weights
  const absSum = weights.reduce((acc, w) => acc + Math.abs(w), 0) || 1;
  const featureImportances = featureNames
    .map((name, idx) => ({
      feature: name,
      importance: Number((Math.abs(weights[idx]) / absSum).toFixed(3)),
    }))
    .sort((a, b) => b.importance - a.importance);

  return {
    task: 'classification',
    modelName: 'Logistic Regression',
    isBaseline: false,
    trainingTimeMs: Number((performance.now() - startTime).toFixed(1)),
    accuracy,
    precision,
    recall,
    f1Score,
    confusionMatrix: { tp, fp, tn, fn },
    featureImportances,
  };
}

/**
 * Baseline Majority Classifier
 */
export function evaluateBaselineClassification(
  trainY: number[],
  testY: number[]
): ModelEvaluationMetrics {
  const startTime = performance.now();
  const ones = trainY.filter((y) => y === 1).length;
  const majorityClass = ones >= trainY.length / 2 ? 1 : 0;

  let tp = 0, fp = 0, tn = 0, fn = 0;
  for (const actual of testY) {
    if (majorityClass === 1 && actual === 1) tp++;
    else if (majorityClass === 1 && actual === 0) fp++;
    else if (majorityClass === 0 && actual === 0) tn++;
    else if (majorityClass === 0 && actual === 1) fn++;
  }

  const total = testY.length;
  const accuracy = total > 0 ? Number(((tp + tn) / total).toFixed(4)) : 0;
  const precision = tp + fp > 0 ? Number((tp / (tp + fp)).toFixed(4)) : 0;
  const recall = tp + fn > 0 ? Number((tp / (tp + fn)).toFixed(4)) : 0;
  const f1Score =
    precision + recall > 0 ? Number(((2 * precision * recall) / (precision + recall)).toFixed(4)) : 0;

  return {
    task: 'classification',
    modelName: 'Dummy Baseline (Majority Class)',
    isBaseline: true,
    trainingTimeMs: Number((performance.now() - startTime).toFixed(1)),
    accuracy,
    precision,
    recall,
    f1Score,
    confusionMatrix: { tp, fp, tn, fn },
  };
}

/**
 * Train Decision Tree Classifier
 */
export function trainDecisionTreeClassifier(
  trainX: number[][],
  trainY: number[],
  testX: number[][],
  testY: number[],
  featureNames: string[],
  maxDepth: number = 3
): ModelEvaluationMetrics {
  const startTime = performance.now();
  const nFeatures = featureNames.length;

  // Simple Decision Stump / Greedy Tree Splitter
  interface Node {
    featureIdx?: number;
    threshold?: number;
    left?: Node;
    right?: Node;
    prediction?: number;
  }

  const gini = (labels: number[]) => {
    if (labels.length === 0) return 0;
    const p1 = labels.filter((y) => y === 1).length / labels.length;
    const p0 = 1 - p1;
    return 1 - (p1 * p1 + p0 * p0);
  };

  const featureScores = new Array(nFeatures).fill(0);

  const buildTree = (X: number[][], y: number[], depth: number): Node => {
    const defaultPred = y.filter((val) => val === 1).length >= y.length / 2 ? 1 : 0;
    if (depth >= maxDepth || y.length < 5 || new Set(y).size <= 1) {
      return { prediction: defaultPred };
    }

    let bestGain = 0;
    let bestFeat = 0;
    let bestThresh = 0;
    const parentGini = gini(y);

    for (let f = 0; f < nFeatures; f++) {
      const vals = X.map((row) => row[f]).sort((a, b) => a - b);
      const thresholds = [
        vals[Math.floor(vals.length * 0.25)],
        vals[Math.floor(vals.length * 0.5)],
        vals[Math.floor(vals.length * 0.75)],
      ];

      for (const thresh of thresholds) {
        if (thresh === undefined) continue;
        const leftY: number[] = [];
        const rightY: number[] = [];

        for (let i = 0; i < X.length; i++) {
          if (X[i][f] <= thresh) leftY.push(y[i]);
          else rightY.push(y[i]);
        }

        if (leftY.length === 0 || rightY.length === 0) continue;
        const leftGini = gini(leftY);
        const rightGini = gini(rightY);
        const weightedGini = (leftY.length / y.length) * leftGini + (rightY.length / y.length) * rightGini;
        const gain = parentGini - weightedGini;

        if (gain > bestGain) {
          bestGain = gain;
          bestFeat = f;
          bestThresh = thresh;
        }
      }
    }

    if (bestGain <= 0.001) {
      return { prediction: defaultPred };
    }

    featureScores[bestFeat] += bestGain;

    const leftX: number[][] = [];
    const leftY: number[] = [];
    const rightX: number[][] = [];
    const rightY: number[] = [];

    for (let i = 0; i < X.length; i++) {
      if (X[i][bestFeat] <= bestThresh) {
        leftX.push(X[i]);
        leftY.push(y[i]);
      } else {
        rightX.push(X[i]);
        rightY.push(y[i]);
      }
    }

    return {
      featureIdx: bestFeat,
      threshold: bestThresh,
      left: buildTree(leftX, leftY, depth + 1),
      right: buildTree(rightX, rightY, depth + 1),
    };
  };

  const root = buildTree(trainX, trainY, 0);

  const predictRow = (node: Node, row: number[]): number => {
    if (node.prediction !== undefined) return node.prediction;
    if (node.featureIdx !== undefined && node.threshold !== undefined) {
      if (row[node.featureIdx] <= node.threshold) {
        return node.left ? predictRow(node.left, row) : 0;
      } else {
        return node.right ? predictRow(node.right, row) : 1;
      }
    }
    return 0;
  };

  // Evaluate
  let tp = 0, fp = 0, tn = 0, fn = 0;
  for (let i = 0; i < testX.length; i++) {
    const pred = predictRow(root, testX[i]);
    const actual = testY[i];
    if (pred === 1 && actual === 1) tp++;
    else if (pred === 1 && actual === 0) fp++;
    else if (pred === 0 && actual === 0) tn++;
    else if (pred === 0 && actual === 1) fn++;
  }

  const total = testX.length;
  const accuracy = total > 0 ? Number(((tp + tn) / total).toFixed(4)) : 0;
  const precision = tp + fp > 0 ? Number((tp / (tp + fp)).toFixed(4)) : 0;
  const recall = tp + fn > 0 ? Number((tp / (tp + fn)).toFixed(4)) : 0;
  const f1Score =
    precision + recall > 0 ? Number(((2 * precision * recall) / (precision + recall)).toFixed(4)) : 0;

  const scoreSum = featureScores.reduce((a, b) => a + b, 0) || 1;
  const featureImportances = featureNames
    .map((name, idx) => ({
      feature: name,
      importance: Number((featureScores[idx] / scoreSum).toFixed(3)),
    }))
    .sort((a, b) => b.importance - a.importance);

  return {
    task: 'classification',
    modelName: 'Decision Tree Classifier (depth=3)',
    isBaseline: false,
    trainingTimeMs: Number((performance.now() - startTime).toFixed(1)),
    accuracy,
    precision,
    recall,
    f1Score,
    confusionMatrix: { tp, fp, tn, fn },
    featureImportances,
  };
}

/**
 * Train Linear Regression (Ordinary Least Squares gradient descent)
 */
export function trainLinearRegression(
  trainX: number[][],
  trainY: number[],
  testX: number[][],
  testY: number[],
  featureNames: string[]
): ModelEvaluationMetrics {
  const startTime = performance.now();
  const nFeatures = featureNames.length;
  const nSamples = trainX.length;

  let weights = new Array(nFeatures).fill(0);
  let bias = trainY.reduce((a, b) => a + b, 0) / Math.max(1, nSamples);
  const lr = 0.01;

  for (let epoch = 0; epoch < 250; epoch++) {
    const dw = new Array(nFeatures).fill(0);
    let db = 0;

    for (let i = 0; i < nSamples; i++) {
      let yHat = bias;
      for (let j = 0; j < nFeatures; j++) {
        yHat += trainX[i][j] * weights[j];
      }
      const err = yHat - trainY[i];
      for (let j = 0; j < nFeatures; j++) {
        dw[j] += err * trainX[i][j];
      }
      db += err;
    }

    for (let j = 0; j < nFeatures; j++) {
      weights[j] -= (lr * dw[j]) / nSamples;
    }
    bias -= (lr * db) / nSamples;
  }

  // Evaluate
  let sumErrSq = 0;
  let sumAbsErr = 0;
  const meanTestY = testY.reduce((a, b) => a + b, 0) / Math.max(1, testY.length);
  let totalVar = 0;

  for (let i = 0; i < testX.length; i++) {
    let yHat = bias;
    for (let j = 0; j < nFeatures; j++) {
      yHat += testX[i][j] * weights[j];
    }
    const err = yHat - testY[i];
    sumErrSq += err * err;
    sumAbsErr += Math.abs(err);
    totalVar += Math.pow(testY[i] - meanTestY, 2);
  }

  const mse = sumErrSq / Math.max(1, testX.length);
  const rmse = Math.sqrt(mse);
  const mae = sumAbsErr / Math.max(1, testX.length);
  const r2 = totalVar > 0 ? Math.max(0, 1 - sumErrSq / totalVar) : 0;

  const absSum = weights.reduce((acc, w) => acc + Math.abs(w), 0) || 1;
  const featureImportances = featureNames
    .map((name, idx) => ({
      feature: name,
      importance: Number((Math.abs(weights[idx]) / absSum).toFixed(3)),
    }))
    .sort((a, b) => b.importance - a.importance);

  return {
    task: 'regression',
    modelName: 'Ridge / Linear Regression',
    isBaseline: false,
    trainingTimeMs: Number((performance.now() - startTime).toFixed(1)),
    mae: Number(mae.toFixed(3)),
    mse: Number(mse.toFixed(3)),
    rmse: Number(rmse.toFixed(3)),
    r2: Number(r2.toFixed(3)),
    featureImportances,
  };
}

/**
 * Time Series Forecasting via Exponential Smoothing with Trend & Confidence Intervals
 */
export function runHoltWintersForecast(
  historicalDates: string[],
  historicalValues: number[],
  horizonSteps: number = 6
): ModelEvaluationMetrics {
  const startTime = performance.now();
  const n = historicalValues.length;
  if (n < 4) {
    throw new Error('Need at least 4 historical periods to fit time series forecast');
  }

  const alpha = 0.3; // Level smoothing
  const beta = 0.15; // Trend smoothing

  let level = historicalValues[0];
  let trend = (historicalValues[n - 1] - historicalValues[0]) / (n - 1);

  const fitted: number[] = [level];

  for (let i = 1; i < n; i++) {
    const actual = historicalValues[i];
    const prevLevel = level;
    level = alpha * actual + (1 - alpha) * (prevLevel + trend);
    trend = beta * (level - prevLevel) + (1 - beta) * trend;
    fitted.push(Number(level.toFixed(2)));
  }

  // Calculate residual variance for confidence intervals
  let sumResSq = 0;
  for (let i = 0; i < n; i++) {
    sumResSq += Math.pow(historicalValues[i] - fitted[i], 2);
  }
  const residualStd = Math.sqrt(sumResSq / (n - 1));

  // MAPE
  let mapeSum = 0;
  for (let i = 1; i < n; i++) {
    if (historicalValues[i] !== 0) {
      mapeSum += Math.abs((historicalValues[i] - fitted[i]) / historicalValues[i]);
    }
  }
  const mape = Number(((mapeSum / (n - 1)) * 100).toFixed(2));

  // Project future points
  const forecastPoints: NonNullable<ModelEvaluationMetrics['forecastPoints']> = [];

  // Historical points
  for (let i = 0; i < n; i++) {
    forecastPoints.push({
      date: historicalDates[i] || `T-${n - i}`,
      actual: historicalValues[i],
      forecast: fitted[i],
      lower80: Number((fitted[i] - 1.28 * residualStd).toFixed(2)),
      upper80: Number((fitted[i] + 1.28 * residualStd).toFixed(2)),
      lower95: Number((fitted[i] - 1.96 * residualStd).toFixed(2)),
      upper95: Number((fitted[i] + 1.96 * residualStd).toFixed(2)),
    });
  }

  // Future projections
  for (let h = 1; h <= horizonSteps; h++) {
    const futureVal = level + h * trend;
    const futureStd = residualStd * Math.sqrt(1 + h * 0.1);
    forecastPoints.push({
      date: `+${h}mo (Proj)`,
      forecast: Number(futureVal.toFixed(2)),
      lower80: Number((futureVal - 1.28 * futureStd).toFixed(2)),
      upper80: Number((futureVal + 1.28 * futureStd).toFixed(2)),
      lower95: Number((futureVal - 1.96 * futureStd).toFixed(2)),
      upper95: Number((futureVal + 1.96 * futureStd).toFixed(2)),
    });
  }

  return {
    task: 'forecasting',
    modelName: "Holt's Linear Exponential Smoothing",
    isBaseline: false,
    trainingTimeMs: Number((performance.now() - startTime).toFixed(1)),
    mape,
    rmse: Number(residualStd.toFixed(2)),
    forecastPoints,
  };
}
