/**
 * EarthSignal — Clean, Simple Public Product Footer
 */

import React from 'react';
import { NavTab } from './TopBar';

interface FooterProps {
  onSelectTab: (tab: NavTab) => void;
}

export const Footer: React.FC<FooterProps> = ({ onSelectTab }) => {
  return (
    <footer className="w-full border-t border-slate-200 dark:border-slate-800/90 bg-slate-50 dark:bg-[#06080D] text-slate-600 dark:text-slate-400 transition-colors mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Top 12-Column Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 pb-10 border-b border-slate-200 dark:border-slate-800/80">
          {/* Column 1: Product Summary (5 cols) */}
          <div className="md:col-span-5 space-y-3">
            <div className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
              EarthSignal
            </div>
            <p className="text-xs leading-relaxed text-slate-600 dark:text-slate-400 max-w-sm">
              Free tool to track temperature, rainfall, soil moisture, and crop yields across Pakistan and major cities worldwide using live NASA satellite data.
            </p>
          </div>

          {/* Column 2: Quick Links (3 cols) */}
          <div className="md:col-span-3 space-y-2.5">
            <div className="text-xs font-semibold text-slate-900 dark:text-slate-200">
              Explore
            </div>
            <ul className="space-y-2 text-xs">
              {[
                { id: 'overview', label: 'Home' },
                { id: 'explorer', label: '3D Map' },
                { id: 'crop-advisory', label: 'Crop Planner' },
                { id: 'trends', label: 'Weather Trends' },
                { id: 'comparison', label: 'Compare Cities' },
                { id: 'ai-scientist', label: 'Ask Assistant' },
              ].map((item) => (
                <li key={item.id}>
                  <button
                    type="button"
                    onClick={() => onSelectTab(item.id as NavTab)}
                    className="text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white transition-colors text-left"
                  >
                    {item.label}
                  </button>
                </li>
              ))}
            </ul>
          </div>

          {/* Column 3: How It Works (4 cols) */}
          <div className="md:col-span-4 space-y-2.5">
            <div className="text-xs font-semibold text-slate-900 dark:text-slate-200">
              How It Works
            </div>
            <div className="space-y-2 text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              <p>
                <span className="text-slate-900 dark:text-slate-200 font-medium">Live Satellite Data:</span>{' '}
                Pulls monthly temperature, rain, and soil moisture records from 1981 to 2026.
              </p>
              <p>
                <span className="text-slate-900 dark:text-slate-200 font-medium">Practical Insights:</span>{' '}
                Shows how local weather is changing and which crops will perform best in the next 3 to 6 months.
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Row */}
        <div className="pt-6 flex items-center justify-between text-xs text-slate-500">
          <div>EarthSignal — Free Climate &amp; Crop Planning Tool</div>
        </div>
      </div>
    </footer>
  );
};
