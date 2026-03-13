import React from 'react';
import { Info } from 'lucide-react';
import type { VariableExplanation } from '../types';

interface Props {
  variables: VariableExplanation[];
}

export default function VariableExplanationsCard({ variables }: Props) {
  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-sm p-5 shadow-sm col-span-1 md:col-span-2">
      <h2 className="text-xs font-semibold text-slate-800 dark:text-slate-100 uppercase tracking-widest mb-4 flex items-center gap-2">
        <Info className="w-4 h-4 text-slate-500 dark:text-slate-400 dark:text-slate-500" />
        Variable Mapping Explanations
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-64 overflow-y-auto pr-2 custom-scrollbar">
        {variables.map((ve, i) => (
          <div key={i} className="bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-700 rounded-sm p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-mono font-bold text-blue-600">{ve.variable}</span>
              <span className="text-[10px] font-mono text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-600 px-1.5 py-0.5 rounded-sm border border-slate-200 dark:border-slate-600">{Number(ve.value || 0).toFixed(2)}</span>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 dark:text-slate-500 leading-relaxed">{ve.explanation}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
