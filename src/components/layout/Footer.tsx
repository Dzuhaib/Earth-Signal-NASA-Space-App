/**
 * EarthSignal — Clean Minimal Footer
 */

import React from 'react';
import { Globe, Sun, Moon, FileDown } from 'lucide-react';
import { NavTab } from './TopBar';

interface FooterProps {
  onSelectTab: (tab: NavTab) => void;
  onOpenReport: () => void;
  isDark: boolean;
  onToggleTheme: () => void;
}

export const Footer: React.FC<FooterProps> = ({
  onSelectTab,
  onOpenReport,
  isDark,
  onToggleTheme,
}) => {
  return (
    <footer className="border-t border-slate-200 dark:border-[#1E2638] bg-white dark:bg-[#07090E] text-slate-600 dark:text-slate-400 transition-colors mt-16">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-sm bg-slate-950 dark:bg-cyan-500 flex items-center justify-center text-white dark:text-slate-950">
            <Globe className="w-4 h-4" />
          </div>
          <span className="font-display text-sm font-bold text-slate-950 dark:text-white">
            EarthSignal
          </span>
          <span className="text-xs font-mono text-slate-500">
            · Open Climate &amp; Crop Intelligence
          </span>
        </div>

        {/* Quick Links */}
        <div className="flex flex-wrap items-center gap-4 text-xs font-medium">
          <button
            type="button"
            onClick={() => onSelectTab('overview')}
            className="hover:text-cyan-500 transition-colors cursor-pointer"
          >
            Overview
          </button>
          <button
            type="button"
            onClick={() => onSelectTab('explorer')}
            className="hover:text-cyan-500 transition-colors cursor-pointer"
          >
            3D Map
          </button>
          <button
            type="button"
            onClick={() => onSelectTab('crop-advisory')}
            className="hover:text-cyan-500 transition-colors cursor-pointer"
          >
            Crop Forecast
          </button>
          <button
            type="button"
            onClick={() => onSelectTab('trends')}
            className="hover:text-cyan-500 transition-colors cursor-pointer"
          >
            Trend Audit
          </button>
          <button
            type="button"
            onClick={() => onSelectTab('comparison')}
            className="hover:text-cyan-500 transition-colors cursor-pointer"
          >
            Compare
          </button>
          <button
            type="button"
            onClick={() => onSelectTab('ai-scientist')}
            className="hover:text-cyan-500 transition-colors cursor-pointer"
          >
            AI Scientist
          </button>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onToggleTheme}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-sm border border-slate-200 dark:border-[#1E2638] bg-slate-50 dark:bg-[#0D111A] text-slate-700 dark:text-slate-300 text-xs font-mono cursor-pointer"
          >
            {isDark ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5" />}
            <span>{isDark ? 'Light' : 'Dark'}</span>
          </button>

          <button
            type="button"
            onClick={onOpenReport}
            className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-sm bg-cyan-500 hover:bg-cyan-400 text-[#07090E] text-xs font-bold cursor-pointer"
          >
            <FileDown className="w-3.5 h-3.5" />
            <span>Export PDF</span>
          </button>
        </div>
      </div>
    </footer>
  );
};
