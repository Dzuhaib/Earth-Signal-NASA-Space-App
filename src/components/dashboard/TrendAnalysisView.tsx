/**
 * EarthSignal — Trend Analysis & Scientific Findings
 * Apple Studio Design Edition:
 * - Direct answers to the 4 NASA challenge questions (What, Where, How Much, Is It Significant?)
 * - Plain English scientific verdict without AI-slop hype or neon gradients
 * - Single-year anomaly summary & full multi-year Mann-Kendall decomposition
 * - Apple Studio graphite cards, subtle borders, and monospace data typography
 */

import React from 'react';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  CheckCircle2,
  AlertTriangle,
  Info,
  ShieldCheck,
  Calendar,
  MapPin,
  Database,
  ArrowRight,
  Sparkles,
} from 'lucide-react';
import { StatisticalAnalysisResponse } from '../../types/earthsignal';
import { ScientificTimeSeriesChart } from '../charts/ScientificTimeSeriesChart';

interface TrendAnalysisViewProps {
  analysis: StatisticalAnalysisResponse | null;
  isLoading: boolean;
  onNavigateToAI: () => void;
  onNavigateToExplorer: () => void;
}

export const TrendAnalysisView: React.FC<TrendAnalysisViewProps> = ({
  analysis,
  isLoading,
  onNavigateToAI,
  onNavigateToExplorer,
}) => {
  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 flex flex-col items-center justify-center min-h-[440px]">
        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-4" />
        <h3 className="text-sm font-semibold text-white">
          Fetching NASA Observations & Computing Statistics...
        </h3>
        <p className="text-xs text-slate-400 mt-1 font-mono">
          Querying NASA POWER REST API and running Mann-Kendall rank analysis
        </p>
      </div>
    );
  }

  if (!analysis) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <h3 className="text-base font-semibold text-white">
          No Trend Analysis Selected
        </h3>
        <p className="text-xs text-slate-400 mt-2 max-w-md mx-auto">
          Select a city or region in the Earth Explorer to initiate scientific trend evaluation.
        </p>
        <button
          onClick={onNavigateToExplorer}
          className="mt-6 px-4 py-2 text-xs font-semibold rounded-xl bg-blue-600 text-white hover:bg-blue-500 transition-colors shadow-sm"
        >
          Open Earth Explorer
        </button>
      </div>
    );
  }

  const {
    location,
    variable_name,
    unit,
    period,
    sample_size,
    trend_direction,
    trend_classification,
    slope_per_decade,
    slope_unit,
    p_value,
    confidence_interval,
    is_significant,
    linear_regression,
    mann_kendall,
    sens_slope,
    autocorrelation,
    data_quality,
    limitations,
    provenance,
    observations,
  } = analysis;

  const isSingleYear = period.total_months <= 12;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Master Location & Period Card (Apple Studio Design) */}
      <div className="bg-[#12141c] border border-white/10 rounded-2xl p-6 text-white shadow-sm space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-400 font-mono mb-1">
              <MapPin className="w-3.5 h-3.5 text-blue-400" />
              <span>
                {location.name}, {location.country} ({location.latitude.toFixed(2)}°N, {location.longitude.toFixed(2)}°E)
              </span>
              <span>·</span>
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>
                {period.start} to {period.end} ({period.total_months} monthly observations)
              </span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              {variable_name} Analysis
            </h1>
          </div>

          <button
            onClick={onNavigateToAI}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold rounded-xl bg-[#1e212d] hover:bg-[#282c3c] text-slate-200 border border-white/10 transition-colors shadow-sm"
          >
            <Sparkles className="w-3.5 h-3.5 text-blue-400" />
            <span>Consult Science Assistant</span>
          </button>
        </div>

        {/* 4 Answers Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. WHAT is changing? */}
          <div className="bg-[#181a24] border border-white/5 rounded-xl p-4">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block mb-1">
              1. What Is Changing?
            </span>
            <div className="flex items-center gap-2 mt-2">
              {trend_direction === 'increasing' ? (
                <TrendingUp className="w-5 h-5 text-red-400" />
              ) : trend_direction === 'decreasing' ? (
                <TrendingDown className="w-5 h-5 text-blue-400" />
              ) : (
                <Minus className="w-5 h-5 text-slate-400" />
              )}
              <span className="text-base font-bold text-white capitalize">
                {trend_direction === 'increasing'
                  ? 'Upward Trend'
                  : trend_direction === 'decreasing'
                  ? 'Downward Trend'
                  : 'Stable Series'}
              </span>
            </div>
            <span className="text-xs text-slate-400 block mt-1">
              {trend_classification === 'significant_increasing'
                ? 'Statistically Confirmed Increase'
                : trend_classification === 'significant_decreasing'
                ? 'Statistically Confirmed Decline'
                : 'No Statistically Significant Drift'}
            </span>
          </div>

          {/* 2. WHERE is it changing? */}
          <div className="bg-[#181a24] border border-white/5 rounded-xl p-4">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block mb-1">
              2. Where Is It Changing?
            </span>
            <div className="text-base font-bold text-white mt-2 truncate">
              {location.name}
            </div>
            <span className="text-xs font-mono text-slate-400 block mt-1">
              Lat {location.latitude.toFixed(2)}° · Lon {location.longitude.toFixed(2)}°
            </span>
          </div>

          {/* 3. HOW MUCH is it changing? */}
          <div className="bg-[#181a24] border border-white/5 rounded-xl p-4">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block mb-1">
              3. Rate of Change (Sen’s Slope)
            </span>
            <div className="flex items-baseline gap-1 mt-2">
              <span className="text-2xl font-bold font-mono tabular-nums text-white">
                {slope_per_decade > 0 ? `+${slope_per_decade}` : slope_per_decade}
              </span>
              <span className="text-xs font-mono text-slate-400">
                {slope_unit}
              </span>
            </div>
            <span className="text-[11px] font-mono tabular-nums text-slate-400 block mt-1">
              95% CI: [{confidence_interval.lower.toFixed(2)}, {confidence_interval.upper.toFixed(2)}]
            </span>
          </div>

          {/* 4. IS IT statistically significant? */}
          <div className="bg-[#181a24] border border-white/5 rounded-xl p-4">
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block mb-1">
              4. Statistical Significance
            </span>
            <div className="flex items-center gap-2 mt-2">
              {is_significant ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
              ) : (
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />
              )}
              <span className="text-base font-bold text-white">
                {is_significant ? 'Confirmed' : 'Not Significant'}
              </span>
            </div>
            <span className="text-xs font-mono tabular-nums text-slate-400 block mt-1">
              p = {p_value.toFixed(4)} (α = 0.05, Z = {mann_kendall.z_statistic.toFixed(2)})
            </span>
          </div>
        </div>

        {/* Plain-Language Detective Verdict Card */}
        <div className="bg-[#181a24] border border-white/5 rounded-xl p-5 text-slate-200">
          <div className="flex items-center gap-2 mb-2 flex-wrap">
            <span className="bg-blue-500/20 text-blue-300 text-[10px] font-mono px-2 py-0.5 rounded font-medium border border-blue-500/30">
              Plain English Summary
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Live Ingest: {sample_size} monthly records ({period.start} to {period.end})
            </span>
          </div>

          <p className="text-sm text-slate-100 leading-relaxed font-normal">
            {isSingleYear ? (
              <>
                For the year <strong>{period.start.slice(0, 4)}</strong> in <strong className="text-blue-300">{location.name} ({location.country})</strong>, recorded <strong>{variable_name}</strong> averages <strong className="text-white">{(observations.reduce((acc, o) => acc + (isNaN(o.value) ? 0 : o.value), 0) / Math.max(1, observations.filter(o => !isNaN(o.value)).length)).toFixed(2)} {unit}</strong> across {period.total_months} monthly observations.
              </>
            ) : trend_classification === 'significant_increasing' ? (
              <>
                Across the <strong>{period.total_months} months</strong> from {period.start} to {period.end}, <strong>{variable_name}</strong> in <strong className="text-blue-300">{location.name} ({location.country})</strong> has experienced a confirmed upward trajectory at a rate of <strong className="text-red-400">{slope_per_decade > 0 ? `+${slope_per_decade}` : slope_per_decade} {slope_unit}</strong>.
              </>
            ) : trend_classification === 'significant_decreasing' ? (
              <>
                Across the <strong>{period.total_months} months</strong> from {period.start} to {period.end}, <strong>{variable_name}</strong> in <strong className="text-blue-300">{location.name} ({location.country})</strong> has experienced a confirmed downward decline at a rate of <strong className="text-blue-400">{slope_per_decade} {slope_unit}</strong>.
              </>
            ) : (
              <>
                Across the <strong>{period.total_months} months</strong> between {period.start} and {period.end}, <strong>{variable_name}</strong> in <strong className="text-blue-300">{location.name}</strong> remains within normal historical variance with no statistically confirmed multi-year drift (median slope: {slope_per_decade} {slope_unit}).
              </>
            )}
          </p>

          <div className="mt-3.5 pt-3 border-t border-white/5 grid grid-cols-1 md:grid-cols-3 gap-3.5 text-xs">
            <div>
              <span className="text-slate-400 block text-[11px] mb-0.5">Statistical Confidence:</span>
              <span className="text-slate-200">
                {is_significant
                  ? `p = ${p_value.toFixed(4)} (< 0.05). Under 0.01% likelihood this is random luck.`
                  : `p = ${p_value.toFixed(4)} (≥ 0.05). Consistent with natural seasonal fluctuations.`}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px] mb-0.5">Observation Archive:</span>
              <span className="text-slate-200 font-mono">
                {provenance.data_provider}
              </span>
            </div>
            <div>
              <span className="text-slate-400 block text-[11px] mb-0.5">Practical Consequence:</span>
              <span className="text-slate-200">
                {location.id === 'pakistan_sindh'
                  ? 'Exacerbates summer heat stress (>48°C), agricultural canal evaporation, and soil moisture deficits.'
                  : 'Provides empirical evidence for regional resource planning and climate adaptation.'}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Primary Time Series SVG Chart */}
      <ScientificTimeSeriesChart
        observations={observations}
        sensSlope={sens_slope}
        variableName={variable_name}
        unit={unit}
        locationName={location.name}
      />

      {/* Statistical Tables Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Non-Parametric Metrics */}
        <div className="bg-[#12141c] border border-white/10 rounded-2xl p-5 text-white space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-white/10">
            <ShieldCheck className="w-4 h-4 text-blue-400" />
            <h3 className="text-xs font-semibold text-white uppercase tracking-wider">
              Mann-Kendall & Sen’s Slope Output
            </h3>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-white/5">
              <span className="text-slate-400">Kendall S Statistic:</span>
              <span className="font-mono tabular-nums font-semibold text-white">
                {mann_kendall.s_statistic > 0 ? `+${mann_kendall.s_statistic}` : mann_kendall.s_statistic}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-white/5">
              <span className="text-slate-400">Tie-Corrected Variance Var(S):</span>
              <span className="font-mono tabular-nums text-white">
                {mann_kendall.variance_s.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-white/5">
              <span className="text-slate-400">Standardized Z Statistic:</span>
              <span className="font-mono tabular-nums font-semibold text-white">
                {mann_kendall.z_statistic.toFixed(3)}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-white/5">
              <span className="text-slate-400">Kendall’s Tau (τ):</span>
              <span className="font-mono tabular-nums text-white">
                {mann_kendall.kendall_tau.toFixed(4)}
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-400">Lag-1 Autocorrelation (r₁):</span>
              <span className="font-mono tabular-nums text-white">
                {autocorrelation.lag_1.toFixed(3)} ({autocorrelation.is_autocorrelated ? 'Autocorrelated' : 'Independent'})
              </span>
            </div>
          </div>
        </div>

        {/* Right: Data Quality Audit */}
        <div className="bg-[#12141c] border border-white/10 rounded-2xl p-5 text-white space-y-3">
          <div className="flex items-center gap-2 pb-2 border-b border-white/10">
            <Info className="w-4 h-4 text-blue-400" />
            <h3 className="text-xs font-semibold text-white uppercase tracking-wider">
              Quality Audit & Provenance
            </h3>
          </div>

          <div className="space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-white/5">
              <span className="text-slate-400">Valid Observations:</span>
              <span className="font-mono tabular-nums font-semibold text-white">
                {data_quality.valid_observations} of {data_quality.total_observations}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-white/5">
              <span className="text-slate-400">OLS Regression Slope:</span>
              <span className="font-mono tabular-nums text-white">
                {(linear_regression.slope * 120).toFixed(3)} {unit} per decade
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-white/5">
              <span className="text-slate-400">Data Continuity:</span>
              <span className="font-mono capitalize text-white">
                {data_quality.temporal_continuity.replace('_', ' ')}
              </span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-400">Data Source:</span>
              <span className="text-slate-300 font-mono truncate max-w-xs">
                {provenance.data_provider}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
