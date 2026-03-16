import { VariableConfig } from './db.js';

export const DEFAULT_VARIABLES = [
  // Layer 0 - SCM
  { metric: 'SCM', layer: 'Layer 0', symbol: 'HPA', name: 'Historical Path Allegiance', weight: 0.25, defaultValue: 0.5, description: 'Evaluation of the actor’s persistence in historical precedents and strategic momentum' },
  { metric: 'SCM', layer: 'Layer 0', symbol: 'EII', name: 'Economic-Institutional Integration', weight: 0.25, defaultValue: 0.5, description: 'Depth of entanglement with regional or global economic frameworks' },
  { metric: 'SCM', layer: 'Layer 0', symbol: 'CLS', name: 'Cultural-Linguistic Synchronization', weight: 0.20, defaultValue: 0.5, description: 'Alignment in socio-cultural identity parameters with allied networks' },
  { metric: 'SCM', layer: 'Layer 0', symbol: 'GPI', name: 'Geopolitical Proximity Index', weight: 0.15, defaultValue: 0.5, description: 'Distance/Access to critical security corridors and choke points' },
  { metric: 'SCM', layer: 'Layer 0', symbol: 'SI', name: 'Strategic Independence', weight: 0.15, defaultValue: 0.5, description: 'Autonomy in decision-making and resistance to external coercion' },

  // Layer 1 - CCI
  { metric: 'CCI', layer: 'Layer 1', symbol: 'WMC', name: 'Will-to-Mobilize Coefficient', weight: 0.30, defaultValue: 0.5, description: 'Level of psychological and political readiness for total mobilization' },
  { metric: 'CCI', layer: 'Layer 1', symbol: 'PS', name: 'Political Stability', weight: 0.25, defaultValue: 0.5, description: 'Robustness of the central authority against internal fracturing' },
  { metric: 'CCI', layer: 'Layer 1', symbol: 'EF', name: 'Economic Flexibility', weight: 0.25, defaultValue: 0.5, description: 'Ability to quickly redirect industrial margins under duress' },
  { metric: 'CCI', layer: 'Layer 1', symbol: 'AC', name: 'Alliance Cohesion', weight: 0.20, defaultValue: 0.5, description: 'Reliability and depth of formal partnership commitments' },

  // Layer 1 - ERC
  { metric: 'ERC', layer: 'Layer 1', symbol: 'ERA', name: 'Energy Resource Availability', weight: 0.25, defaultValue: 0.5, description: 'Domestic surplus or secure supply lines for critical energy' },
  { metric: 'ERC', layer: 'Layer 1', symbol: 'ERE', name: 'Economic Resilience Engine', weight: 0.30, defaultValue: 0.5, description: 'Financial shock absorption capacity and reserves' },
  { metric: 'ERC', layer: 'Layer 1', symbol: 'ST', name: 'Socio-Political Trust', weight: 0.25, defaultValue: 0.5, description: 'Public confidence in institutional authority during crisis' },
  { metric: 'ERC', layer: 'Layer 1', symbol: 'IC', name: 'Information Control', weight: 0.20, defaultValue: 0.5, description: 'State capacity to shape narratives and prevent subversion' },

  // Layer 1 - RQ
  { metric: 'RQ', layer: 'Layer 1', symbol: 'TC', name: 'Technological Capacity', weight: 0.25, defaultValue: 0.5, description: 'Advanced R&D foundation and cyber capabilities' },
  { metric: 'RQ', layer: 'Layer 1', symbol: 'PC', name: 'Production Capacity', weight: 0.20, defaultValue: 0.5, description: 'Hard industrial throughput and supply chain resilience' },
  { metric: 'RQ', layer: 'Layer 1', symbol: 'SCFR', name: 'Supply Chain Friction Rate', weight: 0.20, defaultValue: 0.5, description: 'Vulnerability to chokepoints and logistical bottlenecks' },
  { metric: 'RQ', layer: 'Layer 1', symbol: 'EVC', name: 'Elite-Vanguard Cohesion', weight: 0.20, defaultValue: 0.5, description: 'Alignment between policy makers, military, and financial elites' },
  { metric: 'RQ', layer: 'Layer 1', symbol: 'FER', name: 'Foreign Exchange Reserves', weight: 0.15, defaultValue: 0.5, description: 'Liquidity buffer for sustained asymmetric trade war' },

  // Layer 1 - SRC
  { metric: 'SRC', layer: 'Layer 1', symbol: 'NC', name: 'Nuclear/Cyber Deterrence', weight: 0.30, defaultValue: 0.5, description: 'Credibility of ultimate threat projection' },
  { metric: 'SRC', layer: 'Layer 1', symbol: 'TI', name: 'Territorial Integrity', weight: 0.30, defaultValue: 0.5, description: 'Defensibility of core geographic boundaries' },
  { metric: 'SRC', layer: 'Layer 1', symbol: 'RNA', name: 'Regional Network Anchor', weight: 0.20, defaultValue: 0.5, description: 'Influence over adjacent buffer states' },
  { metric: 'SRC', layer: 'Layer 1', symbol: 'RC', name: 'Regime Continuity', weight: 0.20, defaultValue: 0.5, description: 'Institutional mechanisms enabling long-term strategic patience' },

  // Layer 2 - IFA
  { metric: 'IFA', layer: 'Layer 2', symbol: 'CCR', name: 'Cross-Domain Coordination Rate', weight: 0.25, defaultValue: 0.5, description: 'Ability to synchronize kinetic, cyber, and economic actions' },
  { metric: 'IFA', layer: 'Layer 2', symbol: 'SNR', name: 'Signal-to-Noise Ratio', weight: 0.25, defaultValue: 0.5, description: 'Clarity of intelligence and decision-making inputs' },
  { metric: 'IFA', layer: 'Layer 2', symbol: 'LCA', name: 'Logistical Chokepoint Adaptation', weight: 0.30, defaultValue: 0.5, description: 'Speed of rerouting around destroyed or blocked nodes' },
  { metric: 'IFA', layer: 'Layer 2', symbol: 'VM', name: 'Velocity of Maneuver', weight: 0.20, defaultValue: 0.5, description: 'OODA loop speed relative to adversaries' },

  // Layer 2 - DRC
  { metric: 'DRC', layer: 'Layer 2', symbol: 'SC', name: 'Structural Constraint', weight: 0.35, defaultValue: 0.5, description: 'Friction imposed by physical geography or legal frameworks' },
  { metric: 'DRC', layer: 'Layer 2', symbol: 'OM', name: 'Operational Mass', weight: 0.25, defaultValue: 0.5, description: 'Concentration of effective force at critical junctures' },
  { metric: 'DRC', layer: 'Layer 2', symbol: 'EPC', name: 'Efficacy of Power Projection', weight: 0.25, defaultValue: 0.5, description: 'Reach and lethality curve over distance' },
  { metric: 'DRC', layer: 'Layer 2', symbol: 'VT', name: 'Volatility Tolerance', weight: 0.15, defaultValue: 0.5, description: 'Systemic capacity to absorb Black Swan shocks' },

  // Layer 2 - IAQ
  { metric: 'IAQ', layer: 'Layer 2', symbol: 'RCC', name: 'Rapid Consensus Capacity', weight: 0.30, defaultValue: 0.5, description: 'Speed at which factions align under threat' },
  { metric: 'IAQ', layer: 'Layer 2', symbol: 'POC', name: 'Perception of Commitment', weight: 0.30, defaultValue: 0.5, description: 'Adversary’s belief in your willingness to escalate' },
  { metric: 'IAQ', layer: 'Layer 2', symbol: 'LTO', name: 'Long-Term Orientation', weight: 0.25, defaultValue: 0.5, description: 'Willingness to endure short-term pain for strategic gain' },
  { metric: 'IAQ', layer: 'Layer 2', symbol: 'CPT', name: 'Coupling to Primary Threat', weight: 0.15, defaultValue: 0.5, description: 'Degree of focus and resource allocation directed at primary adversary' },

  // Layer 2 - TPM
  { metric: 'TPM', layer: 'Layer 2', symbol: 'PPPA', name: 'Pre-emptive Positioning Precision', weight: 0.35, defaultValue: 0.5, description: 'Quality of proactive force arrayment before phase transition' },
  { metric: 'TPM', layer: 'Layer 2', symbol: 'SQ', name: 'Stealth Quotient', weight: 0.25, defaultValue: 0.5, description: 'Ability to mask intentions during buildup phase' },
  { metric: 'TPM', layer: 'Layer 2', symbol: 'AS', name: 'Asymmetric Subversion', weight: 0.20, defaultValue: 0.5, description: 'Capability to undermine adversary from within' },
  { metric: 'TPM', layer: 'Layer 2', symbol: 'DAB', name: 'Diplomatic Agility Buffer', weight: 0.20, defaultValue: 0.5, description: 'Use of third parties to diffuse or redirect pressure' },

  // INDEPENDENT VARIABLES
  { metric: 'INDEPENDENT', layer: 'Layer 3', symbol: 'Flexibility', name: 'System Flexibility', weight: 1, defaultValue: 0.5, description: 'Overall systemic flexibility' },
  { metric: 'INDEPENDENT', layer: 'Layer 3', symbol: 'tau', name: 'Time to Peak Escalation', weight: 1, defaultValue: 1, description: 'Time steps required to reach maximum intensity' },
  { metric: 'INDEPENDENT', layer: 'Layer 3', symbol: 'tau_max', name: 'Maximum Time Horizon', weight: 1, defaultValue: 10, description: 'Absolute maximum time steps before resolution' },
  { metric: 'INDEPENDENT', layer: 'Layer 3', symbol: 'f', name: 'Friction Coefficient', weight: 1, defaultValue: 0.5, description: 'Resistance native to the environment' },
  { metric: 'INDEPENDENT', layer: 'Layer 3', symbol: 'sigma', name: 'Uncertainty Index', weight: 1, defaultValue: 1, description: 'Current level of informational entropy' },
  { metric: 'INDEPENDENT', layer: 'Layer 3', symbol: 'sigma_max', name: 'Maximum Uncertainty', weight: 1, defaultValue: 10, description: 'Fog of war threshold' },
  { metric: 'INDEPENDENT', layer: 'Layer 3', symbol: 'rho', name: 'Resource Regeneration Rate', weight: 1, defaultValue: 0.5, description: 'Pacing of industrial/demographic recovery' },
  { metric: 'INDEPENDENT', layer: 'Layer 3', symbol: 'VW', name: 'Volatility Weight', weight: 1, defaultValue: 0.5, description: 'Impact coefficient of stochastic events' },
  { metric: 'INDEPENDENT', layer: 'Layer 3', symbol: 'Complexity', name: 'Systemic Complexity', weight: 1, defaultValue: 0.5, description: 'Number of interdependent nodes and feedback loops' },
  
  // Stress Factors (Sigma)
  { metric: 'INDEPENDENT', layer: 'Layer 3', symbol: 'baseline', name: 'Baseline Stress', weight: 1, defaultValue: 1, description: 'Structural baseline pressure' },
  { metric: 'INDEPENDENT', layer: 'Layer 3', symbol: 'alpha', name: 'Stress Multiplier', weight: 1, defaultValue: 0.1, description: 'Rate of stress compounding' },
  { metric: 'INDEPENDENT', layer: 'Layer 3', symbol: 'load', name: 'Active Load', weight: 1, defaultValue: 2, description: 'Current kinetic or economic demand' },
  { metric: 'INDEPENDENT', layer: 'Layer 3', symbol: 'lambda', name: 'Decay Factor', weight: 1, defaultValue: 0.1, description: 'Natural dissipation rate of stress' },

  // Cultural Modifiers
  { metric: 'INDEPENDENT', layer: 'Cultural', symbol: 'alpha_IC', name: 'Identity Cohesion Multiplier', weight: 1, defaultValue: 0.1, description: '' },
  { metric: 'INDEPENDENT', layer: 'Cultural', symbol: 'GroupBonus', name: 'Group Resonance Bonus', weight: 1, defaultValue: 0.1, description: '' },
  { metric: 'INDEPENDENT', layer: 'Cultural', symbol: 'alpha_PD', name: 'Power Distance Decay', weight: 1, defaultValue: 0.5, description: '' },
  { metric: 'INDEPENDENT', layer: 'Cultural', symbol: 'ELF', name: 'Ethno-Linguistic Fractionalization', weight: 1, defaultValue: 0.5, description: '' },

  // Physical Constraints
  { metric: 'INDEPENDENT', layer: 'Physical', symbol: 'ResourceAvailability', name: 'Resource Availability (PCE)', weight: 1, defaultValue: 1, description: '' },
  { metric: 'INDEPENDENT', layer: 'Physical', symbol: 'EcologicalCapacity', name: 'Ecological Capacity (PCE)', weight: 1, defaultValue: 1, description: '' },
  { metric: 'INDEPENDENT', layer: 'Physical', symbol: 'ClimateBudget', name: 'Climate Budget (PCE)', weight: 1, defaultValue: 1, description: '' },
];

export async function seedVariables() {
  const count = await VariableConfig.countDocuments();
  if (count === 0) {
    console.log('🌱 Seeding initial CIPF Variable Configs to database...');
    await VariableConfig.insertMany(DEFAULT_VARIABLES);
    console.log('✅ Default Variable Configs seeded successfully.');
  }
}
