/**
 * EarthSignal — Visual-First Mission Control & Overview
 * Clean, visual-rich layout with 3D Earth Globe (20% default zoom), SVG radial gauges,
 * visual range bars, interactive time-series chart, and visual city cards.
 */

import React, { useMemo, useState } from 'react';
import {
  ArrowUpRight,
  Compass,
  Sprout,
  TrendingUp,
  TrendingDown,
  Minus,
  Thermometer,
  CloudRain,
  Sun,
  Wind,
  Layers,
  MapPin,
} from 'lucide-react';
import {
  GeographicRegion,
  EnvironmentalVariableId,
  StatisticalAnalysisResponse,
} from '../../types/earthsignal';
import {
  ENVIRONMENTAL_VARIABLES,
  ACCURATE_CITIES,
  getCityMetricForVariableAndYear,
} from '../../services/nasa/nasaRegistry';
import { ScientificTimeSeriesChart } from '../charts/ScientificTimeSeriesChart';
import { Earth3DGlobe } from '../maps/Earth3DGlobe';
import { NavTab } from '../layout/TopBar';
import { EnvironmentalDataLiveFeed } from './EnvironmentalDataLiveFeed';
import { HyperLocalWeatherFeed } from './HyperLocalWeatherFeed';

interface OverviewViewProps {
  regions: GeographicRegion[];
  selectedRegion: GeographicRegion;
  selectedVariable: EnvironmentalVariableId;
  analysis: StatisticalAnalysisResponse | null;
  loading?: boolean;
  onSelectRegion: (r: GeographicRegion) => void;
  onSelectVariable: (v: EnvironmentalVariableId) => void;
  onSelectCoordinates?: (lat: number, lon: number) => void;
  onNavigate: (tab: NavTab) => void;
  onLaunchFlagship?: () => void;
}

const CHANNEL_VISUALS: {
  id: EnvironmentalVariableId;
  label: string;
  icon: React.FC<{ className?: string }>;
  fillPct: number;
  barColor: string;
}[] = [
  { id: 'T2M', label: 'Air Temperature', icon: Thermometer, fillPct: 76, barColor: '#f97316' },
  { id: 'T2M_MAX', label: 'Peak Heat', icon: Sun, fillPct: 90, barColor: '#f43f5e' },
  { id: 'PRECTOTCORR', label: 'Rainfall', icon: CloudRain, fillPct: 68, barColor: '#06b6d4' },
  { id: 'GWETROOT', label: 'Root Moisture', icon: Sprout, fillPct: 54, barColor: '#10b981' },
  { id: 'GWETTOP', label: 'Surface Soil', icon: Layers, fillPct: 48, barColor: '#3b82f6' },
  { id: 'RH2M', label: 'Humidity', icon: Wind, fillPct: 64, barColor: '#8b5cf6' },
];

