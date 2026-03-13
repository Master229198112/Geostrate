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

export function computeCIPF(inputs: CIPFInputs) {
  // Layer 0
  const SCM = 0.25*inputs.HPA + 0.25*inputs.EII + 0.20*inputs.CLS + 0.15*inputs.GPI + 0.15*inputs.SI;
  
  // Layer 1
  const CCI = 0.30*inputs.WMC + 0.25*inputs.PS + 0.25*inputs.EF + 0.20*inputs.AC;
  const ERC = 0.25*inputs.ERA + 0.30*inputs.ERE + 0.25*inputs.ST + 0.20*inputs.IC;
  const RQ = 0.25*inputs.TC + 0.20*inputs.PC + 0.20*inputs.SCFR + 0.20*inputs.EVC + 0.15*inputs.FER;
  const SRC = 0.30*inputs.NC + 0.30*inputs.TI + 0.20*inputs.RNA + 0.20*inputs.RC;
  const PCC = Math.pow(CCI * ERC * RQ * SRC, 0.25);
  // For simplicity, assuming 1 actor or identical actors for PCC_weighted
  const PCC_weighted = PCC; // simplified

  // Layer 2
  const IFA = 0.25*inputs.CCR + 0.25*inputs.SNR + 0.30*inputs.LCA + 0.20*inputs.VM;
  const DRC = 0.35*inputs.SC + 0.25*inputs.OM + 0.25*inputs.EPC + 0.15*inputs.VT;
  const IAQ = 0.30*inputs.RCC + 0.30*inputs.POC + 0.25*inputs.LTO + 0.15*inputs.CPT;
  const TPM = 0.35*inputs.PPPA + 0.25*inputs.SQ + 0.20*inputs.AS + 0.20*inputs.DAB;
  const ICS = Math.pow(IFA * DRC * IAQ * TPM, 0.25);

  // Layer 3
  const Omega = 0.40*ICS + 0.30*PCC_weighted + 0.30*inputs.Flexibility;
  const Phi = 0.30*(1 - inputs.tau/inputs.tau_max) + 0.25*inputs.f + 0.20*(1 - inputs.sigma/inputs.sigma_max) + 0.25*inputs.rho;
  const Theta = 0.50*inputs.VW + 0.30*(1 - DRC) + 0.20*inputs.Complexity;
  const Sigma = inputs.baseline * Math.exp(inputs.alpha * inputs.load);
  
  const deltaProduct = inputs.Deltas.reduce((acc, val) => acc * (1 - val), 1);
  const Psi = Math.pow(Omega * Phi * (1 - Theta), 1/3) * Math.pow(Sigma, -inputs.lambda) * deltaProduct;

  const Psi_structural_modifier = 1 - 0.15 * SCM;
  const Psi_cultural_modifier = inputs.ELF > 0.65 ? (1 - 0.15 * inputs.ELF) : 1;

  const Psi_structural = Psi * Psi_structural_modifier;
  const Psi_cultural = Psi * Psi_cultural_modifier;

  // Cultural
  const RQ_adj = RQ * (1 + inputs.alpha_IC * inputs.GroupBonus);
  const rho_optimal = 0.70 - 0.30 * inputs.alpha_PD;

  // Physical
  const PCE = Math.min(inputs.ResourceAvailability, inputs.EcologicalCapacity, inputs.ClimateBudget);
  
  const Psi_final = Math.min(Psi * Psi_structural_modifier * Psi_cultural_modifier, PCE);

  // Dominant Delta
  let dominantDeltaIndex = 0;
  let maxDelta = -1;
  inputs.Deltas.forEach((d, i) => {
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
