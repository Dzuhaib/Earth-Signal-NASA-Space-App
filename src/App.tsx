/**
 * EarthSignal — Main Application Root
 * NASA Space Apps Challenge 2026: Be An Earth System Trend Detective!
 */

import React, { useState, useEffect } from 'react';
import { TopBar, NavTab } from './components/layout/TopBar';
import { Footer } from './components/layout/Footer';
import { OverviewView } from './components/dashboard/OverviewView';
import { EarthExplorerView } from './components/explorer/EarthExplorerView';
import { CropAdvisoryView } from './components/agro/CropAdvisoryView';
import { TrendAnalysisView } from './components/dashboard/TrendAnalysisView';
import { RegionalComparisonView } from './components/comparison/RegionalComparisonView';
import { AIEarthScientistView } from './components/ai/AIEarthScientistView';
import { ReportModal } from './components/reports/ReportModal';
import {
  GeographicRegion,
  EnvironmentalVariableId,
  StatisticalAnalysisResponse,
} from './types/earthsignal';
import { GEOGRAPHIC_REGIONS } from './services/nasa/nasaRegistry';

export function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('overview');
  const [isDark, setIsDark] = useState<boolean>(true);
  const [isReportOpen, setIsReportOpen] = useState<boolean>(false);

  // Core application state
  const [regions, setRegions] = useState<GeographicRegion[]>(GEOGRAPHIC_REGIONS);
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

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 dark:bg-[#07090E] text-slate-900 dark:text-slate-100 transition-colors">
      {/* 3-Zone Top Bar Navigation */}
      <TopBar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenReport={() => setIsReportOpen(true)}
        isDark={isDark}
        onToggleTheme={() => setIsDark(!isDark)}
      />

      {/* Error notification banner if any */}
      {errorMessage && (
        <div className="bg-rose-500/10 border-b border-rose-500/20 text-rose-700 dark:text-rose-400 px-4 py-2.5 text-xs font-mono text-center">
          ⚠ System Notification: {errorMessage}
        </div>
      )}

      {/* Main Workspace Stage */}
      <main className="flex-1">
        {activeTab === 'overview' && (
          <OverviewView
            onNavigate={setActiveTab}
            onLaunchFlagship={handleLaunchFlagship}
            analysis={analysis}
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

        {activeTab === 'trends' && (
          <TrendAnalysisView
            analysis={analysis}
            isLoading={isLoading}
            onNavigateToAI={() => setActiveTab('ai-scientist')}
            onNavigateToExplorer={() => setActiveTab('explorer')}
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

      {/* Footer */}
      <Footer onSelectTab={setActiveTab} />

      {/* Scientific Report Export Modal */}
      <ReportModal
        isOpen={isReportOpen}
        onClose={() => setIsReportOpen(false)}
        analysis={analysis}
      />
    </div>
  );
}

export default App;
