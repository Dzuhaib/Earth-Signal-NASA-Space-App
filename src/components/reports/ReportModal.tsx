/**
 * EarthSignal — Scientific Report & Export Modal
 * Generates downloadable CSV time series and printable executive summary.
 */

import React from 'react';
import { X, Download, Printer, FileText, CheckCircle2, ShieldCheck } from 'lucide-react';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs">
      <div className="relative w-full max-w-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl max-h-[90vh] flex flex-col overflow-hidden">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-cyan-500" />
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Scientific Trend Detection Report
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body / Printable Container */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6 print:p-0">
          {analysis ? (
            <div className="space-y-6">
              {/* Report Header Metadata */}
              <div className="pb-4 border-b border-slate-100 dark:border-slate-800">
                <span className="text-[10px] font-mono uppercase text-slate-400 block font-bold">
                  NASA SPACE APPS CHALLENGE 2026 · TECHNICAL ASSESSMENT
                </span>
                <h1 className="text-xl font-bold text-slate-900 dark:text-white mt-1">
                  Environmental Trend Assessment: {analysis.location.name}
                </h1>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                  Report ID: ES-REP-{Date.now().toString().slice(-6)} · Generated: {new Date().toISOString()}
                </p>
              </div>

              {/* Core Findings Table */}
              <div className="bg-slate-50 dark:bg-slate-800/40 rounded-xl p-4 border border-slate-200 dark:border-slate-800 text-xs space-y-2">
                <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-700/60">
                  <span className="text-slate-500 dark:text-slate-400">Target Region:</span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {analysis.location.name}, {analysis.location.country} ({analysis.location.latitude}°N, {analysis.location.longitude}°E)
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-700/60">
                  <span className="text-slate-500 dark:text-slate-400">Environmental Variable:</span>
                  <span className="font-semibold text-slate-900 dark:text-white">
                    {analysis.variable_name} ({analysis.unit})
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-700/60">
                  <span className="text-slate-500 dark:text-slate-400">Analysis Period:</span>
                  <span className="font-mono text-slate-900 dark:text-white">
                    {analysis.period.start} to {analysis.period.end} ({analysis.period.total_months} months)
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-700/60">
                  <span className="text-slate-500 dark:text-slate-400">Trend Direction:</span>
                  <span className="font-semibold text-slate-900 dark:text-white capitalize">
                    {analysis.trend_direction} ({analysis.trend_classification})
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-700/60">
                  <span className="text-slate-500 dark:text-slate-400">Sen’s Median Slope:</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">
                    {analysis.slope_per_decade > 0 ? `+${analysis.slope_per_decade}` : analysis.slope_per_decade} {analysis.slope_unit}
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-700/60">
                  <span className="text-slate-500 dark:text-slate-400">95% Confidence Interval:</span>
                  <span className="font-mono text-slate-900 dark:text-white">
                    [{analysis.confidence_interval.lower}, {analysis.confidence_interval.upper}]
                  </span>
                </div>
                <div className="flex justify-between py-1 border-b border-slate-200 dark:border-slate-700/60">
                  <span className="text-slate-500 dark:text-slate-400">Mann-Kendall p-value:</span>
                  <span className="font-mono text-slate-900 dark:text-white">
                    {analysis.p_value.toFixed(5)} (Z = {analysis.mann_kendall.z_statistic.toFixed(2)})
                  </span>
                </div>
                <div className="flex justify-between py-1">
                  <span className="text-slate-500 dark:text-slate-400">Statistical Significance (α = 0.05):</span>
                  <span
                    className={`font-bold ${
                      analysis.is_significant
                        ? 'text-emerald-600 dark:text-emerald-400'
                        : 'text-amber-600 dark:text-amber-400'
                    }`}
                  >
                    {analysis.is_significant ? 'SIGNIFICANT' : 'NOT STATISTICALLY SIGNIFICANT'}
                  </span>
                </div>
              </div>

              {/* Provenance */}
              <div className="text-xs text-slate-600 dark:text-slate-300 space-y-1">
                <span className="font-bold text-slate-800 dark:text-slate-200 block mb-1">
                  Attribution & Reproducibility:
                </span>
                <p>Provider: {analysis.provenance.data_provider}</p>
                <p>Citation: {analysis.provenance.citation}</p>
                <p className="font-mono text-[10px] text-slate-400">
                  Endpoint: {analysis.provenance.endpoint_queried}
                </p>
              </div>
            </div>
          ) : (
            <p className="text-xs text-slate-500 text-center py-8">
              No active analysis available to export. Run a trend evaluation first.
            </p>
          )}
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-50 dark:bg-slate-950/60 border-t border-slate-200 dark:border-slate-800">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            Export formats: CSV dataset or printable PDF summary
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              disabled={!analysis}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print / Save PDF</span>
            </button>
            <button
              onClick={handleDownloadCsv}
              disabled={!analysis}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white transition-colors shadow-sm"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download CSV</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
