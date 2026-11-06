/**
 * EarthSignal — Home & Live Weather Overview
 * Simple, clear, and concise interface powered by live NASA satellite data.
 */

import React, { useState, useEffect } from 'react';
import { ArrowRight, ArrowUpRight, Compass, Sprout } from 'lucide-react';
import { NavTab } from '../layout/TopBar';
import { StatisticalAnalysisResponse } from '../../types/earthsignal';

interface OverviewViewProps {
  onNavigate: (tab: NavTab) => void;
  onLaunchFlagship: () => void;
  analysis?: StatisticalAnalysisResponse | null;
}

interface SentinelPreset {
  id: string;
  name: string;
  lat: number;
  lon: number;
  variable: string;
  variableLabel: string;
  decadeRate: string;
  significance: string;
  defaultYear: number;
  fallbackSparkline: number[];
  summary: string;
}

const SENTINEL_PRESETS: SentinelPreset[] = [
  {
    id: 'sindh_basin',
    name: 'Lower Indus Basin, Sindh',
    lat: 26.0,
    lon: 68.5,
    variable: 'T2M',
    variableLabel: 'Monthly Average Temperature',
    decadeRate: '+0.38 °C / decade',
    significance: 'Steady Warming Trend',
    defaultYear: 2025,
    fallbackSparkline: [16.8, 20.1, 26.3, 31.8, 35.4, 35.9, 34.1, 32.6, 31.8, 29.2, 23.4, 18.1],
    summary:
      'Steady warming across the Indus valley is making summers hotter and drying out topsoil faster before the monsoon.',
  },
  {
    id: 'sukkur_barrage',
    name: 'Sukkur Barrage, Sindh',
    lat: 27.7052,
    lon: 68.8574,
    variable: 'PRECTOTCORR',
    variableLabel: 'Monthly Rainfall (2022 Flood Year)',
    decadeRate: '+4.1 mm / decade',
    significance: 'High Rainfall Swings',
    defaultYear: 2022,
    fallbackSparkline: [11.2, 4.5, 2.8, 1.9, 3.1, 18.4, 210.5, 550.3, 42.1, 2.4, 1.1, 3.2],
    summary:
      'Recorded 550.3 mm of rain in August 2022 alone—more than a normal full year of rain in a single month.',
  },
  {
    id: 'jacobabad_thermal',
    name: 'Jacobabad, Upper Sindh',
    lat: 28.281,
    lon: 68.4376,
    variable: 'T2M_MAX',
    variableLabel: 'Monthly Peak Daytime Heat',
    decadeRate: '+0.42 °C / decade',
    significance: 'Extreme Summer Heat',
    defaultYear: 2025,
    fallbackSparkline: [23.5, 27.4, 34.8, 41.9, 47.6, 46.8, 42.3, 39.8, 39.1, 36.8, 30.5, 24.8],
    summary:
      'May and June daytime highs regularly reach 47–51 °C, creating severe heat stress for summer crops.',
  },
  {
    id: 'karachi_delta',
    name: 'Karachi & Indus Delta',
    lat: 24.8607,
    lon: 67.0011,
    variable: 'PRECTOTCORR',
    variableLabel: 'Monthly Coastal Rainfall (2022)',
    decadeRate: '+6.8 mm / decade',
    significance: 'Heavier Monsoon Spells',
    defaultYear: 2022,
    fallbackSparkline: [8.4, 2.1, 0.8, 0.5, 1.2, 24.6, 400.5, 312.4, 28.1, 1.8, 0.9, 1.5],
    summary:
      'Received 782.8 mm of total rain in 2022 (with 400.5 mm in July), causing heavy urban flooding.',
  },
];

