/**
 * EarthSignal — Instant Command Palette (Cmd+K / Ctrl+K)
 * Fast navigation and search overlay for cities, variables, and tools.
 */

import React, { useState, useEffect } from 'react';
import { Search, Compass, Sprout, BarChart3, ShieldAlert, Cpu, Layers, X, ArrowRight } from 'lucide-react';
import { ACCURATE_CITIES, ENVIRONMENTAL_VARIABLES } from '../../services/nasa/nasaRegistry';
import { CityMarker, EnvironmentalVariableId } from '../../types/earthsignal';
import { NavTab } from '../layout/TopBar';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTab: (tab: NavTab) => void;
  onSelectCity: (city: CityMarker) => void;
  onSelectVariable: (v: EnvironmentalVariableId) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onSelectTab,
  onSelectCity,
  onSelectVariable,
}) => {
  const [query, setQuery] = useState<string>('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        else {
          // open
        }
      } else if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const matchedCities = ACCURATE_CITIES.filter(
    (c) =>
      c.name.toLowerCase().includes(query.toLowerCase()) ||
      c.province?.toLowerCase().includes(query.toLowerCase()) ||
      c.country.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 5);

  const matchedVars = Object.values(ENVIRONMENTAL_VARIABLES).filter(
    (v) =>
      v.name.toLowerCase().includes(query.toLowerCase()) ||
      v.description.toLowerCase().includes(query.toLowerCase())
  ).slice(0, 3);

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-start justify-center pt-20 p-4">
      <div className="bg-white dark:bg-[#0D111A] border border-slate-200 dark:border-[#1E2638] rounded-md max-w-xl w-full shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center px-4 py-3 border-b border-slate-200 dark:border-[#1E2638] gap-3">
          <Search className="w-4 h-4 text-cyan-500 shrink-0" />
          <input
            type="text"
            autoFocus
            placeholder="Type a city, variable, or tool (e.g. Sukkur, Rainfall, Flood)..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full bg-transparent text-sm text-slate-900 dark:text-white focus:outline-none"
          />
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-950 dark:hover:text-white p-1 rounded-sm cursor-pointer text-xs font-mono"
          >
            ESC
          </button>
        </div>

        <div className="p-3 space-y-3 max-h-[60vh] overflow-y-auto">
          {matchedCities.length > 0 && (
            <div className="space-y-1">
              <div className="px-2 text-[10px] font-mono uppercase text-slate-400 font-semibold">
                Cities &amp; Hubs
              </div>
              {matchedCities.map((city) => (
                <button
                  key={city.id}
                  type="button"
                  onClick={() => {
                    onSelectCity(city);
                    onSelectTab('explorer');
                    onClose();
                  }}
                  className="w-full text-left px-3 py-2 rounded-sm text-xs hover:bg-slate-100 dark:hover:bg-[#141B29] flex items-center justify-between transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Compass className="w-3.5 h-3.5 text-cyan-500" />
                    <div>
                      <div className="font-bold text-slate-950 dark:text-white">{city.name}</div>
                      <div className="text-[10px] text-slate-500">{city.province}, {city.country}</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-cyan-600 dark:text-cyan-400">Go to Map →</span>
                </button>
              ))}
            </div>
          )}

          {matchedVars.length > 0 && (
            <div className="space-y-1 pt-2 border-t border-slate-100 dark:border-[#1E2638]">
              <div className="px-2 text-[10px] font-mono uppercase text-slate-400 font-semibold">
                Climate Channels &amp; Variables
              </div>
              {matchedVars.map((v) => (
                <button
                  key={v.id}
                  type="button"
                  onClick={() => {
                    onSelectVariable(v.id as EnvironmentalVariableId);
                    onSelectTab('explorer');
                    onClose();
                  }}
                  className="w-full text-left px-3 py-2 rounded-sm text-xs hover:bg-slate-100 dark:hover:bg-[#141B29] flex items-center justify-between transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <BarChart3 className="w-3.5 h-3.5 text-emerald-500" />
                    <div>
                      <div className="font-bold text-slate-950 dark:text-white">{v.name}</div>
                      <div className="text-[10px] text-slate-500">{v.unit} · {v.category}</div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400">Select Channel →</span>
                </button>
              ))}
            </div>
          )}

          <div className="space-y-1 pt-2 border-t border-slate-100 dark:border-[#1E2638]">
            <div className="px-2 text-[10px] font-mono uppercase text-slate-400 font-semibold">
              Quick Navigation
            </div>
            {[
              { id: 'overview' as NavTab, label: 'Overview Dashboard', icon: BarChart3 },
              { id: 'explorer' as NavTab, label: '3D Earth Globe Map', icon: Compass },
              { id: 'crop-advisory' as NavTab, label: 'Crop Planner & 3-Month Forecast', icon: Sprout },
              { id: 'flood-sim' as NavTab, label: 'Upstream Flood Simulator', icon: ShieldAlert },
              { id: 'ai-scientist' as NavTab, label: 'AI Earth Scientist', icon: Cpu },
            ].map((nav) => {
              const Icon = nav.icon;
              return (
                <button
                  key={nav.id}
                  type="button"
                  onClick={() => {
                    onSelectTab(nav.id);
                    onClose();
                  }}
                  className="w-full text-left px-3 py-2 rounded-sm text-xs hover:bg-slate-100 dark:hover:bg-[#141B29] flex items-center justify-between transition-colors cursor-pointer"
                >
                  <div className="flex items-center gap-2">
                    <Icon className="w-3.5 h-3.5 text-slate-400" />
                    <span className="font-medium text-slate-900 dark:text-white">{nav.label}</span>
                  </div>
                  <ArrowRight className="w-3 h-3 text-slate-400" />
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
