/**
 * EarthSignal — NASA Agroclimatology Crop Suitability & 3-Month Projected Yield Assessment
 * Synchronized with today's live date (new Date()) and optional target planting date picker.
 * Evaluates each crop against the city's live NASA POWER observations and multi-year historical
 * environmental trends (Theil-Sen slope & inter-annual variability) across the upcoming 3-month
 * and 6-month windows.
 */

import React, { useState, useEffect } from 'react';
import {
  Sprout,
  Calendar,
  MapPin,
  ArrowRight,
  Compass,
  TrendingUp,
  TrendingDown,
  Scale,
  Layers,
} from 'lucide-react';
import { ACCURATE_CITIES } from '../../services/nasa/nasaRegistry';
import { CityMarker } from '../../types/earthsignal';

interface CropAdvisoryViewProps {
  defaultCityId?: string;
  onInspectInExplorer?: (city: CityMarker) => void;
}

export const CropAdvisoryView: React.FC<CropAdvisoryViewProps> = ({
  defaultCityId = 'city_sukkur',
  onInspectInExplorer,
}) => {
  const [selectedCityId, setSelectedCityId] = useState<string>(defaultCityId);
  const [seasonMode, setSeasonMode] = useState<'upcoming_6m' | 'rabi' | 'kharif'>('upcoming_6m');
  const [targetDate, setTargetDate] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  });
  const [regionFilter, setRegionFilter] = useState<'sindh' | 'pakistan' | 'all'>('sindh');
  const [yieldUnit, setYieldUnit] = useState<'maunds_acre' | 'ton_ha'>('maunds_acre');
  const [advisoryData, setAdvisoryData] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedCropId, setSelectedCropId] = useState<string | null>(null);

  const filteredCities = ACCURATE_CITIES.filter((c) => {
    if (regionFilter === 'sindh') return c.province === 'Sindh';
    if (regionFilter === 'pakistan') return c.country === 'Pakistan';
    return true;
  });

  const activeCity =
    ACCURATE_CITIES.find((c) => c.id === selectedCityId) || ACCURATE_CITIES[0];

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);

    fetch(
      `/api/v1/agro/crop-advisory?city_id=${selectedCityId}&lat=${activeCity.latitude}&lon=${activeCity.longitude}&season=${seasonMode}&date=${encodeURIComponent(targetDate)}`
    )
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled && data?.status === 'success') {
          setAdvisoryData(data);
          if (data.recommendations?.length > 0) {
            setSelectedCropId((prev) => {
              const exists = data.recommendations.some((r: any) => r.id === prev);
              return exists ? prev : data.recommendations[0].id;
            });
          }
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedCityId, seasonMode, targetDate, activeCity.latitude, activeCity.longitude]);

  const recommendations: any[] = advisoryData?.recommendations || [];
  const upcomingMonths: any[] = advisoryData?.upcomingMonths || [];
  const indicators = advisoryData?.summaryIndicators;
  const refDate = advisoryData?.referenceDate;
  const historicalTrends3M = advisoryData?.threeMonthHistoricalTrends;
  const focusedCrop =
    recommendations.find((r) => r.id === selectedCropId) || recommendations[0];
  const yield3M = focusedCrop?.yieldAssessment3M;

  const formatSigned = (val: number, decimals = 1, suffix = '') => {
    const num = Number(val) || 0;
    const formatted = Math.abs(num).toFixed(decimals);
    if (num > 0) return `+${formatted}${suffix}`;
    if (num < 0) return `-${formatted}${suffix}`;
    return `0.${'0'.repeat(decimals)}${suffix}`;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Top Editorial Header & Structured Control Bar */}
      <div className="space-y-5">
        {/* Tier 1: Full-Width Simple Title & Date */}
        <div className="space-y-1.5">
          <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-emerald-600 dark:text-emerald-400">
            <Sprout className="w-3.5 h-3.5 shrink-0" />
            <span>Updated for {refDate?.formatted || targetDate}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-950 dark:text-white">
            Crop Planner &amp; 3-Month Yield Forecast
          </h1>
          <p className="text-sm text-slate-600 dark:text-slate-400 max-w-3xl leading-relaxed">
            Pick your city and planting date to see which crops will grow best and how much yield to expect over the next 3 months.
          </p>
        </div>

        {/* Tier 2: Structured 3-Column Parameter Control Bar */}
        <div className="bg-white dark:bg-[#0B0E17] border border-slate-200 dark:border-slate-800 rounded-xl p-4 grid grid-cols-1 md:grid-cols-12 gap-4 items-end">
          {/* Column 1: Planting Date Selector (3 cols) */}
          <div className="md:col-span-3 space-y-1.5">
            <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-500">
              Reference Planting Date
            </label>
            <div className="flex items-center justify-between gap-2 h-9 px-3 rounded-lg bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-xs">
              <div className="flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-sky-500 shrink-0" />
                <span className="text-slate-500 font-mono text-[11px]">Date:</span>
              </div>
              <input
                type="date"
                value={targetDate}
                onChange={(e) => {
                  if (e.target.value) {
                    setTargetDate(e.target.value);
                    setSeasonMode('upcoming_6m');
                  }
                }}
                className="bg-transparent font-mono text-xs text-slate-900 dark:text-white focus:outline-none text-right"
              />
            </div>
          </div>

          {/* Column 2: Season Window Selector (5 cols) */}
          <div className="md:col-span-5 space-y-1.5">
            <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-500">
              Seasonal Evaluation Window
            </label>
            <div className="grid grid-cols-3 gap-1 p-1 h-9 items-center bg-slate-100 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-medium">
              {[
                { id: 'upcoming_6m', label: 'From Selected Date' },
                { id: 'rabi', label: 'Rabi (Nov–Apr)' },
                { id: 'kharif', label: 'Kharif (May–Oct)' },
              ].map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setSeasonMode(s.id as any)}
                  className={`h-full rounded-md transition-colors truncate px-2 text-center ${
                    seasonMode === s.id
                      ? 'bg-white dark:bg-sky-500 text-slate-950 font-semibold shadow-2xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Column 3: Yield Unit Toggle (4 cols) */}
          <div className="md:col-span-4 space-y-1.5">
            <label className="block text-[10px] font-mono uppercase tracking-wider text-slate-500">
              Yield Measurement Unit
            </label>
            <div className="grid grid-cols-2 gap-1 p-1 h-9 items-center bg-slate-100 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-mono">
              <button
                type="button"
                onClick={() => setYieldUnit('maunds_acre')}
                className={`h-full rounded-md transition-colors truncate px-2 text-center ${
                  yieldUnit === 'maunds_acre'
                    ? 'bg-white dark:bg-slate-800 text-slate-950 dark:text-white font-semibold shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Maunds / Acre (40kg)
              </button>
              <button
                type="button"
                onClick={() => setYieldUnit('ton_ha')}
                className={`h-full rounded-md transition-colors truncate px-2 text-center ${
                  yieldUnit === 'ton_ha'
                    ? 'bg-white dark:bg-slate-800 text-slate-950 dark:text-white font-semibold shadow-2xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                Tons / Ha (t/ha)
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main 12-Column Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left 4 Columns: City Selection, 3-Month Historical NASA Trends & 6-Month Envelope */}
        <div className="lg:col-span-4 space-y-6">
          {/* 1. City Selector Panel */}
          <div className="bg-white dark:bg-[#0B0E17] border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-200">
                1. Agricultural District / City
              </span>
              <MapPin className="w-3.5 h-3.5 text-sky-500" />
            </div>

            {/* Region Filter Tabs */}
            <div className="grid grid-cols-3 p-1 bg-slate-100 dark:bg-slate-900 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-medium text-center">
              {[
                { id: 'sindh', label: 'Sindh Hubs' },
                { id: 'pakistan', label: 'All Pakistan' },
                { id: 'all', label: 'Global' },
              ].map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setRegionFilter(tab.id as any)}
                  className={`py-1 rounded-md transition-colors ${
                    regionFilter === tab.id
                      ? 'bg-white dark:bg-slate-800 text-slate-950 dark:text-white font-semibold'
                      : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Scrollable City Buttons */}
            <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/70 pr-1">
              {filteredCities.map((city) => {
                const isSelected = city.id === selectedCityId;
                return (
                  <button
                    key={city.id}
                    type="button"
                    onClick={() => setSelectedCityId(city.id)}
                    className={`w-full text-left py-2.5 px-3 transition-colors flex items-center justify-between ${
                      isSelected
                        ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400 font-semibold'
                        : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-900/50'
                    }`}
                  >
                    <div>
                      <div className="text-xs">{city.name}</div>
                      <div className="text-[10px] font-mono text-slate-500">
                        {city.province || city.country} · {city.keyFeature}
                      </div>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">
                      {city.latitude.toFixed(1)}°N
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. 3-Month Historical NASA Trend Analysis Card */}
          {historicalTrends3M && (
            <div className="bg-white dark:bg-[#0B0E17] border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4">
              <div className="flex items-start justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-200 block">
                    2. 3-Month Historical NASA Trends
                  </span>
                  <span className="text-[11px] font-mono text-slate-500">
                    Window: {historicalTrends3M.windowLabel} ({historicalTrends3M.archiveYears})
                  </span>
                </div>
                <Layers className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
              </div>

              <div className="divide-y divide-slate-100 dark:divide-slate-800/80 text-xs font-mono">
                {[
                  historicalTrends3M.t2m,
                  historicalTrends3M.t2mMax,
                  historicalTrends3M.gwetroot,
                  historicalTrends3M.precip,
                  historicalTrends3M.rh2m,
                ]
                  .filter(Boolean)
                  .map((metric: any) => {
                    const isPositive = metric.annualSlope >= 0;
                    return (
                      <div key={metric.parameter} className="py-2.5 flex items-center justify-between gap-2">
                        <div>
                          <div className="font-sans font-medium text-slate-800 dark:text-slate-200 text-xs">
                            {metric.label}
                          </div>
                          <div className="text-[10px] text-slate-500">
                            Mean: {metric.mean} {metric.unit} · ±{metric.stdDev} SD
                          </div>
                        </div>
                        <div className="text-right tabular-nums">
                          <div
                            className={`font-semibold ${
                              metric.parameter === 'GWETROOT'
                                ? isPositive
                                  ? 'text-emerald-600 dark:text-emerald-400'
                                  : 'text-amber-600 dark:text-amber-400'
                                : metric.parameter.startsWith('T2M')
                                ? isPositive
                                  ? 'text-amber-600 dark:text-amber-400'
                                  : 'text-sky-600 dark:text-sky-400'
                                : 'text-slate-800 dark:text-slate-200'
                            }`}
                          >
                            {formatSigned(
                              metric.annualSlope,
                              metric.parameter === 'GWETROOT' ? 3 : 2,
                              ` ${metric.unit}/yr`
                            )}
                          </div>
                          <div className="text-[10px] text-slate-500">
                            6-Yr Shift: {formatSigned(metric.totalChange6Yr, metric.parameter === 'GWETROOT' ? 2 : 1, ` ${metric.unit}`)}
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>

              {/* Historical Yearly Observations Mini-Table for the 3-Month Window */}
              {historicalTrends3M.t2m?.yearlySeries?.length > 0 && (
                <div className="pt-2 border-t border-slate-200 dark:border-slate-800 space-y-2">
                  <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500">
                    NASA Archive ({historicalTrends3M.windowLabel} Mean by Year)
                  </div>
                  <div className="grid grid-cols-6 gap-1 text-center font-mono text-[10px]">
                    {historicalTrends3M.t2m.yearlySeries.map((pt: any, i: number) => {
                      const gwPt = historicalTrends3M.gwetroot?.yearlySeries?.[i];
                      return (
                        <div
                          key={pt.year}
                          className="p-1.5 rounded bg-slate-50 dark:bg-slate-900/70 border border-slate-200/70 dark:border-slate-800"
                        >
                          <div className="text-slate-400">{pt.year}</div>
                          <div className="font-semibold text-slate-900 dark:text-white mt-0.5">
                            {pt.value.toFixed(1)}°
                          </div>
                          {gwPt && (
                            <div className="text-[9px] text-sky-600 dark:text-sky-400">
                              {Math.round(gwPt.value * 100)}%w
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 3. City Seasonal Atmosphere Envelope Card */}
          {indicators && (
            <div className="bg-white dark:bg-[#0B0E17] border border-slate-200 dark:border-slate-800 rounded-xl p-5 space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-800 pb-3">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-200 block">
                    3. 6-Month Rolling Envelope
                  </span>
                  <span className="text-[11px] font-mono text-slate-500">
                    {advisoryData?.location?.name}
                  </span>
                </div>
                <Compass className="w-4 h-4 text-sky-500" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <span className="text-[11px] font-mono text-slate-500 block">6-MO MEAN T2M</span>
                  <span className="text-xl font-bold font-mono tabular-nums text-slate-950 dark:text-white">
                    {indicators.avgT2M} °C
                  </span>
                  <span className="text-[11px] font-mono text-amber-600 dark:text-amber-400 block">
                    Drift: {indicators.avgThermalDriftC >= 0 ? `+${indicators.avgThermalDriftC}` : indicators.avgThermalDriftC} °C
                  </span>
                </div>

                <div>
                  <span className="text-[11px] font-mono text-slate-500 block">WINDOW PEAK HIGH</span>
                  <span className="text-xl font-bold font-mono tabular-nums text-rose-600 dark:text-rose-400">
                    {indicators.maxCanopyC} °C
                  </span>
                  <span className="text-[11px] font-mono text-slate-500 block">
                    Night Min: {indicators.minNightC} °C
                  </span>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80">
                  <span className="text-[11px] font-mono text-slate-500 block">ROOT SOIL WETNESS</span>
                  <span className="text-xl font-bold font-mono tabular-nums text-sky-600 dark:text-sky-400">
                    {indicators.avgRootWetness}{' '}
                    <span className="text-xs font-normal text-slate-500">({Math.round(indicators.avgRootWetness * 100)}%)</span>
                  </span>
                  <span className="text-[11px] font-mono text-slate-500 block">
                    GLDAS-2.1 Root Zone
                  </span>
                </div>

                <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80">
                  <span className="text-[11px] font-mono text-slate-500 block">EXPECTED RAINFALL</span>
                  <span className="text-xl font-bold font-mono tabular-nums text-slate-950 dark:text-white">
                    {indicators.totalPrecipMm} mm
                  </span>
                  <span className="text-[11px] font-mono text-slate-500 block">
                    Mean RH: {indicators.avgHumidityPct}%
                  </span>
                </div>
              </div>

              {onInspectInExplorer && (
                <button
                  type="button"
                  onClick={() => onInspectInExplorer(activeCity)}
                  className="w-full py-2 px-3 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-900 text-xs font-medium text-slate-700 dark:text-slate-300 transition-colors flex items-center justify-center gap-1.5"
                >
                  <span>View {activeCity.name} on 3D Globe</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          )}
        </div>

        {/* Right 8 Columns: 3-Month Yield Assessment Spotlight + 6-Month Trajectory + Ranked Crop Matrix */}
        <div className="lg:col-span-8 space-y-8">
          {/* 1. NEW: 3-Month Projected Crop Yield Assessment Card */}
          {focusedCrop && yield3M && (
            <div className="bg-white dark:bg-[#0B0E17] border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-6">
              {/* Top Header */}
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4 border-b border-slate-200 dark:border-slate-800 pb-4">
                <div className="space-y-1">
                  <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-emerald-600 dark:text-emerald-400">
                    <Scale className="w-3.5 h-3.5" />
                    <span>3-MONTH PROJECTED CROP YIELD ASSESSMENT</span>
                    <span>·</span>
                    <span>WINDOW: {yield3M.windowLabel}</span>
                  </div>
                  <h2 className="text-xl font-bold text-slate-950 dark:text-white">
                    {focusedCrop.name} — {activeCity.name}
                  </h2>
                  <p className="text-xs text-slate-500 font-mono">
                    {focusedCrop.category} · {focusedCrop.sowingStatus} · Suitability Score: {focusedCrop.suitabilityScore}%
                  </p>
                </div>

                <div className="sm:text-right font-mono shrink-0">
                  <div
                    className={`inline-flex items-center gap-1 text-2xl font-bold tabular-nums ${
                      yield3M.yieldDeltaPct >= 2
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : yield3M.yieldDeltaPct >= -5
                        ? 'text-sky-600 dark:text-sky-400'
                        : yield3M.yieldDeltaPct >= -14
                        ? 'text-amber-600 dark:text-amber-400'
                        : 'text-rose-600 dark:text-rose-400'
                    }`}
                  >
                    {yield3M.yieldDeltaPct >= 0 ? (
                      <TrendingUp className="w-5 h-5" />
                    ) : (
                      <TrendingDown className="w-5 h-5" />
                    )}
                    <span>{formatSigned(yield3M.yieldDeltaPct, 1, '% Yield Shift')}</span>
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5">{yield3M.yieldOutlookLabel}</div>
                </div>
              </div>

              {/* 4-Column Quantitative Yield Readout Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 p-4 rounded-lg bg-slate-50 dark:bg-slate-900/50 border border-slate-200/80 dark:border-slate-800 font-mono">
                <div>
                  <span className="text-[10px] uppercase text-slate-500 block">
                    Regional Baseline Yield
                  </span>
                  <span className="text-lg font-bold tabular-nums text-slate-800 dark:text-slate-200">
                    {yieldUnit === 'maunds_acre'
                      ? `${yield3M.baselineMaundsPerAcre} md/ac`
                      : `${yield3M.baselineYieldTonHa} t/ha`}
                  </span>
                  <span className="text-[10px] text-slate-500 block">
                    {yieldUnit === 'maunds_acre'
                      ? `(${yield3M.baselineYieldTonHa} t/ha)`
                      : `(${yield3M.baselineMaundsPerAcre} maunds/ac)`}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] uppercase text-slate-500 block">
                    3-Mo Projected Yield
                  </span>
                  <span className="text-lg font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
                    {yieldUnit === 'maunds_acre'
                      ? `${yield3M.projectedMaundsPerAcre} md/ac`
                      : `${yield3M.projectedYieldTonHa} t/ha`}
                  </span>
                  <span className="text-[10px] text-slate-500 block">
                    {yieldUnit === 'maunds_acre'
                      ? `(${yield3M.projectedYieldTonHa} t/ha)`
                      : `(${yield3M.projectedMaundsPerAcre} maunds/ac)`}
                  </span>
                </div>

                <div>
                  <span className="text-[10px] uppercase text-slate-500 block">
                    90% Confidence Range
                  </span>
                  <span className="text-sm font-semibold tabular-nums text-slate-900 dark:text-white block mt-0.5">
                    {yieldUnit === 'maunds_acre'
                      ? `${yield3M.confidenceRangeMaunds[0]} – ${yield3M.confidenceRangeMaunds[1]} md/ac`
                      : `${yield3M.confidenceRangeTonHa[0]} – ${yield3M.confidenceRangeTonHa[1]} t/ha`}
                  </span>
                  <span className="text-[10px] text-slate-500 block">
                    From NASA Inter-Annual SD
                  </span>
                </div>

                <div>
                  <span className="text-[10px] uppercase text-slate-500 block">
                    Net Yield Difference
                  </span>
                  <span
                    className={`text-sm font-semibold tabular-nums block mt-0.5 ${
                      yield3M.yieldDeltaPct >= 0
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-amber-600 dark:text-amber-400'
                    }`}
                  >
                    {yieldUnit === 'maunds_acre'
                      ? `${formatSigned(
                          yield3M.projectedMaundsPerAcre - yield3M.baselineMaundsPerAcre,
                          1,
                          ' md/ac'
                        )}`
                      : `${formatSigned(
                          yield3M.projectedYieldTonHa - yield3M.baselineYieldTonHa,
                          2,
                          ' t/ha'
                        )}`}
                  </span>
                  <span className="text-[10px] text-slate-500 block">
                    vs. Historical Norm
                  </span>
                </div>
              </div>

              {/* Environmental Trend Driver Breakdown & Phenology Progression */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
                {/* Left 5 cols: NASA Trend Driver Breakdown */}
                <div className="md:col-span-5 space-y-3">
                  <div className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    NASA Environmental Trend Drivers (3-Mo)
                  </div>
                  <div className="space-y-2.5 text-xs font-mono">
                    {[
                      {
                        label: 'Thermal Trend & Canopy Heat (T2M / T2M_MAX)',
                        val: yield3M.driverBreakdown?.thermalTrendImpactPct ?? 0,
                      },
                      {
                        label: 'Root-Zone Soil Moisture Trend (GWETROOT)',
                        val: yield3M.driverBreakdown?.soilMoistureTrendImpactPct ?? 0,
                      },
                      {
                        label: 'Rainfall & Humidity Trend (PRECTOTCORR / RH2M)',
                        val: yield3M.driverBreakdown?.precipHumidityImpactPct ?? 0,
                      },
                      {
                        label: 'Seasonal Sowing Window Alignment',
                        val: yield3M.driverBreakdown?.offSeasonPenaltyPct ?? 0,
                      },
                    ].map((d) => {
                      const pct = Number(d.val) || 0;
                      const barWidth = Math.min(100, Math.max(6, Math.abs(pct) * 4.5));
                      return (
                        <div key={d.label} className="space-y-1">
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="font-sans text-slate-600 dark:text-slate-400">
                              {d.label}
                            </span>
                            <span
                              className={`font-semibold tabular-nums ${
                                pct > 0
                                  ? 'text-emerald-600 dark:text-emerald-400'
                                  : pct < 0
                                  ? 'text-rose-600 dark:text-rose-400'
                                  : 'text-slate-500'
                              }`}
                            >
                              {formatSigned(pct, 1, '%')}
                            </span>
                          </div>
                          <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${
                                pct > 0
                                  ? 'bg-emerald-500'
                                  : pct < 0
                                  ? 'bg-rose-500'
                                  : 'bg-slate-400'
                              }`}
                              style={{ width: `${barWidth}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Right 7 cols: Month 1, Month 2, Month 3 Phenological Stage Progression */}
                <div className="md:col-span-7 space-y-3">
                  <div className="text-xs font-semibold uppercase tracking-wider text-slate-700 dark:text-slate-300">
                    3-Month Phenological Stage &amp; Biomass Progression
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    {(yield3M.monthlyStages || []).map((st: any) => (
                      <div
                        key={st.monthStep}
                        className="p-3 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-900/30 flex flex-col justify-between space-y-2"
                      >
                        <div>
                          <div className="flex items-center justify-between text-[11px] font-mono text-slate-500">
                            <span>MONTH 0{st.monthStep}</span>
                            <span className="text-slate-900 dark:text-white font-semibold">
                              {st.monthLabel}
                            </span>
                          </div>
                          <div className="text-xs font-bold text-slate-900 dark:text-white mt-1">
                            {st.phenologyStage}
                          </div>
                        </div>

                        <div className="space-y-1 pt-2 border-t border-slate-200/70 dark:border-slate-800/80 text-[11px] font-mono tabular-nums">
                          <div className="flex justify-between">
                            <span className="text-slate-500">Mean / Max:</span>
                            <span className="text-slate-800 dark:text-slate-200">
                              {st.projectedT2M}° / {st.projectedT2MMax}°C
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Root Wetness:</span>
                            <span className="text-sky-600 dark:text-sky-400">
                              {Math.round(st.projectedRootWetness * 100)}%
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-slate-500">Biomass Vigor:</span>
                            <span
                              className={`font-semibold ${
                                st.stageBiomassIndexPct >= 80
                                  ? 'text-emerald-600 dark:text-emerald-400'
                                  : st.stageBiomassIndexPct >= 65
                                  ? 'text-amber-600 dark:text-amber-400'
                                  : 'text-rose-600 dark:text-rose-400'
                              }`}
                            >
                              {st.stageBiomassIndexPct}%
                            </span>
                          </div>
                        </div>

                        <div className="text-[11px] text-slate-600 dark:text-slate-400 pt-1 border-t border-slate-200/50 dark:border-slate-800/50">
                          {st.stageNote}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Bottom Agronomic Intervention & Detailed Fit */}
              <div className="pt-4 border-t border-slate-200 dark:border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1">
                  <div className="font-mono text-[11px] text-emerald-600 dark:text-emerald-400 uppercase">
                    3-Month Yield Protection Intervention
                  </div>
                  <p className="text-slate-800 dark:text-slate-200 font-medium leading-relaxed">
                    {yield3M.agronomicYieldIntervention}
                  </p>
                  <div className="text-slate-500 font-mono text-[11px] pt-1">
                    {focusedCrop.thermalMatch} · {focusedCrop.waterMatch}
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="font-mono text-[11px] text-sky-600 dark:text-sky-400 uppercase">
                    Recommended Sowing &amp; Field Action
                  </div>
                  <p className="text-slate-800 dark:text-slate-200 font-medium leading-relaxed">
                    {focusedCrop.farmerAction}
                  </p>
                  <div className="text-slate-500 font-mono text-[11px] pt-1">
                    {focusedCrop.atmosphericRisk}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 2. Month-by-Month Upcoming Atmospheric Forecast Table */}
          <div className="bg-white dark:bg-[#0B0E17] border border-slate-200 dark:border-slate-800 rounded-xl p-6 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-slate-200 dark:border-slate-800">
              <div>
                <h2 className="text-base font-bold text-slate-950 dark:text-white">
                  Upcoming 6-Month Agroclimatology Trajectory — {activeCity.name}
                </h2>
                <p className="text-xs font-mono text-slate-500">
                  {advisoryData?.seasonLabel || 'NASA POWER Monthly Projection'}
                </p>
              </div>
              {isLoading && (
                <span className="text-xs font-mono text-sky-500">Querying NASA POWER AG...</span>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-mono text-slate-500 uppercase">
                    <th className="py-2.5 pr-3">Month</th>
                    <th className="py-2.5 px-3">Mean Temp (T2M)</th>
                    <th className="py-2.5 px-3">Canopy Max (T2M_MAX)</th>
                    <th className="py-2.5 px-3">Night Min (T2M_MIN)</th>
                    <th className="py-2.5 px-3">Rain (PRECTOTCORR)</th>
                    <th className="py-2.5 px-3">Root Moisture (GWETROOT)</th>
                    <th className="py-2.5 pl-3 text-right">Humidity (RH2M)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/60 dark:divide-slate-800/70 font-mono tabular-nums">
                  {upcomingMonths.map((m, idx) => (
                    <tr
                      key={m.step}
                      className={`hover:bg-slate-50 dark:hover:bg-slate-900/40 ${
                        idx < 3 ? 'bg-emerald-500/[0.03]' : ''
                      }`}
                    >
                      <td className="py-2.5 pr-3 font-sans font-semibold text-slate-900 dark:text-white">
                        {m.shortLabel}
                        {m.isCurrentMonth && (
                          <span className="ml-1.5 text-[10px] font-mono text-sky-500">(Current)</span>
                        )}
                        {idx < 3 && !m.isCurrentMonth && (
                          <span className="ml-1.5 text-[10px] font-mono text-emerald-600 dark:text-emerald-400">
                            (3M Window)
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-slate-800 dark:text-slate-200">
                        {m.t2m.toFixed(1)} °C
                      </td>
                      <td
                        className={`py-2.5 px-3 font-semibold ${
                          m.t2m_max >= 40
                            ? 'text-rose-600 dark:text-rose-400'
                            : m.t2m_max >= 34
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {m.t2m_max.toFixed(1)} °C
                      </td>
                      <td className="py-2.5 px-3 text-slate-600 dark:text-slate-400">
                        {m.t2m_min.toFixed(1)} °C
                      </td>
                      <td
                        className={`py-2.5 px-3 ${
                          m.precip_mm > 80
                            ? 'text-sky-600 dark:text-sky-400 font-semibold'
                            : 'text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {m.precip_mm.toFixed(1)} mm
                      </td>
                      <td className="py-2.5 px-3 text-slate-700 dark:text-slate-300">
                        {m.root_wetness.toFixed(2)} ({Math.round(m.root_wetness * 100)}%)
                      </td>
                      <td className="py-2.5 pl-3 text-right text-slate-600 dark:text-slate-400">
                        {m.rh_pct}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* 3. Complete Ranked Crop Suitability & 3-Month Yield Comparison Matrix */}
          <div className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h3 className="text-base font-bold text-slate-950 dark:text-white">
                Ranked Crop Suitability &amp; 3-Month Yield Comparison — {activeCity.name}
              </h3>
              <span className="text-xs font-mono text-slate-500">
                Click any crop to inspect its 3-month NASA yield model
              </span>
            </div>

            <div className="divide-y divide-slate-200 dark:divide-slate-800 border-y border-slate-200 dark:border-slate-800">
              {recommendations.map((crop, idx) => {
                const isSelected = focusedCrop?.id === crop.id;
                const cropYield = crop.yieldAssessment3M;
                const scoreColor =
                  crop.suitabilityScore >= 80
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : crop.suitabilityScore >= 64
                    ? 'text-sky-600 dark:text-sky-400'
                    : crop.suitabilityScore >= 46
                    ? 'text-amber-600 dark:text-amber-400'
                    : 'text-rose-600 dark:text-rose-400';

                return (
                  <button
                    key={crop.id}
                    type="button"
                    onClick={() => setSelectedCropId(crop.id)}
                    className={`w-full text-left py-4 px-4 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                      isSelected
                        ? 'bg-slate-100/90 dark:bg-slate-900/90'
                        : 'hover:bg-slate-50 dark:hover:bg-slate-900/30'
                    }`}
                  >
                    <div className="space-y-1 max-w-xl">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="text-xs font-mono text-slate-400">0{idx + 1}.</span>
                        <span className="text-sm font-bold text-slate-950 dark:text-white">
                          {crop.name}
                        </span>
                        <span className="text-xs text-slate-500">· {crop.sowingStatus}</span>
                      </div>
                      <div className="text-xs text-slate-600 dark:text-slate-400 pl-6">
                        {crop.farmerAction}
                      </div>
                      <div className="text-[11px] font-mono text-slate-500 pl-6">
                        Window: {crop.sowingWindow} · {crop.thermalMatch}
                      </div>
                    </div>

                    <div className="flex sm:items-center gap-6 justify-between sm:justify-end shrink-0 pl-6 sm:pl-0 font-mono">
                      {cropYield && (
                        <div className="text-left sm:text-right">
                          <div className="text-[10px] uppercase text-slate-500">
                            3-Mo Projected Yield
                          </div>
                          <div className="text-sm font-bold tabular-nums text-slate-900 dark:text-white">
                            {yieldUnit === 'maunds_acre'
                              ? `${cropYield.projectedMaundsPerAcre} md/ac`
                              : `${cropYield.projectedYieldTonHa} t/ha`}
                          </div>
                          <div
                            className={`text-[11px] tabular-nums ${
                              cropYield.yieldDeltaPct >= 0
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-amber-600 dark:text-amber-400'
                            }`}
                          >
                            {formatSigned(cropYield.yieldDeltaPct, 1, '% vs norm')}
                          </div>
                        </div>
                      )}

                      <div className="text-right">
                        <div className={`text-lg font-bold tabular-nums ${scoreColor}`}>
                          {crop.suitabilityScore}%
                        </div>
                        <div className="text-[11px] text-slate-500">{crop.verdict}</div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
