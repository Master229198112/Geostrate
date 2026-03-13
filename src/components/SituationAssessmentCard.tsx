import React from 'react';
import { Globe } from 'lucide-react';
import type { SituationAssessment as SituationData } from '../types';

interface Props {
  data: SituationData;
}

export default function SituationAssessmentCard({ data }: Props) {
  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-sm p-5 shadow-sm">
      <h2 className="text-xs font-semibold text-slate-800 dark:text-slate-100 uppercase tracking-widest mb-4 flex items-center gap-2">
        <Globe className="w-4 h-4 text-slate-500 dark:text-slate-400 dark:text-slate-500" />
        Situation Assessment
      </h2>

      {/* Power Balance */}
      {data.powerBalance && data.powerBalance.length > 0 && (
        <div className="mb-4">
          <h3 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Power Balance</h3>
          <div className="space-y-2">
            {data.powerBalance.map((actor, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-xs text-slate-600 dark:text-slate-300 w-28 truncate">{actor.actor}</span>
                <div className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-600 rounded-none overflow-hidden">
                  <div className="h-full bg-blue-500" style={{ width: `${actor.powerScore * 100}%` }} />
                </div>
                <span className="text-[10px] font-mono text-slate-500 dark:text-slate-400 dark:text-slate-500 w-10 text-right">{(actor.powerScore * 100).toFixed(0)}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Strategic Alignment */}
      {data.strategicAlignment && data.strategicAlignment.length > 0 && (
        <div>
          <h3 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Strategic Alignment</h3>
          <div className="flex flex-wrap gap-2">
            {data.strategicAlignment.map((sa, i) => (
              <span key={i} className={`text-[10px] px-2 py-1 rounded-sm border uppercase tracking-wider font-bold ${
                sa.alignment === 'Aligned' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' :
                sa.alignment === 'Opposed' ? 'bg-rose-50 text-rose-600 border-rose-200' :
                'bg-slate-100 text-slate-500 dark:text-slate-400 dark:text-slate-500 border-slate-200 dark:border-slate-600'
              }`}>
                {sa.actor}: {sa.alignment}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
