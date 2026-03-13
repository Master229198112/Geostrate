// ===== Geostrate TypeScript Types =====

// --- Executive Summary ---
export interface StrategicPriority {
  priority: string;
  urgency: 'High' | 'Medium' | 'Low';
  impact: 'High' | 'Medium' | 'Low';
}

export interface TimelineEvent {
  date: string;
  event: string;
}

export interface ExecutiveSummary {
  globalRiskIndicator: number;
  strategicPriorityMatrix: StrategicPriority[];
  keyDecisionTriggers: string[];
  escalationTimeline: TimelineEvent[];
  top10Insights: string[];
}

// --- Part 1: Situation Assessment ---
export interface PowerBalance {
  actor: string;
  powerScore: number;
}

export interface StrategicAlignment {
  actor: string;
  alignment: string;
}

export interface SituationAssessment {
  conflictTimeline: TimelineEvent[];
  powerBalance: PowerBalance[];
  strategicAlignment: StrategicAlignment[];
}

// --- Part 2: Actor Architecture ---
export interface Actor {
  name: string;
  type: 'State' | 'Military' | 'Financial' | 'Tech' | 'Proxy' | 'Multilateral';
  capability: number;
  influence: number;
  stability: number;
  intentions: string;
}

export interface ActorArchitecture {
  actors: Actor[];
}

// --- Part 3: Market Impact ---
export interface MarketAsset {
  class: string;
  volatility: number;
  riskExposure: 'High' | 'Medium' | 'Low';
  liquidityStress: number;
  shockProjection: string;
}

export interface MarketImpact {
  assets: MarketAsset[];
}

// --- Part 4: Scenarios ---
export interface Scenario {
  name: string;
  probability: number;
  economicShock: number;
  recoveryTimeline: string;
  description: string;
}

// --- Part 5: Sector Decision ---
export interface Sector {
  name: string;
  shockVulnerability: number;
  opportunityScore: number;
  resilienceScore: number;
  supplyChainVulnerability: string;
}

export interface SectorDecision {
  sectors: Sector[];
}

// --- Part 6: Geographic Impact ---
export interface Region {
  name: string;
  economicShockIndex: number;
  tradeDependency: number;
  strategicImpact: string;
  militaryHotspot: string;
}

export interface GeographicImpact {
  regions: Region[];
}

// --- Part 7: Order Effects ---
export interface BlackSwanEvent {
  event: string;
  probability: number;
  impact: number;
}

export interface InstitutionalStress {
  institution: string;
  stressLevel: number;
}

export interface OrderEffects {
  dominoEffects: string[];
  blackSwanProbabilities: BlackSwanEvent[];
  institutionalStress: InstitutionalStress[];
}

// --- Part 8: Strategic Q&A ---
export interface StrategicQA {
  question: string;
  analyticalAnswer: string;
  confidenceLevel: number;
  strategicImplication: string;
}

// --- Part 9: Decision Architecture ---
export interface Stakeholder {
  type: string;
  actionFramework: string[];
  riskMitigation: string[];
}

export interface DecisionArchitecture {
  stakeholders: Stakeholder[];
}

// --- Variable Explanations ---
export interface VariableExplanation {
  variable: string;
  value: number;
  explanation: string;
}

// --- Full Parsed Data (Gemini Response) ---
export interface ParsedData {
  entities?: string[];
  executiveSummary?: ExecutiveSummary;
  part1_SituationAssessment?: SituationAssessment;
  part2_ActorArchitecture?: ActorArchitecture;
  part3_MarketImpact?: MarketImpact;
  part4_Scenarios?: Scenario[];
  part5_SectorDecision?: SectorDecision;
  part6_GeographicImpact?: GeographicImpact;
  part7_OrderEffects?: OrderEffects;
  part8_StrategicQA?: StrategicQA[];
  part9_DecisionArchitecture?: DecisionArchitecture;
  variableExplanations?: VariableExplanation[];
  mappedVariables?: Record<string, number | number[]>;
}

// --- CIPF Results ---
export interface CIPFResults {
  SCM: number;
  PCC: number;
  ICS: number;
  Psi: number;
  Psi_final: number;
  Psi_structural: number;
  Psi_cultural: number;
  PCE: number;
  dominantDelta: string;
  bindingConstraint: string;
  [key: string]: number | string;
}

// --- Full Analysis Response (from API) ---
export interface AnalysisResponse {
  parsedData: ParsedData;
  evidence: any;
  cipf: CIPFResults;
  confidence: { C_final: number };
  report: string;
  inputs: Record<string, any>;
}
