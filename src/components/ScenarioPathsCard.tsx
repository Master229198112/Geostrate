import React from 'react';
import { GitBranch } from 'lucide-react';

interface ScenarioPath {
  name: string;
  probability: number;
  description: string;
}

interface Props {
  scenarios: ScenarioPath[];
}

const SCENARIO_COLORS = [
  { bar: 'bg-emerald-500', text: 'text-emerald-600 dark:text-emerald-400', icon: '✓' },
  { bar: 'bg-amber-500', text: 'text-amber-600 dark:text-amber-400', icon: '⚠' },
  { bar: 'bg-orange-500', text: 'text-orange-600 dark:text-orange-400', icon: '⚡' },
  { bar: 'bg-rose-600', text: 'text-rose-600 dark:text-rose-400', icon: '✕' },
];

export default function ScenarioPathsCard({ scenarios }: Props) {
  if (!scenarios || scenarios.length === 0) return null;

  const maxProb = Math.max(...scenarios.map(s => s.probability));

  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-sm p-5 shadow-sm">
      <h2 className="text-xs font-semibold text-slate-800 dark:text-slate-100 uppercase tracking-widest mb-4 flex items-center gap-2">
        <GitBranch className="w-4 h-4 text-slate-500 dark:text-slate-400" />
        UHDA Scenario Paths
      </h2>

      <div className="space-y-4">
        {scenarios.map((scenario, i) => {
          const color = SCENARIO_COLORS[i % SCENARIO_COLORS.length];
          const isMax = scenario.probability === maxProb;
          return (
            <div key={i} className={`rounded-sm p-3 transition-all ${isMax ? 'bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 ring-1 ring-blue-200 dark:ring-blue-800' : ''}`}>
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <span className={`text-xs ${color.text}`}>{color.icon}</span>
                  <span className={`text-xs font-bold ${isMax ? 'text-slate-800 dark:text-slate-100' : 'text-slate-600 dark:text-slate-300'}`}>
                    {scenario.name}
                  </span>
                  {isMax && (
                    <span className="text-[8px] font-bold bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-1.5 py-0.5 rounded-sm uppercase tracking-widest">
                      Most Likely
                    </span>
                  )}
                </div>
                <span className={`text-sm font-mono font-bold ${color.text}`}>
                  {(scenario.probability * 100).toFixed(0)}%
                </span>
              </div>

              {/* Probability Bar */}
              <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-sm overflow-hidden mb-1.5">
                <div
                  className={`h-full ${color.bar} transition-all duration-500`}
                  style={{ width: `${scenario.probability * 100}%` }}
                />
              </div>

              <p className="text-[9px] text-slate-500 dark:text-slate-400 leading-relaxed">
                {scenario.description}
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
