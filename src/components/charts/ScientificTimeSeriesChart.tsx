/**
 * EarthSignal — Scientific Time Series Chart
 * High-precision SVG visualization featuring:
 * - Observed time series
 * - Sen's Slope robust median trend line
 * - 95% Confidence ribbon
 * - 12-Month moving average
 * - Interactive hairline crosshair probe with tabular monospace HUD
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
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);
  const [showMovingAvg, setShowMovingAvg] = useState(true);
  const [showTrendLine, setShowTrendLine] = useState(true);
  const [showConfidence, setShowConfidence] = useState(true);

  // Filter valid data
  const validData = useMemo(() => {
    return observations.filter((d) => !d.is_missing && !isNaN(d.value));
  }, [observations]);

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

  // Dimensions
  const width = 900;
  const height = 360;
  const padding = { top: 24, right: 30, bottom: 44, left: 60 };
  const chartW = width - padding.left - padding.right;
  const chartH = height - padding.top - padding.bottom;

  // Min and Max values
  const { minVal, maxVal } = useMemo(() => {
    if (validData.length === 0) return { minVal: 0, maxVal: 100 };
    const vals = validData.map((d) => d.value);
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    const buffer = (max - min) * 0.1 || 1;
    return {
      minVal: min - buffer,
      maxVal: max + buffer,
    };
  }, [validData]);

  // Scale functions
  const getX = (idx: number) => padding.left + (idx / Math.max(1, validData.length - 1)) * chartW;
  const getY = (val: number) => padding.top + chartH - ((val - minVal) / (maxVal - minVal || 1)) * chartH;

  // Generate SVG path for observations
  const obsPath = useMemo(() => {
    if (validData.length === 0) return '';
    return validData
      .map((d, i) => `${i === 0 ? 'M' : 'L'} ${getX(i).toFixed(1)} ${getY(d.value).toFixed(1)}`)
      .join(' ');
  }, [validData, minVal, maxVal]);

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
      yLowerStart: getY(sensSlope.intercept + sensSlope.confidence_interval.lower * 0),
      yLowerEnd: getY(sensSlope.intercept + sensSlope.confidence_interval.lower * (n - 1)),
      yUpperStart: getY(sensSlope.intercept + sensSlope.confidence_interval.upper * 0),
      yUpperEnd: getY(sensSlope.intercept + sensSlope.confidence_interval.upper * (n - 1)),
    };
  }, [sensSlope, validData, minVal, maxVal]);

  // Year tick marks
  const yearTicks = useMemo(() => {
    if (validData.length === 0) return [];
    const ticks: { idx: number; year: number }[] = [];
    let lastYear = -1;
    validData.forEach((d, i) => {
      if (d.year !== lastYear && (d.year % 5 === 0 || i === 0 || i === validData.length - 1)) {
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

  const activeObs = hoveredIdx !== null && validData[hoveredIdx] ? validData[hoveredIdx] : null;

  return (
    <div className="w-full bg-white dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 rounded-xl p-5 shadow-xs transition-colors">
      {/* Header controls & Legend */}
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4 pb-3 border-b border-slate-100 dark:border-slate-800/80">
        <div>
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
            {locationName} — {variableName} Historical Series
          </h3>
          <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            <span>{validData.length} Valid Observations</span>
            <span aria-hidden="true">·</span>
            <span>Monthly Sampling</span>
            <span aria-hidden="true">·</span>
            <span>Unit: {unit}</span>
          </div>
        </div>

        {/* Layer Toggles */}
        <div className="flex items-center gap-2 text-xs">
          <button
            onClick={() => setShowTrendLine(!showTrendLine)}
            className={`px-2.5 py-1 rounded transition-colors whitespace-nowrap shrink-0 border ${
              showTrendLine
                ? 'bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30'
                : 'text-slate-500 border-slate-200 dark:border-slate-800'
            }`}
          >
            Sen's Trend Line
          </button>
          <button
            onClick={() => setShowMovingAvg(!showMovingAvg)}
            className={`px-2.5 py-1 rounded transition-colors whitespace-nowrap shrink-0 border ${
              showMovingAvg
                ? 'bg-cyan-500/10 text-cyan-700 dark:text-cyan-400 border-cyan-500/30'
                : 'text-slate-500 border-slate-200 dark:border-slate-800'
            }`}
          >
            12M Moving Avg
          </button>
          <button
            onClick={() => setShowConfidence(!showConfidence)}
            className={`px-2.5 py-1 rounded transition-colors whitespace-nowrap shrink-0 border ${
              showConfidence
                ? 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/30'
                : 'text-slate-500 border-slate-200 dark:border-slate-800'
            }`}
          >
            95% Confidence Band
          </button>
        </div>
      </div>

      {/* SVG Canvas */}
      <div className="relative w-full overflow-x-auto">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto max-h-[380px] select-none"
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
          {/* Horizontal Grid lines */}
          {yTicks.map((tickVal, i) => (
            <g key={`ytick-${i}`}>
              <line
                x1={padding.left}
                y1={getY(tickVal)}
                x2={width - padding.right}
                y2={getY(tickVal)}
                stroke="currentColor"
                className="text-slate-200 dark:text-slate-800 stroke-[1]"
                strokeDasharray="4 4"
              />
              <text
                x={padding.left - 8}
                y={getY(tickVal) + 4}
                textAnchor="end"
                className="text-[10px] font-mono tabular-nums fill-slate-400 dark:fill-slate-500"
              >
                {tickVal.toFixed(1)}
              </text>
            </g>
          ))}

          {/* Vertical Year Grid & Ticks */}
          {yearTicks.map((tick, i) => (
            <g key={`xtick-${i}`}>
              <line
                x1={getX(tick.idx)}
                y1={padding.top}
                x2={getX(tick.idx)}
                y2={height - padding.bottom}
                stroke="currentColor"
                className="text-slate-100 dark:text-slate-800/40 stroke-[1]"
              />
              <text
                x={getX(tick.idx)}
                y={height - padding.bottom + 16}
                textAnchor="middle"
                className="text-[10px] font-mono tabular-nums fill-slate-400 dark:fill-slate-500"
              >
                {tick.year}
              </text>
            </g>
          ))}

          {/* 95% Confidence Band Polygon */}
          {showConfidence && trendLine && (
            <polygon
              points={`
                ${trendLine.x1},${trendLine.yLowerStart}
                ${trendLine.x2},${trendLine.yLowerEnd}
                ${trendLine.x2},${trendLine.yUpperEnd}
                ${trendLine.x1},${trendLine.yUpperStart}
              `}
              className="fill-amber-500/10 dark:fill-amber-500/15"
            />
          )}

          {/* Observed values line */}
          <path
            d={obsPath}
            fill="none"
            className="stroke-slate-400/60 dark:stroke-slate-500/60 stroke-[1.25]"
          />

          {/* 12-Month Moving Average */}
          {showMovingAvg && (
            <path
              d={maPath}
              fill="none"
              className="stroke-cyan-500 dark:stroke-cyan-400 stroke-2"
            />
          )}

          {/* Sen's Slope Trend Line */}
          {showTrendLine && trendLine && (
            <line
              x1={trendLine.x1}
              y1={trendLine.y1}
              x2={trendLine.x2}
              y2={trendLine.y2}
              className="stroke-amber-500 dark:stroke-amber-400 stroke-[2.25]"
              strokeDasharray="6 3"
            />
          )}

          {/* Crosshair probe */}
          {hoveredIdx !== null && activeObs && (
            <g>
              <line
                x1={getX(hoveredIdx)}
                y1={padding.top}
                x2={getX(hoveredIdx)}
                y2={height - padding.bottom}
                className="stroke-cyan-500/80 stroke-1"
                strokeDasharray="3 3"
              />
              <circle
                cx={getX(hoveredIdx)}
                cy={getY(activeObs.value)}
                r="4.5"
                className="fill-cyan-500 stroke-white dark:stroke-slate-900 stroke-2"
              />
            </g>
          )}
        </svg>

        {/* Hover Monospace Tooltip HUD */}
        {activeObs && hoveredIdx !== null && (
          <div
            className="absolute top-4 right-4 pointer-events-none bg-slate-950/90 text-white border border-slate-700/80 rounded-lg px-3 py-2 text-xs shadow-lg backdrop-blur-md font-mono"
            style={{ minWidth: '180px' }}
          >
            <div className="text-slate-400 text-[10px] uppercase tracking-wider mb-1">
              OBSERVATION PROBE
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-slate-400">Date:</span>
              <span className="tabular-nums font-semibold">{activeObs.timestamp}</span>
            </div>
            <div className="flex justify-between gap-4 mt-0.5">
              <span className="text-slate-400">Value:</span>
              <span className="tabular-nums font-semibold text-cyan-400">
                {activeObs.value.toFixed(2)} {unit}
              </span>
            </div>
            {movingAvgData[hoveredIdx] !== null && (
              <div className="flex justify-between gap-4 mt-0.5 text-slate-300">
                <span className="text-slate-400">12M Avg:</span>
                <span className="tabular-nums">
                  {movingAvgData[hoveredIdx]?.toFixed(2)} {unit}
                </span>
              </div>
            )}
            {sensSlope && (
              <div className="flex justify-between gap-4 mt-0.5 text-amber-400">
                <span className="text-slate-400">Sen's Est:</span>
                <span className="tabular-nums">
                  {(sensSlope.intercept + sensSlope.slope * hoveredIdx).toFixed(2)} {unit}
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Bottom telemetry legend */}
      <div className="flex flex-wrap items-center justify-between gap-4 mt-3 pt-3 border-t border-slate-100 dark:border-slate-800/80 text-xs text-slate-500 dark:text-slate-400">
        <div className="flex items-center gap-4">
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-slate-400 inline-block"></span>
            Raw Monthly
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-cyan-500 inline-block"></span>
            12-Month Moving Avg
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-3 h-0.5 bg-amber-500 border-dashed border-t inline-block"></span>
            Sen's Robust Median Trend
          </span>
        </div>
        <div className="font-mono text-[11px] tabular-nums">
          Y-Axis: [{minVal.toFixed(1)}, {maxVal.toFixed(1)}] {unit}
        </div>
      </div>
    </div>
  );
};
