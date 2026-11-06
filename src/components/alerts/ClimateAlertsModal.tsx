/**
 * EarthSignal — Climate Alerts Notification Center
 * Seasonally accurate NASA climate advisories reflecting current November 2026 conditions.
 */

import React from 'react';
import { AlertTriangle, X, Calendar, CheckCircle2 } from 'lucide-react';

interface ClimateAlert {
  id: string;
  severity: 'critical' | 'warning' | 'advisory';
  title: string;
  region: string;
  affectedDates: string;
  timestamp: string;
  description: string;
  actionRequired: string;
}

interface ClimateAlertsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectRegion?: (regionName: string) => void;
}

const ACTIVE_ALERTS: ClimateAlert[] = [
  {
    id: 'alert_1',
    severity: 'advisory',
    title: 'Optimal Rabi Cereal Sowing Window Active',
    region: 'Sukkur, Larkana & Upper Sindh',
    affectedDates: 'Nov 01, 2026 – Nov 30, 2026',
    timestamp: 'Live · MERRA-2 Agroclimatology',
    description: 'Ambient temperatures (21°C–24°C) and root-zone moisture profiles have reached optimal biological thresholds for wheat and oilseed germination.',
    actionRequired: 'Proceed with certified seed drill sowing and initial canal irrigation.',
  },
  {
    id: 'alert_2',
    severity: 'warning',
    title: 'Seasonal Winter Atmospheric Inversion & Smog Watch',
    region: 'Lahore & Punjab Basin',
    affectedDates: 'Nov 05, 2026 – Dec 15, 2026',
    timestamp: 'Live · Sentinel-5P TROPOMI',
    description: 'Stable atmospheric pressure and low wind speeds (5 km/h) are trapping particulate matter across the upper Indo-Gangetic plain.',
    actionRequired: 'Adhere to industrial emissions controls and stubble burning restrictions.',
  },
  {
    id: 'alert_3',
    severity: 'advisory',
    title: 'Fall Rabi Canal Irrigation Regimen',
    region: 'Indus Basin Command',
    affectedDates: 'Nov 01, 2026 – Nov 30, 2026',
    timestamp: 'Live · GLDAS-2.1 Hydrology',
    description: 'Reservoir levels are stable. Canal water distribution is operating on scheduled rotational turns for Rabi crop establishment.',
    actionRequired: 'Coordinate rotational water delivery with local farmer water user associations.',
  },
];

export const ClimateAlertsModal: React.FC<ClimateAlertsModalProps> = ({
  isOpen,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-[#0D111A] border border-slate-200 dark:border-[#1E2638] rounded-md max-w-lg w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-[#1E2638] flex items-center justify-between bg-slate-50 dark:bg-[#111622]">
          <div className="flex items-center gap-2.5">
            <div className="relative flex items-center justify-center">
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 animate-ping absolute" />
              <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 relative" />
            </div>
            <h3 className="font-display text-base font-bold text-slate-950 dark:text-white">
              NASA Climate &amp; Seasonal Advisories
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-950 dark:hover:text-white p-1 rounded-sm cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Alert List */}
        <div className="p-5 space-y-3.5 max-h-[70vh] overflow-y-auto">
          {ACTIVE_ALERTS.map((alert) => (
            <div
              key={alert.id}
              className={`p-4 rounded-md border space-y-2.5 ${
                alert.severity === 'warning'
                  ? 'bg-amber-500/10 border-amber-500/30 text-slate-900 dark:text-slate-100'
                  : 'bg-cyan-500/10 border-cyan-500/30 text-slate-900 dark:text-slate-100'
              }`}
            >
              <div className="flex items-center justify-between">
                <span
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-xs text-[10px] font-mono font-bold uppercase ${
                    alert.severity === 'warning'
                      ? 'bg-amber-500 text-slate-950'
                      : 'bg-cyan-500 text-slate-950'
                  }`}
                >
                  <CheckCircle2 className="w-3 h-3" />
                  {alert.severity}
                </span>
                <span className="inline-flex items-center gap-1 text-[11px] font-mono font-bold text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 px-2 py-0.5 rounded-xs">
                  <Calendar className="w-3 h-3" />
                  {alert.affectedDates}
                </span>
              </div>

              <div>
                <h4 className="font-display text-sm font-bold text-slate-950 dark:text-white">
                  {alert.title}
                </h4>
                <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                  📍 {alert.region} · {alert.timestamp}
                </div>
              </div>

              <p className="text-xs text-slate-600 dark:text-slate-300">
                {alert.description}
              </p>

              <div className="pt-2 border-t border-slate-200/60 dark:border-[#1E2638] flex items-center justify-between text-[11px] font-mono">
                <span className="text-slate-500">Advisory Action:</span>
                <span className="text-slate-800 dark:text-slate-200 font-semibold truncate max-w-[280px]">
                  {alert.actionRequired}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-5 py-3.5 bg-slate-50 dark:bg-[#111622] border-t border-slate-200 dark:border-[#1E2638] flex items-center justify-between text-xs">
          <span className="font-mono text-slate-500">Active Window: November 2026 (Rabi Season)</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-sm bg-slate-950 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-200 text-white dark:text-slate-950 font-semibold cursor-pointer"
          >
            Acknowledge All
          </button>
        </div>
      </div>
    </div>
  );
};
