import React from 'react';
import { AlertTriangle } from 'lucide-react';
import type { ExecutiveSummary as ExecSummaryData } from '../types';

interface Props {
  data: ExecSummaryData;
}

export default function ExecutiveSummaryCard({ data }: Props) {
  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-sm p-5 shadow-sm">
      <h2 className="text-xs font-semibold text-slate-800 dark:text-slate-100 uppercase tracking-widest mb-4 flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 text-amber-500" />
        Executive Summary
      </h2>
      
      <div className="mb-6">
        <div className="flex justify-between items-end mb-2">
          <span className="text-xs text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-wider">Geostrate Risk Indicator</span>
          <span className="text-lg font-mono text-amber-600">{(data.globalRiskIndicator * 100).toFixed(1)}%</span>
        </div>
        <div className="h-1.5 w-full bg-slate-200 dark:bg-slate-600 rounded-none overflow-hidden">
          <div className="h-full bg-gradient-to-r from-emerald-500 via-amber-500 to-rose-500" style={{ width: `${data.globalRiskIndicator * 100}%` }} />
        </div>
      </div>

      <div className="space-y-4">
        <div>
          <h3 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Top Strategic Insights</h3>
          <ul className="space-y-2">
            {data.top10Insights?.slice(0, 3).map((insight: string, i: number) => (
              <li key={i} className="text-xs text-slate-600 dark:text-slate-300 flex gap-2 items-start">
                <span className="text-blue-600 font-mono mt-0.5">[{i+1}]</span>
                <span className="leading-relaxed">{insight}</span>
              </li>
            ))}
          </ul>
        </div>
        
        <div>
          <h3 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Key Decision Triggers</h3>
          <div className="flex flex-wrap gap-2">
            {data.keyDecisionTriggers?.map((trigger: string, i: number) => (
              <span key={i} className="text-[10px] bg-slate-100 dark:bg-slate-600 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 px-2 py-1 rounded-sm uppercase tracking-wider">
                {trigger}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
