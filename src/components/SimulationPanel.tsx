import React from 'react';
import { SlidersHorizontal } from 'lucide-react';
import { computeCIPF, CIPFInputs } from '../lib/cipf_core';

interface Props {
  inputs: CIPFInputs;
  results: any;
  onInputsChange: (inputs: CIPFInputs) => void;
  onResultsChange: (results: any) => void;
}

function LayerCard({ title, value, max }: { title: string; value: number; max: number }) {
  const safeValue = Number(value || 0);
  const percentage = Math.min(100, Math.max(0, (safeValue / max) * 100));
  return (
    <div className="bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-700 rounded-sm p-3">
      <div className="flex justify-between items-end mb-1.5">
        <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{title}</span>
        <span className="text-sm font-mono text-slate-700 dark:text-slate-300">{safeValue.toFixed(3)}</span>
      </div>
      <div className="h-1 w-full bg-slate-200 dark:bg-slate-600 rounded-none overflow-hidden">
        <div className="h-full bg-blue-500" style={{ width: `${percentage}%` }} />
      </div>
    </div>
  );
}

// Correction 4: Variable descriptions
const VARIABLE_DESCRIPTIONS: Record<string, { about: string; impact: string }> = {
  HPA: {
    about: 'Historical Path Allegiance — persistence of actors in legacy coordination structures.',
    impact: 'Higher values indicate stronger structural memory, improving Structural Coherence (SCM).',
  },
  EII: {
    about: 'Economic-Institutional Integration — depth of economic entanglement across regional institutions.',
    impact: 'Increasing EII strengthens institutional binding, raising SCM and overall Ψ.',
  },
  CLS: {
    about: 'Cultural-Linguistic Synchronization — alignment in socio-cultural and identity systems.',
    impact: 'Higher CLS supports deeper coordination trust, improving SCM.',
  },
  GPI: {
    about: 'Geopolitical Proximity Index — access to strategically critical geographies and corridors.',
    impact: 'Affects structural leverage; higher GPI increases proximity-based coordination benefits.',
  },
  SI: {
    about: 'Strategic Independence — autonomy in decision-making and geopolitical self-determination.',
    impact: 'Higher SI reduces dependency risk, improving structural resilience.',
  },
  Flexibility: {
    about: 'Economic Flexibility — ability to quickly redirect industrial, fiscal, or trade capacity.',
    impact: 'Higher flexibility improves crisis adaptability, boosting CCI and PCC.',
  },
  WMC: {
    about: 'Will-to-Mobilize Coefficient — level of psychological and political readiness for action.',
    impact: 'Higher WMC increases Political Cohesion (CCI), improving institutional commitment.',
  },
  PS: {
    about: 'Political Stability — robustness of the central authority against internal disruption.',
    impact: 'Higher stability reduces fragility risk, directly improving CCI.',
  },
  EF: {
    about: 'Economic Flexibility — ability to quickly redirect industrial and fiscal capacity.',
    impact: 'Higher EF strengthens crisis adaptability and improves CCI.',
  },
  AC: {
    about: 'Alliance Cohesion — reliability and depth of formal partnerships and agreements.',
    impact: 'Higher AC improves collective commitment and lowers coordination failure risk.',
  },
};

function SimSlider({ label, value, desc, onChange }: { label: string; value: number; desc?: { about: string; impact: string }; onChange: (v: number) => void }) {
  const safe = Number(value || 0);
  return (
    <div>
      <div className="flex justify-between items-center mb-1">
        <label className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest">{label}</label>
        <span className="text-[10px] font-mono text-blue-600">{safe.toFixed(2)}</span>
      </div>
      <input
        type="range" min="0" max="1" step="0.01"
        value={safe}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-1 bg-slate-200 dark:bg-slate-600 rounded-lg appearance-none cursor-pointer accent-blue-500"
      />
      {desc && (
        <div className="mt-1 space-y-0.5">
          <p className="text-[9px] text-slate-500 dark:text-slate-500 leading-snug">{desc.about}</p>
          <p className="text-[9px] text-blue-500/70 leading-snug italic">{desc.impact}</p>
        </div>
      )}
    </div>
  );
}

const KEY_VARIABLES = [
  'HPA', 'EII', 'CLS', 'GPI', 'SI', 'Flexibility', 'WMC', 'PS', 'EF', 'AC'
] as const;

export default function SimulationPanel({ inputs, results, onInputsChange, onResultsChange }: Props) {
  const handleChange = (key: string, value: number) => {
    const newInputs = { ...inputs, [key]: value };
    onInputsChange(newInputs);
    onResultsChange(computeCIPF(newInputs));
  };

  return (
    <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-sm p-5 shadow-sm col-span-1 md:col-span-2">
      <h2 className="text-xs font-semibold text-slate-800 dark:text-slate-100 uppercase tracking-widest mb-4 flex items-center gap-2">
        <SlidersHorizontal className="w-4 h-4 text-slate-500 dark:text-slate-400" />
        CIPF Simulation Engine
      </h2>

      {/* CIPF Layer Scores */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        <LayerCard title="SCM (L0)" value={results.SCM} max={1} />
        <LayerCard title="PCC (L1)" value={results.PCC} max={1} />
        <LayerCard title="ICS (L2)" value={results.ICS} max={1} />
        <LayerCard title="Ψ_final" value={results.Psi_final} max={1} />
      </div>

      {/* Sliders */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-x-4 gap-y-5">
        {KEY_VARIABLES.map((varKey) => (
          <div key={varKey}>
            <SimSlider
              label={varKey}
              value={Number((inputs as any)[varKey] || 0)}
              desc={VARIABLE_DESCRIPTIONS[varKey]}
              onChange={(v) => handleChange(varKey, v)}
            />
          </div>
        ))}
      </div>

      {/* Status */}
      <div className="mt-4 flex items-center gap-4 text-[10px] font-mono uppercase tracking-widest">
        <span className="text-slate-400 dark:text-slate-500">Dominant Δ: <span className="text-slate-600 dark:text-slate-300">{results.dominantDelta}</span></span>
        <span className="text-slate-400 dark:text-slate-500">Binding: <span className="text-slate-600 dark:text-slate-300">{results.bindingConstraint}</span></span>
        <span className={`px-2 py-0.5 rounded-sm border font-bold ${results.Psi_final >= 0.387 ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-rose-50 text-rose-600 border-rose-200'}`}>
          {results.Psi_final >= 0.387 ? 'VIABLE' : 'CRITICAL RISK'}
        </span>
      </div>
    </div>
  );
}
