export function retrieveEvidence(problem: string, entities: string[]) {
  // Mock data for prototype
  return {
    historicalCases: [
      { id: 'HC-001', description: 'Similar coordination failure in 2018', relevance: 0.85 },
      { id: 'HC-002', description: 'Successful integration in adjacent sector', relevance: 0.72 }
    ],
    structuredData: {
      averageHistoricalPsi: 0.42,
      commonFailureModes: ['Trust Fragmentation (Delta 2)', 'Resource Depletion (Delta 5)']
    }
  };
}
