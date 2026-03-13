import React from 'react';
import { Map } from 'lucide-react';
import type { Region } from '../types';

interface Props {
  regions: Region[];
}

export default function GeographicImpactCard({ regions }: Props) {
  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-sm p-5 shadow-sm">
      <h2 className="text-xs font-semibold text-slate-800 dark:text-slate-100 uppercase tracking-widest mb-4 flex items-center gap-2">
        <Map className="w-4 h-4 text-slate-500 dark:text-slate-400 dark:text-slate-500" />
        Geographic Impact Assessment
      </h2>
      <div className="space-y-3">
        {regions.map((region, i) => (
          <div key={i} className="bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-700 rounded-sm p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300">{region.name}</span>
              <span className={`text-[9px] px-1.5 py-0.5 rounded-sm border font-mono ${
                region.economicShockIndex > 0.7 ? 'bg-rose-50 text-rose-600 border-rose-200' :
                region.economicShockIndex > 0.4 ? 'bg-amber-50 text-amber-600 border-amber-200' :
                'bg-emerald-50 text-emerald-600 border-emerald-200'
              }`}>
                Shock {(region.economicShockIndex * 100).toFixed(0)}%
              </span>
            </div>
            <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-500 dark:text-slate-400 dark:text-slate-500">
              <div><span className="text-slate-400 dark:text-slate-500 uppercase text-[9px] tracking-widest">Trade Dep:</span> {(region.tradeDependency * 100).toFixed(0)}%</div>
              <div><span className="text-slate-400 dark:text-slate-500 uppercase text-[9px] tracking-widest">Impact:</span> {region.strategicImpact}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
