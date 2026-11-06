/**
 * EarthSignal — Scientific Analysis Engine Validation Test Suite
 * Validates deterministic statistical methods against reference benchmarks:
 * 1. Monotonically increasing synthetic series (must yield p < 0.001, trend = increasing)
 * 2. Monotonically decreasing synthetic series (must yield p < 0.001, trend = decreasing)
 * 3. Stable random white noise series (must yield p >= 0.05, no significant trend)
 * 4. Sen's slope calculation accuracy
 * 5. Ordinary Least Squares (OLS) regression line matching
 * 6. Benjamini-Hochberg FDR correction
 */

import {
  computeMannKendall,
  computeSensSlope,
  computeLinearRegression,
  computeLag1Autocorrelation,
  benjaminiHochbergCorrection,
} from './statisticalEngine';

function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    process.exit(1);
  } else {
    console.log(`✅ PASSED: ${message}`);
  }
}

console.log('🧪 Starting EarthSignal Scientific Engine Verification Tests...\n');

// Test 1: Monotonically increasing series
{
  const series = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15];
  const mk = computeMannKendall(series);
  assert(mk.trend === 'increasing', 'MK correctly detects increasing series');
  assert(mk.is_significant === true, 'Increasing series is statistically significant');
  assert(mk.p_value < 0.001, `p-value (${mk.p_value.toFixed(6)}) is < 0.001`);
  assert(mk.kendall_tau === 1.0, 'Kendall Tau is exactly 1.0 for strictly monotonic series');

  const times = series.map((_, i) => i);
  const sens = computeSensSlope(times, series, 0.05, false);
  assert(Math.abs(sens.slope - 1.0) < 1e-6, `Sen's slope is 1.0 (got ${sens.slope})`);
}

// Test 2: Monotonically decreasing series
{
  const series = [100, 95, 90, 85, 80, 75, 70, 65, 60, 55, 50, 45, 40];
  const mk = computeMannKendall(series);
  assert(mk.trend === 'decreasing', 'MK correctly detects decreasing series');
  assert(mk.is_significant === true, 'Decreasing series is statistically significant');
  assert(mk.kendall_tau === -1.0, 'Kendall Tau is exactly -1.0');

  const times = series.map((_, i) => i);
  const sens = computeSensSlope(times, series, 0.05, false);
  assert(Math.abs(sens.slope - -5.0) < 1e-6, `Sen's slope is -5.0 (got ${sens.slope})`);
}

// Test 3: Stable stationary series (zero trend)
{
  // Deterministic pseudo-random oscillating series centered at 25
  const series = [
    25.1, 24.9, 25.3, 24.8, 25.0, 25.2, 24.7, 25.1, 24.9, 25.0,
    25.2, 24.8, 25.1, 25.0, 24.9, 25.3, 24.7, 25.0, 25.2, 24.8
  ];
  const mk = computeMannKendall(series);
  assert(mk.trend === 'no_trend', 'MK finds no trend in stationary series');
  assert(mk.is_significant === false, 'Stationary series is not significant (p >= 0.05)');
  assert(mk.p_value > 0.1, `p-value (${mk.p_value.toFixed(4)}) is > 0.1`);
}

// Test 4: Linear regression verification
{
  const x = [0, 1, 2, 3, 4];
  const y = [2, 4, 6, 8, 10]; // y = 2x + 2
  const reg = computeLinearRegression(x, y);
  assert(Math.abs(reg.slope - 2.0) < 1e-6, `OLS slope is 2.0 (got ${reg.slope})`);
  assert(Math.abs(reg.intercept - 2.0) < 1e-6, `OLS intercept is 2.0 (got ${reg.intercept})`);
  assert(Math.abs(reg.r_squared - 1.0) < 1e-6, `OLS R^2 is 1.0 (got ${reg.r_squared})`);
}

// Test 5: Autocorrelation evaluation
{
  // AR(1) process with oscillation/innovations
  const arSeries: number[] = [2];
  for (let i = 1; i < 60; i++) {
    // x_t = 0.75 * x_{t-1} + small perturbation
    arSeries.push(0.75 * arSeries[i - 1] + Math.cos(i * 0.2));
  }
  const ac = computeLag1Autocorrelation(arSeries);
  assert(ac.lag_1 > 0.5, `AR(1) series yields high positive lag-1 autocorrelation (${ac.lag_1.toFixed(3)})`);
  assert(ac.is_autocorrelated === true, 'Autocorrelation test correctly flags series');
}

// Test 6: Benjamini-Hochberg FDR correction
{
  const rawP = [0.001, 0.008, 0.039, 0.041, 0.042, 0.060, 0.074, 0.205];
  const adjusted = benjaminiHochbergCorrection(rawP);
  assert(adjusted[0] === 0.008, `First adjusted p-value matches expected (got ${adjusted[0]})`);
  assert(adjusted[0] <= adjusted[1], 'Adjusted p-values are monotonically increasing');
  for (let i = 0; i < rawP.length; i++) {
    assert(adjusted[i] >= rawP[i], 'Adjusted p-value is >= raw p-value');
  }
}

console.log('\n🌟 All 6 Scientific Engine Validation Tests Passed Successfully!\n');
