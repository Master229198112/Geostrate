import React from 'react';
import { Shield } from 'lucide-react';
import type { DecisionArchitecture as DecisionData } from '../types';

interface Props {
  data: DecisionData;
}

export default function DecisionArchitectureCard({ data }: Props) {
  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-sm p-5 shadow-sm col-span-1 md:col-span-2">
      <h2 className="text-xs font-semibold text-slate-800 dark:text-slate-100 uppercase tracking-widest mb-4 flex items-center gap-2">
        <Shield className="w-4 h-4 text-slate-500 dark:text-slate-400 dark:text-slate-500" />
        Decision Architecture
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
        {data.stakeholders.map((sh, i) => (
          <div key={i} className="bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-700 rounded-sm p-4">
            <h3 className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-widest mb-3">{sh.type}</h3>
            
            <div className="mb-3">
              <h4 className="text-[9px] font-bold text-blue-500 uppercase tracking-widest mb-1.5">Action Framework</h4>
              <ul className="space-y-1">
                {sh.actionFramework.map((action, j) => (
                  <li key={j} className="text-[10px] text-slate-600 dark:text-slate-300 flex gap-1.5 items-start">
                    <span className="text-blue-400 mt-0.5">▸</span>
                    <span className="leading-relaxed">{action}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest mb-1.5">Risk Mitigation</h4>
              <ul className="space-y-1">
                {sh.riskMitigation.map((mit, j) => (
                  <li key={j} className="text-[10px] text-slate-600 dark:text-slate-300 flex gap-1.5 items-start">
                    <span className="text-emerald-400 mt-0.5">✦</span>
                    <span className="leading-relaxed">{mit}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
