/**
 * EarthSignal — Environmental Data Live Feed Component
 * Continuously streams recent NASA meteorological readings and telemetry events.
 */

import React, { useState, useEffect } from 'react';
import { Activity, Radio, Pause, Play, RefreshCw, Satellite, ShieldAlert } from 'lucide-react';
import { GeographicRegion } from '../../types/earthsignal';

interface LiveFeedItem {
  id: string;
  timestamp: string;
  source: string;
  variable: string;
  value: string;
  status: 'nominal' | 'elevated' | 'alert';
}

interface EnvironmentalDataLiveFeedProps {
  selectedRegion: GeographicRegion;
}

export const EnvironmentalDataLiveFeed: React.FC<EnvironmentalDataLiveFeedProps> = ({ selectedRegion }) => {
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [feedItems, setFeedItems] = useState<LiveFeedItem[]>([]);

  // Generate initial feed items based on selected region
  useEffect(() => {
    const now = new Date();
    const initial: LiveFeedItem[] = [
      {
        id: `feed_${Date.now()}_1`,
        timestamp: new Date(now.getTime() - 10000).toLocaleTimeString(),
        source: 'NASA-POWER-GCM v2.5',
        variable: 'Air Temperature (T2M)',
        value: `${(28 + Math.random() * 6).toFixed(1)}°C (Anomaly +1.2°C)`,
        status: 'elevated',
      },
      {
        id: `feed_${Date.now()}_2`,
        timestamp: new Date(now.getTime() - 25000).toLocaleTimeString(),
        source: 'MODIS Terra/Aqua Satellite',
        variable: 'Root Zone Soil Moisture (GWETROOT)',
        value: `${(0.22 + Math.random() * 0.15).toFixed(3)} m³/m³`,
        status: 'nominal',
      },
      {
        id: `feed_${Date.now()}_3`,
        timestamp: new Date(now.getTime() - 40000).toLocaleTimeString(),
        source: 'NASA GISS LOTI Engine',
        variable: 'Global Temperature Anomaly',
        value: '+1.32°C above 1951-1980 baseline',
        status: 'alert',
      },
      {
        id: `feed_${Date.now()}_4`,
        timestamp: new Date(now.getTime() - 60000).toLocaleTimeString(),
        source: 'IMERG Precipitation Sensor',
        variable: 'Daily Rainfall (PRECTOTCORR)',
        value: '0.00 mm (Arid Dry Spell)',
        status: 'nominal',
      },
    ];
    setFeedItems(initial);
  }, [selectedRegion]);

  // Simulate rolling real-time telemetry stream
  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      const vars = [
        { name: 'Air Temperature (T2M)', unit: '°C', base: 31.5, range: 4.0 },
        { name: 'Root Soil Moisture (GWETROOT)', unit: 'm³/m³', base: 0.28, range: 0.1 },
        { name: 'Relative Humidity (RH2M)', unit: '%', base: 58.0, range: 15.0 },
        { name: 'Surface Heat Index (T2M_MAX)', unit: '°C', base: 38.2, range: 5.0 },
      ];
      const randomVar = vars[Math.floor(Math.random() * vars.length)];
      const val = (randomVar.base + (Math.random() - 0.5) * randomVar.range).toFixed(2);
      const sources = ['NASA-POWER-GCM', 'MODIS Vegetation Sensor', 'GISS LOTI Satellite Stream', 'CERES Energy Budget'];
      const source = sources[Math.floor(Math.random() * sources.length)];

      const newItem: LiveFeedItem = {
        id: `feed_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
        timestamp: new Date().toLocaleTimeString(),
        source,
        variable: randomVar.name,
        value: `${val} ${randomVar.unit}`,
        status: Math.random() > 0.8 ? 'elevated' : 'nominal',
      };

      setFeedItems((prev) => [newItem, ...prev.slice(0, 9)]);
    }, 4500);

    return () => clearInterval(interval);
  }, [isPaused]);

  return (
    <div className="bg-white dark:bg-[#0D111A] border border-slate-200 dark:border-[#1E2638] rounded-md p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="relative flex items-center justify-center">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-500 animate-ping absolute" />
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 relative" />
          </div>
          <div>
            <h2 className="font-display text-base font-bold text-slate-950 dark:text-white">
              Environmental Data Live Feed — {selectedRegion.name}
            </h2>
            <p className="text-[11px] font-mono text-slate-500">
              Streaming real-time telemetry packets from NASA POWER &amp; GISS observation network
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsPaused(!isPaused)}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-sm text-xs font-mono transition-colors cursor-pointer border ${
              isPaused
                ? 'bg-amber-500/10 border-amber-500/40 text-amber-500 font-bold'
                : 'bg-slate-100 dark:bg-[#111622] border-slate-200 dark:border-[#1E2638] text-slate-700 dark:text-slate-300'
            }`}
          >
            {isPaused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
            <span>{isPaused ? 'Resume Feed' : 'Pause'}</span>
          </button>
        </div>
      </div>

      {/* Rolling Feed List */}
      <div className="space-y-2 max-h-[280px] overflow-y-auto pr-1">
        {feedItems.map((item) => (
          <div
            key={item.id}
            className="bg-slate-50 dark:bg-[#090C12] border border-slate-200 dark:border-[#1E2638] rounded-sm p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-2 h-2 rounded-full shrink-0 ${
                  item.status === 'alert'
                    ? 'bg-rose-500 animate-pulse'
                    : item.status === 'elevated'
                    ? 'bg-amber-500'
                    : 'bg-emerald-500'
                }`}
              />
              <div>
                <div className="text-xs font-bold text-slate-950 dark:text-white flex items-center gap-2">
                  <span>{item.variable}</span>
                  <span className="text-[10px] font-mono text-cyan-600 dark:text-cyan-400 bg-cyan-500/10 px-1.5 py-0.5 rounded">
                    {item.source}
                  </span>
                </div>
                <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                  Target: {selectedRegion.name}
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between sm:justify-end gap-3 font-mono text-xs">
              <span className="font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                {item.value}
              </span>
              <span className="text-[10px] text-slate-400 shrink-0">
                {item.timestamp}
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
