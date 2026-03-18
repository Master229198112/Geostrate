// UHDA Engine — Universal Hierarchical Decision Architecture v1.0
// Enhanced coordination analysis engine with Network Architecture, Cascade Detection, and Scenario Simulation

export interface UHDAInputs {
  // Layer 0: Structural Constraint Matrix (SCM)
  HPA: number; EII: number; CLS: number; GPI: number; SI: number;

  // Layer 1: Personal Coordination Capacity (PCC)
  WMC: number; PS: number; EF: number; AC: number;
  ERA: number; ERE: number; ST: number; IC: number;
  TC: number; PC: number; SCFR: number; EVC: number; FER: number;
  NC: number; TI: number; RNA: number; RC: number;

  // Layer 2: Institutional Coherence Score (ICS)
  CCR: number; SNR: number; LCA: number; VM: number;
  SC: number; OM: number; EPC: number; VT: number;
  RCC: number; POC: number; LTO: number; CPT: number;
  PPPA: number; SQ: number; AS: number; DAB: number;

  // Extensions
  AIEI_threat: number; // Adversarial Information Environment Index
  Procedural_Fairness: number; Voice_Inclusion: number; Outcome_Proportionality: number; Transparency: number;
  Platform_Accessibility: number; Algorithmic_Neutrality: number; Connectivity: number; Digital_Literacy: number;

  // Layer 3: System Dynamics
  Flexibility: number;
  tau: number; tau_max: number; f: number; sigma: number; sigma_max: number; rho_eff: number;
  VW: number; Proc_Complexity: number;
  baseline: number; alpha: number; cumulative_load: number; lambda: number;

  // Failure Signatures (Deltas)
  Deltas: number[]; // [Delta_1..Delta_6]

  // Cultural Context Vector (CCV)
  alpha_IC: number; alpha_PD: number; alpha_UA: number; alpha_LT: number; alpha_TF: number; alpha_CS: number;
  ELF: number;

  // Physical Constraint Envelope (PCE)
  Resource_Availability: number; Ecological_Carrying_Capacity: number; Climate_Budget: number;

  // Network Architecture Index (NAI)
  Density: number; Clustering: number; Structural_Holes: number; Small_World: number;
}

export interface UHDAResult {
  risk_score: number;
  Psi: number;
  Psi_rev: number;
  cascade_stage: string;
  cascade_phase: number;
  scenario_paths: { name: string; probability: number; description: string }[];
  diagnostics: {
    SCM_severity: number;
    PCC: number;
    ICS: number;
    NAI: number;
    LAS: number;
    IFA_effective: number;
    Omega: number;
    Phi: number;
    Theta: number;
    Sigma: number;
    deltaProduct: number;
  };
}

