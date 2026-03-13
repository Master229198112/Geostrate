import React from 'react';
import { AlertTriangle } from 'lucide-react';
import type { OrderEffects as OrderEffectsData } from '../types';

interface Props {
  data: OrderEffectsData;
}

export default function OrderEffectsCard({ data }: Props) {
  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-sm p-5 shadow-sm">
      <h2 className="text-xs font-semibold text-slate-800 dark:text-slate-100 uppercase tracking-widest mb-4 flex items-center gap-2">
        <AlertTriangle className="w-4 h-4 text-rose-500" />
        Second-Order Effects
      </h2>

      {/* Domino Effects */}
      {data.dominoEffects && data.dominoEffects.length > 0 && (
        <div className="mb-4">
          <h3 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Domino Effects</h3>
          <ul className="space-y-1.5">
            {data.dominoEffects.map((effect, i) => (
              <li key={i} className="text-[10px] text-slate-600 dark:text-slate-300 flex gap-2 items-start">
                <span className="text-rose-500 mt-0.5">→</span>
                <span className="leading-relaxed">{effect}</span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Black Swan Events */}
      {data.blackSwanProbabilities && data.blackSwanProbabilities.length > 0 && (
        <div className="mb-4">
          <h3 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Black Swan Probabilities</h3>
          <div className="space-y-2">
            {data.blackSwanProbabilities.map((bs, i) => (
              <div key={i} className="bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-700 rounded-sm p-2">
                <div className="flex justify-between items-start mb-1">
                  <span className="text-[10px] text-slate-600 dark:text-slate-300 leading-relaxed flex-1">{bs.event}</span>
                  <div className="flex gap-2 ml-2">
                    <span className="text-[9px] font-mono text-amber-600">P: {(bs.probability * 100).toFixed(0)}%</span>
                    <span className="text-[9px] font-mono text-rose-600">I: {(bs.impact * 100).toFixed(0)}%</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Institutional Stress */}
      {data.institutionalStress && data.institutionalStress.length > 0 && (
        <div>
          <h3 className="text-[10px] font-bold text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">Institutional Stress</h3>
          <div className="space-y-1.5">
            {data.institutionalStress.map((inst, i) => (
              <div key={i} className="flex items-center gap-2">
                <span className="text-[10px] text-slate-600 dark:text-slate-300 w-24 truncate">{inst.institution}</span>
                <div className="flex-1 h-1.5 bg-slate-200 dark:bg-slate-600 rounded-none overflow-hidden">
                  <div className={`h-full ${inst.stressLevel > 0.7 ? 'bg-rose-500' : inst.stressLevel > 0.4 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${inst.stressLevel * 100}%` }} />
                </div>
                <span className="text-[9px] font-mono text-slate-500 dark:text-slate-400 dark:text-slate-500 w-8 text-right">{(inst.stressLevel * 100).toFixed(0)}%</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
