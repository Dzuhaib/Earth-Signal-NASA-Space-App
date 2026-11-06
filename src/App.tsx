/**
 * EarthSignal — Main Application Root
 * Planetary Observation, Statistical Trend Detection & Crop Yield Intelligence Platform
 */

import React, { useState, useEffect } from 'react';
import { Sun, Moon, Compass, Sliders } from 'lucide-react';
import { TopBar, NavTab } from './components/layout/TopBar';
import { Footer } from './components/layout/Footer';
import { OverviewView } from './components/dashboard/OverviewView';
import { EarthExplorerView } from './components/explorer/EarthExplorerView';
import { CropAdvisoryView } from './components/agro/CropAdvisoryView';
import { TrendAnalysisView } from './components/dashboard/TrendAnalysisView';
import { RegionalComparisonView } from './components/comparison/RegionalComparisonView';
import { AIEarthScientistView } from './components/ai/AIEarthScientistView';
import { FloodSimulatorView } from './components/simulation/FloodSimulatorView';
import { CoordinateInspectorView } from './components/inspector/CoordinateInspectorView';
import { VegetationMonitorView } from './components/vegetation/VegetationMonitorView';
import { ReportModal } from './components/reports/ReportModal';
import { ClimateAlertsModal } from './components/alerts/ClimateAlertsModal';
import { CommandPalette } from './components/navigation/CommandPalette';
import { TelemetryTicker } from './components/layout/TelemetryTicker';
import { OfflineIndicator } from './components/layout/OfflineIndicator';
import {
  GeographicRegion,
  EnvironmentalVariableId,
  StatisticalAnalysisResponse,
} from './types/earthsignal';
import { GEOGRAPHIC_REGIONS, ENVIRONMENTAL_VARIABLES } from './services/nasa/nasaRegistry';

const QUICK_VARIABLES: { id: EnvironmentalVariableId; shortLabel: string }[] = [
  { id: 'T2M', shortLabel: 'Air Temp (T2M)' },
  { id: 'T2M_MAX', shortLabel: 'Canopy Max' },
  { id: 'PRECTOTCORR', shortLabel: 'Rainfall' },
  { id: 'GWETROOT', shortLabel: 'Root Soil Moisture' },
  { id: 'RH2M', shortLabel: 'Humidity' },
  { id: 'GISTEMP_ANOMALY', shortLabel: 'GISTEMP LOTI' },
];