export function computeUHDA(raw: any): UHDAResult {
  // Defensive defaults
  const g = (key: string, def: number = 0.5) => Number(raw[key] ?? def);

  // --- Layer 0: Structural Constraint Matrix (SCM) ---
  const SCM_severity = 0.25 * g('HPA') + 0.25 * g('EII') + 0.20 * g('CLS') + 0.15 * g('GPI') + 0.15 * g('SI');

  // --- Layer 1: Individual Actor Substrate (PCC) ---
  const CCI = 0.30 * g('WMC') + 0.25 * g('PS') + 0.25 * g('EF') + 0.20 * g('AC');
  const ERC = 0.25 * g('ERA') + 0.30 * g('ERE') + 0.25 * g('ST') + 0.20 * g('IC');
  const RQ_raw = 0.25 * g('TC') + 0.20 * g('PC') + 0.20 * g('SCFR') + 0.20 * g('EVC') + 0.15 * g('FER');
  const SRC_raw = 0.30 * g('NC') + 0.30 * g('TI') + 0.20 * g('RNA') + 0.20 * g('RC');

  // Network Architecture Index (NAI)
  const NAI = 0.25 * g('Density') + 0.25 * g('Clustering') + 0.25 * g('Structural_Holes') + 0.25 * g('Small_World');
  const SRC_effective = SRC_raw * Math.pow(Math.max(NAI, 0.01), 0.5);

  const PCC = Math.pow(Math.max(CCI * ERC * RQ_raw * SRC_effective, 0.0001), 0.25);

  // --- Layer 2: Institutional Coherence Score (ICS) ---
  const IFA_base = 0.25 * g('CCR') + 0.25 * g('SNR') + 0.30 * g('LCA') + 0.20 * g('VM');
  const AIEI = g('AIEI_threat', 0.3);
  const IFA_effective = IFA_base * (1 - 0.40 * AIEI);

  const DRC = 0.35 * g('SC') + 0.25 * g('OM') + 0.25 * g('EPC') + 0.15 * g('VT');
  const IAQ = 0.30 * g('RCC') + 0.30 * g('POC') + 0.25 * g('LTO') + 0.15 * g('CPT');
  const TPM = 0.35 * g('PPPA') + 0.25 * g('SQ') + 0.20 * g('AS') + 0.20 * g('DAB');

  const ICS = Math.pow(Math.max(IFA_effective * DRC * IAQ * TPM, 0.0001), 0.25);

  // Legitimacy Architecture Score (LAS)
  const LAS = 0.30 * g('Procedural_Fairness') + 0.25 * g('Voice_Inclusion') + 0.25 * g('Outcome_Proportionality') + 0.20 * g('Transparency');

  // --- Layer 3: System Dynamics & Predictive Integration ---
  const Omega = 0.40 * ICS + 0.30 * PCC + 0.30 * g('Flexibility');
  const Phi = 0.30 * (1 - g('tau', 1) / g('tau_max', 10)) + 0.25 * g('f') + 0.20 * (1 - g('sigma', 1) / g('sigma_max', 10)) + 0.25 * g('rho_eff');
  const Theta = 0.50 * g('VW') + 0.30 * (1 - DRC) + 0.20 * g('Proc_Complexity', g('Complexity'));
  const Sigma = g('baseline', 1) * Math.exp(g('alpha', 0.1) * g('cumulative_load', g('load', 2)));

  const Deltas: number[] = raw.Deltas || [0, 0, 0, 0, 0, 0];
  const deltaProduct = Deltas.reduce((acc: number, val: number) => acc * (1 - val), 1);

  // Master Coordination Equation
  const Psi_calculated = Math.pow(Math.max(Omega * Phi * (1 - Theta), 0.0001), 1 / 3) * Math.pow(Math.max(Sigma, 0.0001), -g('lambda', 0.1)) * deltaProduct;

  // Physical Constraint Envelope (PCE)
  const PCE = Math.min(g('Resource_Availability', g('ResourceAvailability', 1)), g('Ecological_Carrying_Capacity', g('EcologicalCapacity', 1)), g('Climate_Budget', g('ClimateBudget', 1)));
  const Psi_achievable = Math.min(Psi_calculated, PCE * Psi_calculated);

  // Final Psi with SCM ceiling
  const Psi = Math.max(0, Math.min(1, Psi_achievable * (1 - 0.15 * SCM_severity)));

  // --- Cascade Engine (5-Phase Transition Model) ---
  let cascade_stage = "Stable";
  let cascade_phase = 0;
  if (Psi < 0.387) {
    cascade_stage = "Phase 5: Institutional Breakpoint";
    cascade_phase = 5;
  } else if (Deltas[1] > 0.40) {
    cascade_stage = "Phase 4: Network Activation";
    cascade_phase = 4;
  } else if (ERC < 0.35 && Deltas[0] > 0.40) {
    cascade_stage = "Phase 3: Emotional Mobilisation";
    cascade_phase = 3;
  } else if (IFA_effective < 0.45 && Deltas[3] > 0.35) {
    cascade_stage = "Phase 2: Narrative Fracture";
    cascade_phase = 2;
  } else if (SCM_severity > 0.50 && TPM < 0.33) {
    cascade_stage = "Phase 1: Latent Pressure";
    cascade_phase = 1;
  }

  // --- Scenario Simulation ---
  const scenario_paths = [
    { name: "Swift Resolution", probability: Psi > 0.5 ? 0.6 : 0.15, description: "Coordination holds, system adapts." },
    { name: "Protracted Disruption", probability: (Psi <= 0.5 && Psi > 0.387) ? 0.5 : 0.45, description: "System degrades but avoids collapse." },
    { name: "Regional Conflagration", probability: (Psi <= 0.387 && cascade_phase >= 4) ? 0.6 : 0.30, description: "Network activation leads to widespread conflict." },
    { name: "Systemic Cascade", probability: Psi < 0.387 ? 0.8 : 0.10, description: "Institutional breakpoint reached, old equilibrium irrecoverable." }
  ];

  // Normalize probabilities
  const totalProb = scenario_paths.reduce((sum, s) => sum + s.probability, 0);
  scenario_paths.forEach(s => s.probability = parseFloat((s.probability / totalProb).toFixed(2)));

  // Revolution Cascade Architecture
  const C = (CCI + RQ_raw) / 2;
  const E = ERC;
  const R = (SRC_effective + NAI) / 2;
  const I = (ICS + LAS) / 2;
  const S = 1 - SCM_severity;
  const Psi_rev = Math.pow(Math.max(C * E * R * I * S, 0.0001), 1 / 5);

  return {
    risk_score: parseFloat((1 - Psi).toFixed(3)),
    Psi: parseFloat(Psi.toFixed(3)),
    Psi_rev: parseFloat(Psi_rev.toFixed(3)),
    cascade_stage,
    cascade_phase,
    scenario_paths,
    diagnostics: {
      SCM_severity: parseFloat(SCM_severity.toFixed(3)),
      PCC: parseFloat(PCC.toFixed(3)),
      ICS: parseFloat(ICS.toFixed(3)),
      NAI: parseFloat(NAI.toFixed(3)),
      LAS: parseFloat(LAS.toFixed(3)),
      IFA_effective: parseFloat(IFA_effective.toFixed(3)),
      Omega: parseFloat(Omega.toFixed(3)),
      Phi: parseFloat(Phi.toFixed(3)),
      Theta: parseFloat(Theta.toFixed(3)),
      Sigma: parseFloat(Sigma.toFixed(3)),
      deltaProduct: parseFloat(deltaProduct.toFixed(3)),
    }
  };
}
