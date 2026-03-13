import React from 'react';
import { Layers } from 'lucide-react';
import type { Scenario } from '../types';

interface Props {
  scenarios: Scenario[];
}

export default function ScenarioProjectionsCard({ scenarios }: Props) {
  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-sm p-5 shadow-sm col-span-1 md:col-span-2">
      <h2 className="text-xs font-semibold text-slate-800 dark:text-slate-100 uppercase tracking-widest mb-4 flex items-center gap-2">
        <Layers className="w-4 h-4 text-slate-500 dark:text-slate-400 dark:text-slate-500" />
        Scenario Projections (to Q4 2027)
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {scenarios.map((scenario, i) => (
          <div key={i} className="bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-700 p-4 rounded-sm flex flex-col">
            <div className="flex justify-between items-start mb-2">
              <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 leading-tight">{scenario.name}</h3>
              <span className="text-[10px] font-mono bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-sm border border-blue-200">{(scenario.probability * 100).toFixed(0)}%</span>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400 dark:text-slate-500 mb-4 flex-grow">{scenario.description}</p>
            <div className="space-y-2">
              <div>
                <div className="flex justify-between text-[9px] text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">
                  <span>Econ Shock</span>
                  <span className="font-mono">{(scenario.economicShock * 100).toFixed(0)}%</span>
                </div>
                <div className="h-1 w-full bg-slate-200 dark:bg-slate-600 rounded-none overflow-hidden">
                  <div className="h-full bg-rose-500" style={{ width: `${scenario.economicShock * 100}%` }} />
                </div>
              </div>
              <div className="text-[9px] text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest">
                Recovery: <span className="text-slate-600 dark:text-slate-300">{scenario.recoveryTimeline}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
