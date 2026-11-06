/**
 * EarthSignal — Upstream Flood & Reservoir Surge Simulator
 * Interactive simulation tool for modeling Indus Basin barrage releases and flood inundation.
 */

import React, { useState } from 'react';
import { Waves, AlertTriangle, ShieldAlert, ArrowRight, Activity, MapPin, Gauge } from 'lucide-react';
import { CityMarker } from '../../types/earthsignal';
import { ACCURATE_CITIES } from '../../services/nasa/nasaRegistry';

interface FloodSimulatorViewProps {
  onInspectInExplorer?: (city: CityMarker) => void;
}

export const FloodSimulatorView: React.FC<FloodSimulatorViewProps> = ({ onInspectInExplorer }) => {
  const [reservoirLevelM, setReservoirLevelM] = useState<number>(312.5); // meters (e.g. Tarbela/Mangla or Sukkur gauge)
  const [dischargeCusecs, setDischargeCusecs] = useState<number>(650000); // cusecs
  const [selectedHubId, setSelectedHubId] = useState<string>('city_sukkur');

  const sindhPakCities = ACCURATE_CITIES.filter((c) => c.country === 'Pakistan');
  const selectedCity = sindhPakCities.find((c) => c.id === selectedHubId) || sindhPakCities[2];

  // Calculate simulated flood impact metrics based on discharge volume
  const floodRiskScore = Math.min(100, Math.max(10, Math.round((dischargeCusecs / 1200000) * 100)));
  const inundationAreaSqKm = Math.round((dischargeCusecs / 100000) * 145);
  const affectedPopulationEst = Math.round((dischargeCusecs / 100000) * 280000);
  const evacuationLeadTimeHours = Math.max(6, Math.round(72 - (dischargeCusecs / 25000)));

  const riskLevel =
    dischargeCusecs > 900000
      ? 'CRITICAL / Super-Flood Alert'
      : dischargeCusecs > 600000
      ? 'HIGH / Severe Upstream Surge'
      : dischargeCusecs > 350000
      ? 'MODERATE / Seasonal High Water'
      : 'NORMAL / Safe Canal Regimen';

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 space-y-6 pb-20 pt-4">
      {/* Header */}
      <div className="bg-white dark:bg-[#0D111A] border border-slate-200 dark:border-[#1E2638] rounded-md p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-xs bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 text-[10px] font-mono font-bold tracking-widest uppercase">
                <span className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse" />
                NASA Hydrology & Barrage Simulation Engine
              </span>
            </div>
            <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-slate-950 dark:text-white tracking-tight">
              Upstream Flood & Reservoir Surge Simulator
            </h1>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Model Indus Basin discharge surges, barrage spillway capacities, and downstream inundation zones in real time.
            </p>
          </div>

          <div className="flex items-center gap-3 bg-slate-50 dark:bg-[#111622] border border-slate-200 dark:border-[#1E2638] rounded-sm px-4 py-2.5">
            <Waves className="w-5 h-5 text-cyan-500 shrink-0" />
            <div>
              <div className="text-[10px] font-mono text-slate-400 uppercase">Simulator Status</div>
              <div className="text-xs font-mono font-bold text-slate-900 dark:text-white">Active Real-Time Model</div>
            </div>
          </div>
        </div>
      </div>

      {/* Simulator Control & Visual Dashboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Controls Panel */}
        <div className="bg-white dark:bg-[#0D111A] border border-slate-200 dark:border-[#1E2638] rounded-md p-5 space-y-5 shadow-xs">
          <h2 className="font-display text-base font-bold text-slate-950 dark:text-white flex items-center gap-2">
            <Activity className="w-4 h-4 text-cyan-500" />
            <span>Discharge & Reservoir Controls</span>
          </h2>

          <div className="space-y-4">
            {/* Target Basin Hub Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-mono uppercase text-slate-500 block">Target Downstream Hub</label>
              <div className="flex items-center gap-2 bg-slate-50 dark:bg-[#111622] border border-slate-200 dark:border-[#1E2638] rounded-sm px-3 py-2">
                <MapPin className="w-4 h-4 text-cyan-500 shrink-0" />
                <select
                  value={selectedHubId}
                  onChange={(e) => setSelectedHubId(e.target.value)}
                  className="w-full bg-transparent text-xs font-semibold text-slate-900 dark:text-white focus:outline-none cursor-pointer"
                >
                  {sindhPakCities.map((c) => (
                    <option key={c.id} value={c.id} className="bg-white dark:bg-[#0D111A]">
                      {c.name} ({c.province})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Discharge Cusecs Slider */}
            <div className="space-y-2 pt-2">
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-slate-500">Upstream Discharge Flow</span>
                <span className="font-bold text-cyan-600 dark:text-cyan-400 tabular-nums">
                  {dischargeCusecs.toLocaleString()} cusecs
                </span>
              </div>
              <input
                type="range"
                min="100000"
                max="1300000"
                step="25000"
                value={dischargeCusecs}
                onChange={(e) => setDischargeCusecs(Number(e.target.value))}
                className="w-full accent-cyan-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-mono text-slate-400">
                <span>100K (Low)</span>
                <span>600K (Normal Peak)</span>
                <span>1.3M (Super Flood)</span>
              </div>
            </div>

            {/* Reservoir Water Level Slider */}
            <div className="space-y-2 pt-2">
              <div className="flex justify-between items-center text-xs font-mono">
                <span className="text-slate-500">Reservoir Water Level</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                  {reservoirLevelM.toFixed(1)} meters
                </span>
              </div>
              <input
                type="range"
                min="280"
                max="340"
                step="0.5"
                value={reservoirLevelM}
                onChange={(e) => setReservoirLevelM(Number(e.target.value))}
                className="w-full accent-emerald-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] font-mono text-slate-400">
                <span>280m (Min Pool)</span>
                <span>310m (Normal)</span>
                <span>340m (Max Capacity)</span>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 dark:border-[#1E2638]">
            <button
              type="button"
              onClick={() => {
                if (onInspectInExplorer) onInspectInExplorer(selectedCity);
              }}
              className="w-full py-2.5 px-4 rounded-sm bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer"
            >
              <span>Inspect {selectedCity.name} on 3D Map</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Visual Impact Dashboard */}
        <div className="lg:col-span-2 space-y-4">
          {/* Top Status Alert Banner */}
          <div
            className={`p-4 rounded-md border flex items-center gap-3 ${
              dischargeCusecs > 900000
                ? 'bg-red-500/10 border-red-500/30 text-red-700 dark:text-red-300'
                : dischargeCusecs > 600000
                ? 'bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-300'
                : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
            }`}
          >
            {dischargeCusecs > 600000 ? (
              <ShieldAlert className="w-5 h-5 shrink-0" />
            ) : (
              <Waves className="w-5 h-5 shrink-0" />
            )}
            <div>
              <div className="font-bold text-xs uppercase tracking-wider">
                Simulation Alert Level: {riskLevel}
              </div>
              <div className="text-xs opacity-90 mt-0.5">
                Downstream gauge at {selectedCity.name} indicates {dischargeCusecs.toLocaleString()} cusecs influx. Evacuation lead time estimated at {evacuationLeadTimeHours} hours.
              </div>
            </div>
          </div>

          {/* 4 Impact Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-white dark:bg-[#0D111A] border border-slate-200 dark:border-[#1E2638] rounded-md p-5 space-y-2">
              <span className="text-xs font-semibold text-slate-500">Inundation Risk Index</span>
              <div className="font-mono text-3xl font-extrabold text-slate-950 dark:text-white tabular-nums">
                {floodRiskScore}%
              </div>
              <div className="w-full h-1.5 bg-slate-100 dark:bg-[#161D2B] rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${
                    floodRiskScore > 75 ? 'bg-red-500' : floodRiskScore > 40 ? 'bg-amber-500' : 'bg-cyan-500'
                  }`}
                  style={{ width: `${floodRiskScore}%` }}
                />
              </div>
            </div>

            <div className="bg-white dark:bg-[#0D111A] border border-slate-200 dark:border-[#1E2638] rounded-md p-5 space-y-2">
              <span className="text-xs font-semibold text-slate-500">Est. Inundation Footprint</span>
              <div className="font-mono text-3xl font-extrabold text-slate-950 dark:text-white tabular-nums">
                {inundationAreaSqKm.toLocaleString()} km²
              </div>
              <div className="text-[11px] font-mono text-slate-500">
                Low-lying agricultural basin coverage
              </div>
            </div>

            <div className="bg-white dark:bg-[#0D111A] border border-slate-200 dark:border-[#1E2638] rounded-md p-5 space-y-2">
              <span className="text-xs font-semibold text-slate-500">Vulnerable Population Est.</span>
              <div className="font-mono text-3xl font-extrabold text-slate-950 dark:text-white tabular-nums">
                {affectedPopulationEst.toLocaleString()}
              </div>
              <div className="text-[11px] font-mono text-slate-500">
                Riverine settlements within 10km buffer
              </div>
            </div>

            <div className="bg-white dark:bg-[#0D111A] border border-slate-200 dark:border-[#1E2638] rounded-md p-5 space-y-2">
              <span className="text-xs font-semibold text-slate-500">Evacuation Lead Time</span>
              <div className="font-mono text-3xl font-extrabold text-slate-950 dark:text-white tabular-nums">
                {evacuationLeadTimeHours} Hours
              </div>
              <div className="text-[11px] font-mono text-slate-500">
                Emergency response window
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
