/**
 * EarthSignal — Top Navigation Bar
 * Strictly follows the 3-Zone Top Bar Contract:
 * [Zone 1: Single-line Brand Wordmark] — [Zone 2: Clean typographic nav links] — [Zone 3: Primary Action]
 */

import React from 'react';
import { Sun, Moon } from 'lucide-react';

export type NavTab = 'overview' | 'explorer' | 'crop-advisory' | 'trends' | 'comparison' | 'ai-scientist';

interface TopBarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onOpenReport: () => void;
  isDark: boolean;
  onToggleTheme: () => void;
}

const NAV_ITEMS: { id: NavTab; label: string }[] = [
  { id: 'overview', label: 'Home' },
  { id: 'explorer', label: '3D Map' },
  { id: 'crop-advisory', label: 'Crop Planner' },
  { id: 'trends', label: 'Weather Trends' },
  { id: 'comparison', label: 'Compare Cities' },
  { id: 'ai-scientist', label: 'Ask Assistant' },
];

export const TopBar: React.FC<TopBarProps> = ({
  activeTab,
  onSelectTab,
  onOpenReport,
  isDark,
  onToggleTheme,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-200 dark:border-slate-800/90 bg-white/95 dark:bg-[#07090E]/95 backdrop-blur-md transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Single-element Brand Wordmark */}
        <button
          type="button"
          onClick={() => onSelectTab('overview')}
          className="text-lg font-bold tracking-tight text-slate-900 dark:text-white whitespace-nowrap shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-sky-500 rounded"
        >
          EarthSignal
        </button>

        {/* Zone 2: Clean Single-Line Typographic Navigation Links */}
        <nav
          aria-label="Primary Navigation"
          className="hidden md:flex items-center gap-7 text-xs font-medium text-slate-600 dark:text-slate-400"
        >
          {NAV_ITEMS.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectTab(item.id)}
                className={`relative py-5 transition-colors whitespace-nowrap shrink-0 focus:outline-none ${
                  isActive
                    ? 'text-slate-950 dark:text-white font-semibold'
                    : 'hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {item.label}
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-sky-500 rounded-full" />
                )}
              </button>
            );
          })}
        </nav>

        {/* Zone 3: Theme Switch & Primary Action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            type="button"
            onClick={onToggleTheme}
            aria-label="Toggle color theme"
            className="p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white border border-slate-200 dark:border-slate-800 transition-colors"
          >
            {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          <button
            type="button"
            onClick={onOpenReport}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-slate-900 hover:bg-slate-800 dark:bg-sky-500 dark:hover:bg-sky-400 text-white dark:text-slate-950 transition-colors whitespace-nowrap shrink-0"
          >
            Download Report
          </button>
        </div>
      </div>

      {/* Mobile Navigation Bar */}
      <div className="md:hidden border-t border-slate-200 dark:border-slate-800/80 px-4 py-2 flex items-center gap-4 overflow-x-auto text-xs">
        {NAV_ITEMS.map((item) => {
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectTab(item.id)}
              className={`whitespace-nowrap shrink-0 py-1 ${
                isActive
                  ? 'text-sky-600 dark:text-sky-400 font-semibold'
                  : 'text-slate-500 dark:text-slate-400'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>
    </header>
  );
};
