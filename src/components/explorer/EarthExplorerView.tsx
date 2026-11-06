/**
 * EarthSignal — Visual-First 3D Map Explorer
 * Clean, visual-rich 3D planetary globe (20% default zoom), compact channel selector,
 * 12-month seasonal bar chart, and interactive time-series chart.
 */

import React, { useState, useEffect } from 'react';
import {
  MapPin,
  Sliders,
  Waves,
  Calendar,
  BarChart3,
} from 'lucide-react';
import {
  GeographicRegion,
  EnvironmentalVariableId,
  StatisticalAnalysisResponse,
} from '../../types/earthsignal';
import {
  ENVIRONMENTAL_VARIABLES,
  ACCURATE_CITIES,
  FLOOD_YEAR_RECORDS,
  getCityMetricForVariableAndYear,
} from '../../services/nasa/nasaRegistry';
import { Earth3DGlobe } from '../maps/Earth3DGlobe';
import { ScientificTimeSeriesChart } from '../charts/ScientificTimeSeriesChart';

interface EarthExplorerViewProps {
  regions: GeographicRegion[];
  selectedRegion: GeographicRegion;
  selectedVariable: EnvironmentalVariableId;
  startYear: number;
  endYear: number;
  analysis: StatisticalAnalysisResponse | null;
  isLoading?: boolean;
  loading?: boolean;
  onSelectRegion: (r: GeographicRegion) => void;
  onSelectVariable: (v: EnvironmentalVariableId) => void;
  onSelectCoordinates?: (lat: number, lon: number) => void;
  onChangeYears?: (startYear: number, endYear: number) => void;
  onChangeStartYear?: (y: number) => void;
  onChangeEndYear?: (y: number) => void;
  onAnalyze?: () => void;
  onOpenReport?: () => void;
}

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export const EarthExplorerView: React.FC<EarthExplorerViewProps> = ({
  regions,
  selectedRegion,
  selectedVariable,
  startYear,
  endYear,
  analysis,
  isLoading = false,
  loading = false,
  onSelectRegion,
  onSelectVariable,
  onSelectCoordinates,
  onChangeYears,
  onChangeStartYear,
  onChangeEndYear,
}) => {
  const [isSingleYearMode, setIsSingleYearMode] = useState<boolean>(true);
  const [selectedYear, setSelectedYear] = useState<number>(2026);
  const [isFloodMode, setIsFloodMode] = useState<boolean>(false);
  const [baseMapStyle, setBaseMapStyle] = useState<'satellite' | 'cartography' | 'analytical'>('satellite');
  const [cityFilter, setCityFilter] = useState<'sindh' | 'pakistan' | 'global'>('sindh');

  const [liveSnapshot, setLiveSnapshot] = useState<{
    pointVariables: Record<string, any>;
    cities: Record<string, any>;
    loading: boolean;
  }>({
    pointVariables: {},
    cities: {},
    loading: false,
  });

  useEffect(() => {
    let cancelled = false;
    setLiveSnapshot((prev) => ({ ...prev, loading: true }));

    const url = `/api/year-snapshot?lat=${selectedRegion.latitude}&lon=${selectedRegion.longitude}&year=${selectedYear}&variable=${selectedVariable}`;
    fetch(url)
      .then((res) => (res.ok ? res.json() : Promise.reject(new Error('Failed snapshot'))))
      .then((data) => {
        if (cancelled) return;
        setLiveSnapshot({
          pointVariables: data.pointVariables || {},
          cities: data.cities || {},
          loading: false,
        });
      })
      .catch(() => {
        if (cancelled) return;
        setLiveSnapshot((prev) => ({ ...prev, loading: false }));
      });

    return () => {
      cancelled = true;
    };
  }, [selectedRegion.latitude, selectedRegion.longitude, selectedYear, selectedVariable]);

  const activeVarMeta =
    ENVIRONMENTAL_VARIABLES[selectedVariable] || ENVIRONMENTAL_VARIABLES.T2M;

  const updateYearSpan = (s: number, e: number) => {
    if (onChangeYears) {
      onChangeYears(s, e);
    } else {
      if (onChangeStartYear) onChangeStartYear(s);
      if (onChangeEndYear) onChangeEndYear(e);
    }
  };

  const handleSingleYearChange = (yr: number) => {
    setSelectedYear(yr);
    updateYearSpan(Math.max(1981, yr - 5), yr);
  };

  const handleToggleFloodMode = () => {
    const next = !isFloodMode;
    setIsFloodMode(next);
    if (next) {
      setIsSingleYearMode(true);
      setSelectedYear(2022);
      onSelectVariable('PRECTOTCORR');
      updateYearSpan(2015, 2025);
    }
  };

  const handleCoordPick = (lat: number, lon: number) => {
    if (onSelectCoordinates) {
      onSelectCoordinates(lat, lon);
      return;
    }
    const matchingCity = ACCURATE_CITIES.find(
      (c) => Math.abs(c.latitude - lat) < 0.25 && Math.abs(c.longitude - lon) < 0.25
    );
    if (matchingCity) {
      onSelectRegion({
        id: matchingCity.id,
        name: matchingCity.name,
        country: matchingCity.province
          ? `${matchingCity.province}, ${matchingCity.country}`
          : matchingCity.country,
        admin_level: 'special_zone',
        latitude: matchingCity.latitude,
        longitude: matchingCity.longitude,
        bounding_box: [
          matchingCity.latitude - 0.25,
          matchingCity.longitude - 0.25,
          matchingCity.latitude + 0.25,
          matchingCity.longitude + 0.25,
        ],
      });
    } else {
      onSelectRegion({
        id: `point_${lat.toFixed(2)}_${lon.toFixed(2)}`,
        name: `Surface Point (${lat.toFixed(2)}°N, ${lon.toFixed(2)}°E)`,
        country: 'Satellite Target',
        admin_level: 'special_zone',
        latitude: lat,
        longitude: lon,
        bounding_box: [lat - 0.25, lon - 0.25, lat + 0.25, lon + 0.25],
      });
    }
  };

  const filteredCities = ACCURATE_CITIES.filter((c) => {
    if (cityFilter === 'sindh') return c.province === 'Sindh';
    if (cityFilter === 'pakistan') return c.country === 'Pakistan' && c.province !== 'Sindh';
    return c.country !== 'Pakistan';
  });

  const floodRecord =
    FLOOD_YEAR_RECORDS.find((f) => f.year === selectedYear) ||
    FLOOD_YEAR_RECORDS.find((f) => f.year === 2022) ||
    FLOOD_YEAR_RECORDS[0];

  const isBusy = isLoading || loading;

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 space-y-5 pb-16">
      {/* Compact Header Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-4">
        <div className="flex items-center gap-3">
          <h1 className="font-display text-xl sm:text-2xl font-bold text-slate-950 dark:text-white tracking-tight">
            3D Planetary Map
          </h1>
          <span className="font-mono text-xs text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 border border-cyan-500/30 px-2.5 py-0.5 rounded-xs tabular-nums">
            {selectedRegion.name} ({selectedRegion.latitude.toFixed(2)}°N, {selectedRegion.longitude.toFixed(2)}°E)
          </span>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="px-2.5 py-1 rounded-xs bg-white dark:bg-[#0D111A] border border-slate-200 dark:border-[#1E2638] text-slate-700 dark:text-slate-300 tabular-nums">
            {isSingleYearMode ? `Year: ${selectedYear}` : `${startYear}–${endYear}`}
          </span>
          <span className="px-2.5 py-1 rounded-xs bg-cyan-500 text-[#07090E] font-bold">
            {activeVarMeta.name}
          </span>
        </div>
      </div>

      {/* Main Split Grid: Map First on Mobile, Controls on Left on Desktop */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* LEFT CONTROLS (4 Cols) */}
        <div className="order-2 lg:order-1 lg:col-span-4 space-y-4">
          {/* 1. Time & Flood Mode Card */}
          <div className="bg-white dark:bg-[#0D111A] border border-slate-200 dark:border-[#1E2638] rounded-md p-4 space-y-3.5">
            <div className="grid grid-cols-3 gap-1 bg-slate-100 dark:bg-[#080B10] p-1 rounded-sm border border-slate-200 dark:border-[#1E2638]">
              <button
                type="button"
                onClick={() => {
                  setIsSingleYearMode(true);
                  setIsFloodMode(false);
                }}
                className={`py-1.5 rounded-xs text-[11px] font-mono transition-colors cursor-pointer ${
                  isSingleYearMode && !isFloodMode
                    ? 'bg-cyan-500 text-[#07090E] font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white'
                }`}
              >
                Single Year
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsSingleYearMode(false);
                  setIsFloodMode(false);
                  updateYearSpan(2000, 2026);
                }}
                className={`py-1.5 rounded-xs text-[11px] font-mono transition-colors cursor-pointer ${
                  !isSingleYearMode && !isFloodMode
                    ? 'bg-cyan-500 text-[#07090E] font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white'
                }`}
              >
                Year Range
              </button>
              <button
                type="button"
                onClick={handleToggleFloodMode}
                className={`py-1.5 rounded-xs text-[11px] font-mono transition-colors flex items-center justify-center gap-1 cursor-pointer ${
                  isFloodMode
                    ? 'bg-cyan-500 text-[#07090E] font-bold'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white'
                }`}
              >
                <Waves className="w-3 h-3" />
                <span>Floods</span>
              </button>
            </div>

            {isSingleYearMode ? (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-500 font-medium flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-cyan-500" />
                    <span>Year</span>
                  </span>
                  <span className="font-mono text-lg font-bold text-slate-950 dark:text-white tabular-nums">
                    {selectedYear}
                  </span>
                </div>

                <input
                  type="range"
                  min={1981}
                  max={2026}
                  value={selectedYear}
                  onChange={(e) => handleSingleYearChange(Number(e.target.value))}
                  aria-label="Observation year"
                  className="w-full accent-cyan-500 cursor-pointer h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg"
                />

                <div className="grid grid-cols-5 gap-1">
                  {[2010, 2015, 2020, 2022, 2026].map((yr) => (
                    <button
                      key={yr}
                      type="button"
                      onClick={() => handleSingleYearChange(yr)}
                      className={`py-1 rounded-xs text-[11px] font-mono tabular-nums border transition-colors cursor-pointer ${
                        selectedYear === yr
                          ? 'bg-cyan-500 text-[#07090E] border-cyan-500 font-bold'
                          : 'bg-slate-50 dark:bg-[#111622] text-slate-600 dark:text-slate-400 border-slate-200 dark:border-[#1E2638]'
                      }`}
                    >
                      {yr}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[10px] font-mono text-slate-500 uppercase mb-1">Start</label>
                  <select
                    value={startYear}
                    onChange={(e) => updateYearSpan(Number(e.target.value), endYear)}
                    className="w-full bg-slate-50 dark:bg-[#111622] border border-slate-200 dark:border-[#1E2638] rounded-sm px-2.5 py-1.5 text-xs font-mono text-slate-900 dark:text-white"
                  >
                    {Array.from({ length: 44 }, (_, i) => 1981 + i).map((y) => (
                      <option key={y} value={y} disabled={y >= endYear - 2}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-mono text-slate-500 uppercase mb-1">End</label>
                  <select
                    value={endYear}
                    onChange={(e) => updateYearSpan(startYear, Number(e.target.value))}
                    className="w-full bg-slate-50 dark:bg-[#111622] border border-slate-200 dark:border-[#1E2638] rounded-sm px-2.5 py-1.5 text-xs font-mono text-slate-900 dark:text-white"
                  >
                    {Array.from({ length: 44 }, (_, i) => 1983 + i).map((y) => (
                      <option key={y} value={y} disabled={y <= startYear + 2}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            )}

            {/* Compact Flood Visual Gauge when Flood Mode is on */}
            {isFloodMode && (
              <div className="p-3 rounded-sm bg-cyan-500/10 border border-cyan-500/30 space-y-2">
                <div className="flex items-center justify-between text-xs font-bold text-slate-950 dark:text-white">
                  <span>{floodRecord.year} Flood Peak</span>
                  <span className="font-mono text-cyan-600 dark:text-cyan-400 tabular-nums">
                    {floodRecord.rainfallAnomalyPct >= 0 ? '+' : ''}
                    {floodRecord.rainfallAnomalyPct}% Rain
                  </span>
                </div>
                <div className="w-full h-2 bg-slate-200 dark:bg-[#161D2B] rounded-full overflow-hidden">
                  <div
                    className="h-full bg-cyan-500 rounded-full"
                    style={{ width: `${floodRecord.soilSaturationPct}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] font-mono text-slate-500">
                  <span>Soil Saturation: {floodRecord.soilSaturationPct}%</span>
                  <span>{floodRecord.observedRainfallMm} mm</span>
                </div>
              </div>
            )}
          </div>

          {/* Layer Toggle Control Card */}
          <div className="bg-white dark:bg-[#0D111A] border border-slate-200 dark:border-[#1E2638] rounded-md p-4 space-y-2.5">
            <span className="text-xs font-bold text-slate-950 dark:text-white block">
              Base Map Layer Toggle
            </span>
            <div className="grid grid-cols-3 gap-1 bg-slate-100 dark:bg-[#080B10] p-1 rounded-sm border border-slate-200 dark:border-[#1E2638]">
              {(
                [
                  { id: 'satellite', label: 'Satellite' },
                  { id: 'cartography', label: 'Cartography' },
                  { id: 'analytical', label: 'Analytical' },
                ] as const
              ).map((layer) => (
                <button
                  key={layer.id}
                  type="button"
                  onClick={() => setBaseMapStyle(layer.id)}
                  className={`py-1.5 rounded-xs text-[11px] font-mono transition-colors cursor-pointer ${
                    baseMapStyle === layer.id
                      ? 'bg-cyan-500 text-[#07090E] font-bold'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white'
                  }`}
                >
                  {layer.label}
                </button>
              ))}
            </div>
          </div>

          {/* 2. Compact 2x4 Visual Channel Selector */}
          <div className="bg-white dark:bg-[#0D111A] border border-slate-200 dark:border-[#1E2638] rounded-md p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-950 dark:text-white flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-cyan-500" />
                <span>Satellite Channel</span>
              </span>
              <span className="text-[10px] font-mono text-slate-500">{activeVarMeta.unit}</span>
            </div>

            <div className="grid grid-cols-2 gap-1.5">
              {Object.values(ENVIRONMENTAL_VARIABLES).map((v) => {
                const isSelected = selectedVariable === v.id;
                const liveVal =
                  liveSnapshot.pointVariables[v.id] ||
                  getCityMetricForVariableAndYear(selectedRegion as any, v.id, selectedYear);
                return (
                  <button
                    key={v.id}
                    type="button"
                    onClick={() => onSelectVariable(v.id)}
                    className={`text-left p-2.5 rounded-sm border transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-cyan-500 text-[#07090E] border-cyan-500 font-bold'
                        : 'bg-slate-50 dark:bg-[#111622] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-[#1E2638] hover:border-slate-300 dark:hover:border-slate-700'
                    }`}
                  >
                    <div className="text-[11px] font-semibold truncate">{v.name}</div>
                    <div
                      className={`font-mono text-xs font-bold tabular-nums mt-0.5 ${
                        isSelected ? 'text-[#07090E]' : 'text-slate-950 dark:text-white'
                      }`}
                    >
                      {liveVal.formatted}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Quick Location Selector */}
          <div className="bg-white dark:bg-[#0D111A] border border-slate-200 dark:border-[#1E2638] rounded-md p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-950 dark:text-white flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-cyan-500" />
                <span>Locations</span>
              </span>
              <div className="flex gap-1">
                {(['sindh', 'pakistan', 'global'] as const).map((tab) => (
                  <button
                    key={tab}
                    type="button"
                    onClick={() => setCityFilter(tab)}
                    className={`px-2 py-0.5 rounded-xs text-[10px] font-mono uppercase cursor-pointer ${
                      cityFilter === tab
                        ? 'bg-cyan-500 text-[#07090E] font-bold'
                        : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-1.5 max-h-48 overflow-y-auto pr-0.5">
              {filteredCities.map((city) => {
                const isSelected =
                  Math.abs(selectedRegion.latitude - city.latitude) < 0.08 &&
                  Math.abs(selectedRegion.longitude - city.longitude) < 0.08;
                return (
                  <button
                    key={city.id}
                    type="button"
                    onClick={() => handleCoordPick(city.latitude, city.longitude)}
                    className={`text-left px-2.5 py-1.5 rounded-xs border text-xs transition-colors truncate cursor-pointer ${
                      isSelected
                        ? 'bg-cyan-500 text-[#07090E] border-cyan-500 font-bold'
                        : 'bg-slate-50 dark:bg-[#111622] text-slate-700 dark:text-slate-300 border-slate-200 dark:border-[#1E2638] hover:border-slate-300'
                    }`}
                  >
                    {city.name}
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* RIGHT VIEWPORT (8 Cols, First on Mobile) */}
        <div className="order-1 lg:order-2 lg:col-span-8 space-y-5">
          {/* 1. 3D Earth Map Ball at 20% Default Zoom */}
          <Earth3DGlobe
            regions={regions}
            selectedRegion={selectedRegion}
            onSelectRegion={onSelectRegion}
            onSelectCoordinates={handleCoordPick}
            selectedVariable={selectedVariable}
            selectedYear={selectedYear}
            isSingleYearMode={isSingleYearMode}
            isFloodMode={isFloodMode}
            onToggleFloodMode={handleToggleFloodMode}
            analysis={analysis}
            liveCityMetrics={liveSnapshot.cities}
            livePointMetrics={liveSnapshot.pointVariables}
            baseMapStyle={baseMapStyle}
          />

          {/* 2. 12-Month Seasonal Bar Chart (Visual Monthly Profile) */}
          {liveSnapshot.pointVariables[selectedVariable]?.monthlyValues && (
            <div className="bg-white dark:bg-[#0D111A] border border-slate-200 dark:border-[#1E2638] rounded-md p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <BarChart3 className="w-4 h-4 text-cyan-500" />
                  <h3 className="font-display text-sm font-bold text-slate-950 dark:text-white">
                    {selectedYear} Monthly Profile — {activeVarMeta.name}
                  </h3>
                </div>
                <span className="text-xs font-mono font-bold text-cyan-600 dark:text-cyan-400 tabular-nums">
                  {liveSnapshot.pointVariables[selectedVariable]?.formatted}
                </span>
              </div>

              <div className="grid grid-cols-12 gap-1.5 items-end h-24 pt-3">
                {liveSnapshot.pointVariables[selectedVariable].monthlyValues.map(
                  (val: number | null, idx: number) => {
                    const allValid = liveSnapshot.pointVariables[selectedVariable].monthlyValues.filter(
                      (x: number | null) => x !== null
                    ) as number[];
                    const maxV = allValid.length ? Math.max(...allValid) : 1;
                    const minV = allValid.length ? Math.min(...allValid) : 0;
                    const range = Math.max(0.1, maxV - Math.min(0, minV));
                    const heightPct =
                      val !== null ? Math.max(12, Math.min(100, ((val - Math.min(0, minV)) / range) * 100)) : 6;
                    const isPeak = val !== null && val === maxV;

                    return (
                      <div key={MONTH_LABELS[idx]} className="flex flex-col items-center gap-1 h-full justify-end">
                        <span className="text-[9px] font-mono text-slate-500 tabular-nums">
                          {val !== null ? val.toFixed(0) : '—'}
                        </span>
                        <div className="w-full bg-slate-100 dark:bg-[#141B29] rounded-xs h-14 flex items-end overflow-hidden">
                          <div
                            className={`w-full transition-all duration-300 rounded-xs ${
                              isPeak ? 'bg-amber-500' : 'bg-cyan-500'
                            }`}
                            style={{ height: `${heightPct}%` }}
                          />
                        </div>
                        <span className="text-[9px] font-mono text-slate-500">{MONTH_LABELS[idx]}</span>
                      </div>
                    );
                  }
                )}
              </div>
            </div>
          )}

          {/* 3. Multi-Year Time-Series Chart */}
          {isBusy ? (
            <div className="w-full h-[360px] bg-white dark:bg-[#0D111A] border border-slate-200 dark:border-[#1E2638] rounded-md flex items-center justify-center">
              <div className="w-6 h-6 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
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
        </div>
      </div>
    </div>
  );
};
