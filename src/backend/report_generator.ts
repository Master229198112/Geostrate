export function generateReport(results: any) {
  return `
Geostrate - CIPF v4.0 Executive Summary
=======================================

Final Coordination Capacity (Ψ_final): ${results.cipf.Psi_final.toFixed(4)}
Threshold (Ψ*): 0.387
Status: ${results.cipf.Psi_final >= 0.387 ? 'VIABLE' : 'CRITICAL RISK'}

Confidence Score: ${(results.confidence.C_final * 100).toFixed(1)}%

Layer Scores:
- Layer 0 (SCM): ${results.cipf.SCM.toFixed(4)}
- Layer 1 (PCC): ${results.cipf.PCC.toFixed(4)}
- Layer 2 (ICS): ${results.cipf.ICS.toFixed(4)}
- Layer 3 (Ψ Base): ${results.cipf.Psi.toFixed(4)}

Dominant Failure Signature (Δ): ${results.cipf.dominantDelta}
Binding Constraint: ${results.cipf.bindingConstraint}

---------------------------------------
EXECUTIVE SUMMARY
---------------------------------------
${results.parsedData.executiveSummary || 'N/A'}

---------------------------------------
RECOMMENDATIONS
---------------------------------------
${(results.parsedData.recommendations || []).map((r: string) => `- ${r}`).join('\n')}

---------------------------------------
EVIDENCE SYNTHESIS
---------------------------------------
${results.parsedData.evidenceSynthesis || 'N/A'}

---------------------------------------
HISTORICAL EVIDENCE
---------------------------------------
${(results.parsedData.historicalEvidence || []).map((c: any) => `- ${c.title} (${c.date})\n  Relevance: ${c.relevance}\n  ${c.description}`).join('\n\n')}

---------------------------------------
VARIABLE MAPPING EXPLANATIONS
---------------------------------------
${(results.parsedData.variableExplanations || []).map((v: any) => `- ${v.variable} (${v.value}): ${v.explanation}`).join('\n')}
  `.trim();
}
