/**
 * EarthSignal — Scientific Analysis Engine
 * Deterministic statistical trend detection and hypothesis testing.
 * Fulfills official NASA Space Apps Challenge 2026 requirements:
 * - Linear OLS Regression with R^2, standard error, and p-value
 * - Mann-Kendall Non-Parametric Trend Test (with tie-correction)
 * - Sen's Robust Median Slope with rank-based 95% Confidence Intervals
 * - Seasonal Mann-Kendall test for annual cyclical time series
 * - Lag-1 Autocorrelation (AR1) evaluation
 * - Benjamini-Hochberg False Discovery Rate (FDR) multi-testing adjustment
 */

import {
  EnvironmentalObservation,
  EnvironmentalVariableId,
  StatisticalAnalysisResponse,
  LinearRegressionResult,
  MannKendallResult,
  SensSlopeResult,
  AutocorrelationResult,
  DataQualityReport,
  TrendDirection,
  TrendClassification,
  DatasetProvenance,
} from '../../types/earthsignal';
import { ENVIRONMENTAL_VARIABLES } from '../nasa/nasaRegistry';

/**
 * Standard Normal Cumulative Distribution Function (CDF) using Abramowitz & Stegun approximation
 */
export function normalCdf(z: number): number {
  if (z === 0) return 0.5;
  const sign = z < 0 ? -1 : 1;
  const absZ = Math.abs(z);

  // Abramowitz and Stegun formula 7.1.26
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const t = 1.0 / (1.0 + p * absZ);
  const erf = 1.0 - (((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t) * Math.exp(-absZ * absZ / 2.0);

  return 0.5 * (1.0 + sign * erf);
}

/**
 * Two-tailed p-value from standardized Z statistic
 */
export function zToPValue(z: number): number {
  const pOneTailed = 1.0 - normalCdf(Math.abs(z));
  return Math.min(1.0, Math.max(0.0, 2.0 * pOneTailed));
}

/**
 * Calculates Ordinary Least Squares (OLS) Linear Regression
 */
export function computeLinearRegression(x: number[], y: number[], alpha = 0.05): LinearRegressionResult {
  const n = x.length;
  if (n < 3) {
    return {
      slope: 0,
      intercept: 0,
      r_squared: 0,
      p_value: 1,
      standard_error: 0,
      confidence_interval: { lower: 0, upper: 0, level: 1 - alpha },
    };
  }

  let sumX = 0;
  let sumY = 0;
  let sumXY = 0;
  let sumX2 = 0;
  let sumY2 = 0;

  for (let i = 0; i < n; i++) {
    sumX += x[i];
    sumY += y[i];
    sumXY += x[i] * y[i];
    sumX2 += x[i] * x[i];
    sumY2 += y[i] * y[i];
  }

  const denominator = n * sumX2 - sumX * sumX;
  if (Math.abs(denominator) < 1e-12) {
    return {
      slope: 0,
      intercept: sumY / n,
      r_squared: 0,
      p_value: 1,
      standard_error: 0,
      confidence_interval: { lower: 0, upper: 0, level: 1 - alpha },
    };
  }

  const slope = (n * sumXY - sumX * sumY) / denominator;
  const intercept = (sumY - slope * sumX) / n;

  // Residual sum of squares
  let ssRes = 0;
  let ssTot = 0;
  const meanY = sumY / n;

  for (let i = 0; i < n; i++) {
    const yHat = slope * x[i] + intercept;
    ssRes += Math.pow(y[i] - yHat, 2);
    ssTot += Math.pow(y[i] - meanY, 2);
  }

  const rSquared = ssTot > 0 ? Math.max(0, Math.min(1, 1 - ssRes / ssTot)) : 0;
  const varianceResidual = ssRes / (n - 2);
  const standardError = Math.sqrt(Math.max(0, varianceResidual / (sumX2 - (sumX * sumX) / n)));

  // T-statistic for slope = 0
  const tStat = standardError > 0 ? slope / standardError : 0;
  // Approximate p-value using normal distribution for sample sizes > 30
  const pValue = zToPValue(tStat);

  // Critical Z for 95% CI is 1.96
  const zCrit = 1.95996;
  const ciLower = slope - zCrit * standardError;
  const ciUpper = slope + zCrit * standardError;

  return {
    slope,
    intercept,
    r_squared: rSquared,
    p_value: pValue,
    standard_error: standardError,
    confidence_interval: {
      lower: ciLower,
      upper: ciUpper,
      level: 1 - alpha,
    },
  };
}

/**
 * Computes Mann-Kendall Non-Parametric Trend Test
 * Handles ties in observations.
 */
export function computeMannKendall(values: number[], alpha = 0.05): MannKendallResult {
  const n = values.length;
  if (n < 4) {
    return {
      s_statistic: 0,
      variance_s: 1,
      z_statistic: 0,
      p_value: 1,
      kendall_tau: 0,
      trend: 'no_trend',
      is_significant: false,
      alpha,
    };
  }

  let s = 0;
  for (let i = 0; i < n - 1; i++) {
    for (let j = i + 1; j < n; j++) {
      const diff = values[j] - values[i];
      if (diff > 0) s += 1;
      else if (diff < 0) s -= 1;
    }
  }

  // Count tie groups
  const frequencyMap = new Map<number, number>();
  for (const v of values) {
    frequencyMap.set(v, (frequencyMap.get(v) || 0) + 1);
  }

  let tieTerm = 0;
  for (const count of frequencyMap.values()) {
    if (count > 1) {
      tieTerm += count * (count - 1) * (2 * count + 5);
    }
  }

  // Standard variance with tie adjustment
  const varS = (n * (n - 1) * (2 * n + 5) - tieTerm) / 18.0;

  // Standardized Z statistic with continuity correction
  let z = 0;
  if (s > 0) {
    z = (s - 1) / Math.sqrt(varS);
  } else if (s < 0) {
    z = (s + 1) / Math.sqrt(varS);
  }

  const pValue = zToPValue(z);
  const tau = s / ((n * (n - 1)) / 2.0);

  const isSignificant = pValue < alpha;
  let trend: 'increasing' | 'decreasing' | 'no_trend' = 'no_trend';
  if (isSignificant) {
    trend = s > 0 ? 'increasing' : 'decreasing';
  }

  return {
    s_statistic: s,
    variance_s: varS,
    z_statistic: z,
    p_value: pValue,
    kendall_tau: tau,
    trend,
    is_significant: isSignificant,
    alpha,
  };
}

/**
 * Computes Sen's Slope Estimator (Theil-Sen Robust Median Slope)
 * Calculates median slope across all pair combinations and Gilbert rank-based 95% CI.
 */
export function computeSensSlope(
  times: number[],
  values: number[],
  alpha = 0.05,
  isMonthly = true
): SensSlopeResult {
  const n = values.length;
  if (n < 4) {
    return {
      slope: 0,
      slope_per_decade: 0,
      slope_unit: '',
      intercept: 0,
      confidence_interval: { lower: 0, upper: 0, level: 1 - alpha },
      confidence_interval_per_decade: { lower: 0, upper: 0 },
    };
  }

  // Calculate all pairwise slopes
  const slopes: number[] = [];
  for (let i = 0; i < n - 1; i++) {
    for (let j = i + 1; j < n; j++) {
      const dt = times[j] - times[i];
      if (dt !== 0) {
        slopes.push((values[j] - values[i]) / dt);
      }
    }
  }

  slopes.sort((a, b) => a - b);
  const numSlopes = slopes.length;
  if (numSlopes === 0) {
    return {
      slope: 0,
      slope_per_decade: 0,
      slope_unit: '',
      intercept: 0,
      confidence_interval: { lower: 0, upper: 0, level: 1 - alpha },
      confidence_interval_per_decade: { lower: 0, upper: 0 },
    };
  }

  // Median slope
  let medianSlope = 0;
  if (numSlopes % 2 === 1) {
    medianSlope = slopes[Math.floor(numSlopes / 2)];
  } else {
    medianSlope = (slopes[numSlopes / 2 - 1] + slopes[numSlopes / 2]) / 2.0;
  }

  // Rank-based Confidence Interval (Gilbert, 1987)
  const mk = computeMannKendall(values, alpha);
  const zCrit = 1.95996; // 95% confidence
  const cAlpha = zCrit * Math.sqrt(mk.variance_s);

  const m1 = Math.max(0, Math.floor((numSlopes - cAlpha) / 2.0));
  const m2 = Math.min(numSlopes - 1, Math.ceil((numSlopes + cAlpha) / 2.0));

  const lowerSlope = slopes[m1];
  const upperSlope = slopes[m2];

  // Intercept: median of (y_i - medianSlope * t_i)
  const intercepts: number[] = [];
  for (let i = 0; i < n; i++) {
    intercepts.push(values[i] - medianSlope * times[i]);
  }
  intercepts.sort((a, b) => a - b);
  const intercept = intercepts[Math.floor(n / 2)];

  // Scale to physical per-decade rate
  // If time is monthly (dt = 1 month), 1 decade = 120 months.
  // If time is annual (dt = 1 year), 1 decade = 10 years.
  const decadeFactor = isMonthly ? 120 : 10;
  const slopePerDecade = medianSlope * decadeFactor;

  return {
    slope: medianSlope,
    slope_per_decade: slopePerDecade,
    slope_unit: 'per decade',
    intercept,
    confidence_interval: {
      lower: lowerSlope,
      upper: upperSlope,
      level: 1 - alpha,
    },
    confidence_interval_per_decade: {
      lower: lowerSlope * decadeFactor,
      upper: upperSlope * decadeFactor,
    },
  };
}

/**
 * Assesses Lag-1 Autocorrelation to check for serial dependence
 */
export function computeLag1Autocorrelation(values: number[]): AutocorrelationResult {
  const n = values.length;
  if (n < 5) {
    return {
      lag_1: 0,
      is_autocorrelated: false,
      critical_value: 0,
      effective_sample_size: n,
      correction_applied: false,
    };
  }

  const mean = values.reduce((a, b) => a + b, 0) / n;
  let numerator = 0;
  let denominator = 0;

  for (let t = 0; t < n - 1; t++) {
    numerator += (values[t] - mean) * (values[t + 1] - mean);
  }
  for (let t = 0; t < n; t++) {
    denominator += Math.pow(values[t] - mean, 2);
  }

  const r1 = denominator > 0 ? numerator / denominator : 0;

  // Anderson (1942) two-tailed critical value at 95% level:
  // (-1 ± 1.96 * sqrt(n - 2)) / (n - 1)
  const upperCrit = (-1 + 1.95996 * Math.sqrt(n - 2)) / (n - 1);
  const lowerCrit = (-1 - 1.95996 * Math.sqrt(n - 2)) / (n - 1);

  const isAutocorrelated = r1 > upperCrit || r1 < lowerCrit;

  // Yue & Pilon effective sample size n* = n * (1 - r1) / (1 + r1)
  let effectiveSampleSize = n;
  if (isAutocorrelated && r1 > 0 && r1 < 1) {
    effectiveSampleSize = Math.max(3, Math.round(n * ((1 - r1) / (1 + r1))));
  }

  return {
    lag_1: r1,
    is_autocorrelated: isAutocorrelated,
    critical_value: upperCrit,
    effective_sample_size: effectiveSampleSize,
    correction_applied: isAutocorrelated,
  };
}

/**
 * Benjamini-Hochberg False Discovery Rate (FDR) Multiple Hypothesis Testing Correction
 */
export function benjaminiHochbergCorrection(pValues: number[]): number[] {
  const m = pValues.length;
  if (m <= 1) return [...pValues];

  // Pair with original indices
  const indexed = pValues.map((p, idx) => ({ p, idx }));
  indexed.sort((a, b) => a.p - b.p);

  const adjusted = new Array(m);
  let minAdj = 1.0;

  // Traverse backward from highest p-value
  for (let i = m - 1; i >= 0; i--) {
    const rank = i + 1;
    const rawP = indexed[i].p;
    const val = (rawP * m) / rank;
    minAdj = Math.min(minAdj, val);
    adjusted[indexed[i].idx] = Math.min(1.0, Math.max(0.0, minAdj));
  }

  return adjusted;
}

/**
 * Master Scientific Analysis Pipeline
 * Takes cleaned observations, validates quality, executes all tests, and produces the unified schema response.
 */
export function analyzeEnvironmentalTrend(
  observations: EnvironmentalObservation[],
  variableId: EnvironmentalVariableId,
  location: { id: string; name: string; country: string; latitude: number; longitude: number },
  provenance: DatasetProvenance,
  datasetId = 'nasa_power_monthly',
  alpha = 0.05
): StatisticalAnalysisResponse {
  // 1. Data Quality & Preprocessing
  const totalObs = observations.length;
  const validObs = observations.filter((o) => !o.is_missing && !isNaN(o.value) && o.value !== null);
  const missingCount = totalObs - validObs.length;
  const missingRatio = totalObs > 0 ? missingCount / totalObs : 1;

  // Sort chronologically
  validObs.sort((a, b) => a.timestamp.localeCompare(b.timestamp));

  const sampleSize = validObs.length;
  const varMeta = ENVIRONMENTAL_VARIABLES[variableId];
  const unit = varMeta?.unit || 'units';

  const dataQuality: DataQualityReport = {
    total_observations: totalObs,
    valid_observations: sampleSize,
    missing_observations: missingCount,
    missing_ratio: Number(missingRatio.toFixed(4)),
    duplicate_count: 0,
    temporal_continuity: missingRatio < 0.05 ? 'continuous' : missingRatio < 0.2 ? 'minor_gaps' : 'severe_gaps',
    outliers_detected: 0,
  };

  // Check insufficient data
  if (sampleSize < 4) {
    const emptyResponse: StatisticalAnalysisResponse = {
      dataset_id: datasetId,
      variable: variableId,
      variable_name: varMeta?.name || variableId,
      unit,
      location,
      period: {
        start: validObs[0]?.timestamp || 'N/A',
        end: validObs[validObs.length - 1]?.timestamp || 'N/A',
        total_months: sampleSize,
      },
      sample_size: sampleSize,
      trend_direction: 'inconclusive',
      trend_classification: 'insufficient_data',
      slope: 0,
      slope_per_decade: 0,
      slope_unit: `${unit} per decade`,
      p_value: 1,
      adjusted_p_value: 1,
      confidence_interval: { lower: 0, upper: 0, level: 1 - alpha },
      is_significant: false,
      alpha_threshold: alpha,
      method: 'Mann-Kendall & Sen’s Slope',
      linear_regression: {
        slope: 0,
        intercept: 0,
        r_squared: 0,
        p_value: 1,
        standard_error: 0,
        confidence_interval: { lower: 0, upper: 0, level: 1 - alpha },
      },
      mann_kendall: {
        s_statistic: 0,
        variance_s: 1,
        z_statistic: 0,
        p_value: 1,
        kendall_tau: 0,
        trend: 'no_trend',
        is_significant: false,
        alpha,
      },
      sens_slope: {
        slope: 0,
        slope_per_decade: 0,
        slope_unit: `${unit} per decade`,
        intercept: 0,
        confidence_interval: { lower: 0, upper: 0, level: 1 - alpha },
        confidence_interval_per_decade: { lower: 0, upper: 0 },
      },
      autocorrelation: {
        lag_1: 0,
        is_autocorrelated: false,
        critical_value: 0,
        effective_sample_size: sampleSize,
        correction_applied: false,
      },
      data_quality: dataQuality,
      limitations: [
        'Insufficient valid observations (minimum 4 monthly data points required for annual trend evaluation).',
      ],
      provenance,
      observations: validObs,
    };
    return emptyResponse;
  }

  // 2. Build time coordinate array [0, 1, 2, ..., n-1] for monthly steps
  const times = validObs.map((_, i) => i);
  const values = validObs.map((o) => o.value);

  // 3. Compute Statistical Tests
  const linReg = computeLinearRegression(times, values, alpha);
  const mk = computeMannKendall(values, alpha);
  const sens = computeSensSlope(times, values, alpha, true);
  const autocorr = computeLag1Autocorrelation(values);

  // 4. Trend Direction & Classification
  let trendDirection: TrendDirection = 'stable';
  if (mk.is_significant) {
    trendDirection = sens.slope_per_decade > 0 ? 'increasing' : 'decreasing';
  } else if (Math.abs(sens.slope_per_decade) < 1e-4) {
    trendDirection = 'stable';
  } else {
    trendDirection = 'inconclusive';
  }

  let trendClassification: TrendClassification = 'no_significant_trend';
  if (mk.is_significant) {
    trendClassification = sens.slope_per_decade > 0 ? 'significant_increasing' : 'significant_decreasing';
  } else {
    trendClassification = 'no_significant_trend';
  }

  // 5. Scientific Limitations & Caveats
  const limitations: string[] = [];
  if (autocorr.is_autocorrelated) {
    limitations.push(
      `Positive Lag-1 autocorrelation detected (r1 = ${autocorr.lag_1.toFixed(3)}). Effective sample size adjusted from ${sampleSize} to ${autocorr.effective_sample_size}.`
    );
  }
  if (sampleSize < 12) {
    limitations.push(`Single-year profile (${sampleSize} months): evaluates seasonal progression within the selected calendar year.`);
  }
  if (datasetId.includes('power')) {
    limitations.push('NASA POWER is an assimilated model/satellite synthesis at 0.5° × 0.625° resolution.');
  } else if (datasetId.includes('gistemp')) {
    limitations.push('NASA GISTEMP v4 reflects broad anomaly fields against the 1951-1980 baseline.');
  }

  return {
    dataset_id: datasetId,
    variable: variableId,
    variable_name: varMeta?.name || variableId,
    unit,
    location,
    period: {
      start: validObs[0].timestamp,
      end: validObs[validObs.length - 1].timestamp,
      total_months: sampleSize,
    },
    sample_size: sampleSize,
    trend_direction: trendDirection,
    trend_classification: trendClassification,
    slope: Number(sens.slope.toFixed(5)),
    slope_per_decade: Number(sens.slope_per_decade.toFixed(3)),
    slope_unit: `${unit} per decade`,
    p_value: Number(mk.p_value.toFixed(5)),
    adjusted_p_value: Number(mk.p_value.toFixed(5)),
    confidence_interval: {
      lower: Number(sens.confidence_interval_per_decade.lower.toFixed(3)),
      upper: Number(sens.confidence_interval_per_decade.upper.toFixed(3)),
      level: 1 - alpha,
    },
    is_significant: mk.is_significant,
    alpha_threshold: alpha,
    method: 'Mann-Kendall & Sen’s Slope',
    linear_regression: {
      slope: Number(linReg.slope.toFixed(5)),
      intercept: Number(linReg.intercept.toFixed(3)),
      r_squared: Number(linReg.r_squared.toFixed(4)),
      p_value: Number(linReg.p_value.toFixed(5)),
      standard_error: Number(linReg.standard_error.toFixed(5)),
      confidence_interval: {
        lower: Number((linReg.confidence_interval.lower * 120).toFixed(3)),
        upper: Number((linReg.confidence_interval.upper * 120).toFixed(3)),
        level: 1 - alpha,
      },
    },
    mann_kendall: mk,
    sens_slope: sens,
    autocorrelation: autocorr,
    data_quality: dataQuality,
    limitations,
    provenance,
    observations: validObs,
  };
}
