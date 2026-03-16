export interface CIPFInputs {
  // Layer 0
  HPA: number; EII: number; CLS: number; GPI: number; SI: number;
  // Layer 1
  WMC: number; PS: number; EF: number; AC: number;
  ERA: number; ERE: number; ST: number; IC: number;
  TC: number; PC: number; SCFR: number; EVC: number; FER: number;
  NC: number; TI: number; RNA: number; RC: number;
  weights: number[]; // for PCC_weighted
  // Layer 2
  CCR: number; SNR: number; LCA: number; VM: number;
  SC: number; OM: number; EPC: number; VT: number;
  RCC: number; POC: number; LTO: number; CPT: number;
  PPPA: number; SQ: number; AS: number; DAB: number;
  // Layer 3
  Flexibility: number;
  tau: number; tau_max: number; f: number; sigma: number; sigma_max: number; rho: number;
  VW: number; Complexity: number;
  baseline: number; alpha: number; load: number; lambda: number;
  Deltas: number[]; // Array of Delta_i
  // Cultural
  alpha_IC: number; GroupBonus: number; alpha_PD: number; ELF: number;
  // Physical
  ResourceAvailability: number; EcologicalCapacity: number; ClimateBudget: number;
}

export function computeCIPF(inputs: any, variables: any[] = []) {
  const metrics: Record<string, number> = {};
  ['SCM', 'CCI', 'ERC', 'RQ', 'SRC', 'IFA', 'DRC', 'IAQ', 'TPM'].forEach(m => metrics[m] = 0);

  if (variables && variables.length > 0) {
    variables.forEach(v => {
      if (v.metric && metrics[v.metric] !== undefined) {
        metrics[v.metric] += (inputs[v.symbol] || 0) * (v.weight || 0);
      }
    });
  } else {
    // Fallback to strict defaults if no DB config passed
    metrics.SCM = 0.25*(inputs.HPA||0) + 0.25*(inputs.EII||0) + 0.20*(inputs.CLS||0) + 0.15*(inputs.GPI||0) + 0.15*(inputs.SI||0);
    metrics.CCI = 0.30*(inputs.WMC||0) + 0.25*(inputs.PS||0) + 0.25*(inputs.EF||0) + 0.20*(inputs.AC||0);
    metrics.ERC = 0.25*(inputs.ERA||0) + 0.30*(inputs.ERE||0) + 0.25*(inputs.ST||0) + 0.20*(inputs.IC||0);
    metrics.RQ = 0.25*(inputs.TC||0) + 0.20*(inputs.PC||0) + 0.20*(inputs.SCFR||0) + 0.20*(inputs.EVC||0) + 0.15*(inputs.FER||0);
    metrics.SRC = 0.30*(inputs.NC||0) + 0.30*(inputs.TI||0) + 0.20*(inputs.RNA||0) + 0.20*(inputs.RC||0);
    metrics.IFA = 0.25*(inputs.CCR||0) + 0.25*(inputs.SNR||0) + 0.30*(inputs.LCA||0) + 0.20*(inputs.VM||0);
    metrics.DRC = 0.35*(inputs.SC||0) + 0.25*(inputs.OM||0) + 0.25*(inputs.EPC||0) + 0.15*(inputs.VT||0);
    metrics.IAQ = 0.30*(inputs.RCC||0) + 0.30*(inputs.POC||0) + 0.25*(inputs.LTO||0) + 0.15*(inputs.CPT||0);
    metrics.TPM = 0.35*(inputs.PPPA||0) + 0.25*(inputs.SQ||0) + 0.20*(inputs.AS||0) + 0.20*(inputs.DAB||0);
  }

  const { SCM, CCI, ERC, RQ, SRC, IFA, DRC, IAQ, TPM } = metrics;
  
  const Flexibility = inputs.Flexibility ?? 0.5;
  const tau = inputs.tau ?? 1;
  const tau_max = inputs.tau_max ?? 10;
  const f = inputs.f ?? 0.5;
  const sigma = inputs.sigma ?? 1;
  const sigma_max = inputs.sigma_max ?? 10;
  const rho = inputs.rho ?? 0.5;
  const VW = inputs.VW ?? 0.5;
  const Complexity = inputs.Complexity ?? 0.5;
  const baseline = inputs.baseline ?? 1;
  const alpha = inputs.alpha ?? 0.1;
  const load = inputs.load ?? 2;
  const lambda = inputs.lambda ?? 0.1;
  const Deltas = inputs.Deltas || [0,0,0,0,0,0];

  const PCC = Math.pow(CCI * ERC * RQ * SRC, 0.25);
  const PCC_weighted = PCC;

  const ICS = Math.pow(IFA * DRC * IAQ * TPM, 0.25);

  const Omega = 0.40*ICS + 0.30*PCC_weighted + 0.30*Flexibility;
  const Phi = 0.30*(1 - tau/tau_max) + 0.25*f + 0.20*(1 - sigma/sigma_max) + 0.25*rho;
  const Theta = 0.50*VW + 0.30*(1 - DRC) + 0.20*Complexity;
  const Sigma = baseline * Math.exp(alpha * load);
  
  const deltaProduct = Deltas.reduce((acc: number, val: number) => acc * (1 - val), 1);
  const Psi = Math.pow(Omega * Phi * (1 - Theta), 1/3) * Math.pow(Sigma, -lambda) * deltaProduct;

  const Psi_structural_modifier = 1 - 0.15 * SCM;
  const ELF = inputs.ELF ?? 0.5;
  const Psi_cultural_modifier = ELF > 0.65 ? (1 - 0.15 * ELF) : 1;

  const Psi_structural = Psi * Psi_structural_modifier;
  const Psi_cultural = Psi * Psi_cultural_modifier;

  const alpha_IC = inputs.alpha_IC ?? 0.1;
  const GroupBonus = inputs.GroupBonus ?? 0.1;
  const RQ_adj = RQ * (1 + alpha_IC * GroupBonus);
  const alpha_PD = inputs.alpha_PD ?? 0.5;
  const rho_optimal = 0.70 - 0.30 * alpha_PD;

  const PCE = Math.min(inputs.ResourceAvailability??1, inputs.EcologicalCapacity??1, inputs.ClimateBudget??1);
  const Psi_final = Math.min(Psi * Psi_structural_modifier * Psi_cultural_modifier, PCE);

  let dominantDeltaIndex = 0;
  let maxDelta = -1;
  Deltas.forEach((d: number, i: number) => {
    if (d > maxDelta) { maxDelta = d; dominantDeltaIndex = i; }
  });

  return {
    SCM, CCI, ERC, RQ, SRC, PCC, IFA, DRC, IAQ, TPM, ICS,
    Omega, Phi, Theta, Sigma, Psi, Psi_structural, Psi_cultural, PCE, Psi_final,
    RQ_adj, rho_optimal,
    dominantDelta: `Delta_${dominantDeltaIndex + 1} (${maxDelta})`,
    bindingConstraint: PCE < (Psi * Psi_structural_modifier * Psi_cultural_modifier) ? 'Physical Constraint Envelope (PCE)' : 'Structural/Cultural Capacity'
  };
}
