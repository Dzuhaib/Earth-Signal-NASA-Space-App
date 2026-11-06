/**
 * EarthSignal — AI Earth Scientist & Grounded Research Briefing Console
 * Asymmetric 12-Column Split:
 * - Left 4 Columns: Active Empirical Telemetry Context Ledger & Curated Scientific Prompts
 * - Right 8 Columns: Structured Research Briefing Transcript with Verified Telemetry Citations
 */

import React, { useState } from 'react';
import { Sparkles, Send, Compass, ShieldCheck } from 'lucide-react';
import { StatisticalAnalysisResponse, AIAskResponse } from '../../types/earthsignal';

interface AIEarthScientistViewProps {
  analysis: StatisticalAnalysisResponse | null;
}

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  groundedFacts?: AIAskResponse['grounded_facts'];
  confidenceStatement?: string;
  uncertaintyNotes?: string[];
  timestamp: string;
}

export const AIEarthScientistView: React.FC<AIEarthScientistViewProps> = ({ analysis }) => {
  const [inputQuery, setInputQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'assistant',
      content: analysis
        ? `EarthSignal Research Console initialized. I am grounded on your active statistical audit of ${analysis.variable_name} for ${analysis.location.name} (${analysis.period.start} to ${analysis.period.end}). The empirical Theil-Sen median slope is ${analysis.slope_per_decade > 0 ? '+' : ''}${analysis.slope_per_decade} ${analysis.slope_unit} with a Mann-Kendall p-value of ${analysis.p_value.toFixed(5)} (${analysis.is_significant ? 'Statistically Confirmed' : 'Within Natural Variance'}). Ask any question regarding local atmospheric shifts, statistical significance, or crop adaptation.`
        : 'EarthSignal Research Console initialized. Select a region or channel in the 3D Earth Map console to ground our briefing, or ask any question about regional climate trends and crop yield planning.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const sampleQuestions = [
    'Is Sindh becoming hotter according to satellite data?',
    'What does the Mann-Kendall p-value signify in this analysis?',
    'How does Sen’s slope differ from standard linear regression?',
    'How does this warming trend affect wheat and cotton in Sindh?',
    'What are the limitations of this dataset?',
  ];

  const handleSendMessage = async (textToSend?: string) => {
    const query = textToSend || inputQuery;
    if (!query.trim() || isLoading) return;

    const userMsg: ChatMessage = {
      role: 'user',
      content: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    if (!textToSend) setInputQuery('');
    setIsLoading(true);

    try {
      const res = await fetch('/api/v1/ai/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          question: query,
          analysis_context: analysis || undefined,
        }),
      });

      const data: AIAskResponse = await res.json();

      const assistantMsg: ChatMessage = {
        role: 'assistant',
        content: data.answer,
        groundedFacts: data.grounded_facts,
        confidenceStatement: data.confidence_statement,
        uncertaintyNotes: data.uncertainty_notes,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content:
            'An error occurred while communicating with the AI Scientist endpoint. Please verify server connectivity.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-10 py-8 space-y-6">
      {/* Top Editorial Header */}
      <div className="pb-5 border-b border-slate-200 dark:border-[#1E2638]">
        <div className="flex items-center gap-2 text-xs font-mono text-cyan-600 dark:text-cyan-400 mb-1">
          <Sparkles className="w-3.5 h-3.5" />
          <span>EMPIRICALLY GROUNDED SCIENTIFIC BRIEFING CONSOLE</span>
        </div>
        <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight text-slate-950 dark:text-white">
          AI Earth Scientist
        </h1>
        <p className="text-sm text-slate-600 dark:text-slate-400 mt-1 max-w-3xl">
          Every explanation is strictly anchored to verified Mann-Kendall rank statistics, Theil-Sen median slopes, and satellite observation records.
        </p>
      </div>

      {/* Main 12-Column Split Console */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left 4 Columns: Active Grounding Telemetry Context & Curated Queries */}
        <div className="lg:col-span-4 space-y-5">
          {analysis && (
            <div className="bg-white dark:bg-[#0D111A] border border-slate-200 dark:border-[#1E2638] rounded-sm p-5 space-y-4">
              <div className="flex items-center justify-between pb-2.5 border-b border-slate-200 dark:border-[#1E2638]">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-950 dark:text-white flex items-center gap-1.5">
                  <Compass className="w-3.5 h-3.5 text-cyan-600 dark:text-cyan-400" />
                  <span>Grounding Telemetry</span>
                </span>
                <span className="text-[10px] font-mono text-emerald-600 dark:text-emerald-400">
                  ● Verified Context
                </span>
              </div>

              <div className="divide-y divide-slate-100 dark:divide-[#1E2638] text-xs font-mono">
                <div className="py-2 flex justify-between gap-2">
                  <span className="text-slate-500">Target Region:</span>
                  <span className="font-semibold text-slate-950 dark:text-white text-right">
                    {analysis.location.name}
                  </span>
                </div>
                <div className="py-2 flex justify-between gap-2">
                  <span className="text-slate-500">Coordinates:</span>
                  <span className="tabular-nums text-slate-800 dark:text-slate-200">
                    {analysis.location.latitude.toFixed(2)}°N, {analysis.location.longitude.toFixed(2)}°E
                  </span>
                </div>
                <div className="py-2 flex justify-between gap-2">
                  <span className="text-slate-500">Variable:</span>
                  <span className="font-semibold text-cyan-600 dark:text-cyan-400">
                    {analysis.variable} ({analysis.unit})
                  </span>
                </div>
                <div className="py-2 flex justify-between gap-2">
                  <span className="text-slate-500">Theil-Sen Slope:</span>
                  <span className="tabular-nums font-bold text-slate-950 dark:text-white">
                    {analysis.slope_per_decade > 0 ? '+' : ''}
                    {analysis.slope_per_decade} {analysis.slope_unit}
                  </span>
                </div>
                <div className="py-2 flex justify-between gap-2">
                  <span className="text-slate-500">Mann-Kendall p:</span>
                  <span className="tabular-nums text-slate-950 dark:text-white">
                    {analysis.p_value.toFixed(5)} (Z = {analysis.mann_kendall.z_statistic.toFixed(2)})
                  </span>
                </div>
                <div className="py-2 flex justify-between gap-2">
                  <span className="text-slate-500">Sample Size:</span>
                  <span className="tabular-nums text-slate-800 dark:text-slate-200">
                    {analysis.sample_size} Monthly Passes
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Suggested Scientific Queries */}
          <div className="bg-white dark:bg-[#0D111A] border border-slate-200 dark:border-[#1E2638] rounded-sm p-5 space-y-3">
            <div className="text-xs font-bold uppercase tracking-wider text-slate-950 dark:text-white pb-2 border-b border-slate-200 dark:border-[#1E2638]">
              Research Briefing Prompts
            </div>
            <div className="space-y-2">
              {sampleQuestions.map((q, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSendMessage(q)}
                  className="w-full text-left text-xs px-3 py-2.5 rounded-xs border border-slate-200 dark:border-[#1E2638] bg-slate-50 dark:bg-[#111622] text-slate-700 dark:text-slate-300 hover:border-cyan-500 dark:hover:border-cyan-400 hover:text-slate-950 dark:hover:text-white transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right 8 Columns: Research Transcript & Input Bar */}
        <div className="lg:col-span-8 bg-white dark:bg-[#0D111A] border border-slate-200 dark:border-[#1E2638] rounded-sm p-6 flex flex-col min-h-[560px]">
          <div className="flex-1 space-y-5 overflow-y-auto mb-5 pr-1">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex flex-col ${
                  msg.role === 'user' ? 'items-end' : 'items-start'
                }`}
              >
                <div
                  className={`max-w-2xl rounded-sm p-4 sm:p-5 text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-slate-950 text-white dark:bg-cyan-500 dark:text-slate-950 font-medium'
                      : 'bg-slate-50 dark:bg-[#111622] text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-[#1E2638]'
                  }`}
                >
                  {/* Message Header */}
                  <div className="flex items-center justify-between gap-4 mb-2.5 pb-1.5 border-b border-current/10 text-[11px] font-mono">
                    <span className="font-bold uppercase tracking-wider">
                      {msg.role === 'user' ? 'RESEARCH QUERY' : 'AI EARTH SCIENTIST'}
                    </span>
                    <span className="opacity-75 tabular-nums">{msg.timestamp}</span>
                  </div>

                  <div className="whitespace-pre-line">{msg.content}</div>

                  {/* Grounded Facts Ribbon */}
                  {msg.groundedFacts && (
                    <div className="mt-4 pt-3 border-t border-slate-200 dark:border-[#1E2638] text-xs font-mono space-y-1 text-slate-600 dark:text-slate-400">
                      <div className="text-[10px] uppercase font-bold text-cyan-600 dark:text-cyan-400 flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span>VERIFIED TELEMETRY GROUNDING</span>
                      </div>
                      <div>• Theil-Sen Slope: {msg.groundedFacts.slope_per_decade}</div>
                      <div>
                        • Mann-Kendall p-value: {msg.groundedFacts.p_value} (
                        {msg.groundedFacts.is_significant
                          ? 'Confirmed Significant'
                          : 'Not Significant'}
                        )
                      </div>
                      <div>• Archive Source: {msg.groundedFacts.dataset_cited}</div>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex items-center gap-2.5 text-xs text-cyan-600 dark:text-cyan-400 font-mono">
                <div className="w-4 h-4 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
                <span>Evaluating empirical series &amp; confidence intervals...</span>
              </div>
            )}
          </div>

          {/* Input Bar */}
          <div className="pt-4 border-t border-slate-200 dark:border-[#1E2638] flex items-center gap-3">
            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder="Ask a question about climate trends, Mann-Kendall significance, or crop yield planning..."
              className="flex-1 bg-slate-50 dark:bg-[#111622] border border-slate-200 dark:border-[#1E2638] rounded-xs px-4 py-2.5 text-xs text-slate-950 dark:text-white placeholder-slate-400 focus:outline-none focus:border-cyan-500"
            />
            <button
              type="button"
              onClick={() => handleSendMessage()}
              disabled={isLoading || !inputQuery.trim()}
              className="px-4 py-2.5 rounded-xs bg-slate-950 text-white hover:bg-slate-800 dark:bg-cyan-500 dark:text-slate-950 dark:hover:bg-cyan-400 disabled:opacity-50 font-semibold text-xs transition-colors flex items-center gap-1.5 whitespace-nowrap"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Submit Query</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
