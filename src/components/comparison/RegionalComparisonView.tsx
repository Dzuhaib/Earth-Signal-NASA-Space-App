/**
 * EarthSignal — Inter-Regional Comparative Telemetry Audit
 * Compares environmental trend slopes, Mann-Kendall significance, and multi-decadal
 * trajectories between two geographical regions with a synchronized Dual-Series SVG Chart.
 */

import React, { useState, useEffect, useMemo } from 'react';
import { GitCompare, RefreshCw } from 'lucide-react';
import {
  GeographicRegion,
  EnvironmentalVariableId,
  StatisticalAnalysisResponse,
} from '../../types/earthsignal';
import { ENVIRONMENTAL_VARIABLES } from '../../services/nasa/nasaRegistry';

interface RegionalComparisonViewProps {
  regions: GeographicRegion[];
  defaultPrimaryRegion: GeographicRegion;
  selectedVariable: EnvironmentalVariableId;
}

export const RegionalComparisonView: React.FC<RegionalComparisonViewProps> = ({
  regions,
  defaultPrimaryRegion,
  selectedVariable,
}) => {
  const [primaryId, setPrimaryId] = useState(defaultPrimaryRegion.id);
  const [secondaryId, setSecondaryId] = useState(
    regions.find((r) => r.id !== defaultPrimaryRegion.id)?.id ||
      regions[1]?.id ||
      'pakistan_balochistan'
  );
  const [variable, setVariable] = useState<EnvironmentalVariableId>(selectedVariable);
  const [startYear, setStartYear] = useState<number>(2000);
  const [endYear, setEndYear] = useState<number>(2026);
  const [isLoading, setIsLoading] = useState(false);
  const [comparisonResult, setComparisonResult] = useState<{
    primary_analysis: StatisticalAnalysisResponse;
    secondary_analysis: StatisticalAnalysisResponse;
    comparison: {
      variable: string;
      slope_difference_per_decade: number;
      relative_ratio: number;
      both_significant: boolean;
      summary: string;
    };
  } | null>(null);

  useEffect(() => {
    setVariable(selectedVariable);
  }, [selectedVariable]);

  const runComparison = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/v1/analysis/compare', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          primary_region_id: primaryId,
          secondary_region_id: secondaryId,
          variable,
          start_year: startYear,
          end_year: endYear,
        }),
      });
      const data = await res.json();
      if (data.status === 'success') {
        setComparisonResult(data);
      }
    } catch (err) {
      console.error('Comparison error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    runComparison();
  }, [primaryId, secondaryId, variable, startYear, endYear]);

  // Dual-Series Chart Geometry
  const dualChartData = useMemo(() => {
    if (!comparisonResult) return null;
    const pObs = comparisonResult.primary_analysis.observations.filter(
      (d) => !d.is_missing && !isNaN(d.value)
    );
    const sObs = comparisonResult.secondary_analysis.observations.filter(
      (d) => !d.is_missing && !isNaN(d.value)
    );
    if (pObs.length < 2 || sObs.length < 2) return null;

    // Compute 12-month moving average for smoother visual overlay
    const computeMA = (arr: typeof pObs) => {
      const out: { year: number; timestamp: string; val: number }[] = [];
      for (let i = 11; i < arr.length; i++) {
        let sum = 0;
        for (let k = i - 11; k <= i; k++) sum += arr[k].value;
        out.push({
          year: arr[i].year,
          timestamp: arr[i].timestamp,
          val: sum / 12,
        });
      }
      return out.length > 0
        ? out
        : arr.map((x) => ({ year: x.year, timestamp: x.timestamp, val: x.value }));
    };

    const pMA = computeMA(pObs);
    const sMA = computeMA(sObs);
    const allVals = [...pMA.map((d) => d.val), ...sMA.map((d) => d.val)];
    const minV = Math.min(...allVals);
    const maxV = Math.max(...allVals);
    const pad = (maxV - minV) * 0.12 || 1;
    return {
      pMA,
      sMA,
      minVal: minV - pad,
      maxVal: maxV + pad,
    };
  }, [comparisonResult]);

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 py-8 space-y-6">
      {/* Header & Selector Matrix */}
      <div className="bg-white dark:bg-[#0D111A] border border-slate-200 dark:border-[#1E2638] rounded-sm p-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-[#1E2638]">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-cyan-600 dark:text-cyan-400 mb-1">
              <GitCompare className="w-3.5 h-3.5" />
              <span>INTER-REGIONAL COMPARATIVE TELEMETRY AUDIT</span>
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-950 dark:text-white">
              Compare Regional Trajectories &amp; Slopes
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-2xl">
              Evaluate side-by-side Theil-Sen rates of change, Mann-Kendall significance, and 12-month moving average curves across any two provinces or global sentinel benchmarks.
            </p>
          </div>

          <button
            type="button"
            onClick={runComparison}
            disabled={isLoading}
            className="px-4 py-2 text-xs font-semibold rounded-sm bg-slate-950 text-white hover:bg-slate-800 dark:bg-cyan-500 dark:text-slate-950 dark:hover:bg-cyan-400 transition-colors inline-flex items-center gap-1.5 whitespace-nowrap shrink-0"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>{isLoading ? 'Computing Audit...' : 'Recalculate Comparison'}</span>
          </button>
        </div>

        {/* Region & Variable Selectors */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-[10px] font-mono uppercase tracking-wider text-cyan-600 dark:text-cyan-400 block mb-1.5 font-semibold">
              Primary Region (Channel A — Cyan)
            </label>
            <select
              value={primaryId}
              onChange={(e) => setPrimaryId(e.target.value)}
              className="w-full bg-slate-50 dark:bg-[#111622] border border-slate-200 dark:border-[#1E2638] rounded-xs px-3 py-2 text-xs text-slate-950 dark:text-white font-medium"
            >
              {regions.map((r) => (
                <option key={`p-${r.id}`} value={r.id}>
                  {r.name} ({r.country}) {r.is_flagship ? '· Flagship' : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] font-mono uppercase tracking-wider text-amber-600 dark:text-amber-400 block mb-1.5 font-semibold">
              Comparator Region (Channel B — Amber)
            </label>
            <select
              value={secondaryId}
              onChange={(e) => setSecondaryId(e.target.value)}
              className="w-full bg-slate-50 dark:bg-[#111622] border border-slate-200 dark:border-[#1E2638] rounded-xs px-3 py-2 text-xs text-slate-950 dark:text-white font-medium"
            >
              {regions.map((r) => (
                <option key={`s-${r.id}`} value={r.id}>
                  {r.name} ({r.country})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] font-mono uppercase tracking-wider text-slate-500 block mb-1.5 font-semibold">
              Environmental Parameter
            </label>
            <select
              value={variable}
              onChange={(e) => setVariable(e.target.value as EnvironmentalVariableId)}
              className="w-full bg-slate-50 dark:bg-[#111622] border border-slate-200 dark:border-[#1E2638] rounded-xs px-3 py-2 text-xs text-slate-950 dark:text-white font-medium"
            >
              {Object.values(ENVIRONMENTAL_VARIABLES).map((v) => (
                <option key={v.id} value={v.id}>
                  {v.id} · {v.name} ({v.unit})
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Time Span / Year Range Selectors */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-200 dark:border-[#1E2638]">
          <div>
            <label className="text-[10px] font-mono uppercase tracking-wider text-slate-500 block mb-1.5 font-semibold">
              Start Year (Baseline Ingest)
            </label>
            <select
              value={startYear}
              onChange={(e) => setStartYear(parseInt(e.target.value, 10))}
              className="w-full bg-slate-50 dark:bg-[#111622] border border-slate-200 dark:border-[#1E2638] rounded-xs px-3 py-2 text-xs text-slate-950 dark:text-white font-medium"
            >
              {[1981, 1985, 1990, 1995, 2000, 2005, 2010, 2015, 2020].map((y) => (
                <option key={`sy-${y}`} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[10px] font-mono uppercase tracking-wider text-slate-500 block mb-1.5 font-semibold">
              End Year (Latest Telemetry)
            </label>
            <select
              value={endYear}
              onChange={(e) => setEndYear(parseInt(e.target.value, 10))}
              className="w-full bg-slate-50 dark:bg-[#111622] border border-slate-200 dark:border-[#1E2638] rounded-xs px-3 py-2 text-xs text-slate-950 dark:text-white font-medium"
            >
              {[2020, 2022, 2024, 2025, 2026].map((y) => (
                <option key={`ey-${y}`} value={y}>
                  {y} {y === 2026 ? '· Latest Real-Time' : ''}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {comparisonResult && (
        <div className="space-y-6">
          {/* 3-Column Differential Scorecard + Executive Synthesis */}
          <div className="bg-white dark:bg-[#0D111A] border border-slate-200 dark:border-[#1E2638] rounded-sm p-6 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pb-5 border-b border-slate-200 dark:border-[#1E2638] font-mono">
              <div className="bg-slate-50 dark:bg-[#111622] p-4 rounded-xs border border-slate-200 dark:border-[#1E2638]">
                <span className="text-[10px] uppercase text-slate-500 block">
                  DECADAL SLOPE DIFFERENTIAL (Δ)
                </span>
                <span className="text-2xl font-bold tabular-nums text-slate-950 dark:text-white mt-1 block">
                  {comparisonResult.comparison.slope_difference_per_decade > 0 ? '+' : ''}
                  {comparisonResult.comparison.slope_difference_per_decade.toFixed(3)}{' '}
                  <span className="text-xs font-normal text-slate-500">
                    {comparisonResult.primary_analysis.slope_unit}
                  </span>
                </span>
              </div>

              <div className="bg-slate-50 dark:bg-[#111622] p-4 rounded-xs border border-slate-200 dark:border-[#1E2638]">
                <span className="text-[10px] uppercase text-slate-500 block">
                  RELATIVE DRIFT RATIO (A / B)
                </span>
                <span className="text-2xl font-bold tabular-nums text-cyan-600 dark:text-cyan-400 mt-1 block">
                  {comparisonResult.comparison.relative_ratio.toFixed(2)}×
                </span>
              </div>

              <div className="bg-slate-50 dark:bg-[#111622] p-4 rounded-xs border border-slate-200 dark:border-[#1E2638]">
                <span className="text-[10px] uppercase text-slate-500 block">
                  CONCURRENT SIGNIFICANCE
                </span>
                <span
                  className={`text-lg font-bold mt-1.5 block ${
                    comparisonResult.comparison.both_significant
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-amber-600 dark:text-amber-400'
                  }`}
                >
                  {comparisonResult.comparison.both_significant
                    ? '● Both Confirmed (p < 0.05)'
                    : '▲ Divergent Significance'}
                </span>
              </div>
            </div>

            <div>
              <span className="text-[10px] font-mono text-cyan-600 dark:text-cyan-400 uppercase tracking-wider block mb-1 font-semibold">
                COMPARATIVE EMPIRICAL SYNTHESIS
              </span>
              <p className="text-sm text-slate-800 dark:text-slate-200 leading-relaxed">
                {comparisonResult.comparison.summary}
              </p>
            </div>
          </div>

          {/* Dual-Region Overlay SVG Time Series Chart */}
          {dualChartData && (
            <div className="bg-white dark:bg-[#0D111A] border border-slate-200 dark:border-[#1E2638] rounded-sm p-6 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-4 pb-3 border-b border-slate-200 dark:border-[#1E2638]">
                <div>
                  <h3 className="font-display text-base font-bold text-slate-950 dark:text-white">
                    Synchronized 12-Month Moving Average Trajectory Overlay
                  </h3>
                  <p className="text-xs font-mono text-slate-500">
                    Comparing {comparisonResult.primary_analysis.location.name} vs{' '}
                    {comparisonResult.secondary_analysis.location.name} (
                    {comparisonResult.primary_analysis.unit})
                  </p>
                </div>

                <div className="flex items-center gap-5 text-xs font-mono">
                  <span className="flex items-center gap-2 text-cyan-600 dark:text-cyan-400 font-semibold">
                    <span className="w-3.5 h-0.5 bg-cyan-500 inline-block" />
                    {comparisonResult.primary_analysis.location.name}
                  </span>
                  <span className="flex items-center gap-2 text-amber-600 dark:text-amber-400 font-semibold">
                    <span className="w-3.5 h-0.5 bg-amber-500 inline-block" />
                    {comparisonResult.secondary_analysis.location.name}
                  </span>
                </div>
              </div>

              <div className="w-full overflow-x-auto">
                {(() => {
                  const w = 920;
                  const h = 280;
                  const pad = { top: 20, right: 28, bottom: 36, left: 58 };
                  const cw = w - pad.left - pad.right;
                  const ch = h - pad.top - pad.bottom;
                  const { pMA, sMA, minVal, maxVal } = dualChartData;

                  const getX = (i: number, len: number) =>
                    pad.left + (i / Math.max(1, len - 1)) * cw;
                  const getY = (v: number) =>
                    pad.top + ch - ((v - minVal) / (maxVal - minVal || 1)) * ch;

                  const pPath = pMA
                    .map(
                      (pt, i) =>
                        `${i === 0 ? 'M' : 'L'} ${getX(i, pMA.length).toFixed(1)} ${getY(
                          pt.val
                        ).toFixed(1)}`
                    )
                    .join(' ');
                  const sPath = sMA
                    .map(
                      (pt, i) =>
                        `${i === 0 ? 'M' : 'L'} ${getX(i, sMA.length).toFixed(1)} ${getY(
                          pt.val
                        ).toFixed(1)}`
                    )
                    .join(' ');

                  const yTicks = [0, 0.25, 0.5, 0.75, 1].map(
                    (f) => minVal + (maxVal - minVal) * f
                  );

                  return (
                    <svg viewBox={`0 0 ${w} ${h}`} className="w-full h-auto max-h-[300px]">
                      {yTicks.map((tv, idx) => (
                        <g key={idx}>
                          <line
                            x1={pad.left}
                            y1={getY(tv)}
                            x2={w - pad.right}
                            y2={getY(tv)}
                            stroke="currentColor"
                            className="text-slate-200 dark:text-[#1E2638]"
                            strokeDasharray="3 3"
                          />
                          <text
                            x={pad.left - 8}
                            y={getY(tv) + 4}
                            textAnchor="end"
                            className="text-[10px] font-mono fill-slate-400 tabular-nums"
                          >
                            {tv.toFixed(1)}
                          </text>
                        </g>
                      ))}

                      <path
                        d={pPath}
                        fill="none"
                        className="stroke-cyan-500 stroke-[2.2]"
                      />
                      <path
                        d={sPath}
                        fill="none"
                        className="stroke-amber-500 stroke-[2.2]"
                      />
                    </svg>
                  );
                })()}
              </div>
            </div>
          )}

          {/* Side-by-Side Statistical Comparison Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Primary Region Card */}
            <div className="bg-white dark:bg-[#0D111A] border border-slate-200 dark:border-[#1E2638] rounded-sm p-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-[#1E2638]">
                <div>
                  <span className="text-[10px] font-mono uppercase text-cyan-600 dark:text-cyan-400 font-bold block">
                    CHANNEL A · PRIMARY TARGET
                  </span>
                  <h3 className="font-display text-lg font-bold text-slate-950 dark:text-white">
                    {comparisonResult.primary_analysis.location.name}
                  </h3>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-500 font-mono tabular-nums">
                    {comparisonResult.primary_analysis.location.latitude.toFixed(2)}°N,{' '}
                    {comparisonResult.primary_analysis.location.longitude.toFixed(2)}°E
                  </span>
                </div>
              </div>

              <div className="space-y-4 mt-5">
                <div>
                  <span className="text-xs text-slate-500 block mb-1">
                    Rate of Change (Theil-Sen Median Slope)
                  </span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-3xl font-bold font-mono tabular-nums text-slate-950 dark:text-white">
                      {comparisonResult.primary_analysis.slope_per_decade > 0 ? '+' : ''}
                      {comparisonResult.primary_analysis.slope_per_decade}
                    </span>
                    <span className="text-xs font-mono text-slate-500">
                      {comparisonResult.primary_analysis.slope_unit}
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-500 block mt-1 tabular-nums">
                    95% CI: [{comparisonResult.primary_analysis.confidence_interval.lower},{' '}
                    {comparisonResult.primary_analysis.confidence_interval.upper}]
                  </span>
                </div>

                <div className="pt-3 border-t border-slate-200 dark:border-[#1E2638] divide-y divide-slate-100 dark:divide-[#1E2638] text-xs">
                  <div className="flex justify-between py-2">
                    <span className="text-slate-500">Mann-Kendall p-value:</span>
                    <span className="font-mono tabular-nums font-semibold text-slate-950 dark:text-white">
                      {comparisonResult.primary_analysis.p_value.toFixed(5)}
                    </span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-slate-500">Significance (α = 0.05):</span>
                    <span
                      className={`font-semibold ${
                        comparisonResult.primary_analysis.is_significant
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-amber-600 dark:text-amber-400'
                      }`}
                    >
                      {comparisonResult.primary_analysis.is_significant
                        ? '● Confirmed Significant'
                        : '▲ Not Significant'}
                    </span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-slate-500">Kendall’s Tau (τ):</span>
                    <span className="font-mono tabular-nums text-slate-950 dark:text-white">
                      {comparisonResult.primary_analysis.mann_kendall.kendall_tau.toFixed(4)}
                    </span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-slate-500">Sample Size:</span>
                    <span className="font-mono tabular-nums text-slate-950 dark:text-white">
                      {comparisonResult.primary_analysis.sample_size} months
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Secondary Region Card */}
            <div className="bg-white dark:bg-[#0D111A] border border-slate-200 dark:border-[#1E2638] rounded-sm p-6">
              <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-[#1E2638]">
                <div>
                  <span className="text-[10px] font-mono uppercase text-amber-600 dark:text-amber-400 font-bold block">
                    CHANNEL B · COMPARATOR TARGET
                  </span>
                  <h3 className="font-display text-lg font-bold text-slate-950 dark:text-white">
                    {comparisonResult.secondary_analysis.location.name}
                  </h3>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-500 font-mono tabular-nums">
                    {comparisonResult.secondary_analysis.location.latitude.toFixed(2)}°N,{' '}
                    {comparisonResult.secondary_analysis.location.longitude.toFixed(2)}°E
                  </span>
                </div>
              </div>

              <div className="space-y-4 mt-5">
                <div>
                  <span className="text-xs text-slate-500 block mb-1">
                    Rate of Change (Theil-Sen Median Slope)
                  </span>
                  <div className="flex items-baseline gap-1.5">
                    <span className="text-3xl font-bold font-mono tabular-nums text-slate-950 dark:text-white">
                      {comparisonResult.secondary_analysis.slope_per_decade > 0 ? '+' : ''}
                      {comparisonResult.secondary_analysis.slope_per_decade}
                    </span>
                    <span className="text-xs font-mono text-slate-500">
                      {comparisonResult.secondary_analysis.slope_unit}
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-500 block mt-1 tabular-nums">
                    95% CI: [{comparisonResult.secondary_analysis.confidence_interval.lower},{' '}
                    {comparisonResult.secondary_analysis.confidence_interval.upper}]
                  </span>
                </div>

                <div className="pt-3 border-t border-slate-200 dark:border-[#1E2638] divide-y divide-slate-100 dark:divide-[#1E2638] text-xs">
                  <div className="flex justify-between py-2">
                    <span className="text-slate-500">Mann-Kendall p-value:</span>
                    <span className="font-mono tabular-nums font-semibold text-slate-950 dark:text-white">
                      {comparisonResult.secondary_analysis.p_value.toFixed(5)}
                    </span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-slate-500">Significance (α = 0.05):</span>
                    <span
                      className={`font-semibold ${
                        comparisonResult.secondary_analysis.is_significant
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-amber-600 dark:text-amber-400'
                      }`}
                    >
                      {comparisonResult.secondary_analysis.is_significant
                        ? '● Confirmed Significant'
                        : '▲ Not Significant'}
                    </span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-slate-500">Kendall’s Tau (τ):</span>
                    <span className="font-mono tabular-nums text-slate-950 dark:text-white">
                      {comparisonResult.secondary_analysis.mann_kendall.kendall_tau.toFixed(4)}
                    </span>
                  </div>
                  <div className="flex justify-between py-2">
                    <span className="text-slate-500">Sample Size:</span>
                    <span className="font-mono tabular-nums text-slate-950 dark:text-white">
                      {comparisonResult.secondary_analysis.sample_size} months
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
