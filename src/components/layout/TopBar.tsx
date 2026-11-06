/**
 * EarthSignal — Top Navigation Bar
 * Implements primary header menu links, advanced tools dropdown, mobile menu, and search icon button.
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  ChevronDown,
  Layers,
  Menu,
  X,
  Compass,
  Sprout,
  BarChart3,
  ShieldAlert,
  Cpu,
  FileText,
  Bell,
  Search,
  MapPin,
} from 'lucide-react';
import { ACCURATE_CITIES, ENVIRONMENTAL_VARIABLES } from '../../services/nasa/nasaRegistry';
import { CityMarker, EnvironmentalVariableId } from '../../types/earthsignal';

export type NavTab =
  | 'overview'
  | 'explorer'
  | 'crop-advisory'
  | 'trends'
  | 'comparison'
  | 'ai-scientist'
  | 'flood-sim'
  | 'coord-inspector'
  | 'vegetation';

interface TopBarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onOpenReport: () => void;
  onOpenAlerts: () => void;
  onOpenSearch: () => void;
  onSelectCity?: (city: CityMarker) => void;
  onSelectVariable?: (v: EnvironmentalVariableId) => void;
}

const PRIMARY_NAV: { id: NavTab; label: string; icon: any }[] = [
  { id: 'overview', label: 'Overview', icon: BarChart3 },
  { id: 'explorer', label: '3D Earth Map', icon: Compass },
  { id: 'crop-advisory', label: 'Crop Planner', icon: Sprout },
  { id: 'trends', label: 'Trend Analysis', icon: BarChart3 },
  { id: 'comparison', label: 'Compare Regions', icon: Layers },
];

const ADVANCED_TOOLS: { id: NavTab; label: string; icon: any }[] = [
  { id: 'flood-sim', label: 'Flood & Surge Simulator', icon: ShieldAlert },
  { id: 'coord-inspector', label: 'Point-and-Click Inspector', icon: Compass },
  { id: 'vegetation', label: 'Vegetation & Carbon Monitor', icon: Sprout },
  { id: 'ai-scientist', label: 'AI Earth Scientist', icon: Cpu },
];

export const TopBar: React.FC<TopBarProps> = ({
  activeTab,
  onSelectTab,
  onOpenReport,
  onOpenAlerts,
  onOpenSearch,
}) => {
  const [isToolsOpen, setIsToolsOpen] = useState<boolean>(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isAdvancedActive = ADVANCED_TOOLS.some((t) => t.id === activeTab);
  const activeToolLabel = ADVANCED_TOOLS.find((t) => t.id === activeTab)?.label || 'Advanced Tools';

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsToolsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200/90 dark:border-[#1E2638] bg-white/95 dark:bg-[#07090E]/95 backdrop-blur-md transition-colors">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 h-14 sm:h-16 flex items-center justify-between gap-6">
        {/* Zone 1: Brand Wordmark & Mobile Hamburger Toggle */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white p-1 rounded-sm focus:outline-none cursor-pointer"
            aria-label="Toggle Mobile Menu"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5 text-cyan-400" /> : <Menu className="w-5 h-5" />}
          </button>

          <button
            type="button"
            onClick={() => {
              onSelectTab('overview');
              setIsMobileMenuOpen(false);
            }}
            className="font-display text-lg sm:text-xl font-bold tracking-tight text-slate-950 dark:text-white whitespace-nowrap shrink-0 focus:outline-none"
          >
            EarthSignal
          </button>
        </div>

        {/* Zone 2: Full Header Menu (Primary Desktop Navigation Links + Advanced Dropdown) */}
        <nav
          aria-label="Primary Navigation"
          className="hidden lg:flex items-center gap-6 text-xs sm:text-[13px] font-medium text-slate-500 dark:text-slate-400"
        >
          {PRIMARY_NAV.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectTab(item.id)}
                className={`relative py-4 sm:py-5 transition-colors whitespace-nowrap shrink-0 focus:outline-none ${
                  isActive
                    ? 'text-slate-950 dark:text-white font-semibold'
                    : 'hover:text-slate-900 dark:hover:text-slate-200'
                }`}
              >
                {item.label}
                {isActive && (
                  <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-cyan-600 dark:bg-cyan-400" />
                )}
              </button>
            );
          })}

          {/* Advanced Tools Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setIsToolsOpen(!isToolsOpen)}
              className={`flex items-center gap-1.5 py-4 sm:py-5 transition-colors whitespace-nowrap shrink-0 focus:outline-none ${
                isAdvancedActive
                  ? 'text-slate-950 dark:text-white font-semibold'
                  : 'hover:text-slate-900 dark:hover:text-slate-200'
              }`}
            >
              <Layers className="w-3.5 h-3.5 text-cyan-500" />
              <span>{isAdvancedActive ? activeToolLabel : 'Advanced Tools'}</span>
              <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isToolsOpen ? 'rotate-180' : ''}`} />
              {isAdvancedActive && (
                <span className="absolute bottom-0 left-0 right-0 h-[2px] bg-cyan-600 dark:bg-cyan-400" />
              )}
            </button>

            {isToolsOpen && (
              <div className="absolute top-full right-0 mt-1 w-64 bg-white dark:bg-[#0D111A] border border-slate-200 dark:border-[#1E2638] rounded-md shadow-lg py-1.5 z-50">
                {ADVANCED_TOOLS.map((tool) => {
                  const isToolActive = activeTab === tool.id;
                  return (
                    <button
                      key={tool.id}
                      type="button"
                      onClick={() => {
                        onSelectTab(tool.id);
                        setIsToolsOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2.5 text-xs font-medium transition-colors flex items-center justify-between ${
                        isToolActive
                          ? 'bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 font-semibold'
                          : 'text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-[#141B29]'
                      }`}
                    >
                      <span>{tool.label}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </nav>

        {/* Zone 3: Search Icon, Alerts Bell, & Primary Action */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onOpenSearch}
            className="p-2 rounded-sm bg-slate-100 dark:bg-[#161D2B] text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white transition-colors cursor-pointer"
            title="Global Search (Cmd+K)"
          >
            <Search className="w-4 h-4 text-cyan-500" />
          </button>

          <button
            type="button"
            onClick={onOpenAlerts}
            className="relative p-2 rounded-sm bg-slate-100 dark:bg-[#161D2B] text-slate-700 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white transition-colors cursor-pointer"
            title="Climate Alerts (3 active)"
          >
            <Bell className="w-4 h-4 text-amber-500" />
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
            </span>
          </button>

          <button
            type="button"
            onClick={onOpenReport}
            className="px-4 py-2 text-xs font-semibold rounded-sm bg-slate-950 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-200 text-white dark:text-slate-950 transition-colors whitespace-nowrap shrink-0"
          >
            Export Dossier
          </button>
        </div>
      </div>

      {/* Mobile Navigation Dropdown Navbar Overlay */}
      {isMobileMenuOpen && (
        <div className="lg:hidden absolute top-full left-0 right-0 bg-[#07090E]/98 border-b border-[#1E2638] shadow-2xl z-50 p-4 space-y-4 animate-in slide-in-from-top-2">
          <div className="text-[10px] font-mono uppercase tracking-widest text-slate-400 font-bold px-2">
            Primary Navigation
          </div>
          <div className="grid grid-cols-1 gap-1">
            {PRIMARY_NAV.map((item) => {
              const isActive = activeTab === item.id;
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    onSelectTab(item.id);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2.5 rounded-sm text-xs font-semibold flex items-center gap-3 transition-colors ${
                    isActive
                      ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
                      : 'text-slate-300 hover:bg-[#141B29]'
                  }`}
                >
                  <Icon className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </div>

          <div className="text-[10px] font-mono uppercase tracking-widest text-slate-400 font-bold px-2 pt-2 border-t border-[#1E2638]">
            Advanced Tools &amp; Intelligence
          </div>
          <div className="grid grid-cols-1 gap-1">
            {ADVANCED_TOOLS.map((tool) => {
              const isActive = activeTab === tool.id;
              const Icon = tool.icon;
              return (
                <button
                  key={tool.id}
                  type="button"
                  onClick={() => {
                    onSelectTab(tool.id);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2.5 rounded-sm text-xs font-semibold flex items-center gap-3 transition-colors ${
                    isActive
                      ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30'
                      : 'text-slate-300 hover:bg-[#141B29]'
                  }`}
                >
                  <Icon className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>{tool.label}</span>
                </button>
              );
            })}
          </div>

          <div className="pt-2 border-t border-[#1E2638] flex gap-2">
            <button
              type="button"
              onClick={() => {
                onOpenSearch();
                setIsMobileMenuOpen(false);
              }}
              className="flex-1 py-2.5 bg-[#161D2B] text-white rounded-sm text-xs font-bold flex items-center justify-center gap-2 cursor-pointer border border-[#1E2638]"
            >
              <Search className="w-4 h-4 text-cyan-400" />
              <span>Global Search</span>
            </button>
            <button
              type="button"
              onClick={() => {
                onOpenReport();
                setIsMobileMenuOpen(false);
              }}
              className="flex-1 py-2.5 bg-cyan-500 text-[#07090E] rounded-sm text-xs font-bold flex items-center justify-center gap-2 cursor-pointer"
            >
              <FileText className="w-4 h-4" />
              <span>Export Dossier</span>
            </button>
          </div>
        </div>
      )}
    </header>
  );
};
