/**
 * EarthSignal — Dataset Explorer & Documentation View
 * Full catalog of NASA Earth Science Missions, Parameters, and Processing Levels.
 */

import React from 'react';
import { Database, ExternalLink, ShieldCheck, AlertCircle, FileText } from 'lucide-react';
import { DATASET_CATALOG, ENVIRONMENTAL_VARIABLES } from '../../services/nasa/nasaRegistry';

export const DatasetExplorerView: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs">
        <div className="flex items-center gap-2 text-xs font-mono text-cyan-600 dark:text-cyan-400 mb-1">
          <Database className="w-4 h-4" />
          <span>NASA DATA REGISTRY & PROVENANCE</span>
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          NASA Earth Observation Dataset Catalog
        </h1>
        <p className="text-sm text-slate-500 dark:text-slate-400 mt-1 max-w-2xl">
          EarthSignal strictly utilizes official, documented NASA datasets. Transparent metadata, processing levels, and scientific caveats ensure empirical reproducibility.
        </p>
      </div>

      {/* Dataset Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {DATASET_CATALOG.map((ds) => (
          <div
            key={ds.dataset_id}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <span className="text-[10px] font-mono uppercase font-bold text-cyan-600 dark:text-cyan-400">
                  {ds.provider}
                </span>
                <span className="text-xs text-slate-500 dark:text-slate-400 font-mono">
                  {ds.processing_level}
                </span>
              </div>

              <h3 className="text-base font-bold text-slate-900 dark:text-white mt-3">
                {ds.dataset_name}
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-2 leading-relaxed">
                {ds.variable_description}
              </p>

              {/* Attributes Grid */}
              <div className="grid grid-cols-2 gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 text-xs">
                <div>
                  <span className="text-slate-400 text-[11px] block">Spatial Resolution:</span>
                  <span className="font-mono text-slate-800 dark:text-slate-200">{ds.spatial_resolution}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px] block">Temporal Resolution:</span>
                  <span className="font-mono text-slate-800 dark:text-slate-200">{ds.temporal_resolution}</span>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px] block">Temporal Coverage:</span>
                  <span className="font-mono text-slate-800 dark:text-slate-200">
                    {ds.temporal_coverage.start} to {ds.temporal_coverage.end}
                  </span>
                </div>
                <div>
                  <span className="text-slate-400 text-[11px] block">Authentication:</span>
                  <span className="font-medium text-emerald-600 dark:text-emerald-400">
                    {ds.authentication_requirement}
                  </span>
                </div>
              </div>

              {/* Limitations */}
              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                <span className="text-[11px] font-semibold text-slate-700 dark:text-slate-300 uppercase tracking-wider block mb-1">
                  Scientific Caveats & Limitations:
                </span>
                <ul className="list-disc list-inside space-y-1 text-slate-500 dark:text-slate-400 text-xs">
                  {ds.known_limitations.map((lim, i) => (
                    <li key={i}>{lim}</li>
                  ))}
                </ul>
              </div>
            </div>

            {/* External Link */}
            <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
              <a
                href={ds.source_url}
                target="_blank"
                rel="noreferrer noopener"
                className="flex items-center gap-1.5 text-xs font-semibold text-cyan-600 dark:text-cyan-400 hover:underline"
              >
                <span>Official Documentation</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* Environmental Parameters Table */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl p-6 shadow-xs">
        <h3 className="text-base font-bold text-slate-900 dark:text-white mb-4">
          Supported Environmental Variables Catalog
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-500 dark:text-slate-400 uppercase font-mono text-[11px]">
                <th className="py-2.5 px-3">Variable ID</th>
                <th className="py-2.5 px-3">Parameter Name</th>
                <th className="py-2.5 px-3">Category</th>
                <th className="py-2.5 px-3">Physical Unit</th>
                <th className="py-2.5 px-3">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {Object.values(ENVIRONMENTAL_VARIABLES).map((v) => (
                <tr key={v.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                  <td className="py-2.5 px-3 font-mono font-bold text-cyan-600 dark:text-cyan-400">
                    {v.id}
                  </td>
                  <td className="py-2.5 px-3 font-semibold text-slate-900 dark:text-white">
                    {v.name}
                  </td>
                  <td className="py-2.5 px-3 text-slate-600 dark:text-slate-300">
                    {v.category}
                  </td>
                  <td className="py-2.5 px-3 font-mono text-slate-700 dark:text-slate-300">
                    {v.unit}
                  </td>
                  <td className="py-2.5 px-3 text-slate-500 dark:text-slate-400 max-w-md">
                    {v.description}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