export function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('overview');
  const [isDark, setIsDark] = useState<boolean>(true);
  const [isReportOpen, setIsReportOpen] = useState<boolean>(false);
  const [isAlertsOpen, setIsAlertsOpen] = useState<boolean>(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState<boolean>(false);

  useEffect(() => {
    const handleCmdK = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsCommandPaletteOpen((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleCmdK);
    return () => window.removeEventListener('keydown', handleCmdK);
  }, []);

  // Core application state
  const [regions] = useState<GeographicRegion[]>(GEOGRAPHIC_REGIONS);
  const [selectedRegion, setSelectedRegion] = useState<GeographicRegion>(
    GEOGRAPHIC_REGIONS.find((r) => r.id === 'pakistan_sindh') || GEOGRAPHIC_REGIONS[0]
  );
  const [selectedVariable, setSelectedVariable] = useState<EnvironmentalVariableId>('T2M');
  const [startYear, setStartYear] = useState<number>(2000);
  const [endYear, setEndYear] = useState<number>(2026);

  // Analysis state
  const [analysis, setAnalysis] = useState<StatisticalAnalysisResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync dark class on documentElement
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  // Execute trend analysis
  const executeAnalysis = async (
    targetRegion = selectedRegion,
    targetVar = selectedVariable,
    sYear = startYear,
    eYear = endYear
  ) => {
    setIsLoading(true);
    setErrorMessage(null);
    try {
      const res = await fetch('/api/v1/analysis/trends', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          region_id: targetRegion.id,
          variable: targetVar,
          start_year: sYear,
          end_year: eYear,
          custom_lat: targetRegion.latitude,
          custom_lon: targetRegion.longitude,
        }),
      });

      if (!res.ok) {
        throw new Error(`Analysis API error HTTP ${res.status}`);
      }

      const data = await res.json();
      if (data.status === 'success' && data.analysis) {
        setAnalysis(data.analysis);
      } else {
        throw new Error(data.error || 'Unable to compute trend analysis');
      }
    } catch (err: any) {
      console.error('Failed to compute analysis:', err);
      setErrorMessage(err.message || 'Error communicating with analysis service');
    } finally {
      setIsLoading(false);
    }
  };

  // Initial load: analyze flagship region (Sindh, Pakistan)
  useEffect(() => {
    executeAnalysis();
  }, []);

  // Quick launch flagship
  const handleLaunchFlagship = () => {
    const sindh = GEOGRAPHIC_REGIONS.find((r) => r.id === 'pakistan_sindh') || GEOGRAPHIC_REGIONS[0];
    setSelectedRegion(sindh);
    setSelectedVariable('T2M');
    executeAnalysis(sindh, 'T2M');
    setActiveTab('trends');
  };

  const activeVarMeta = ENVIRONMENTAL_VARIABLES[selectedVariable];

  return (
    <div className="min-h-screen flex flex-col bg-[#F8FAFC] dark:bg-[#07090E] text-slate-900 dark:text-slate-100 transition-colors selection:bg-cyan-500 selection:text-slate-950">
      {/* 3-Zone Top Bar Navigation */}
      <TopBar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenReport={() => setIsReportOpen(true)}
        onOpenAlerts={() => setIsAlertsOpen(true)}
        onOpenSearch={() => setIsCommandPaletteOpen(true)}
        onSelectCity={(city) => {
          const targetReg: GeographicRegion = {
            id: city.id,
            name: city.name,
            country: city.province ? `${city.province}, ${city.country}` : city.country,
            admin_level: 'special_zone',
            latitude: city.latitude,
            longitude: city.longitude,
            bounding_box: [city.latitude - 0.25, city.longitude - 0.25, city.latitude + 0.25, city.longitude + 0.25],
            notes: city.keyFeature,
            is_flagship: city.isFlagshipCity,
          };
          setSelectedRegion(targetReg);
          executeAnalysis(targetReg, selectedVariable, startYear, endYear);
          setActiveTab('explorer');
        }}
        onSelectVariable={(v) => {
          setSelectedVariable(v);
          executeAnalysis(selectedRegion, v, startYear, endYear);
          setActiveTab('explorer');
        }}
      />

      <ClimateAlertsModal
        isOpen={isAlertsOpen}
        onClose={() => setIsAlertsOpen(false)}
      />

      {/* Top Telemetry & Calibration Ribbon (Workspace Context Bar) */}
      <div className="w-full border-b border-slate-200/90 dark:border-[#1E2638] bg-slate-100/80 dark:bg-[#0B0E17] text-xs">
        <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 py-2 flex flex-wrap items-center justify-between gap-3">
          {/* Active Spatial Target & Coordinates */}
          <div className="flex items-center gap-2.5 font-mono text-[11px] text-slate-600 dark:text-slate-400 min-w-0">
            <Compass className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400 shrink-0" />
            <span className="truncate">
              TARGET: <strong className="text-slate-950 dark:text-white">{selectedRegion.name}</strong>
            </span>
            <span aria-hidden="true">·</span>
            <span className="tabular-nums shrink-0">
              {selectedRegion.latitude.toFixed(2)}°N, {selectedRegion.longitude.toFixed(2)}°E
            </span>
            <span className="hidden lg:inline" aria-hidden="true">·</span>
            <span className="hidden lg:inline text-slate-500 truncate">
              CHANNEL: {activeVarMeta?.name} ({activeVarMeta?.unit})
            </span>
          </div>

          {/* Right Quick Channel Calibration & Theme Switch */}
          <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
            <div className="hidden sm:flex items-center gap-1 mr-1 text-[11px] font-mono text-slate-500">
              <Sliders className="w-3 h-3" />
              <span>Channel:</span>
            </div>
            <div className="flex items-center gap-1 bg-white dark:bg-[#111622] p-0.5 rounded-sm border border-slate-200 dark:border-[#1E2638]">
              {QUICK_VARIABLES.map((qv) => {
                const isSelected = selectedVariable === qv.id;
                return (
                  <button
                    key={qv.id}
                    type="button"
                    onClick={() => {
                      setSelectedVariable(qv.id);
                      executeAnalysis(selectedRegion, qv.id, startYear, endYear);
                    }}
                    className={`px-2 py-1 text-[11px] font-mono rounded-xs transition-colors whitespace-nowrap shrink-0 ${
                      isSelected
                        ? 'bg-slate-950 text-white dark:bg-cyan-500 dark:text-slate-950 font-semibold'
                        : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white'
                    }`}
                  >
                    {qv.shortLabel}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => setIsDark(!isDark)}
              aria-label="Toggle color theme"
              title={isDark ? 'Switch to Light Lab Theme' : 'Switch to Dark Space Theme'}
              className="px-2.5 py-1 rounded-sm bg-white dark:bg-[#111622] border border-slate-200 dark:border-[#1E2638] text-slate-600 dark:text-slate-300 hover:text-slate-950 dark:hover:text-white transition-colors inline-flex items-center gap-1.5 text-[11px] font-mono shrink-0"
            >
              {isDark ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-slate-700" />}
              <span className="hidden xl:inline">{isDark ? 'Light Mode' : 'Dark Mode'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Error notification banner if any */}
      {errorMessage && (
        <div className="bg-rose-500/10 border-b border-rose-500/20 text-rose-700 dark:text-rose-400 px-4 py-2.5 text-xs font-mono text-center">
          Telemetry Notice: {errorMessage}
        </div>
      )}

      {/* Main Workspace Stage */}
      <main className="flex-1 bg-scientific-grid">
        {activeTab === 'overview' && (
          <OverviewView
            onNavigate={setActiveTab}
            onLaunchFlagship={handleLaunchFlagship}
            analysis={analysis}
            regions={regions}
            selectedRegion={selectedRegion}
            onSelectRegion={(reg) => {
              setSelectedRegion(reg);
              executeAnalysis(reg, selectedVariable, startYear, endYear);
            }}
            selectedVariable={selectedVariable}
            onSelectVariable={(v) => {
              setSelectedVariable(v);
              executeAnalysis(selectedRegion, v, startYear, endYear);
            }}
          />
        )}

        {activeTab === 'explorer' && (
          <EarthExplorerView
            regions={regions}
            selectedRegion={selectedRegion}
            onSelectRegion={(reg) => {
              setSelectedRegion(reg);
              executeAnalysis(reg, selectedVariable, startYear, endYear);
            }}
            selectedVariable={selectedVariable}
            onSelectVariable={(v) => {
              setSelectedVariable(v);
              executeAnalysis(selectedRegion, v, startYear, endYear);
            }}
            startYear={startYear}
            endYear={endYear}
            onChangeYears={(s, e) => {
              setStartYear(s);
              setEndYear(e);
              executeAnalysis(selectedRegion, selectedVariable, s, e);
            }}
            onAnalyze={() => {
              executeAnalysis();
              setActiveTab('trends');
            }}
            isLoading={isLoading}
            analysis={analysis}
          />
        )}

        {activeTab === 'crop-advisory' && (
          <CropAdvisoryView
            defaultCityId={selectedRegion.id?.startsWith('city_') ? selectedRegion.id : 'city_sukkur'}
            onInspectInExplorer={(city) => {
              const targetReg: GeographicRegion = {
                id: city.id,
                name: city.name,
                country: city.province ? `${city.province}, ${city.country}` : city.country,
                admin_level: 'special_zone',
                latitude: city.latitude,
                longitude: city.longitude,
                bounding_box: [city.latitude - 0.25, city.longitude - 0.25, city.latitude + 0.25, city.longitude + 0.25],
                notes: city.keyFeature,
                is_flagship: city.isFlagshipCity,
              };
              setSelectedRegion(targetReg);
              executeAnalysis(targetReg, selectedVariable, startYear, endYear);
              setActiveTab('explorer');
            }}
          />
        )}

        {activeTab === 'flood-sim' && (
          <FloodSimulatorView
            onInspectInExplorer={(city) => {
              const targetReg: GeographicRegion = {
                id: city.id,
                name: city.name,
                country: city.province ? `${city.province}, ${city.country}` : city.country,
                admin_level: 'special_zone',
                latitude: city.latitude,
                longitude: city.longitude,
                bounding_box: [city.latitude - 0.25, city.longitude - 0.25, city.latitude + 0.25, city.longitude + 0.25],
                notes: city.keyFeature,
                is_flagship: city.isFlagshipCity,
              };
              setSelectedRegion(targetReg);
              executeAnalysis(targetReg, selectedVariable, startYear, endYear);
              setActiveTab('explorer');
            }}
          />
        )}

        {activeTab === 'coord-inspector' && (
          <CoordinateInspectorView
            onInspectInExplorer={(city) => {
              const targetReg: GeographicRegion = {
                id: city.id,
                name: city.name,
                country: city.province ? `${city.province}, ${city.country}` : city.country,
                admin_level: 'special_zone',
                latitude: city.latitude,
                longitude: city.longitude,
                bounding_box: [city.latitude - 0.25, city.longitude - 0.25, city.latitude + 0.25, city.longitude + 0.25],
                notes: city.keyFeature,
                is_flagship: city.isFlagshipCity,
              };
              setSelectedRegion(targetReg);
              executeAnalysis(targetReg, selectedVariable, startYear, endYear);
              setActiveTab('explorer');
            }}
          />
        )}

        {activeTab === 'vegetation' && (
          <VegetationMonitorView />
        )}

        {activeTab === 'trends' && (
          <TrendAnalysisView
            analysis={analysis}
            isLoading={isLoading}
            onNavigateToAI={() => setActiveTab('ai-scientist')}
            onNavigateToExplorer={() => setActiveTab('explorer')}
            selectedVariable={selectedVariable}
            onSelectVariable={(v) => {
              setSelectedVariable(v);
              executeAnalysis(selectedRegion, v, startYear, endYear);
            }}
            regions={regions}
            selectedRegion={selectedRegion}
            onSelectRegion={(reg) => {
              setSelectedRegion(reg);
              executeAnalysis(reg, selectedVariable, startYear, endYear);
            }}
          />
        )}

        {activeTab === 'comparison' && (
          <RegionalComparisonView
            regions={regions}
            defaultPrimaryRegion={selectedRegion}
            selectedVariable={selectedVariable}
          />
        )}

        {activeTab === 'ai-scientist' && (
          <AIEarthScientistView analysis={analysis} />
        )}
      </main>

      {/* Live Satellite Telemetry Status Ticker */}
      <TelemetryTicker />

      {/* Footer */}
      <Footer
        onSelectTab={setActiveTab}
        isDark={isDark}
        onToggleTheme={() => setIsDark(!isDark)}
        onOpenReport={() => setIsReportOpen(true)}
      />

      {/* Scientific Report Export Modal */}
      <ReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        analysis={analysis}
      />

      {/* Instant Command Palette (Cmd+K / Ctrl+K) */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onSelectTab={setActiveTab}
        onSelectCity={(city) => {
          const targetReg: GeographicRegion = {
            id: city.id,
            name: city.name,
            country: city.province ? `${city.province}, ${city.country}` : city.country,
            admin_level: 'special_zone',
            latitude: city.latitude,
            longitude: city.longitude,
            bounding_box: [city.latitude - 0.25, city.longitude - 0.25, city.latitude + 0.25, city.longitude + 0.25],
            notes: city.keyFeature,
            is_flagship: city.isFlagshipCity,
          };
          setSelectedRegion(targetReg);
          executeAnalysis(targetReg, selectedVariable, startYear, endYear);
          setActiveTab('explorer');
        }}
        onSelectVariable={(v) => {
          setSelectedVariable(v);
          executeAnalysis(selectedRegion, v, startYear, endYear);
          setActiveTab('explorer');
        }}
      />
      <OfflineIndicator />
    </div>
  );
}

export default App;
