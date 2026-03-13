import { describe, it, expect } from 'vitest';
import { computeCIPF, CIPFInputs } from '../src/lib/cipf_core';

// Default balanced inputs for testing
function makeDefaults(overrides: Partial<CIPFInputs> = {}): CIPFInputs {
  return {
    HPA: 0.5, EII: 0.5, CLS: 0.5, GPI: 0.5, SI: 0.5,
    WMC: 0.5, PS: 0.5, EF: 0.5, AC: 0.5,
    ERA: 0.5, ERE: 0.5, ST: 0.5, IC: 0.5,
    TC: 0.5, PC: 0.5, SCFR: 0.5, EVC: 0.5, FER: 0.5,
    NC: 0.5, TI: 0.5, RNA: 0.5, RC: 0.5,
    CCR: 0.5, SNR: 0.5, LCA: 0.5, VM: 0.5,
    SC: 0.5, OM: 0.5, EPC: 0.5, VT: 0.5,
    RCC: 0.5, POC: 0.5, LTO: 0.5, CPT: 0.5,
    PPPA: 0.5, SQ: 0.5, AS: 0.5, DAB: 0.5,
    Flexibility: 0.5, tau: 1, tau_max: 10, f: 0.5,
    sigma: 1, sigma_max: 10, rho: 0.5,
    VW: 0.5, Complexity: 0.5,
    baseline: 1, alpha: 0.1, load: 2, lambda: 0.1,
    Deltas: [0.1, 0.05, 0.02, 0.01, 0.01, 0.01],
    alpha_IC: 0.1, GroupBonus: 0.1, alpha_PD: 0.5,
    ELF: 0.5,
    ResourceAvailability: 1, EcologicalCapacity: 1, ClimateBudget: 1,
    weights: [1],
    ...overrides,
  };
}

describe('computeCIPF', () => {
  it('returns all expected keys', () => {
    const result = computeCIPF(makeDefaults());
    const expectedKeys = [
      'SCM', 'CCI', 'ERC', 'RQ', 'SRC', 'PCC',
      'IFA', 'DRC', 'IAQ', 'TPM', 'ICS',
      'Omega', 'Phi', 'Theta', 'Sigma', 'Psi',
      'Psi_structural', 'Psi_cultural', 'PCE', 'Psi_final',
      'RQ_adj', 'rho_optimal',
      'dominantDelta', 'bindingConstraint',
    ];
    for (const key of expectedKeys) {
      expect(result).toHaveProperty(key);
    }
  });

  it('produces numeric outputs for all scores', () => {
    const result = computeCIPF(makeDefaults());
    expect(typeof result.SCM).toBe('number');
    expect(typeof result.PCC).toBe('number');
    expect(typeof result.ICS).toBe('number');
    expect(typeof result.Psi_final).toBe('number');
    expect(Number.isNaN(result.Psi_final)).toBe(false);
  });

  it('Psi_final is bounded by PCE', () => {
    const result = computeCIPF(makeDefaults({ ResourceAvailability: 0.1 }));
    expect(result.Psi_final).toBeLessThanOrEqual(0.1);
  });

  it('SCM is between 0 and 1 with default inputs', () => {
    const result = computeCIPF(makeDefaults());
    expect(result.SCM).toBeGreaterThanOrEqual(0);
    expect(result.SCM).toBeLessThanOrEqual(1);
  });

  it('higher Flexibility improves Psi_final', () => {
    const low = computeCIPF(makeDefaults({ Flexibility: 0.1 }));
    const high = computeCIPF(makeDefaults({ Flexibility: 0.9 }));
    expect(high.Psi_final).toBeGreaterThan(low.Psi_final);
  });

  it('higher Deltas reduce Psi_final', () => {
    const lowDelta = computeCIPF(makeDefaults({ Deltas: [0.01, 0.01, 0.01, 0.01, 0.01, 0.01] }));
    const highDelta = computeCIPF(makeDefaults({ Deltas: [0.3, 0.3, 0.3, 0.3, 0.3, 0.3] }));
    expect(lowDelta.Psi_final).toBeGreaterThan(highDelta.Psi_final);
  });

  it('identifies dominant delta correctly', () => {
    const result = computeCIPF(makeDefaults({ Deltas: [0.01, 0.5, 0.02, 0.01, 0.01, 0.01] }));
    expect(result.dominantDelta).toContain('Delta_2');
    expect(result.dominantDelta).toContain('0.5');
  });

  it('bindingConstraint detects PCE when physical limits are low', () => {
    const result = computeCIPF(makeDefaults({ ResourceAvailability: 0.01 }));
    expect(result.bindingConstraint).toContain('Physical');
  });

  it('ELF > 0.65 triggers cultural modifier', () => {
    const lowELF = computeCIPF(makeDefaults({ ELF: 0.3 }));
    const highELF = computeCIPF(makeDefaults({ ELF: 0.9 }));
    expect(highELF.Psi_cultural).toBeLessThan(lowELF.Psi_cultural);
  });

  it('all zeros produce zero-ish output without NaN', () => {
    const zeroInputs = makeDefaults();
    for (const key of Object.keys(zeroInputs) as (keyof CIPFInputs)[]) {
      if (key === 'Deltas' || key === 'weights') continue;
      if (typeof zeroInputs[key] === 'number') {
        (zeroInputs as any)[key] = 0;
      }
    }
    zeroInputs.tau_max = 1; // avoid division by zero
    zeroInputs.sigma_max = 1;
    zeroInputs.baseline = 1;
    zeroInputs.Deltas = [0, 0, 0, 0, 0, 0];
    const result = computeCIPF(zeroInputs);
    expect(Number.isNaN(result.Psi_final)).toBe(false);
    expect(Number.isFinite(result.Psi_final)).toBe(true);
  });

  it('extreme high inputs produce reasonable Psi_final', () => {
    const maxInputs = makeDefaults();
    for (const key of Object.keys(maxInputs) as (keyof CIPFInputs)[]) {
      if (key === 'Deltas' || key === 'weights') continue;
      if (typeof maxInputs[key] === 'number') {
        (maxInputs as any)[key] = 1;
      }
    }
    maxInputs.tau = 1; maxInputs.tau_max = 10;
    maxInputs.sigma = 1; maxInputs.sigma_max = 10;
    maxInputs.baseline = 1; maxInputs.load = 1;
    maxInputs.Deltas = [0, 0, 0, 0, 0, 0];
    const result = computeCIPF(maxInputs);
    expect(Number.isFinite(result.Psi_final)).toBe(true);
    expect(result.Psi_final).toBeGreaterThan(0);
  });
});
