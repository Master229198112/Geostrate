import React from 'react';
import { AlertTriangle, Shield, Activity } from 'lucide-react';

interface Props {
  cascadeStage: string;
  cascadePhase: number;
  riskScore: number;
  psiRev: number;
}

const PHASE_INFO = [
  { label: 'Stable', color: 'bg-emerald-500', textColor: 'text-emerald-600', bgLight: 'bg-emerald-50 dark:bg-emerald-900/20', borderColor: 'border-emerald-200 dark:border-emerald-800' },
  { label: 'Latent Pressure', color: 'bg-amber-400', textColor: 'text-amber-600', bgLight: 'bg-amber-50 dark:bg-amber-900/20', borderColor: 'border-amber-200 dark:border-amber-800' },
  { label: 'Narrative Fracture', color: 'bg-orange-500', textColor: 'text-orange-600', bgLight: 'bg-orange-50 dark:bg-orange-900/20', borderColor: 'border-orange-200 dark:border-orange-800' },
  { label: 'Emotional Mobilisation', color: 'bg-rose-400', textColor: 'text-rose-600', bgLight: 'bg-rose-50 dark:bg-rose-900/20', borderColor: 'border-rose-200 dark:border-rose-800' },
  { label: 'Network Activation', color: 'bg-red-500', textColor: 'text-red-600', bgLight: 'bg-red-50 dark:bg-red-900/20', borderColor: 'border-red-200 dark:border-red-800' },
  { label: 'Institutional Breakpoint', color: 'bg-red-700', textColor: 'text-red-700', bgLight: 'bg-red-50 dark:bg-red-900/30', borderColor: 'border-red-300 dark:border-red-800' },
];

export default function CascadePhaseCard({ cascadeStage, cascadePhase, riskScore, psiRev }: Props) {
  const phaseInfo = PHASE_INFO[cascadePhase] || PHASE_INFO[0];

  return (
    <div className={`bg-white dark:bg-slate-800 border ${phaseInfo.borderColor} rounded-sm p-5 shadow-sm`}>
      <h2 className="text-xs font-semibold text-slate-800 dark:text-slate-100 uppercase tracking-widest mb-4 flex items-center gap-2">
        <Activity className="w-4 h-4 text-slate-500 dark:text-slate-400" />
        Cascade Stability Analysis
      </h2>

      {/* Phase Indicator */}
      <div className={`${phaseInfo.bgLight} border ${phaseInfo.borderColor} rounded-sm p-4 mb-4`}>
        <div className="flex items-center gap-3 mb-2">
          {cascadePhase >= 3 ? (
            <AlertTriangle className={`w-5 h-5 ${phaseInfo.textColor}`} />
          ) : (
            <Shield className={`w-5 h-5 ${phaseInfo.textColor}`} />
          )}
          <span className={`text-sm font-bold ${phaseInfo.textColor}`}>
            {cascadeStage}
          </span>
        </div>
        <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-relaxed">
          {cascadePhase === 0 && "System coordination is intact. No cascade risks detected."}
          {cascadePhase === 1 && "Structural pressures building. TPM degradation with elevated SCM severity."}
          {cascadePhase === 2 && "Information architecture fragmenting. IFA degradation with active failure signatures."}
          {cascadePhase === 3 && "Emotional regulation capacity declining. ERC below threshold with Delta activation."}
          {cascadePhase === 4 && "Network-level activation detected. Delta-2 (trust erosion) exceeds critical threshold."}
          {cascadePhase === 5 && "Ψ below 0.387 — institutional coordination has passed the breakpoint."}
        </p>
      </div>

      {/* 5-Phase Visual Bar */}
      <div className="flex gap-1 mb-4">
        {PHASE_INFO.map((phase, i) => (
          <div key={i} className="flex-1 flex flex-col items-center">
            <div
              className={`w-full h-2 rounded-sm transition-all ${
                i <= cascadePhase ? phase.color : 'bg-slate-200 dark:bg-slate-700'
              } ${i === cascadePhase ? 'ring-1 ring-offset-1 ring-slate-400' : ''}`}
            />
            <span className={`text-[7px] mt-1 font-bold uppercase tracking-wider ${
              i === cascadePhase ? phase.textColor : 'text-slate-400 dark:text-slate-600'
            }`}>
              {i === 0 ? 'OK' : `P${i}`}
            </span>
          </div>
        ))}
      </div>

      {/* Risk Metrics */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-700 rounded-sm p-3">
          <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Risk Score</div>
          <div className={`text-lg font-mono font-bold ${riskScore >= 0.6 ? 'text-rose-500' : riskScore >= 0.4 ? 'text-amber-500' : 'text-emerald-500'}`}>
            {(riskScore * 100).toFixed(1)}%
          </div>
        </div>
        <div className="bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-700 rounded-sm p-3">
          <div className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">Ψ Revolution</div>
          <div className={`text-lg font-mono font-bold ${psiRev < 0.387 ? 'text-rose-500' : psiRev < 0.5 ? 'text-amber-500' : 'text-emerald-500'}`}>
            {psiRev.toFixed(3)}
          </div>
        </div>
      </div>
    </div>
  );
}
