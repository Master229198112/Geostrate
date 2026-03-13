export function computeConfidence(layerConfidences: { C_L0: number, C_L1: number, C_L2: number, C_L3: number }) {
  const { C_L0, C_L1, C_L2, C_L3 } = layerConfidences;
  const C_final = Math.pow(C_L0 * C_L1 * C_L2 * C_L3, 0.25);
  return {
    C_final,
    C_L0, C_L1, C_L2, C_L3
  };
}
