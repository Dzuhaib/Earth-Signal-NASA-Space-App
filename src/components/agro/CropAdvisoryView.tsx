/**
 * EarthSignal — Visual-First Crop & Yield Forecast
 * Clean, visual-rich agroclimatology dashboard with 6-year mini spark-bars,
 * SVG circular biomass vigor rings, and radial crop suitability gauges.
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  Sprout,
  Thermometer,
  CloudRain,
  Droplets,
  Calendar,
  MapPin,
  TrendingUp,
  TrendingDown,
  Minus,
  CheckCircle2,
  AlertTriangle,
  Info,
} from 'lucide-react';
import { GeographicRegion, CityMarker } from '../../types/earthsignal';
import { ACCURATE_CITIES } from '../../services/nasa/nasaRegistry';

interface CropAdvisoryViewProps {
  selectedRegion?: GeographicRegion;
  defaultCityId?: string;
  onSelectCoordinates?: (lat: number, lon: number) => void;
  onInspectInExplorer?: (city: CityMarker) => void;
}

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

const SHORT_MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

interface YearlySeriesPoint {
  year: number;
  value: number;
}

interface TrendIndicator {
  historicalMean: number;
  annualSlope: number;
  totalChange6Yr: number;
  stdDev?: number;
  direction: 'upward' | 'downward' | 'stable';
  yearlySeries: YearlySeriesPoint[];
}

interface MonthlyStage {
  monthStep: number;
  monthLabel: string;
  phenologyStage: string;
  projectedT2M: number;
  projectedT2MMax: number;
  projectedRootWetness: number;
  projectedPrecipMm: number;
  t2mDrift?: number;
  stageBiomassIndexPct: number;
  stageNote: string;
}

interface YieldAssessment3M {
  windowLabel: string;
  baselineYieldTonHa: number;
  projectedYieldTonHa: number;
  baselineMaundsPerAcre: number;
  projectedMaundsPerAcre: number;
  yieldDeltaPct: number;
  confidenceRangeTonHa: [number, number];
  yieldOutlookLabel: string;
  agronomicYieldIntervention: string;
  monthlyStages: MonthlyStage[];
}

interface CropRecommendation {
  id: string;
  name: string;
  category: string;
  suitabilityScore: number;
  thermalScore?: number;
  hydroScore?: number;
  verdict: string;
  sowingStatus: string;
  sowingWindow: string;
  waterNeedLabel: string;
  thermalMatch?: string;
  waterMatch?: string;
  atmosphericRisk?: string;
  farmerAction: string;
  yieldAssessment3M: YieldAssessment3M;
}

interface AgroApiResponse {
  status: string;
  referenceDate?: {
    iso: string;
    formatted: string;
    year: number;
    month: number;
    day: number;
  };
  location?: {
    city_id: string;
    name: string;
    latitude: number;
    longitude: number;
  };
  seasonMode?: string;
  seasonLabel?: string;
  summaryIndicators: {
    avgT2M: number;
    maxCanopyC: number;
    minNightC: number;
    totalPrecipMm: number;
    avgRootWetness: number;
    avgHumidityPct: number;
    avgThermalDriftC?: number;
  };
  threeMonthHistoricalTrends: {
    windowLabel: string;
    T2M: TrendIndicator;
    T2M_MAX?: TrendIndicator;
    PRECTOTCORR: TrendIndicator;
    GWETROOT: TrendIndicator;
    RH2M?: TrendIndicator;
  };
  upcomingMonths?: Array<{
    step: number;
    month: number;
    year: number;
    monthName: string;
    shortLabel: string;
    isCurrentMonth?: boolean;
    t2m: number;
    t2m_max: number;
    t2m_min: number;
    precip_mm: number;
    rh_pct: number;
    root_wetness: number;
  }>;
  recommendations: CropRecommendation[];
}

export const CropAdvisoryView: React.FC<CropAdvisoryViewProps> = ({
  selectedRegion,
  defaultCityId = 'city_sukkur',
  onSelectCoordinates,
  onInspectInExplorer,
}) => {
  const pakistaniHubs = useMemo(
    () => ACCURATE_CITIES.filter((c) => c.country === 'Pakistan'),
    []
  );

  const [selectedCity, setSelectedCity] = useState<CityMarker>(() => {
    if (selectedRegion) {
      const match = pakistaniHubs.find(
        (c) =>
          Math.abs(c.latitude - selectedRegion.latitude) < 0.35 &&
          Math.abs(c.longitude - selectedRegion.longitude) < 0.35
      );
      if (match) return match;
    }
    return pakistaniHubs.find((c) => c.id === defaultCityId) || pakistaniHubs[0];
  });

  // Default to Month 3 (April, 0-indexed) and 2026
  const [selectedMonth, setSelectedMonth] = useState<number>(3);
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [selectedCropId, setSelectedCropId] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [agroData, setAgroData] = useState<AgroApiResponse | null>(null);
  const [fetchError, setFetchError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setFetchError(null);

    const queryParams = new URLSearchParams({
      city_id: selectedCity.id,
      lat: String(selectedCity.latitude),
      lon: String(selectedCity.longitude),
      month: String(selectedMonth),
      year: String(selectedYear),
    });

    fetch(`/api/crop-advisory?${queryParams.toString()}`)
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Satellite service returned ${res.status}`);
        }
        return res.json();
      })
      .then((data: AgroApiResponse) => {
        if (cancelled) return;
        if (data && data.status === 'success' && data.recommendations?.length > 0) {
          setAgroData(data);
          // Retain selection if valid, otherwise pick first crop
          setSelectedCropId((prev) => {
            const exists = data.recommendations.some((c) => c.id === prev);
            return exists ? prev : data.recommendations[0].id;
          });
        } else {
          throw new Error('Incomplete data payload');
        }
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error('Agro fetch error:', err);
        setFetchError(err.message);
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [selectedCity.id, selectedCity.latitude, selectedCity.longitude, selectedMonth, selectedYear]);

  const m1 = selectedMonth;
  const m3 = (selectedMonth + 2) % 12;

  const activeCrop = useMemo(() => {
    if (!agroData?.recommendations?.length) return null;
    return (
      agroData.recommendations.find((c) => c.id === selectedCropId) ||
      agroData.recommendations[0]
    );
  }, [agroData, selectedCropId]);

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 space-y-6 pb-20 pt-4">
      {/* 1. COMPACT HEADER & 3-PARAMETER CONTROL BAR */}
      <div className="bg-white dark:bg-[#0D111A] border border-slate-200 dark:border-[#1E2638] rounded-md p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-xs bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-mono font-bold tracking-widest uppercase">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                NASA Live Agroclimatology
              </span>
              <span className="text-[11px] font-mono text-slate-400 dark:text-slate-500">
                MERRA-2 & GLDAS-2.1
              </span>
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-950 dark:text-white tracking-tight">
              {selectedCity.name} — {SHORT_MONTHS[m1]} to {SHORT_MONTHS[m3]} {selectedYear}
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              3-Month rolling phenology forecast & crop suitability analysis for Indus Basin agriculture.
            </p>
          </div>

          {/* 3 Selectors (City, Month Window, Year) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 min-w-[320px] lg:w-auto">
            {/* Hub Selector */}
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-[#111622] border border-slate-200 dark:border-[#1E2638] rounded-sm px-3 py-2">
              <MapPin className="w-3.5 h-3.5 text-cyan-500 shrink-0" />
              <div className="flex-1 min-w-0">
                <label htmlFor="hub-select" className="block text-[9px] font-mono uppercase text-slate-400 font-semibold leading-none mb-0.5">
                  Agricultural Hub
                </label>
                <select
                  id="hub-select"
                  value={selectedCity.id}
                  onChange={(e) => {
                    const city = pakistaniHubs.find((c) => c.id === e.target.value);
                    if (city) {
                      setSelectedCity(city);
                      if (onSelectCoordinates) {
                        onSelectCoordinates(city.latitude, city.longitude);
                      }
                    }
                  }}
                  className="w-full bg-transparent text-xs font-semibold text-slate-900 dark:text-white focus:outline-none cursor-pointer truncate"
                >
                  {pakistaniHubs.map((c) => (
                    <option key={c.id} value={c.id} className="bg-white dark:bg-[#0D111A]">
                      {c.name} ({c.province || 'PK'})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Start Month */}
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-[#111622] border border-slate-200 dark:border-[#1E2638] rounded-sm px-3 py-2">
              <Calendar className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <div className="flex-1 min-w-0">
                <label htmlFor="month-select" className="block text-[9px] font-mono uppercase text-slate-400 font-semibold leading-none mb-0.5">
                  3-Month Window
                </label>
                <select
                  id="month-select"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(Number(e.target.value))}
                  className="w-full bg-transparent text-xs font-semibold text-slate-900 dark:text-white focus:outline-none cursor-pointer truncate"
                >
                  {MONTH_NAMES.map((m, idx) => (
                    <option key={m} value={idx} className="bg-white dark:bg-[#0D111A]">
                      {m} – {SHORT_MONTHS[(idx + 2) % 12]}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Year Selector */}
            <div className="flex items-center gap-2 bg-slate-50 dark:bg-[#111622] border border-slate-200 dark:border-[#1E2638] rounded-sm px-3 py-2">
              <div className="flex-1 min-w-0">
                <label htmlFor="year-select" className="block text-[9px] font-mono uppercase text-slate-400 font-semibold leading-none mb-0.5">
                  Forecast Year
                </label>
                <select
                  id="year-select"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(Number(e.target.value))}
                  className="w-full bg-transparent text-xs font-mono font-bold text-slate-900 dark:text-white focus:outline-none cursor-pointer truncate"
                >
                  {[2026, 2025, 2024, 2023, 2022, 2021, 2020].map((yr) => (
                    <option key={yr} value={yr} className="bg-white dark:bg-[#0D111A]">
                      {yr}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Loading state */}
      {loading && !agroData && (
        <div className="w-full h-80 bg-white dark:bg-[#0D111A] border border-slate-200 dark:border-[#1E2638] rounded-md flex flex-col items-center justify-center gap-3">
          <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          <span className="text-xs font-mono text-slate-500">
            Querying NASA Langley Agroclimatology (MERRA-2 / GLDAS)...
          </span>
        </div>
      )}

      {/* Error state */}
      {fetchError && !agroData && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-md p-4 flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
          <div className="text-xs text-amber-700 dark:text-amber-300">
            Could not fetch real-time NASA satellite forecast. Retrying in background...
          </div>
        </div>
      )}

      {/* MAIN DATA VIEW */}
      {agroData && (
        <>
          {/* 2. THREE CLIMATOLOGICAL CONDITION CARDS WITH SPARK-BARS */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Canopy Heat (T2M) */}
            <div className="bg-white dark:bg-[#0D111A] border border-slate-200 dark:border-[#1E2638] rounded-md p-5 space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-white">
                  <Thermometer className="w-4 h-4 text-orange-500 shrink-0" />
                  <span>Canopy Temperature</span>
                </span>
                <span className="text-xs font-mono font-bold text-orange-500 flex items-center gap-1 tabular-nums">
                  {agroData.threeMonthHistoricalTrends?.T2M?.annualSlope >= 0 ? (
                    <TrendingUp className="w-3.5 h-3.5" />
                  ) : (
                    <TrendingDown className="w-3.5 h-3.5" />
                  )}
                  {agroData.threeMonthHistoricalTrends?.T2M?.annualSlope >= 0 ? '+' : ''}
                  {(agroData.threeMonthHistoricalTrends?.T2M?.annualSlope * 10).toFixed(2)}°C / dec
                </span>
              </div>

              <div className="flex items-baseline justify-between pt-1">
                <div>
                  <div className="font-mono text-3xl font-extrabold text-slate-950 dark:text-white tabular-nums tracking-tight">
                    {agroData.summaryIndicators?.avgT2M?.toFixed(1) ?? '--'}°C
                  </div>
                  <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                    Peak Canopy Max: {agroData.summaryIndicators?.maxCanopyC?.toFixed(1) ?? '--'}°C
                  </div>
                </div>

                {/* Historical mini spark-bars */}
                {agroData.threeMonthHistoricalTrends?.T2M?.yearlySeries && (
                  <div className="flex items-end gap-1.5 h-12">
                    {agroData.threeMonthHistoricalTrends.T2M.yearlySeries.map((row) => {
                      const hPct = Math.max(20, Math.min(100, ((row.value - 15) / 28) * 100));
                      return (
                        <div key={row.year} className="flex flex-col items-center gap-1" title={`${row.year}: ${row.value}°C`}>
                          <div className="w-3.5 bg-slate-100 dark:bg-[#141B29] rounded-xs h-9 flex items-end overflow-hidden">
                            <div
                              className="w-full bg-orange-500 rounded-xs transition-all duration-300"
                              style={{ height: `${hPct}%` }}
                            />
                          </div>
                          <span className="text-[9px] font-mono text-slate-400 tabular-nums">
                            {String(row.year).slice(2)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Precipitation (PRECTOTCORR) */}
            <div className="bg-white dark:bg-[#0D111A] border border-slate-200 dark:border-[#1E2638] rounded-md p-5 space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-white">
                  <CloudRain className="w-4 h-4 text-cyan-500 shrink-0" />
                  <span>3-Month Rainfall</span>
                </span>
                <span className="text-xs font-mono font-bold text-cyan-500 flex items-center gap-1 tabular-nums">
                  {agroData.threeMonthHistoricalTrends?.PRECTOTCORR?.annualSlope >= 0 ? (
                    <TrendingUp className="w-3.5 h-3.5" />
                  ) : (
                    <TrendingDown className="w-3.5 h-3.5" />
                  )}
                  {agroData.threeMonthHistoricalTrends?.PRECTOTCORR?.annualSlope >= 0 ? '+' : ''}
                  {(agroData.threeMonthHistoricalTrends?.PRECTOTCORR?.annualSlope * 10).toFixed(1)} mm / dec
                </span>
              </div>

              <div className="flex items-baseline justify-between pt-1">
                <div>
                  <div className="font-mono text-3xl font-extrabold text-slate-950 dark:text-white tabular-nums tracking-tight">
                    {agroData.summaryIndicators?.totalPrecipMm?.toFixed(0) ?? '--'} mm
                  </div>
                  <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                    {agroData.threeMonthHistoricalTrends?.PRECTOTCORR?.direction === 'upward'
                      ? 'Wetting precipitation signal'
                      : 'Arid / dry spell regime'}
                  </div>
                </div>

                {/* Historical mini spark-bars */}
                {agroData.threeMonthHistoricalTrends?.PRECTOTCORR?.yearlySeries && (
                  <div className="flex items-end gap-1.5 h-12">
                    {agroData.threeMonthHistoricalTrends.PRECTOTCORR.yearlySeries.map((row) => {
                      const seriesMax = Math.max(
                        40,
                        ...agroData.threeMonthHistoricalTrends.PRECTOTCORR.yearlySeries.map((x) => x.value)
                      );
                      const hPct = Math.max(15, Math.min(100, (row.value / seriesMax) * 100));
                      return (
                        <div key={row.year} className="flex flex-col items-center gap-1" title={`${row.year}: ${row.value.toFixed(1)} mm`}>
                          <div className="w-3.5 bg-slate-100 dark:bg-[#141B29] rounded-xs h-9 flex items-end overflow-hidden">
                            <div
                              className="w-full bg-cyan-500 rounded-xs transition-all duration-300"
                              style={{ height: `${hPct}%` }}
                            />
                          </div>
                          <span className="text-[9px] font-mono text-slate-400 tabular-nums">
                            {String(row.year).slice(2)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Root-Zone Moisture (GWETROOT) */}
            <div className="bg-white dark:bg-[#0D111A] border border-slate-200 dark:border-[#1E2638] rounded-md p-5 space-y-3 shadow-xs">
              <div className="flex items-center justify-between">
                <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-white">
                  <Droplets className="w-4 h-4 text-emerald-500 shrink-0" />
                  <span>Root-Zone Soil Saturation</span>
                </span>
                <span className="text-xs font-mono font-bold text-emerald-500 flex items-center gap-1 tabular-nums">
                  {Math.abs(agroData.threeMonthHistoricalTrends?.GWETROOT?.annualSlope ?? 0) < 0.005 ? (
                    <Minus className="w-3.5 h-3.5" />
                  ) : agroData.threeMonthHistoricalTrends?.GWETROOT?.annualSlope >= 0 ? (
                    <TrendingUp className="w-3.5 h-3.5" />
                  ) : (
                    <TrendingDown className="w-3.5 h-3.5" />
                  )}
                  {agroData.threeMonthHistoricalTrends?.GWETROOT?.annualSlope >= 0 ? '+' : ''}
                  {((agroData.threeMonthHistoricalTrends?.GWETROOT?.annualSlope ?? 0) * 1000).toFixed(1)}‰ / dec
                </span>
              </div>

              <div className="flex items-baseline justify-between pt-1">
                <div>
                  <div className="font-mono text-3xl font-extrabold text-slate-950 dark:text-white tabular-nums tracking-tight">
                    {((agroData.summaryIndicators?.avgRootWetness ?? 0.35) * 100).toFixed(0)}%
                  </div>
                  <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                    NASA GLDAS-2.1 root layer profile
                  </div>
                </div>

                {/* Historical mini spark-bars */}
                {agroData.threeMonthHistoricalTrends?.GWETROOT?.yearlySeries && (
                  <div className="flex items-end gap-1.5 h-12">
                    {agroData.threeMonthHistoricalTrends.GWETROOT.yearlySeries.map((row) => {
                      const hPct = Math.max(15, Math.min(100, row.value * 100));
                      return (
                        <div key={row.year} className="flex flex-col items-center gap-1" title={`${row.year}: ${(row.value * 100).toFixed(1)}%`}>
                          <div className="w-3.5 bg-slate-100 dark:bg-[#141B29] rounded-xs h-9 flex items-end overflow-hidden">
                            <div
                              className="w-full bg-emerald-500 rounded-xs transition-all duration-300"
                              style={{ height: `${hPct}%` }}
                            />
                          </div>
                          <span className="text-[9px] font-mono text-slate-400 tabular-nums">
                            {String(row.year).slice(2)}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* 3. CROP SUITABILITY RANKINGS WITH RADIAL SVG GAUGES */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-display text-lg font-bold text-slate-950 dark:text-white">
                  Crop Suitability Ranking ({agroData.recommendations.length} Evaluated)
                </h2>
                <p className="text-xs text-slate-500">
                  Click any crop below to view its 3-month growth stages and yield outlook.
                </p>
              </div>

              {onInspectInExplorer && (
                <button
                  type="button"
                  onClick={() => onInspectInExplorer(selectedCity)}
                  className="text-xs font-mono font-semibold text-cyan-600 dark:text-cyan-400 hover:underline cursor-pointer flex items-center gap-1"
                >
                  Inspect {selectedCity.name} on 3D Map →
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {agroData.recommendations.map((crop) => {
                const isSelected = activeCrop?.id === crop.id;
                const ringColor =
                  crop.suitabilityScore >= 80
                    ? '#10b981' // emerald
                    : crop.suitabilityScore >= 60
                    ? '#06b6d4' // cyan
                    : crop.suitabilityScore >= 40
                    ? '#f59e0b' // amber
                    : '#94a3b8'; // slate

                return (
                  <button
                    key={crop.id}
                    type="button"
                    onClick={() => setSelectedCropId(crop.id)}
                    className={`text-left p-4 rounded-md border transition-all cursor-pointer relative flex flex-col justify-between gap-3 ${
                      isSelected
                        ? 'bg-emerald-500/10 border-emerald-500 shadow-sm ring-1 ring-emerald-500/50'
                        : 'bg-white dark:bg-[#0D111A] border-slate-200 dark:border-[#1E2638] hover:border-slate-300 dark:hover:border-slate-600'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="space-y-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <Sprout className={`w-4 h-4 shrink-0 ${isSelected ? 'text-emerald-500' : 'text-slate-400'}`} />
                          <h3 className="font-display text-sm font-bold text-slate-950 dark:text-white truncate">
                            {crop.name}
                          </h3>
                        </div>
                        <div className="text-[10px] font-mono text-slate-400 truncate">
                          {crop.category}
                        </div>
                      </div>

                      {/* Circular Suitability SVG Ring */}
                      <div className="relative w-12 h-12 shrink-0 flex items-center justify-center">
                        <svg className="w-12 h-12 -rotate-90" viewBox="0 0 48 48">
                          <circle
                            cx="24"
                            cy="24"
                            r="19"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="4"
                            className="text-slate-200 dark:text-[#182030]"
                          />
                          <circle
                            cx="24"
                            cy="24"
                            r="19"
                            fill="none"
                            stroke={ringColor}
                            strokeWidth="4"
                            strokeLinecap="round"
                            strokeDasharray={`${(crop.suitabilityScore / 100) * 119.38} 119.38`}
                          />
                        </svg>
                        <span className="absolute font-mono text-[11px] font-bold text-slate-950 dark:text-white tabular-nums">
                          {crop.suitabilityScore}%
                        </span>
                      </div>
                    </div>

                    <div className="space-y-1.5 pt-1 border-t border-slate-100 dark:border-[#161D2B]">
                      <div className="flex items-center justify-between text-[10px] font-mono">
                        <span className="text-slate-400">Verdict</span>
                        <span
                          className={`font-semibold truncate max-w-[150px] ${
                            crop.suitabilityScore >= 70
                              ? 'text-emerald-600 dark:text-emerald-400'
                              : crop.suitabilityScore >= 40
                              ? 'text-amber-600 dark:text-amber-400'
                              : 'text-slate-500'
                          }`}
                        >
                          {crop.verdict}
                        </span>
                      </div>
                      <div className="flex items-center justify-between text-[10px] font-mono">
                        <span className="text-slate-400">Sowing</span>
                        <span className="text-slate-700 dark:text-slate-300 truncate max-w-[150px]">
                          {crop.sowingStatus}
                        </span>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 4. ACTIVE CROP 3-MONTH PHENOLOGY & YIELD ASSESSMENT */}
          {activeCrop && (
            <div className="bg-white dark:bg-[#0D111A] border border-slate-200 dark:border-[#1E2638] rounded-md p-5 space-y-5 shadow-xs">
              {/* Header Bar */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-200 dark:border-[#1E2638]">
                <div className="space-y-0.5">
                  <div className="text-[10px] font-mono uppercase tracking-widest text-emerald-600 dark:text-emerald-400 font-bold">
                    3-Month Growth Trajectory & Satellite Yield Projection
                  </div>
                  <h3 className="font-display text-xl font-extrabold text-slate-950 dark:text-white">
                    {activeCrop.name}
                  </h3>
                  <div className="text-xs font-mono text-slate-500">
                    Sowing Window: {activeCrop.sowingWindow} · Water: {activeCrop.waterNeedLabel}
                  </div>
                </div>

                {/* Yield Delta Badge */}
                {activeCrop.yieldAssessment3M && (
                  <div className="flex items-center gap-3 bg-slate-50 dark:bg-[#111622] border border-slate-200 dark:border-[#1E2638] rounded-sm px-4 py-2">
                    <div>
                      <div className="text-[10px] font-mono uppercase text-slate-400">
                        Projected Yield
                      </div>
                      <div className="font-mono text-base font-bold text-slate-950 dark:text-white tabular-nums">
                        {activeCrop.yieldAssessment3M.projectedYieldTonHa.toFixed(2)} t/ha
                      </div>
                    </div>

                    <div className="h-7 w-px bg-slate-200 dark:bg-[#1E2638]" />

                    <div>
                      <div className="text-[10px] font-mono uppercase text-slate-400">
                        Historical Baseline
                      </div>
                      <div className="font-mono text-base font-bold text-slate-500 tabular-nums">
                        {activeCrop.yieldAssessment3M.baselineYieldTonHa.toFixed(2)} t/ha
                      </div>
                    </div>

                    <div className="h-7 w-px bg-slate-200 dark:bg-[#1E2638]" />

                    <div className="text-right">
                      <div className="text-[10px] font-mono uppercase text-slate-400">
                        Impact Delta
                      </div>
                      <div
                        className={`font-mono text-base font-extrabold tabular-nums flex items-center gap-0.5 ${
                          activeCrop.yieldAssessment3M.yieldDeltaPct >= 0
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : 'text-amber-500'
                        }`}
                      >
                        {activeCrop.yieldAssessment3M.yieldDeltaPct >= 0 ? '+' : ''}
                        {activeCrop.yieldAssessment3M.yieldDeltaPct.toFixed(1)}%
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Agronomic Intervention Alert */}
              <div className="bg-slate-50 dark:bg-[#090C12] border border-slate-200 dark:border-[#1E2638] rounded-sm p-3.5 flex items-start gap-3">
                <Info className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <div className="text-xs space-y-0.5">
                  <span className="font-semibold text-slate-900 dark:text-white">
                    Agronomic Recommendation:{' '}
                  </span>
                  <span className="text-slate-600 dark:text-slate-300">
                    {activeCrop.farmerAction}
                  </span>
                </div>
              </div>

              {/* 3 Monthly Phenology Stages */}
              {activeCrop.yieldAssessment3M?.monthlyStages && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {activeCrop.yieldAssessment3M.monthlyStages.map((stage, idx) => (
                    <div
                      key={stage.monthLabel || idx}
                      className="bg-slate-50 dark:bg-[#090C12] border border-slate-200 dark:border-[#1E2638] rounded-sm p-4 space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400 font-bold uppercase">
                            Month 0{idx + 1} · {stage.monthLabel}
                          </span>
                          <h4 className="font-display text-sm font-bold text-slate-950 dark:text-white mt-0.5">
                            {stage.phenologyStage}
                          </h4>
                        </div>

                        {/* Biomass Vigor Circular Gauge */}
                        <div className="relative w-11 h-11 shrink-0 flex items-center justify-center">
                          <svg className="w-11 h-11 -rotate-90" viewBox="0 0 44 44">
                            <circle
                              cx="22"
                              cy="22"
                              r="17"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="3.5"
                              className="text-slate-200 dark:text-[#182030]"
                            />
                            <circle
                              cx="22"
                              cy="22"
                              r="17"
                              fill="none"
                              stroke="#10b981"
                              strokeWidth="3.5"
                              strokeLinecap="round"
                              strokeDasharray={`${(Math.min(100, stage.stageBiomassIndexPct) / 100) * 106.8} 106.8`}
                            />
                          </svg>
                          <span className="absolute font-mono text-[10px] font-bold text-slate-900 dark:text-white tabular-nums">
                            {stage.stageBiomassIndexPct}%
                          </span>
                        </div>
                      </div>

                      {/* Climate indicators for this month */}
                      <div className="grid grid-cols-3 gap-2 py-2 border-y border-slate-200/60 dark:border-[#161D2B] text-center">
                        <div>
                          <div className="text-[9px] font-mono uppercase text-slate-400">Mean Temp</div>
                          <div className="text-xs font-mono font-bold text-slate-900 dark:text-white tabular-nums">
                            {stage.projectedT2M?.toFixed(1)}°C
                          </div>
                        </div>
                        <div>
                          <div className="text-[9px] font-mono uppercase text-slate-400">Peak Max</div>
                          <div className="text-xs font-mono font-bold text-orange-500 tabular-nums">
                            {stage.projectedT2MMax?.toFixed(1)}°C
                          </div>
                        </div>
                        <div>
                          <div className="text-[9px] font-mono uppercase text-slate-400">Rainfall</div>
                          <div className="text-xs font-mono font-bold text-cyan-500 tabular-nums">
                            {stage.projectedPrecipMm?.toFixed(0)} mm
                          </div>
                        </div>
                      </div>

                      {/* Stage note */}
                      <div className="text-xs text-slate-600 dark:text-slate-400 flex items-start gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                        <span className="line-clamp-2">{stage.stageNote}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};
