import React from 'react';
import { TrendingUp } from 'lucide-react';
import type { MarketAsset } from '../types';

interface Props {
  assets: MarketAsset[];
}

export default function MarketImpactCard({ assets }: Props) {
  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-sm p-5 shadow-sm">
      <h2 className="text-xs font-semibold text-slate-800 dark:text-slate-100 uppercase tracking-widest mb-4 flex items-center gap-2">
        <TrendingUp className="w-4 h-4 text-slate-500 dark:text-slate-400 dark:text-slate-500" />
        Market Impact Monitor
      </h2>
      <div className="space-y-3">
        {assets.slice(0, 4).map((asset, i) => (
          <div key={i} className="flex items-center justify-between p-2 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-700 rounded-sm">
            <div className="flex flex-col">
              <span className="text-xs font-bold text-slate-700 dark:text-slate-300 uppercase">{asset.class}</span>
              <span className="text-[10px] text-slate-500 dark:text-slate-400 dark:text-slate-500">{asset.shockProjection}</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex flex-col items-end">
                <span className="text-[9px] text-slate-400 dark:text-slate-500 dark:text-slate-400 dark:text-slate-500 uppercase tracking-widest">Volatility</span>
                <span className="text-xs font-mono text-amber-600">{(asset.volatility * 100).toFixed(0)}%</span>
              </div>
              <div className={`px-2 py-1 text-[9px] font-bold uppercase tracking-widest rounded-sm ${asset.riskExposure === 'High' ? 'bg-rose-50 text-rose-600 border border-rose-200' : asset.riskExposure === 'Medium' ? 'bg-amber-50 text-amber-600 border border-amber-200' : 'bg-emerald-50 text-emerald-600 border border-emerald-200'}`}>
                {asset.riskExposure}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
