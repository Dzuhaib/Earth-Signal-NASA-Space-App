/**
 * EarthSignal — AI Earth Scientist View
 * Grounded conversational assistant explaining empirical findings using NASA data.
 */

import React, { useState } from 'react';
import {
  Sparkles,
  Send,
  HelpCircle,
  Database,
  CheckCircle2,
  AlertTriangle,
  MapPin,
  Calendar,
  Layers,
} from 'lucide-react';
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
        ? `Hello, I am the EarthSignal AI Earth Scientist. I am currently grounded on your active analysis of ${analysis.variable_name} for ${analysis.location.name} (${analysis.period.start} to ${analysis.period.end}). The empirical Sen's slope is ${analysis.slope_per_decade > 0 ? '+' : ''}${analysis.slope_per_decade} ${analysis.slope_unit} with a Mann-Kendall p-value of ${analysis.p_value.toFixed(5)} (${analysis.is_significant ? 'Statistically Significant' : 'Not Significant'}). Ask me any question about the scientific implications, statistical significance, or dataset limitations.`
        : 'Hello, I am the EarthSignal AI Earth Scientist. Please select an environmental parameter and region in the Earth Explorer to provide empirical context for our discussion, or ask any general question about NASA Earth observation methodologies.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const sampleQuestions = [
    'Is Sindh becoming hotter according to NASA data?',
    'What does the Mann-Kendall p-value signify in this analysis?',
    'How does Sen’s slope differ from standard linear regression?',
    'What are the limitations and sensor uncertainties of this dataset?',
    'Can this observed trend be directly attributed to climate change?',
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
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          content: 'An error occurred while contacting the AI Earth Scientist service. Please verify server connectivity.',
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      {/* Header & Active Grounding Ribbon */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-cyan-600 dark:text-cyan-400 mb-1">
              <Sparkles className="w-4 h-4" />
              <span>EMPIRICALLY GROUNDED INTELLIGENCE</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              AI Earth Scientist
            </h1>
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
              Ask deep questions about detected trends. The AI is strictly constrained to empirical statistical calculations (Mann-Kendall, Sen’s slope) and documented NASA datasets.
            </p>
          </div>

          {analysis && (
            <div className="bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 rounded-xl p-3 text-xs font-mono">
              <div className="text-[10px] uppercase text-slate-400 mb-1 font-bold">
                GROUNDING CONTEXT
              </div>
              <div className="text-slate-900 dark:text-white font-semibold">
                {analysis.location.name} · {analysis.variable}
              </div>
              <div className="text-slate-500 dark:text-slate-400 text-[11px] mt-0.5">
                Slope: {analysis.slope_per_decade > 0 ? '+' : ''}{analysis.slope_per_decade} {analysis.slope_unit} (p = {analysis.p_value.toFixed(4)})
              </div>
            </div>
          )}
        </div>

        {/* Suggested Queries */}
        <div className="mt-5 pt-4 border-t border-slate-100 dark:border-slate-800">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-2">
            Suggested Investigative Queries:
          </span>
          <div className="flex flex-wrap gap-2">
            {sampleQuestions.map((q, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(q)}
                className="text-left text-xs px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/40 text-slate-700 dark:text-slate-300 hover:border-cyan-500 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors"
              >
                {q}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Conversation Thread */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs flex flex-col min-h-[480px]">
        <div className="flex-1 space-y-4 overflow-y-auto mb-4 pr-1">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex flex-col ${
                msg.role === 'user' ? 'items-end' : 'items-start'
              }`}
            >
              <div
                className={`max-w-2xl rounded-xl p-4 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-cyan-600 text-white rounded-br-none'
                    : 'bg-slate-50 dark:bg-slate-800/80 text-slate-800 dark:text-slate-200 border border-slate-200 dark:border-slate-700/60 rounded-bl-none'
                }`}
              >
                {/* Message Header */}
                <div className="flex items-center justify-between gap-4 mb-2 pb-1 border-b border-black/10 dark:border-white/10 text-[11px]">
                  <span className="font-semibold uppercase tracking-wider">
                    {msg.role === 'user' ? 'Environmental Investigator' : 'AI Earth Scientist'}
                  </span>
                  <span className="opacity-75 font-mono">{msg.timestamp}</span>
                </div>

                <div className="whitespace-pre-line">{msg.content}</div>

                {/* Grounded Facts Ribbon */}
                {msg.groundedFacts && (
                  <div className="mt-3 pt-3 border-t border-slate-200 dark:border-slate-700 text-xs font-mono space-y-1 text-slate-600 dark:text-slate-300">
                    <div className="text-[10px] uppercase font-bold text-cyan-600 dark:text-cyan-400">
                      EMPIRICALLY VERIFIED GROUNDING:
                    </div>
                    <div>
                      • Sen’s Slope: {msg.groundedFacts.slope_per_decade}
                    </div>
                    <div>
                      • Mann-Kendall p-value: {msg.groundedFacts.p_value} ({msg.groundedFacts.is_significant ? 'Significant' : 'Not Significant'})
                    </div>
                    <div>• Dataset Cited: {msg.groundedFacts.dataset_cited}</div>
                  </div>
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center gap-2 text-xs text-slate-400 font-mono italic">
              <div className="w-3.5 h-3.5 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
              <span>AI Earth Scientist evaluating statistical invariants...</span>
            </div>
          )}
        </div>

        {/* Input Bar */}
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center gap-3">
          <input
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Ask a scientific question about trends, significance, or NASA data..."
            className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded-xl px-4 py-2.5 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          />
          <button
            onClick={() => handleSendMessage()}
            disabled={isLoading || !inputQuery.trim()}
            className="px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 disabled:opacity-50 text-white font-semibold text-xs transition-colors flex items-center gap-1.5 shadow-sm whitespace-nowrap"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Send</span>
          </button>
        </div>
      </div>
    </div>
  );
};
