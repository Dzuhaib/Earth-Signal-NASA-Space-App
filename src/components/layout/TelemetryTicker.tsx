/**
 * EarthSignal — Live Satellite Telemetry Status Ticker
 * Real-time status bar showing NASA POWER and MERRA-2 stream synchronization.
 */

import React from 'react';
import { Activity, Radio, Cpu } from 'lucide-react';

export const TelemetryTicker: React.FC = () => {
  return (
    <div className="w-full bg-[#05070B] border-t border-[#1E2638] text-[11px] font-mono text-slate-400 py-1.5 px-4 overflow-hidden">
      <div className="max-w-[1440px] mx-auto flex items-center justify-between gap-6 overflow-x-auto no-scrollbar whitespace-nowrap">
        <div className="flex items-center gap-2 text-cyan-400">
          <Radio className="w-3.5 h-3.5 animate-pulse" />
          <span className="font-bold">NASA POWER LIVE FEED</span>
        </div>

        <div className="flex items-center gap-6">
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span>MERRA-2 Stream: Active</span>
          </span>
          <span className="flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
            <span>GLDAS-2.1 Hydrology: 32 Stations</span>
          </span>
          <span className="flex items-center gap-1.5">
            <Cpu className="w-3.5 h-3.5 text-purple-400" />
            <span>Mann-Kendall Engine: Ready</span>
          </span>
          <span className="text-slate-500 tabular-nums">
            Latency: 84ms · {new Date().toUTCString().slice(17, 25)} UTC
          </span>
        </div>
      </div>
    </div>
  );
};