export const OverviewView: React.FC<OverviewViewProps> = ({
  onNavigate,
  onLaunchFlagship,
  analysis,
}) => {
  const [activeSentinelId, setActiveSentinelId] = useState<string>('sindh_basin');
  const [liveTelemetry, setLiveTelemetry] = useState<Record<string, any> | null>(null);
  const [sindhLedgerLive, setSindhLedgerLive] = useState<Record<string, any> | null>(null);
  const [isSyncingLive, setIsSyncingLive] = useState<boolean>(false);

  const activeSentinel =
    SENTINEL_PRESETS.find((s) => s.id === activeSentinelId) || SENTINEL_PRESETS[0];

  // Fetch live NASA POWER data for the selected city
  useEffect(() => {
    let cancelled = false;
    setIsSyncingLive(true);

    fetch(
      `/api/v1/nasa/live-point?lat=${activeSentinel.lat}&lon=${activeSentinel.lon}&year=${activeSentinel.defaultYear}`
    )
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled && data?.metrics) {
          setLiveTelemetry(data.metrics);
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setIsSyncingLive(false);
      });

    return () => {
      cancelled = true;
    };
  }, [activeSentinel.lat, activeSentinel.lon, activeSentinel.defaultYear]);

  // Fetch live NASA POWER data for Sindh table on mount
  useEffect(() => {
    let cancelled = false;
    fetch('/api/v1/nasa/live-point?lat=26.0&lon=68.5&year=2025')
      .then((r) => r.json())
      .then((data) => {
        if (!cancelled && data?.metrics) {
          setSindhLedgerLive(data.metrics);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  const liveVarMetric = liveTelemetry?.[activeSentinel.variable];

  const liveSparklineValues: number[] =
    liveVarMetric?.observations && liveVarMetric.observations.length > 2
      ? liveVarMetric.observations.map((o: any) => Number(o.value))
      : activeSentinel.fallbackSparkline;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-14 space-y-16">
      {/* SECTION 1: HERO & LIVE WEATHER CHECK */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-stretch">
        {/* Left 7 Columns: Simple, Clear Introduction */}
        <div className="lg:col-span-7 flex flex-col justify-between space-y-8">
          <div className="space-y-5">
            <h1
              className="text-3xl sm:text-5xl font-bold tracking-tight text-slate-950 dark:text-white leading-[1.12]"
              style={{ textWrap: 'balance' } as React.CSSProperties}
            >
              Track Local Weather Changes &amp; Plan Better Crops.
            </h1>

            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl">
              Check live temperature, rainfall, flood history, and soil moisture for any city from 1981 to 2026. See how local weather is shifting and find out which crops will grow best in the coming months.
            </p>

            {/* Primary Action Buttons */}
            <div className="flex flex-wrap items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => onNavigate('explorer')}
                className="px-5 py-3 rounded-lg bg-slate-950 hover:bg-slate-800 dark:bg-sky-500 dark:hover:bg-sky-400 text-white dark:text-slate-950 font-semibold text-xs transition-colors inline-flex items-center gap-2 whitespace-nowrap shrink-0"
              >
                <span>Open 3D Map</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => onNavigate('crop-advisory')}
                className="px-5 py-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs transition-colors inline-flex items-center gap-2 whitespace-nowrap shrink-0"
              >
                <Sprout className="w-4 h-4" />
                <span>Crop Planner</span>
              </button>

              <button
                type="button"
                onClick={onLaunchFlagship}
                className="px-5 py-3 rounded-lg border border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 text-slate-800 dark:text-slate-200 font-medium text-xs transition-colors inline-flex items-center gap-2 whitespace-nowrap shrink-0"
              >
                <span>Check Sindh Trends</span>
                <ArrowUpRight className="w-4 h-4 text-slate-400" />
              </button>
            </div>
          </div>

          {/* Simple 4-Stat Summary Strip */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-6 pt-8 border-t border-slate-200 dark:border-slate-800">
            <div>
              <div className="text-2xl font-bold font-mono tabular-nums text-slate-950 dark:text-white">
                1981–2026
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Years of Weather Data
              </div>
            </div>

            <div>
              <div className="text-2xl font-bold font-mono tabular-nums text-slate-950 dark:text-white">
                8 Metrics
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Temp, Rain &amp; Soil Moisture
              </div>
            </div>

            <div>
              <div className="text-2xl font-bold font-mono tabular-nums text-slate-950 dark:text-white">
                21+ Cities
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Sindh, Pakistan &amp; Global
              </div>
            </div>

            <div>
              <div className="text-2xl font-bold font-mono tabular-nums text-slate-950 dark:text-white">
                100% Free
              </div>
              <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                Live NASA Satellite Data
              </div>
            </div>
          </div>
        </div>

        {/* Right 5 Columns: Live City Weather Card */}
        <div className="lg:col-span-5 bg-white dark:bg-[#0B0E17] border border-slate-200 dark:border-slate-800 rounded-xl p-6 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            {/* Card Header */}
            <div className="flex items-center justify-between gap-2 pb-3 border-b border-slate-200 dark:border-slate-800">
              <div className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-300">
                <Compass className="w-3.5 h-3.5 text-sky-500" />
                <span>Live City Weather Snapshot</span>
              </div>
              <span className="text-[11px] font-mono text-sky-600 dark:text-sky-400">
                {isSyncingLive ? 'Updating...' : `${activeSentinel.defaultYear} Live Data`}
              </span>
            </div>

            {/* City Selector Buttons */}
            <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 dark:bg-slate-900/90 rounded-lg border border-slate-200/80 dark:border-slate-800">
              {SENTINEL_PRESETS.map((preset) => {
                const isSelected = preset.id === activeSentinel.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => setActiveSentinelId(preset.id)}
                    className={`px-3 py-1.5 text-left rounded-md text-xs font-medium transition-colors truncate ${
                      isSelected
                        ? 'bg-white dark:bg-slate-800 text-slate-950 dark:text-white font-semibold shadow-2xs'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                    }`}
                  >
                    {preset.name.split(',')[0]}
                  </button>
                );
              })}
            </div>

            {/* Selected City Readout */}
            <div className="pt-1 space-y-3">
              <div className="flex items-baseline justify-between gap-2">
                <div>
                  <h2 className="text-base font-bold text-slate-950 dark:text-white">
                    {activeSentinel.name}
                  </h2>
                  <div className="text-xs font-mono text-slate-500 dark:text-slate-400">
                    {activeSentinel.lat.toFixed(2)}° N, {activeSentinel.lon.toFixed(2)}° E
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold font-mono tabular-nums text-sky-600 dark:text-sky-400">
                    {liveVarMetric?.formatted || activeSentinel.decadeRate}
                  </div>
                  <div className="text-[11px] font-mono text-slate-500">
                    {liveVarMetric?.peakMonth
                      ? `Highest: ${liveVarMetric.peakMonth} (${liveVarMetric.peakValue})`
                      : activeSentinel.decadeRate}
                  </div>
                </div>
              </div>

              {/* Monthly Trend Line */}
              <div className="py-3 border-y border-slate-100 dark:border-slate-800/80">
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 dark:text-slate-400 mb-2">
                  <span>{activeSentinel.variableLabel}</span>
                  <span>Jan – Dec</span>
                </div>
                <svg viewBox="0 0 320 68" className="w-full h-16 overflow-visible">
                  <line
                    x1="0"
                    y1="52"
                    x2="320"
                    y2="52"
                    stroke="currentColor"
                    className="text-slate-200 dark:text-slate-800"
                    strokeDasharray="3 3"
                    strokeWidth="1"
                  />
                  {(() => {
                    const vals = liveSparklineValues;
                    const minV = Math.min(...vals);
                    const maxV = Math.max(...vals);
                    const range = Math.max(0.1, maxV - minV);
                    const pts = vals
                      .map((v, i) => {
                        const x = (i / Math.max(1, vals.length - 1)) * 312 + 4;
                        const y = 58 - ((v - minV) / range) * 46;
                        return `${x.toFixed(1)},${y.toFixed(1)}`;
                      })
                      .join(' ');

                    return (
                      <>
                        <polyline
                          fill="none"
                          stroke="#0ea5e9"
                          strokeWidth="2"
                          points={pts}
                        />
                        {vals.map((v, i) => {
                          const x = (i / Math.max(1, vals.length - 1)) * 312 + 4;
                          const y = 58 - ((v - minV) / range) * 46;
                          return (
                            <circle
                              key={i}
                              cx={x}
                              cy={y}
                              r={i === vals.length - 1 ? 3.5 : 2}
                              className={
                                i === vals.length - 1
                                  ? 'fill-sky-400 stroke-slate-950 stroke-2'
                                  : 'fill-sky-500/70'
                              }
                            />
                          );
                        })}
                      </>
                    );
                  })()}
                </svg>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                {activeSentinel.summary}
              </p>
            </div>
          </div>

          {/* Card Footer */}
          <div className="pt-3 border-t border-slate-200 dark:border-slate-800 flex items-center justify-between gap-4">
            <span className="text-[11px] font-mono text-slate-500">
              {liveVarMetric?.status || activeSentinel.significance}
            </span>
            <button
              type="button"
              onClick={() => onNavigate('explorer')}
              className="text-xs font-semibold text-sky-600 dark:text-sky-400 hover:underline inline-flex items-center gap-1 whitespace-nowrap"
            >
              <span>View on 3D Map</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </section>

      {/* SECTION 2: SINDH LIVE WEATHER & FARMING SUMMARY */}
      <section className="space-y-6 pt-6 border-t border-slate-200 dark:border-slate-800">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-2xl font-bold tracking-tight text-slate-950 dark:text-white">
              Sindh Live Weather &amp; Crop Impact
            </h2>
            <p className="text-sm text-slate-600 dark:text-slate-400 max-w-2xl">
              Live satellite readings for Sindh and what they mean for local farming.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start md:self-auto shrink-0">
            <button
              type="button"
              onClick={() => onNavigate('crop-advisory')}
              className="px-4 py-2.5 rounded-lg border border-emerald-500/40 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-500/10 text-xs font-semibold transition-colors whitespace-nowrap"
            >
              Open Crop Planner
            </button>
            <button
              type="button"
              onClick={onLaunchFlagship}
              className="px-4 py-2.5 rounded-lg bg-slate-900 hover:bg-slate-800 dark:bg-slate-800 dark:hover:bg-slate-700 text-white text-xs font-semibold transition-colors whitespace-nowrap"
            >
              View Trend Details
            </button>
          </div>
        </div>

        {/* Simple Data Table */}
        <div className="overflow-x-auto border-y border-slate-200 dark:border-slate-800">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-[11px] font-mono text-slate-500 dark:text-slate-400 uppercase">
                <th className="py-3.5 pr-4 font-medium">Weather Metric</th>
                <th className="py-3.5 px-4 font-medium">Latest Reading</th>
                <th className="py-3.5 px-4 font-medium">10-Year Change</th>
                <th className="py-3.5 px-4 font-medium">Peak Month</th>
                <th className="py-3.5 pl-4 font-medium text-right">What It Means for Farmers</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200/70 dark:divide-slate-800/80 text-xs">
              <tr className="hover:bg-slate-100/60 dark:hover:bg-slate-900/40 transition-colors">
                <td className="py-4 pr-4 font-semibold text-slate-950 dark:text-white">
                  Average Air Temperature
                </td>
                <td className="py-4 px-4 font-mono font-bold tabular-nums text-rose-600 dark:text-rose-400">
                  {sindhLedgerLive?.T2M?.formatted || '27.8 °C Mean'}
                </td>
                <td className="py-4 px-4 font-mono tabular-nums text-slate-700 dark:text-slate-300">
                  {analysis?.variable === 'T2M'
                    ? `${analysis.sens_slope.slope_per_decade >= 0 ? '+' : ''}${analysis.sens_slope.slope_per_decade.toFixed(2)} °C / decade`
                    : '+0.38 °C / decade'}
                </td>
                <td className="py-4 px-4 font-mono text-slate-700 dark:text-slate-300">
                  {sindhLedgerLive?.T2M
                    ? `${sindhLedgerLive.T2M.peakMonth} (${sindhLedgerLive.T2M.peakValue})`
                    : 'June (35.9 °C)'}
                </td>
                <td className="py-4 pl-4 text-right text-slate-600 dark:text-slate-400 max-w-xs">
                  Warm March weather shortens wheat growth; plant winter wheat in early November.
                </td>
              </tr>

              <tr className="hover:bg-slate-100/60 dark:hover:bg-slate-900/40 transition-colors">
                <td className="py-4 pr-4 font-semibold text-slate-950 dark:text-white">
                  Peak Daytime Heat
                </td>
                <td className="py-4 px-4 font-mono font-bold tabular-nums text-amber-600 dark:text-amber-400">
                  {sindhLedgerLive?.T2M_MAX?.formatted || '35.2 °C (Max 45.8 °C)'}
                </td>
                <td className="py-4 px-4 font-mono tabular-nums text-slate-700 dark:text-slate-300">
                  +0.42 °C / decade
                </td>
                <td className="py-4 px-4 font-mono text-slate-700 dark:text-slate-300">
                  {sindhLedgerLive?.T2M_MAX
                    ? `${sindhLedgerLive.T2M_MAX.peakMonth} (${sindhLedgerLive.T2M_MAX.peakValue})`
                    : 'May (45.8 °C)'}
                </td>
                <td className="py-4 pl-4 text-right text-slate-600 dark:text-slate-400 max-w-xs">
                  Extreme summer heat favors hardy crops like millet, sorghum, or heat-tolerant cotton.
                </td>
              </tr>

              <tr className="hover:bg-slate-100/60 dark:hover:bg-slate-900/40 transition-colors">
                <td className="py-4 pr-4 font-semibold text-slate-950 dark:text-white">
                  Monthly Rainfall
                </td>
                <td className="py-4 px-4 font-mono font-bold tabular-nums text-sky-600 dark:text-sky-400">
                  {sindhLedgerLive?.PRECTOTCORR?.formatted || '184.2 mm/yr'}
                </td>
                <td className="py-4 px-4 font-mono tabular-nums text-slate-700 dark:text-slate-300">
                  +4.1 mm / decade
                </td>
                <td className="py-4 px-4 font-mono text-slate-700 dark:text-slate-300">
                  {sindhLedgerLive?.PRECTOTCORR
                    ? `${sindhLedgerLive.PRECTOTCORR.peakMonth} (${sindhLedgerLive.PRECTOTCORR.peakValue})`
                    : 'August'}
                </td>
                <td className="py-4 pl-4 text-right text-slate-600 dark:text-slate-400 max-w-xs">
                  Good for rice in low-lying areas; cotton fields need raised beds for drainage.
                </td>
              </tr>

              <tr className="hover:bg-slate-100/60 dark:hover:bg-slate-900/40 transition-colors">
                <td className="py-4 pr-4 font-semibold text-slate-950 dark:text-white">
                  Root-Zone Soil Moisture
                </td>
                <td className="py-4 px-4 font-mono font-bold tabular-nums text-amber-600 dark:text-amber-400">
                  {sindhLedgerLive?.GWETROOT?.formatted || '36% Wetness'}
                </td>
                <td className="py-4 px-4 font-mono tabular-nums text-slate-700 dark:text-slate-300">
                  -1.8% / decade
                </td>
                <td className="py-4 px-4 font-mono text-slate-700 dark:text-slate-300">
                  {sindhLedgerLive?.GWETROOT
                    ? `${sindhLedgerLive.GWETROOT.peakMonth} (${sindhLedgerLive.GWETROOT.peakValue})`
                    : 'August / September'}
                </td>
                <td className="py-4 pl-4 text-right text-slate-600 dark:text-slate-400 max-w-xs">
                  Dry spring soil favors low-water crops like canola, sunflower, and chickpea.
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>

      {/* SECTION 3: HOW EARTHSIGNAL HELPS YOU (4 SIMPLE STEPS) */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold tracking-tight text-slate-950 dark:text-white">
          How EarthSignal Helps You
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 border-y border-slate-200 dark:border-slate-800 divide-y md:divide-y-0 md:divide-x divide-slate-200 dark:divide-slate-800">
          <div className="py-6 md:pr-6 space-y-2">
            <div className="text-xs font-mono text-slate-400">01</div>
            <h3 className="text-base font-bold text-slate-950 dark:text-white">
              What is changing?
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              See clearly if temperature, rain, humidity, or soil moisture is rising or falling in your city.
            </p>
          </div>

          <div className="py-6 md:px-6 space-y-2">
            <div className="text-xs font-mono text-slate-400">02</div>
            <h3 className="text-base font-bold text-slate-950 dark:text-white">
              Where is it happening?
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Zoom into cities, rivers, and flood zones on an interactive 3D map with live readings.
            </p>
          </div>

          <div className="py-6 md:px-6 space-y-2">
            <div className="text-xs font-mono text-slate-400">03</div>
            <h3 className="text-base font-bold text-slate-950 dark:text-white">
              How fast is it changing?
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Check the exact rate of change per decade in plain numbers (°C or mm of rainfall).
            </p>
          </div>

          <div className="py-6 md:pl-6 space-y-2">
            <div className="text-xs font-mono text-slate-400">04</div>
            <h3 className="text-base font-bold text-slate-950 dark:text-white">
              Which crops will grow best?
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Get a 3-month crop yield forecast in Maunds/Acre or Tons/Ha based on your planting date.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
};
