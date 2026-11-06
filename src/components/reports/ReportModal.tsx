/**
 * EarthSignal — Technical Assessment Dossier & Data Export Modal
 * Generates downloadable CSV time series and printable executive summary.
 */

import React from 'react';
import { X, Download, Printer, FileText } from 'lucide-react';
import { StatisticalAnalysisResponse } from '../../types/earthsignal';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  analysis: StatisticalAnalysisResponse | null;
}

export const ReportModal: React.FC<ReportModalProps> = ({ isOpen, onClose, analysis }) => {
  if (!isOpen) return null;

  const handleDownloadCsv = () => {
    if (!analysis) return;
    const observations = analysis.observations || [];
    let csv = 'Timestamp,Date,Year,Month,Value,Unit\n';
    for (const obs of observations) {
      csv += `${obs.timestamp},${obs.date},${obs.year},${obs.month || ''},${obs.value},"${obs.unit}"\n`;
    }
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `EarthSignal_${analysis.location.id}_${analysis.variable}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div className="relative w-full max-w-3xl bg-white dark:bg-[#0D111A] border border-slate-200 dark:border-[#1E2638] rounded-sm shadow-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-[#1E2638]">
          <div className="flex items-center gap-2">
            <FileText className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
            <h2 className="font-display text-base font-bold text-slate-950 dark:text-white">
              Technical Assessment Dossier &amp; Data Export
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-xs text-slate-400 hover:text-slate-950 dark:hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body / Printable Container */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 print:p-0">
          {analysis ? (
            <div className="space-y-6">
              {/* Report Header Metadata */}
              <div className="pb-4 border-b border-slate-200 dark:border-[#1E2638]">
                <span className="text-[10px] font-mono uppercase text-cyan-600 dark:text-cyan-400 block font-bold">
                  EARTHSIGNAL · STATISTICAL &amp; TELEMETRY ASSESSMENT
                </span>
                <h1 className="font-display text-xl font-bold text-slate-950 dark:text-white mt-1">
                  Environmental Trend Assessment: {analysis.location.name}
                </h1>
                <p className="text-xs text-slate-500 font-mono mt-0.5 tabular-nums">
                  Dossier ID: ES-REP-{Date.now().toString().slice(-6)} · Generated:{' '}
                  {new Date().toISOString()}
                </p>
              </div>

              {/* Core Findings Table */}
              <div className="bg-slate-50 dark:bg-[#111622] rounded-xs p-5 border border-slate-200 dark:border-[#1E2638] text-xs divide-y divide-slate-200 dark:divide-[#1E2638]">
                <div className="flex justify-between py-2">
                  <span className="text-slate-500">Target Region:</span>
                  <span className="font-semibold text-slate-950 dark:text-white font-mono">
                    {analysis.location.name}, {analysis.location.country} (
                    {analysis.location.latitude.toFixed(2)}°N,{' '}
                    {analysis.location.longitude.toFixed(2)}°E)
                  </span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-slate-500">Telemetry Channel:</span>
                  <span className="font-semibold text-slate-950 dark:text-white">
                    {analysis.variable_name} ({analysis.unit})
                  </span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-slate-500">Observation Span:</span>
                  <span className="font-mono tabular-nums text-slate-950 dark:text-white">
                    {analysis.period.start} to {analysis.period.end} ({analysis.period.total_months}{' '}
                    months)
                  </span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-slate-500">Trend Direction:</span>
                  <span className="font-semibold text-slate-950 dark:text-white capitalize">
                    {analysis.trend_direction} ({analysis.trend_classification})
                  </span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-slate-500">Theil-Sen Median Slope:</span>
                  <span className="font-mono font-bold tabular-nums text-slate-950 dark:text-white">
                    {analysis.slope_per_decade > 0
                      ? `+${analysis.slope_per_decade}`
                      : analysis.slope_per_decade}{' '}
                    {analysis.slope_unit}
                  </span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-slate-500">95% Confidence Bounds:</span>
                  <span className="font-mono tabular-nums text-slate-950 dark:text-white">
                    [{analysis.confidence_interval.lower}, {analysis.confidence_interval.upper}]
                  </span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-slate-500">Mann-Kendall p-value:</span>
                  <span className="font-mono tabular-nums text-slate-950 dark:text-white">
                    {analysis.p_value.toFixed(5)} (Z = {analysis.mann_kendall.z_statistic.toFixed(2)}
                    )
                  </span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-slate-500">Statistical Significance (α = 0.05):</span>
                  <span
                    className={`font-bold font-mono ${
                      analysis.is_significant
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-amber-600 dark:text-amber-400'
                    }`}
                  >
                    {analysis.is_significant
                      ? '● CONFIRMED SIGNIFICANT'
                      : '▲ NOT STATISTICALLY SIGNIFICANT'}
                  </span>
                </div>
              </div>

              {/* Provenance */}
              <div className="text-xs text-slate-600 dark:text-slate-400 space-y-1">
                <span className="font-bold text-slate-950 dark:text-white block mb-1">
                  Data Attribution &amp; Reproducibility:
                </span>
                <p>Provider: {analysis.provenance.data_provider}</p>
                <p>Citation: {analysis.provenance.citation}</p>
                <p className="font-mono text-[10px] text-slate-500">
                  Endpoint: {analysis.provenance.endpoint_queried}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-500 text-center py-8">
              No active analysis available to export. Select a region to run a trend evaluation.
            </p>
          )}
        </div>

        {/* Modal Actions */}
        <div className="flex flex-wrap items-center justify-between gap-4 px-6 py-4 bg-slate-50 dark:bg-[#07090E] border-t border-slate-200 dark:border-[#1E2638]">
          <div className="text-xs text-slate-500 font-mono">
            Formats: Raw CSV Series or Printable PDF Dossier
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={handlePrint}
              disabled={!analysis}
              className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xs border border-slate-300 dark:border-[#1E2638] text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-[#111622] transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
            </button>
            <button
              type="button"
              onClick={handleDownloadCsv}
              disabled={!analysis}
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xs bg-slate-950 text-white hover:bg-slate-800 dark:bg-cyan-500 dark:text-slate-950 dark:hover:bg-cyan-400 transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download CSV Dataset</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
