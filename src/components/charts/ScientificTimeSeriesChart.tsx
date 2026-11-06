/**
 * EarthSignal — Publication-Grade Scientific Time Series & Anomaly Decomposition Chart
 * Features:
 * - Mode 1: Multi-Layer Time Series (Raw Monthly Signal, 12-Month Moving Average, Sen's Median Trend Line, 95% Confidence Cone, Period Mean Reference, and Min/Max Annotations)
 * - Mode 2: Annual Anomaly Bar Decomposition (Diverging positive/negative departures from the multi-year period mean)
 * - 5-Column Quantitative Summary Strip + Interactive Crosshair Telemetry HUD
 */

import React, { useState, useMemo } from 'react';
import { EnvironmentalObservation, SensSlopeResult } from '../../types/earthsignal';

interface ScientificTimeSeriesChartProps {
  observations: EnvironmentalObservation[];
  sensSlope?: SensSlopeResult;
  variableName: string;
  unit: string;
  locationName: string;
}

export const ScientificTimeSeriesChart: React.FC<ScientificTimeSeriesChartProps> = ({
  observations,
  sensSlope,
  variableName,
  unit,
  locationName,
}) => {
  const [chartView, setChartView] = useState<'series' | 'anomalies'>('series');
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [showMovingAvg, setShowMovingAvg] = useState(true);
  const [showTrendLine, setShowTrendLine] = useState(true);
  const [showConfidence, setShowConfidence] = useState(true);

  // Filter valid data
  const validData = useMemo(() => {
    return observations.filter((d) => !d.is_missing && !isNaN(d.value));
  }, [observations]);

  // Summary statistics (Mean, Min, Max)
  const stats = useMemo(() => {
    if (validData.length === 0) {
      return {
        mean: 0,
        min: 0,
        max: 100,
        minObs: null as EnvironmentalObservation | null,
        maxObs: null as EnvironmentalObservation | null,
      };
    }
    let sum = 0;
    let minObs = validData[0];
    let maxObs = validData[0];
    for (const d of validData) {
      sum += d.value;
      if (d.value < minObs.value) minObs = d;
      if (d.value > maxObs.value) maxObs = d;
    }
    return {
      mean: sum / validData.length,
      min: minObs.value,
      max: maxObs.value,
      minObs,
      maxObs,
    };
  }, [validData]);

  // Compute 12-month moving average
  const movingAvgData = useMemo(() => {
    const ma: (number | null)[] = [];
    const windowSize = 12;
    for (let i = 0; i < validData.length; i++) {
      if (i < windowSize - 1) {
        ma.push(null);
      } else {
        const slice = validData.slice(i - windowSize + 1, i + 1);
        const sum = slice.reduce((acc, curr) => acc + curr.value, 0);
        ma.push(sum / windowSize);
      }
    }
    return ma;
  }, [validData]);

  // Compute annual mean anomalies relative to period mean
  const annualAnomalies = useMemo(() => {
    if (validData.length === 0) return [];
    const byYear = new Map<number, number[]>();
    for (const d of validData) {
      const arr = byYear.get(d.year) || [];
      arr.push(d.value);
      byYear.set(d.year, arr);
    }
    const result: { year: number; mean: number; anomaly: number }[] = [];
    byYear.forEach((vals, year) => {
      const yMean = vals.reduce((a, b) => a + b, 0) / vals.length;
      result.push({
        year,
        mean: yMean,
        anomaly: yMean - stats.mean,
      });
    });
    return result.sort((a, b) => a.year - b.year);
  }, [validData, stats.mean]);

  // SVG Dimensions
  const width = 960;
  const height = 380;
  const padding = { top: 28, right: 32, bottom: 44, left: 64 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  // Min and Max values with buffer
  const { minVal, maxVal } = useMemo(() => {
    if (validData.length === 0) return { minVal: 0, maxVal: 100 };
    const buffer = (stats.max - stats.min) * 0.12 || 1;
    return {
      minVal: stats.min - buffer,
      maxVal: stats.max + buffer,
    };
  }, [validData, stats.min, stats.max]);

  // Scale functions
  const getX = (idx: number) =>
    padding.left + (idx / Math.max(1, validData.length - 1)) * chartW;
  const getY = (val: number) =>
    padding.top + chartH - ((val - minVal) / (maxVal - minVal || 1)) * chartH;

  // Generate SVG path for observations
  const obsPath = useMemo(() => {
    if (validData.length === 0) return '';
    return validData
      .map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i).toFixed(1)} ${getY(d.value).toFixed(1)}`)
      .join(' ');
  }, [validData, minVal, maxVal]);

  // Generate SVG area under observations
  const obsAreaPath = useMemo(() => {
    if (validData.length < 2) return '';
    const firstX = getX(0).toFixed(1);
    const lastX = getX(validData.length - 1).toFixed(1);
    const baseY = (padding.top + chartH).toFixed(1);
    return `${obsPath} L ${lastX} ${baseY} L ${firstX} ${baseY} Z`;
  }, [obsPath, validData.length]);

  // Generate SVG path for 12-month moving average
  const maPath = useMemo(() => {
    let p = '';
    let started = false;
    for (let i = 0; i < movingAvgData.length; i++) {
      const v = movingAvgData[i];
      if (v !== null) {
        p += `${!started ? 'M' : 'L'} ${getX(i).toFixed(1)} ${getY(v).toFixed(1)} `;
        started = true;
      }
    }
    return p;
  }, [movingAvgData, minVal, maxVal]);

  // Trend line points (start to end)
  const trendLine = useMemo(() => {
    if (!sensSlope || validData.length < 2) return null;
    const n = validData.length;
    const yStart = sensSlope.intercept;
    const yEnd = sensSlope.intercept + sensSlope.slope * (n - 1);
    return {
      x1: getX(0),
      y1: getY(yStart),
      x2: getX(n - 1),
      y2: getY(yEnd),
      yLowerStart: getY(sensSlope.intercept),
      yLowerEnd: getY(sensSlope.intercept + sensSlope.confidence_interval.lower * (n - 1)),
      yUpperStart: getY(sensSlope.intercept),
      yUpperEnd: getY(sensSlope.intercept + sensSlope.confidence_interval.upper * (n - 1)),
      totalShift: sensSlope.slope * (n - 1),
    };
  }, [sensSlope, validData, minVal, maxVal]);

  // Year tick marks
  const yearTicks = useMemo(() => {
    if (validData.length === 0) return [];
    const ticks: { idx: number; year: number }[] = [];
    let lastYear = -1;
    validData.forEach((d, i) => {
      if (d.year !== lastYear && (d.year % 4 === 0 || i === 0 || i === validData.length - 1)) {
        ticks.push({ idx: i, year: d.year });
        lastYear = d.year;
      }
    });
    return ticks;
  }, [validData]);

  // Y-axis ticks
  const yTicks = useMemo(() => {
    const count = 5;
    const step = (maxVal - minVal) / (count - 1);
    const arr = [];
    for (let i = 0; i < count; i++) {
      arr.push(minVal + step * i);
    }
    return arr;
  }, [minVal, maxVal]);

  const activeObs =
    hoveredIdx !== null && validData[hoveredIdx] ? validData[hoveredIdx] : null;
  const latestMA =
    movingAvgData.length > 0 ? movingAvgData[movingAvgData.length - 1] : null;

  return (
    <div className="w-full bg-white dark:bg-[#0D111A] border border-slate-200 dark:border-[#1E2638] rounded-sm p-5 sm:p-6 transition-colors space-y-5">
      {/* Top Header & Chart Mode Controls */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-[#1E2638]">
        <div>
          <div className="text-[11px] font-mono uppercase tracking-wider text-cyan-600 dark:text-cyan-400">
            EMPIRICAL TIME-SERIES TELEMETRY
          </div>
          <h3 className="font-display text-base sm:text-lg font-bold text-slate-950 dark:text-white mt-0.5">
            {locationName} — {variableName} ({unit})
          </h3>
        </div>

        {/* Mode & Layer Controls */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          {/* View Switcher: Multi-Layer Series vs Annual Anomaly Bars */}
          <div className="flex items-center p-0.5 bg-slate-100 dark:bg-[#111622] border border-slate-200 dark:border-[#1E2638] rounded-xs">
            <button
              type="button"
              onClick={() => setChartView('series')}
              className={`px-2.5 py-1 rounded-xs transition-colors whitespace-nowrap font-medium ${
                chartView === 'series'
                  ? 'bg-slate-950 text-white dark:bg-cyan-500 dark:text-slate-950 font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white'
              }`}
            >
              Time Series + Sen&apos;s Slope
            </button>
            <button
              type="button"
              onClick={() => setChartView('anomalies')}
              className={`px-2.5 py-1 rounded-xs transition-colors whitespace-nowrap font-medium ${
                chartView === 'anomalies'
                  ? 'bg-slate-950 text-white dark:bg-cyan-500 dark:text-slate-950 font-semibold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white'
              }`}
            >
              Annual Anomaly Bars (Δ)
            </button>
          </div>

          {chartView === 'series' && (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => setShowTrendLine(!showTrendLine)}
                className={`px-2.5 py-1 rounded-xs transition-colors whitespace-nowrap shrink-0 border font-mono text-[11px] ${
                  showTrendLine
                    ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300 border-amber-500/50 font-semibold'
                    : 'text-slate-500 border-slate-200 dark:border-[#1E2638]'
                }`}
              >
                Sen&apos;s Trend
              </button>
              <button
                type="button"
                onClick={() => setShowMovingAvg(!showMovingAvg)}
                className={`px-2.5 py-1 rounded-xs transition-colors whitespace-nowrap shrink-0 border font-mono text-[11px] ${
                  showMovingAvg
                    ? 'bg-cyan-500/15 text-cyan-700 dark:text-cyan-300 border-cyan-500/50 font-semibold'
                    : 'text-slate-500 border-slate-200 dark:border-[#1E2638]'
                }`}
              >
                12M Avg
              </button>
              <button
                type="button"
                onClick={() => setShowConfidence(!showConfidence)}
                className={`px-2.5 py-1 rounded-xs transition-colors whitespace-nowrap shrink-0 border font-mono text-[11px] ${
                  showConfidence
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 border-slate-900 dark:border-white font-semibold'
                    : 'text-slate-500 border-slate-200 dark:border-[#1E2638]'
                }`}
              >
                95% CI Cone
              </button>
            </div>
          )}
        </div>
      </div>

      {/* 5-Column Quantitative Telemetry Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 bg-slate-50 dark:bg-[#111622] border border-slate-200 dark:border-[#1E2638] rounded-xs p-3.5 font-mono text-xs">
        <div>
          <span className="text-[10px] uppercase text-slate-500 block">Period Mean</span>
          <span className="text-sm font-bold tabular-nums text-slate-950 dark:text-white mt-0.5 block">
            {stats.mean.toFixed(2)} {unit}
          </span>
        </div>
        <div>
          <span className="text-[10px] uppercase text-slate-500 block">Observed Min</span>
          <span className="text-sm font-bold tabular-nums text-cyan-600 dark:text-cyan-400 mt-0.5 block">
            {stats.min.toFixed(2)} {unit}{' '}
            <span className="text-[10px] font-normal text-slate-500">
              ({stats.minObs?.timestamp || ''})
            </span>
          </span>
        </div>
        <div>
          <span className="text-[10px] uppercase text-slate-500 block">Observed Max</span>
          <span className="text-sm font-bold tabular-nums text-rose-600 dark:text-rose-400 mt-0.5 block">
            {stats.max.toFixed(2)} {unit}{' '}
            <span className="text-[10px] font-normal text-slate-500">
              ({stats.maxObs?.timestamp || ''})
            </span>
          </span>
        </div>
        <div>
          <span className="text-[10px] uppercase text-slate-500 block">Latest 12M Avg</span>
          <span className="text-sm font-bold tabular-nums text-slate-950 dark:text-white mt-0.5 block">
            {latestMA !== null && latestMA !== undefined ? `${latestMA.toFixed(2)} ${unit}` : 'N/A'}
          </span>
        </div>
        <div>
          <span className="text-[10px] uppercase text-slate-500 block">Net Period Shift</span>
          <span className="text-sm font-bold tabular-nums text-amber-600 dark:text-amber-400 mt-0.5 block">
            {trendLine
              ? `${trendLine.totalShift >= 0 ? '+' : ''}${trendLine.totalShift.toFixed(2)} ${unit}`
              : '0.00'}
          </span>
        </div>
      </div>

      {/* Main SVG Visualization Stage */}
      {chartView === 'series' ? (
        <div className="relative w-full overflow-x-auto">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="w-full h-auto max-h-[400px] select-none cursor-crosshair"
            onMouseLeave={() => setHoveredIdx(null)}
            onMouseMove={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const mouseX = e.clientX - rect.left;
              const normX = (mouseX / rect.width) * width;
              const relativeX = normX - padding.left;
              if (relativeX >= 0 && relativeX <= chartW) {
                const idx = Math.round((relativeX / chartW) * (validData.length - 1));
                setHoveredIdx(Math.max(0, Math.min(validData.length - 1, idx)));
              }
            }}
          >
            <defs>
              <linearGradient id="obsAreaGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#06B6D4" stopOpacity="0.16" />
                <stop offset="100%" stopColor="#06B6D4" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Horizontal Grid Lines & Y-Axis Ticks */}
            {yTicks.map((tickVal, i) => (
              <g key={`ytick-${i}`}>
                <line
                  x1={padding.left}
                  y1={getY(tickVal)}
                  x2={width - padding.right}
                  y2={getY(tickVal)}
                  stroke="currentColor"
                  className="text-slate-200 dark:text-[#1E2638] stroke-[1]"
                  strokeDasharray="3 3"
                />
                <text
                  x={padding.left - 10}
                  y={getY(tickVal) + 4}
                  textAnchor="end"
                  className="text-[10px] font-mono tabular-nums fill-slate-400 dark:fill-slate-500"
                >
                  {tickVal.toFixed(1)}
                </text>
              </g>
            ))}

            {/* Period Mean Reference Line */}
            <line
              x1={padding.left}
              y1={getY(stats.mean)}
              x2={width - padding.right}
              y2={getY(stats.mean)}
              className="stroke-slate-400/50 dark:stroke-slate-600/60 stroke-[1]"
              strokeDasharray="2 4"
            />

            {/* Vertical Year Grid & Ticks */}
            {yearTicks.map((tick, i) => (
              <g key={`xtick-${i}`}>
                <line
                  x1={getX(tick.idx)}
                  y1={padding.top}
                  x2={getX(tick.idx)}
                  y2={height - padding.bottom}
                  stroke="currentColor"
                  className="text-slate-100 dark:text-[#1E2638]/60 stroke-[1]"
                />
                <text
                  x={getX(tick.idx)}
                  y={height - padding.bottom + 18}
                  textAnchor="middle"
                  className="text-[10px] font-mono tabular-nums fill-slate-500 dark:fill-slate-400"
                >
                  {tick.year}
                </text>
              </g>
            ))}

            {/* Shaded Area under Observations */}
            {obsAreaPath && <path d={obsAreaPath} fill="url(#obsAreaGrad)" />}

            {/* 95% Confidence Band Polygon */}
            {showConfidence && trendLine && (
              <polygon
                points={`
                  ${trendLine.x1},${trendLine.yLowerStart}
                  ${trendLine.x2},${trendLine.yLowerEnd}
                  ${trendLine.x2},${trendLine.yUpperEnd}
                  ${trendLine.x1},${trendLine.yUpperStart}
                `}
                className="fill-amber-500/12 dark:fill-amber-500/18"
              />
            )}

            {/* Observed Monthly Series Line */}
            <path
              d={obsPath}
              fill="none"
              className="stroke-slate-400/80 dark:stroke-slate-500 stroke-[1.2]"
            />

            {/* 12-Month Moving Average Curve */}
            {showMovingAvg && (
              <path
                d={maPath}
                fill="none"
                className="stroke-cyan-600 dark:stroke-cyan-400 stroke-[2.2]"
              />
            )}

            {/* Sen's Slope Trend Line */}
            {showTrendLine && trendLine && (
              <line
                x1={trendLine.x1}
                y1={trendLine.y1}
                x2={trendLine.x2}
                y2={trendLine.y2}
                className="stroke-amber-500 dark:stroke-amber-400 stroke-[2.4]"
                strokeDasharray="7 4"
              />
            )}

            {/* Crosshair Probe */}
            {hoveredIdx !== null && activeObs && (
              <g>
                <line
                  x1={getX(hoveredIdx)}
                  y1={padding.top}
                  x2={getX(hoveredIdx)}
                  y2={height - padding.bottom}
                  className="stroke-cyan-500 stroke-1"
                  strokeDasharray="3 3"
                />
                <circle
                  cx={getX(hoveredIdx)}
                  cy={getY(activeObs.value)}
                  r="4.5"
                  className="fill-cyan-500 stroke-white dark:stroke-[#07090E] stroke-2"
                />
              </g>
            )}
          </svg>

          {/* Hover Monospace Telemetry HUD */}
          {activeObs && hoveredIdx !== null && (
            <div
              className="absolute top-3 right-3 pointer-events-none bg-[#07090E]/95 text-white border border-[#1E2638] rounded-xs px-3.5 py-2.5 text-xs font-mono shadow-xl"
              style={{ minWidth: '210px' }}
            >
              <div className="text-cyan-400 text-[10px] uppercase tracking-wider mb-1 font-semibold">
                CROSSHAIR TELEMETRY PROBE
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-slate-400">Timestamp:</span>
                <span className="tabular-nums font-semibold">{activeObs.timestamp}</span>
              </div>
              <div className="flex justify-between gap-4 mt-0.5">
                <span className="text-slate-400">Observed:</span>
                <span className="tabular-nums font-bold text-white">
                  {activeObs.value.toFixed(2)} {unit}
                </span>
              </div>
              <div className="flex justify-between gap-4 mt-0.5">
                <span className="text-slate-400">Anomaly vs Mean:</span>
                <span
                  className={`tabular-nums font-semibold ${
                    activeObs.value - stats.mean >= 0 ? 'text-amber-400' : 'text-cyan-400'
                  }`}
                >
                  {activeObs.value - stats.mean >= 0 ? '+' : ''}
                  {(activeObs.value - stats.mean).toFixed(2)} {unit}
                </span>
              </div>
              {movingAvgData[hoveredIdx] !== null && (
                <div className="flex justify-between gap-4 mt-0.5 text-cyan-300">
                  <span className="text-slate-400">12M Moving Avg:</span>
                  <span className="tabular-nums">
                    {movingAvgData[hoveredIdx]?.toFixed(2)} {unit}
                  </span>
                </div>
              )}
              {sensSlope && (
                <div className="flex justify-between gap-4 mt-0.5 text-amber-400">
                  <span className="text-slate-400">Sen&apos;s Trend Est:</span>
                  <span className="tabular-nums">
                    {(sensSlope.intercept + sensSlope.slope * hoveredIdx).toFixed(2)} {unit}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>
      ) : (
        /* Mode 2: Annual Anomaly Decomposition Bar Chart */
        <div className="relative w-full overflow-x-auto">
          <svg
            viewBox={`0 0 ${width} ${height}`}
            className="w-full h-auto max-h-[400px] select-none"
          >
            {(() => {
              const maxAbsAnomaly = Math.max(
                ...annualAnomalies.map((a) => Math.abs(a.anomaly)),
                0.5
              );
              const zeroY = padding.top + chartH / 2;
              const barSlotW = chartW / Math.max(1, annualAnomalies.length);
              const barW = Math.max(4, barSlotW * 0.68);

              return (
                <>
                  {/* Zero Baseline Reference */}
                  <line
                    x1={padding.left}
                    y1={zeroY}
                    x2={width - padding.right}
                    y2={zeroY}
                    className="stroke-slate-400 dark:stroke-slate-600 stroke-[1.2]"
                  />
                  <text
                    x={padding.left - 10}
                    y={zeroY + 4}
                    textAnchor="end"
                    className="text-[10px] font-mono fill-slate-500"
                  >
                    0.0 Δ
                  </text>
                  <text
                    x={padding.left - 10}
                    y={padding.top + 8}
                    textAnchor="end"
                    className="text-[10px] font-mono fill-amber-500"
                  >
                    +{maxAbsAnomaly.toFixed(1)}
                  </text>
                  <text
                    x={padding.left - 10}
                    y={padding.top + chartH}
                    textAnchor="end"
                    className="text-[10px] font-mono fill-cyan-500"
                  >
                    -{maxAbsAnomaly.toFixed(1)}
                  </text>

                  {annualAnomalies.map((item, idx) => {
                    const x = padding.left + idx * barSlotW + (barSlotW - barW) / 2;
                    const normH = (Math.abs(item.anomaly) / maxAbsAnomaly) * (chartH / 2 - 10);
                    const y = item.anomaly >= 0 ? zeroY - normH : zeroY;
                    const isPositive = item.anomaly >= 0;

                    return (
                      <g key={item.year}>
                        <rect
                          x={x}
                          y={y}
                          width={barW}
                          height={Math.max(2, normH)}
                          className={
                            isPositive
                              ? 'fill-amber-500/85 hover:fill-amber-400 transition-colors'
                              : 'fill-cyan-500/85 hover:fill-cyan-400 transition-colors'
                          }
                        >
                          <title>
                            {item.year}: Mean {item.mean.toFixed(2)} {unit} (Anomaly:{' '}
                            {item.anomaly >= 0 ? '+' : ''}
                            {item.anomaly.toFixed(2)} {unit})
                          </title>
                        </rect>
                        {(idx % 3 === 0 || idx === annualAnomalies.length - 1) && (
                          <text
                            x={x + barW / 2}
                            y={height - padding.bottom + 18}
                            textAnchor="middle"
                            className="text-[10px] font-mono fill-slate-500 dark:fill-slate-400"
                          >
                            {item.year}
                          </text>
                        )}
                      </g>
                    );
                  })}
                </>
              );
            })()}
          </svg>
        </div>
      )}

      {/* Bottom Telemetry Legend */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-slate-200 dark:border-[#1E2638] text-xs text-slate-500">
        <div className="flex flex-wrap items-center gap-5">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-slate-400 inline-block" />
            <span>Monthly Observations ({validData.length} pts)</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-cyan-500 inline-block" />
            <span>12-Month Moving Average</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-amber-500 border-dashed border-t inline-block" />
            <span>Theil-Sen Robust Median Slope</span>
          </span>
        </div>
        <div className="font-mono text-[11px] tabular-nums">
          Domain Bounds: [{minVal.toFixed(1)}, {maxVal.toFixed(1)}] {unit}
        </div>
      </div>
    </div>
  );
};
