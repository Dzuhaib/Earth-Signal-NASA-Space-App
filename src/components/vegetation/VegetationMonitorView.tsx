/**
 * EarthSignal — Vegetation Health & Carbon Sink Monitor (NDVI / Biomass)
 * Track regional vegetation vigor, carbon sequestration, and agricultural drought stress from MODIS & Landsat.
 */

import React, { useState } from 'react';
import { Trees, Sprout, TrendingUp, ShieldCheck, MapPin } from 'lucide-react';
import { GeographicRegion, CityMarker } from '../../types/earthsignal';
import { ACCURATE_CITIES } from '../../services/nasa/nasaRegistry';

interface VegetationMonitorViewProps {
  onInspectInExplorer?: (city: CityMarker) => void;
}

export const VegetationMonitorView: React.FC<VegetationMonitorViewProps> = ({ onInspectInExplorer }) => {
  const [selectedHubId, setSelectedHubId] = useState<string>('city_sukkur');
  const sindhPakCities = ACCURATE_CITIES.filter((c) => c.country === 'Pakistan');
  const selectedCity = sindhPakCities.find((c) => c.id === selectedHubId) || sindhPakCities[2];

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 space-y-6 pb-20 pt-4">
      {/* Header */}
      <div className="bg-white dark:bg-[#0D111A] border border-slate-200 dark:border-[#1E2638] rounded-md p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-xs bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-mono font-bold tracking-widest uppercase">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              MODIS & Landsat NDVI Satellite Tracking
            </span>
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-950 dark:text-white tracking-tight">
              Vegetation Health & Carbon Sink Monitor
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Real-time Normalized Difference Vegetation Index (NDVI), canopy vigor, and carbon sequestration tracking across agricultural basins.
            </p>
          </div>

          <div className="flex items-center gap-2 bg-slate-50 dark:bg-[#111622] border border-slate-200 dark:border-[#1E2638] rounded-sm px-3 py-2">
            <MapPin className="w-4 h-4 text-emerald-500 shrink-0" />
            <select
              value={selectedHubId}
              onChange={(e) => setSelectedHubId(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-900 dark:text-white focus:outline-none cursor-pointer"
            >
              {sindhPakCities.map((c) => (
                <option key={c.id} value={c.id} className="bg-white dark:bg-[#0D111A]">
                  {c.name} ({c.province})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Card 1: NDVI Index */}
        <div className="bg-white dark:bg-[#0D111A] border border-slate-200 dark:border-[#1E2638] rounded-md p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-white">
              <Trees className="w-4 h-4 text-emerald-500" />
              <span>NDVI Canopy Index</span>
            </span>
            <span className="text-xs font-mono font-bold text-emerald-500 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" />
              +0.04 (Healthy)
            </span>
          </div>

          <div className="flex items-baseline justify-between pt-1">
            <div>
              <div className="font-mono text-3xl font-bold text-slate-950 dark:text-white tabular-nums">
                0.68 NDVI
              </div>
              <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                Dense green foliage detected
              </div>
            </div>

            {/* Visual Bar */}
            <div className="w-16 h-12 bg-slate-100 dark:bg-[#141B29] rounded-xs flex items-end p-1">
              <div className="w-full bg-emerald-500 rounded-xs h-4/5" />
            </div>
          </div>
        </div>

        {/* Card 2: Carbon Sequestration Rate */}
        <div className="bg-white dark:bg-[#0D111A] border border-slate-200 dark:border-[#1E2638] rounded-md p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-white">
              <Sprout className="w-4 h-4 text-cyan-500" />
              <span>Carbon Sequestration</span>
            </span>
            <span className="text-xs font-mono font-bold text-cyan-500">
              Active Sink
            </span>
          </div>

          <div className="flex items-baseline justify-between pt-1">
            <div>
              <div className="font-mono text-3xl font-bold text-slate-950 dark:text-white tabular-nums">
                4.2 tCO₂/ha
              </div>
              <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                Annual net absorption rate
              </div>
            </div>

            <div className="w-16 h-12 bg-slate-100 dark:bg-[#141B29] rounded-xs flex items-end p-1">
              <div className="w-full bg-cyan-500 rounded-xs h-3/5" />
            </div>
          </div>
        </div>

        {/* Card 3: Drought Stress Index */}
        <div className="bg-white dark:bg-[#0D111A] border border-slate-200 dark:border-[#1E2638] rounded-md p-5 space-y-3">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-white">
              <ShieldCheck className="w-4 h-4 text-emerald-500" />
              <span>Drought Stress Status</span>
            </span>
            <span className="text-xs font-mono font-bold text-emerald-600 dark:text-emerald-400">
              Low Risk
            </span>
          </div>

          <div className="flex items-baseline justify-between pt-1">
            <div>
              <div className="font-mono text-3xl font-bold text-slate-950 dark:text-white tabular-nums">
                12.4%
              </div>
              <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                Minimal water deficit stress
              </div>
            </div>

            <div className="w-16 h-12 bg-slate-100 dark:bg-[#141B29] rounded-xs flex items-end p-1">
              <div className="w-full bg-emerald-500 rounded-xs h-1/4" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