export const OverviewView: React.FC<OverviewViewProps> = ({
  regions,
  selectedRegion,
  selectedVariable,
  analysis,
  loading = false,
  onSelectRegion,
  onSelectVariable,
  onSelectCoordinates,
  onNavigate,
}) => {
  const [cityFilter, setCityFilter] = useState<'all' | 'sindh' | 'global'>('all');

  const variableMeta = useMemo(
    () => ENVIRONMENTAL_VARIABLES[selectedVariable] || ENVIRONMENTAL_VARIABLES.T2M,
    [selectedVariable]
  );

  const displayedCities = useMemo(() => {
    if (cityFilter === 'sindh') {
      return ACCURATE_CITIES.filter((c) => c.province === 'Sindh');
    }
    if (cityFilter === 'global') {
      return ACCURATE_CITIES.filter((c) => c.country !== 'Pakistan');
    }
    return ACCURATE_CITIES.slice(0, 12);
  }, [cityFilter]);

  const quickRegions = useMemo(() => {
    const ids = ['pakistan_sindh', 'pak_karachi', 'pak_jacobabad', 'pak_sukkur', 'brazil_amazon', 'norway_svalbard'];
    return ids
      .map((id) => regions.find((r) => r.id === id))
      .filter((r): r is GeographicRegion => Boolean(r));
  }, [regions]);

  const handleCityFocus = (city: typeof ACCURATE_CITIES[0]) => {
    const matchingRegion = regions.find(
      (r) =>
        r.id.includes(city.id.replace('city_', '')) ||
        (Math.abs(r.latitude - city.latitude) < 0.25 && Math.abs(r.longitude - city.longitude) < 0.25)
    );
    if (matchingRegion) {
      onSelectRegion(matchingRegion);
    } else if (onSelectCoordinates) {
      onSelectCoordinates(city.latitude, city.longitude);
    } else {
      onSelectRegion({
        id: city.id,
        name: city.name,
        country: city.province ? `${city.province}, ${city.country}` : city.country,
        admin_level: 'special_zone',
        latitude: city.latitude,
        longitude: city.longitude,
        bounding_box: [city.latitude - 0.25, city.longitude - 0.25, city.latitude + 0.25, city.longitude + 0.25],
      });
    }
  };

  // Compute summary stats for visual gauges
  const obsSummary = useMemo(() => {
    if (!analysis || analysis.observations.length === 0) return null;
    const valid = analysis.observations.filter((o) => !o.is_missing);
    if (valid.length === 0) return null;
    const vals = valid.map((o) => o.value);
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
    const latest = valid[valid.length - 1];
    const span = max - min || 1;
    const meanPct = Math.max(8, Math.min(92, ((mean - min) / span) * 100));
    const latestPct = Math.max(8, Math.min(92, ((latest.value - min) / span) * 100));
    return { min, max, mean, latest, meanPct, latestPct };
  }, [analysis]);

  const confidencePct = analysis
    ? Math.max(5, Math.min(99.9, (1 - analysis.adjusted_p_value) * 100))
    : 95;

  // Quick 4 metrics for the active region on the hero card
  const heroMiniMetrics = useMemo(() => {
    const vars: { id: EnvironmentalVariableId; label: string; color: string; pct: number }[] = [
      { id: 'T2M', label: 'Air Temp', color: '#f97316', pct: 74 },
      { id: 'PRECTOTCORR', label: 'Rainfall', color: '#06b6d4', pct: 62 },
      { id: 'GWETROOT', label: 'Soil Moisture', color: '#10b981', pct: 58 },
      { id: 'T2M_MAX', label: 'Peak Heat', color: '#f43f5e', pct: 86 },
    ];
    return vars.map((v) => ({
      ...v,
      metric: getCityMetricForVariableAndYear(selectedRegion as any, v.id, 2026),
    }));
  }, [selectedRegion]);

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 space-y-8 pb-16">
      {/* 1. SPLIT HERO: Clean Visual Left + 3D Earth Map Ball Right (20% Default Zoom) */}
      <section className="pt-4">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
          {/* Left Column (5 Cols): Minimal Text + Visual Snapshot Gauges */}
          <div className="lg:col-span-5 flex flex-col justify-between bg-white dark:bg-[#0D111A] border border-slate-200 dark:border-[#1E2638] rounded-md p-6">
            <div className="space-y-5">
              <div>
                <div className="text-[11px] font-mono uppercase tracking-widest text-cyan-600 dark:text-cyan-400 font-semibold mb-2">
                  NASA Satellite Intelligence · 1981–2026
                </div>
                <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-slate-950 dark:text-white leading-[1.1]">
                  Earth Climate &amp; Crop Intelligence
                </h1>
                <p className="mt-2 text-xs sm:text-sm text-slate-600 dark:text-slate-400">
                  Select any point on the 3D globe to inspect live satellite trends and crop conditions.
                </p>
              </div>

              {/* Quick Location Chips */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-500">
                  <span>ACTIVE TARGET</span>
                  <span className="text-cyan-600 dark:text-cyan-400 tabular-nums">
                    {selectedRegion.latitude.toFixed(2)}°N, {selectedRegion.longitude.toFixed(2)}°E
                  </span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {quickRegions.map((reg) => {
                    const isSelected = selectedRegion.id === reg.id;
                    return (
                      <button
                        key={reg.id}
                        type="button"
                        onClick={() => onSelectRegion(reg)}
                        className={`px-2.5 py-1.5 rounded-xs text-xs font-medium transition-colors cursor-pointer ${
                          isSelected
                            ? 'bg-cyan-500 text-[#07090E] font-bold'
                            : 'bg-slate-100 dark:bg-[#111622] text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-[#182032]'
                        }`}
                      >
                        {reg.name.replace(' (Province)', '').replace(' Basin', '')}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Smart Climate Insights Panel */}
              <div className="bg-cyan-500/10 border border-cyan-500/30 rounded-md p-4 space-y-1.5">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
                  <span className="text-[11px] font-mono font-bold text-cyan-600 dark:text-cyan-400 uppercase tracking-wide">
                    Smart Climate Insight · {selectedRegion.name}
                  </span>
                </div>
                <p className="text-xs text-slate-700 dark:text-slate-300 leading-relaxed font-medium">
                  {selectedRegion.name.includes('Sukkur') || selectedRegion.name.includes('Sindh') || selectedRegion.name.includes('Hyderabad')
                    ? 'Optimal Rabi sowing window active (Nov 01–25). Recommended: Ensure certified heat-tolerant wheat seed drill with basal phosphatic fertilizer and scheduled canal irrigation.'
                    : selectedRegion.name.includes('Lahore') || selectedRegion.name.includes('Punjab')
                    ? 'Seasonal winter inversion active. Recommended: Monitor particulate air quality indices and maintain precision split nitrogen application.'
                    : 'Stable regional soil moisture profile. Recommended: Coordinate rotational canal water delivery with local farmer associations for optimal crop establishment.'}
                </p>
              </div>

              {/* 4 Visual Mini-Gauges for Selected Location */}
              <div className="grid grid-cols-2 gap-2.5">
                {heroMiniMetrics.map((item) => {
                  const isCurrentVar = selectedVariable === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => onSelectVariable(item.id)}
                      className={`text-left p-3 rounded-sm border transition-all cursor-pointer ${
                        isCurrentVar
                          ? 'bg-cyan-500/10 border-cyan-500'
                          : 'bg-slate-50 dark:bg-[#090C12] border-slate-200 dark:border-[#1E2638] hover:border-slate-300 dark:hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mb-1">
                        <span>{item.label}</span>
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ backgroundColor: item.color }}
                        />
                      </div>
                      <div className="font-mono text-base sm:text-lg font-bold text-slate-950 dark:text-white tabular-nums">
                        {item.metric.formatted}
                      </div>
                      <div className="w-full h-1.5 bg-slate-200 dark:bg-[#161D2B] rounded-full overflow-hidden mt-2">
                        <div
                          className="h-full rounded-full transition-all duration-500"
                          style={{ width: `${item.pct}%`, backgroundColor: item.color }}
                        />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-2.5 pt-5 mt-5 border-t border-slate-200 dark:border-[#1E2638]">
              <button
                type="button"
                onClick={() => onNavigate('explorer')}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-[#07090E] text-xs font-bold rounded-sm transition-colors cursor-pointer"
              >
                <Compass className="w-4 h-4" />
                <span>3D Map Explorer</span>
              </button>

              <button
                type="button"
                onClick={() => onNavigate('crop-advisory')}
                className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-slate-100 dark:bg-[#131926] hover:bg-slate-200 dark:hover:bg-[#1B2436] text-slate-900 dark:text-white border border-slate-300 dark:border-[#1E2638] text-xs font-semibold rounded-sm transition-colors cursor-pointer"
              >
                <Sprout className="w-4 h-4 text-emerald-500" />
                <span>Crop Forecast</span>
              </button>
            </div>
          </div>

          {/* Right Column (7 Cols): 3D Earth Map Ball at 20% Default Zoom */}
          <div className="lg:col-span-7 flex flex-col">
            <Earth3DGlobe
              regions={regions}
              selectedRegion={selectedRegion}
              onSelectRegion={onSelectRegion}
              onSelectCoordinates={(lat, lon) => {
                if (onSelectCoordinates) {
                  onSelectCoordinates(lat, lon);
                } else {
                  onSelectRegion({
                    id: `custom_${lat.toFixed(2)}_${lon.toFixed(2)}`,
                    name: `Point (${lat.toFixed(2)}°N, ${lon.toFixed(2)}°E)`,
                    country: 'Satellite Target',
                    admin_level: 'special_zone',
                    latitude: lat,
                    longitude: lon,
                    bounding_box: [lat - 0.25, lon - 0.25, lat + 0.25, lon + 0.25],
                  });
                }
              }}
              selectedVariable={selectedVariable}
              selectedYear={2026}
              isSingleYearMode={true}
              analysis={analysis}
              compact={false}
            />
          </div>
        </div>
      </section>

      {/* 2. VISUAL STATISTICAL GAUGES (4 Clean Visual Cards) */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Trend Rate + Visual Slope Curve */}
        <div className="bg-white dark:bg-[#0D111A] border border-slate-200 dark:border-[#1E2638] rounded-md p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Decadal Trend
            </span>
            {analysis && (
              <span
                className={`inline-flex items-center gap-1 text-xs font-mono font-bold ${
                  analysis.trend_direction === 'increasing'
                    ? 'text-amber-500'
                    : analysis.trend_direction === 'decreasing'
                    ? 'text-cyan-400'
                    : 'text-slate-400'
                }`}
              >
                {analysis.trend_direction === 'increasing' ? (
                  <TrendingUp className="w-3.5 h-3.5" />
                ) : analysis.trend_direction === 'decreasing' ? (
                  <TrendingDown className="w-3.5 h-3.5" />
                ) : (
                  <Minus className="w-3.5 h-3.5" />
                )}
                <span className="capitalize">{analysis.trend_direction}</span>
              </span>
            )}
          </div>

          <div className="my-3 flex items-end justify-between gap-3">
            <div>
              <div className="font-mono text-2xl sm:text-3xl font-bold text-slate-950 dark:text-white tabular-nums">
                {loading || !analysis ? (
                  '...'
                ) : (
                  <>
                    {analysis.slope_per_decade > 0 ? '+' : ''}
                    {analysis.slope_per_decade.toFixed(3)}
                  </>
                )}
              </div>
              <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                {variableMeta.unit} / decade
              </div>
            </div>

            {/* Mini Visual Trend SVG */}
            <svg className="w-20 h-10 overflow-visible shrink-0" viewBox="0 0 80 40">
              <path
                d={
                  analysis?.trend_direction === 'decreasing'
                    ? 'M 4 8 Q 30 16, 48 24 T 76 34'
                    : 'M 4 34 Q 30 26, 48 16 T 76 6'
                }
                fill="none"
                stroke={analysis?.trend_direction === 'decreasing' ? '#06b6d4' : '#f59e0b'}
                strokeWidth="2.5"
                strokeLinecap="round"
              />
              <circle
                cx="76"
                cy={analysis?.trend_direction === 'decreasing' ? '34' : '6'}
                r="3.5"
                fill={analysis?.trend_direction === 'decreasing' ? '#06b6d4' : '#f59e0b'}
              />
            </svg>
          </div>

          <div className="text-[11px] font-mono text-slate-500 pt-2 border-t border-slate-100 dark:border-[#1E2638] flex justify-between">
            <span>95% CI</span>
            <span className="text-slate-700 dark:text-slate-300 tabular-nums">
              {analysis
                ? `[${analysis.sens_slope.confidence_interval_per_decade.lower.toFixed(2)}, ${analysis.sens_slope.confidence_interval_per_decade.upper.toFixed(2)}]`
                : '—'}
            </span>
          </div>
        </div>

        {/* Card 2: Confidence Ring Gauge */}
        <div className="bg-white dark:bg-[#0D111A] border border-slate-200 dark:border-[#1E2638] rounded-md p-5 flex items-center justify-between gap-4">
          <div className="space-y-1.5">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 block">
              Statistical Confidence
            </span>
            <div className="font-mono text-2xl sm:text-3xl font-bold text-slate-950 dark:text-white tabular-nums">
              {loading || !analysis ? '...' : `${confidencePct.toFixed(1)}%`}
            </div>
            <div
              className={`inline-flex items-center gap-1.5 text-[11px] font-mono font-semibold ${
                analysis?.is_significant
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-slate-500'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  analysis?.is_significant ? 'bg-emerald-500' : 'bg-slate-400'
                }`}
              />
              <span>{analysis?.is_significant ? 'Verified Signal' : 'Natural Fluctuation'}</span>
            </div>
          </div>

          {/* Radial SVG Ring */}
          <div className="relative w-16 h-16 shrink-0 flex items-center justify-center">
            <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
              <circle
                cx="32"
                cy="32"
                r="26"
                fill="none"
                stroke="currentColor"
                strokeWidth="6"
                className="text-slate-200 dark:text-[#161D2B]"
              />
              <circle
                cx="32"
                cy="32"
                r="26"
                fill="none"
                stroke={analysis?.is_significant ? '#10b981' : '#64748b'}
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={`${(confidencePct / 100) * 163.36} 163.36`}
              />
            </svg>
            <span className="absolute font-mono text-[10px] font-bold text-slate-700 dark:text-slate-300 tabular-nums">
              p={analysis ? (analysis.adjusted_p_value < 0.01 ? '<.01' : analysis.adjusted_p_value.toFixed(2)) : '—'}
            </span>
          </div>
        </div>

        {/* Card 3: Signal Strength Meter */}
        <div className="bg-white dark:bg-[#0D111A] border border-slate-200 dark:border-[#1E2638] rounded-md p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Signal Consistency
            </span>
            <span className="text-[11px] font-mono text-cyan-600 dark:text-cyan-400 font-semibold">
              Kendall’s τ
            </span>
          </div>

          <div className="my-3">
            <div className="font-mono text-2xl sm:text-3xl font-bold text-slate-950 dark:text-white tabular-nums">
              {loading || !analysis
                ? '...'
                : `${analysis.mann_kendall.kendall_tau > 0 ? '+' : ''}${analysis.mann_kendall.kendall_tau.toFixed(3)}`}
            </div>
            {/* Visual Meter Bar */}
            <div className="mt-3 w-full h-2 bg-slate-200 dark:bg-[#161D2B] rounded-full overflow-hidden">
              <div
                className="h-full bg-cyan-500 rounded-full transition-all duration-500"
                style={{
                  width: `${
                    analysis
                      ? Math.max(12, Math.min(100, Math.abs(analysis.mann_kendall.kendall_tau) * 140))
                      : 30
                  }%`,
                }}
              />
            </div>
          </div>

          <div className="text-[11px] font-mono text-slate-500 pt-2 border-t border-slate-100 dark:border-[#1E2638] flex justify-between">
            <span>Sample Size</span>
            <span className="text-slate-700 dark:text-slate-300 tabular-nums">
              {analysis ? `${analysis.sample_size} months` : '—'}
            </span>
          </div>
        </div>

        {/* Card 4: Visual Range Thermometer */}
        <div className="bg-white dark:bg-[#0D111A] border border-slate-200 dark:border-[#1E2638] rounded-md p-5 flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 dark:text-slate-400">
              Observed Range
            </span>
            <span className="text-[11px] font-mono text-slate-500 tabular-nums">
              {variableMeta.unit}
            </span>
          </div>

          <div className="my-3">
            <div className="flex items-baseline justify-between font-mono tabular-nums mb-2">
              <span className="text-xs text-cyan-500 font-semibold">
                Min {obsSummary ? obsSummary.min.toFixed(1) : '—'}
              </span>
              <span className="text-lg font-bold text-slate-950 dark:text-white">
                Avg {obsSummary ? obsSummary.mean.toFixed(1) : '—'}
              </span>
              <span className="text-xs text-rose-500 font-semibold">
                Max {obsSummary ? obsSummary.max.toFixed(1) : '—'}
              </span>
            </div>

            {/* Visual Range Bar with Mean Marker */}
            <div className="relative w-full h-2.5 rounded-full bg-gradient-to-r from-cyan-500 via-emerald-500 to-rose-500">
              {obsSummary && (
                <div
                  className="absolute -top-1 w-2 h-4.5 bg-white border-2 border-slate-950 rounded-xs shadow-md -translate-x-1/2"
                  style={{ left: `${obsSummary.meanPct}%` }}
                  title={`Average: ${obsSummary.mean.toFixed(2)}`}
                />
              )}
            </div>
          </div>

          <div className="text-[11px] font-mono text-slate-500 pt-2 border-t border-slate-100 dark:border-[#1E2638] flex justify-between">
            <span>Latest Reading</span>
            <span className="text-slate-700 dark:text-slate-300 font-semibold tabular-nums">
              {obsSummary ? `${obsSummary.latest.value.toFixed(2)} ${variableMeta.unit}` : '—'}
            </span>
          </div>
        </div>
      </section>

      {/* 3. PRIMARY TIME-SERIES VISUALIZATION */}
      <section>
        {loading ? (
          <div className="w-full h-[420px] bg-white dark:bg-[#0D111A] border border-slate-200 dark:border-[#1E2638] rounded-md flex items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <div className="w-7 h-7 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
              <p className="text-xs font-mono text-slate-500">Loading NASA satellite series...</p>
            </div>
          </div>
        ) : analysis ? (
          <ScientificTimeSeriesChart
            observations={analysis.observations}
            sensSlope={analysis.sens_slope}
            variableName={analysis.variable_name}
            unit={analysis.unit}
            locationName={analysis.location.name}
          />
        ) : null}
      </section>

      {/* 4. 6-CHANNEL VISUAL CLIMATE MATRIX (Replaces dense text table) */}
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-lg font-bold text-slate-950 dark:text-white">
            Multi-Channel Satellite Indicators — {selectedRegion.name}
          </h2>
          <button
            type="button"
            onClick={() => onNavigate('trends')}
            className="text-xs font-mono font-semibold text-cyan-600 dark:text-cyan-400 hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>Full Trend Audit</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {CHANNEL_VISUALS.map((ch) => {
            const Icon = ch.icon;
            const isSelected = selectedVariable === ch.id;
            const liveVal = getCityMetricForVariableAndYear(selectedRegion as any, ch.id, 2026);
            return (
              <button
                key={ch.id}
                type="button"
                onClick={() => onSelectVariable(ch.id)}
                className={`text-left p-4 rounded-md border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-cyan-500/10 border-cyan-500 shadow-sm'
                    : 'bg-white dark:bg-[#0D111A] border-slate-200 dark:border-[#1E2638] hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-8 h-8 rounded-sm flex items-center justify-center"
                      style={{ backgroundColor: `${ch.barColor}20`, color: ch.barColor }}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-slate-950 dark:text-white">
                        {ch.label}
                      </div>
                      <div className="text-[10px] font-mono text-slate-500">{ch.id}</div>
                    </div>
                  </div>

                  <span
                    className="font-mono text-lg font-bold tabular-nums"
                    style={{ color: liveVal.color }}
                  >
                    {liveVal.formatted}
                  </span>
                </div>

                {/* Visual Intensity Bar */}
                <div className="w-full h-2 bg-slate-100 dark:bg-[#141B29] rounded-full overflow-hidden mb-2">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: `${ch.fillPct}%`, backgroundColor: ch.barColor }}
                  />
                </div>

                <div className="flex items-center justify-between text-[11px] font-mono text-slate-500">
                  <span>{liveVal.status}</span>
                  {liveVal.peakMonth && (
                    <span className="text-slate-600 dark:text-slate-400">
                      Peak: {liveVal.peakMonth}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </section>



      {/* Real-Time Weather & Live Telemetry Stream (Organized 2-Column Grid) */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        <div className="lg:col-span-6">
          <HyperLocalWeatherFeed selectedRegion={selectedRegion} />
        </div>
        <div className="lg:col-span-6">
          <EnvironmentalDataLiveFeed selectedRegion={selectedRegion} />
        </div>
      </section>

      {/* 5. MONITORED CITY HOTSPOTS (Clean Visual Cards) */}
      <section className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <h2 className="font-display text-lg font-bold text-slate-950 dark:text-white">
            Monitored Climate Hubs
          </h2>

          <div className="inline-flex items-center p-0.5 bg-slate-200/70 dark:bg-[#0D111A] border border-slate-300 dark:border-[#1E2638] rounded-sm self-start">
            {(
              [
                { id: 'all', label: 'Top Hubs' },
                { id: 'sindh', label: 'Sindh Districts' },
                { id: 'global', label: 'Global' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setCityFilter(tab.id)}
                className={`px-3 py-1 rounded-xs text-xs font-mono transition-colors cursor-pointer ${
                  cityFilter === tab.id
                    ? 'bg-cyan-500 text-[#07090E] font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {displayedCities.map((city) => {
            const metric = getCityMetricForVariableAndYear(city, selectedVariable, 2026);
            const isSelected =
              Math.abs(selectedRegion.latitude - city.latitude) < 0.15 &&
              Math.abs(selectedRegion.longitude - city.longitude) < 0.15;

            const riskPct =
              city.floodRiskLevel === 'extreme'
                ? 92
                : city.floodRiskLevel === 'high'
                ? 74
                : 48;

            return (
              <button
                key={city.id}
                type="button"
                onClick={() => handleCityFocus(city)}
                className={`text-left p-3.5 rounded-md border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-cyan-500/10 border-cyan-500'
                    : 'bg-white dark:bg-[#0D111A] border-slate-200 dark:border-[#1E2638] hover:border-slate-300 dark:hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-cyan-500 shrink-0" />
                      <h3 className="font-display text-sm font-bold text-slate-950 dark:text-white truncate">
                        {city.name}
                      </h3>
                    </div>
                    <div className="text-[10px] font-mono text-slate-500 truncate mt-0.5">
                      {city.province || city.country}
                    </div>
                  </div>

                  <span
                    className="font-mono text-sm font-bold tabular-nums shrink-0"
                    style={{ color: metric.color }}
                  >
                    {metric.formatted}
                  </span>
                </div>

                <div className="w-full h-1.5 bg-slate-100 dark:bg-[#141B29] rounded-full overflow-hidden mb-1.5">
                  <div
                    className="h-full rounded-full"
                    style={{ width: `${riskPct}%`, backgroundColor: metric.color }}
                  />
                </div>

                <div className="flex items-center justify-between text-[10px] font-mono text-slate-500">
                  <span>{metric.status}</span>
                  <span className="tabular-nums">
                    {city.latitude.toFixed(1)}°N
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
};
