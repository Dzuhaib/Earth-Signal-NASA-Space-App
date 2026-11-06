/**
 * EarthSignal — Regional Comparison View
 * Allows comparative scientific trend evaluation between two geographical regions.
 */

import React, { useState, useEffect } from 'react';
import {
  GitCompare,
  TrendingUp,
  TrendingDown,
  Minus,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  MapPin,
  Layers,
} from 'lucide-react';
import { GeographicRegion, EnvironmentalVariableId, StatisticalAnalysisResponse } from '../../types/earthsignal';
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
    regions.find((r) => r.id !== defaultPrimaryRegion.id)?.id || regions[1]?.id || 'pakistan_balochistan'
  );
  const [variable, setVariable] = useState<EnvironmentalVariableId>(selectedVariable);
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

  const primaryRegion = regions.find((r) => r.id === primaryId) || regions[0];
  const secondaryRegion = regions.find((r) => r.id === secondaryId) || regions[1];

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
          start_year: 2000,
          end_year: 2024,
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
  }, [primaryId, secondaryId, variable]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-cyan-600 dark:text-cyan-400 mb-1">
              <GitCompare className="w-4 h-4" />
              <span>INTER-REGIONAL COMPARATIVE AUDIT</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Comparative Trend Detective
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
              Compare environmental rates of change between two provinces or global indicator sites to isolate regional climate vulnerabilities and spatial contrasts.
            </p>
          </div>

          <button
            onClick={runComparison}
            disabled={isLoading}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white transition-colors whitespace-nowrap shrink-0 shadow-sm"
          >
            {isLoading ? 'Computing Comparison...' : 'Refresh Comparison'}
          </button>
        </div>

        {/* Region & Variable Selectors */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6 pt-5 border-t border-slate-100 dark:border-slate-800">
          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1.5">
              Primary Region (Target)
            </label>
            <select
              value={primaryId}
              onChange={(e) => setPrimaryId(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white font-medium"
            >
              {regions.map((r) => (
                <option key={`p-${r.id}`} value={r.id}>
                  {r.name} ({r.country}) {r.is_flagship ? '★ Flagship' : ''}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1.5">
              Secondary Region (Comparator)
            </label>
            <select
              value={secondaryId}
              onChange={(e) => setSecondaryId(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white font-medium"
            >
              {regions.map((r) => (
                <option key={`s-${r.id}`} value={r.id}>
                  {r.name} ({r.country})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1.5">
              Environmental Parameter
            </label>
            <select
              value={variable}
              onChange={(e) => setVariable(e.target.value as EnvironmentalVariableId)}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-lg px-3 py-2 text-xs text-slate-900 dark:text-white font-medium"
            >
              {Object.values(ENVIRONMENTAL_VARIABLES).map((v) => (
                <option key={v.id} value={v.id}>
                  {v.name} ({v.unit})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Comparison Results Card */}
      {comparisonResult && (
        <div className="space-y-6">
          {/* Executive Comparative Synthesis */}
          <div className="bg-slate-900 text-white rounded-xl p-5 border border-slate-800 shadow-sm">
            <span className="text-[11px] font-mono text-cyan-400 uppercase tracking-wider block mb-1">
              SCIENTIFIC COMPARISON SYNTHESIS
            </span>
            <p className="text-sm font-medium leading-relaxed">
              {comparisonResult.comparison.summary}
            </p>
          </div>

          {/* Side-by-Side Comparison Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Primary Region Card */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <span className="text-[10px] font-mono uppercase text-cyan-600 dark:text-cyan-400 font-bold block">
                    PRIMARY REGION
                  </span>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    {comparisonResult.primary_analysis.location.name}
                  </h3>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                    {comparisonResult.primary_analysis.location.latitude.toFixed(2)}°N,{' '}
                    {comparisonResult.primary_analysis.location.longitude.toFixed(2)}°E
                  </span>
                </div>
              </div>

              <div className="space-y-4 mt-5">
                <div>
                  <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1">
                    Rate of Change (Sen’s Slope)
                  </span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
                      {comparisonResult.primary_analysis.slope_per_decade > 0 ? '+' : ''}
                      {comparisonResult.primary_analysis.slope_per_decade}
                    </span>
                    <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                      {comparisonResult.primary_analysis.slope_unit}
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 block mt-1">
                    95% CI: [{comparisonResult.primary_analysis.confidence_interval.lower},{' '}
                    {comparisonResult.primary_analysis.confidence_interval.upper}]
                  </span>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Mann-Kendall p-value:</span>
                    <span className="font-mono tabular-nums font-semibold text-slate-900 dark:text-white">
                      {comparisonResult.primary_analysis.p_value.toFixed(5)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Significance (α = 0.05):</span>
                    <span
                      className={`font-semibold ${
                        comparisonResult.primary_analysis.is_significant
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-amber-600 dark:text-amber-400'
                      }`}
                    >
                      {comparisonResult.primary_analysis.is_significant ? 'Significant' : 'Not Significant'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Kendall’s Tau (τ):</span>
                    <span className="font-mono tabular-nums text-slate-900 dark:text-white">
                      {comparisonResult.primary_analysis.mann_kendall.kendall_tau.toFixed(4)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Sample Size:</span>
                    <span className="font-mono tabular-nums text-slate-900 dark:text-white">
                      {comparisonResult.primary_analysis.sample_size} months
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Secondary Region Card */}
            <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <div>
                  <span className="text-[10px] font-mono uppercase text-slate-500 font-bold block">
                    COMPARATOR REGION
                  </span>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                    {comparisonResult.secondary_analysis.location.name}
                  </h3>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                    {comparisonResult.secondary_analysis.location.latitude.toFixed(2)}°N,{' '}
                    {comparisonResult.secondary_analysis.location.longitude.toFixed(2)}°E
                  </span>
                </div>
              </div>

              <div className="space-y-4 mt-5">
                <div>
                  <span className="text-xs text-slate-500 dark:text-slate-400 block mb-1">
                    Rate of Change (Sen’s Slope)
                  </span>
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
                      {comparisonResult.secondary_analysis.slope_per_decade > 0 ? '+' : ''}
                      {comparisonResult.secondary_analysis.slope_per_decade}
                    </span>
                    <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                      {comparisonResult.secondary_analysis.slope_unit}
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 block mt-1">
                    95% CI: [{comparisonResult.secondary_analysis.confidence_interval.lower},{' '}
                    {comparisonResult.secondary_analysis.confidence_interval.upper}]
                  </span>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-2 text-xs">
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Mann-Kendall p-value:</span>
                    <span className="font-mono tabular-nums font-semibold text-slate-900 dark:text-white">
                      {comparisonResult.secondary_analysis.p_value.toFixed(5)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Significance (α = 0.05):</span>
                    <span
                      className={`font-semibold ${
                        comparisonResult.secondary_analysis.is_significant
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-amber-600 dark:text-amber-400'
                      }`}
                    >
                      {comparisonResult.secondary_analysis.is_significant ? 'Significant' : 'Not Significant'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Kendall’s Tau (τ):</span>
                    <span className="font-mono tabular-nums text-slate-900 dark:text-white">
                      {comparisonResult.secondary_analysis.mann_kendall.kendall_tau.toFixed(4)}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-500 dark:text-slate-400">Sample Size:</span>
                    <span className="font-mono tabular-nums text-slate-900 dark:text-white">
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
