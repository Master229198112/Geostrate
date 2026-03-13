import React, { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronRight } from 'lucide-react';
import type { StrategicQA } from '../types';

interface Props {
  questions: StrategicQA[];
}

export default function StrategicQACard({ questions }: Props) {
  const [expanded, setExpanded] = useState<number | null>(null);

  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-sm p-5 shadow-sm col-span-1 md:col-span-2">
      <h2 className="text-xs font-semibold text-slate-800 dark:text-slate-100 uppercase tracking-widest mb-4 flex items-center gap-2">
        <HelpCircle className="w-4 h-4 text-slate-500 dark:text-slate-400 dark:text-slate-500" />
        Strategic Q&A Intelligence
      </h2>
      <div className="space-y-2 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
        {questions.map((qa, i) => (
          <div key={i} className="bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-700 rounded-sm overflow-hidden">
            <button
              onClick={() => setExpanded(expanded === i ? null : i)}
              className="w-full flex items-center justify-between p-3 text-left hover:bg-slate-100 transition-colors"
            >
              <span className="text-xs text-slate-700 dark:text-slate-300 font-medium flex-1 pr-2">{qa.question}</span>
              <div className="flex items-center gap-2">
                <span className="text-[9px] font-mono text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-sm border border-blue-200">
                  {(qa.confidenceLevel * 100).toFixed(0)}%
                </span>
                {expanded === i ? <ChevronDown className="w-3 h-3 text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500" /> : <ChevronRight className="w-3 h-3 text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500" />}
              </div>
            </button>
            {expanded === i && (
              <div className="px-3 pb-3 space-y-2 border-t border-slate-200 dark:border-slate-700 pt-2">
                <p className="text-[10px] text-slate-600 dark:text-slate-300 leading-relaxed">{qa.analyticalAnswer}</p>
                <div className="text-[9px] text-amber-600 bg-amber-50 border border-amber-200 px-2 py-1 rounded-sm">
                  <strong className="uppercase tracking-widest">Implication:</strong> {qa.strategicImplication}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
