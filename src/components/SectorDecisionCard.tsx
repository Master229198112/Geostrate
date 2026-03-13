import React from 'react';
import { BarChart2 } from 'lucide-react';
import type { Sector } from '../types';

interface Props {
  sectors: Sector[];
}

export default function SectorDecisionCard({ sectors }: Props) {
  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-sm p-5 shadow-sm">
      <h2 className="text-xs font-semibold text-slate-800 dark:text-slate-100 uppercase tracking-widest mb-4 flex items-center gap-2">
        <BarChart2 className="w-4 h-4 text-slate-500 dark:text-slate-400 dark:text-slate-500" />
        Sector Vulnerability Matrix
      </h2>
      <div className="space-y-3">
        {sectors.slice(0, 8).map((sector, i) => (
          <div key={i} className="bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-700 rounded-sm p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">{sector.name}</span>
              <div className="flex items-center gap-2">
                <span className={`text-[9px] px-1.5 py-0.5 rounded-sm border font-bold uppercase tracking-widest ${
                  sector.shockVulnerability > 0.7 ? 'bg-rose-50 text-rose-600 border-rose-200' :
                  sector.shockVulnerability > 0.4 ? 'bg-amber-50 text-amber-600 border-amber-200' :
                  'bg-emerald-50 text-emerald-600 border-emerald-200'
                }`}>
                  Risk {(sector.shockVulnerability * 100).toFixed(0)}%
                </span>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 text-[9px]">
              <div>
                <span className="text-slate-400 dark:text-slate-500 uppercase tracking-widest">Opportunity</span>
                <div className="h-1 mt-1 bg-slate-200 dark:bg-slate-600 rounded-none overflow-hidden">
                  <div className="h-full bg-emerald-500" style={{ width: `${sector.opportunityScore * 100}%` }} />
                </div>
              </div>
              <div>
                <span className="text-slate-400 dark:text-slate-500 uppercase tracking-widest">Resilience</span>
                <div className="h-1 mt-1 bg-slate-200 dark:bg-slate-600 rounded-none overflow-hidden">
                  <div className="h-full bg-blue-500" style={{ width: `${sector.resilienceScore * 100}%` }} />
                </div>
              </div>
              <div>
                <span className="text-slate-400 dark:text-slate-500 uppercase tracking-widest">Vulnerability</span>
                <div className="h-1 mt-1 bg-slate-200 dark:bg-slate-600 rounded-none overflow-hidden">
                  <div className="h-full bg-rose-500" style={{ width: `${sector.shockVulnerability * 100}%` }} />
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
