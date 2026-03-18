import { GoogleGenAI } from "@google/genai";

// ===== SHARED GEMINI CALL HELPER =====
async function callGemini(ai: any, prompt: string): Promise<any> {
  let response: any;
  let retries = 3;
  let delay = 10000;

  while (retries > 0) {
    try {
      response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: prompt,
        config: {
          temperature: 0.2,
          maxOutputTokens: 32768,
          responseMimeType: "application/json",
        },
      });
      break;
    } catch (error: any) {
      console.error(`Gemini API error: ${error.message}`);
      retries--;
      if (retries === 0 || !error.message?.includes("RESOURCE_EXHAUSTED")) {
        throw error;
      }
      console.log(`Rate limited. Retrying in ${delay}ms...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
      delay *= 2;
    }
  }

  if (!response) {
    throw new Error("Failed to get response from Gemini API after retries.");
  }

  let text = response.text || "{}";
  console.log(`[Gemini] Response length: ${text.length} chars`);

  // Clean up markdown fences
  text = text.replace(/^```(?:json)?\s*\n?/i, "").replace(/\n?```\s*$/i, "");
  const fb = text.indexOf("{");
  const lb = text.lastIndexOf("}");
  if (fb !== -1 && lb !== -1 && lb > fb) {
    text = text.substring(fb, lb + 1);
  }

  // Stage 1: Direct JSON.parse
  try {
    return JSON.parse(text);
  } catch (e1: any) {
    console.error("[Gemini] Stage 1 (JSON.parse) failed:", e1.message);
  }

  // Stage 2: Safe repair (fix control chars, trailing commas) + JSON.parse
  let repaired = safeRepairJSON(text);
  try {
    return JSON.parse(repaired);
  } catch (e2: any) {
    console.error("[Gemini] Stage 2 (repair+JSON.parse) failed:", e2.message);
  }

  // Stage 3: JSON5 (tolerates trailing commas, unquoted keys, etc.)
  try {
    const JSON5 = require("json5");
    return JSON5.parse(repaired);
  } catch (e3: any) {
    console.error("[Gemini] Stage 3 (JSON5) failed:", e3.message);
  }

  // Stage 4: Bracket-balance repair + JSON5
  try {
    const balanced = balanceBrackets(repaired);
    const JSON5 = require("json5");
    return JSON5.parse(balanced);
  } catch (e4: any) {
    console.error("[Gemini] Stage 4 (balanced+JSON5) failed:", e4.message);
    console.error("Raw text (first 500 chars):", text.substring(0, 500));
    console.error(
      "Raw text (last 200 chars):",
      text.substring(text.length - 200),
    );
    throw new Error(
      "Failed to parse response from AI. The model generated invalid JSON.",
    );
  }
}

// ===== MAIN ENTRY POINT =====
export async function parseProblem(
  apiKey: string,
  problem: string,
  variables: any[] = [],
  retryCount: number = 0,
): Promise<any> {
  const ai = new GoogleGenAI({ apiKey });

  const variableDefaults = variables.reduce((acc, v) => {
    acc[v.symbol] = v.defaultValue;
    return acc;
  }, {} as Record<string, number>);

  const variableInstructions = variables
    .filter(v => v.description)
    .map(v => `- ${v.symbol}: ${v.description}`)
    .join('\n');

  // fallback if empty
  if (Object.keys(variableDefaults).length === 0) {
    variableDefaults['HPA'] = 0.5;
  }

  // ---- CALL 1: Structure, Variables & Executive Summary ----
  console.log("[Gemini] Call 1: Structure & Variables...");
  let call1Result: any;
  try {
    const prompt = `Act as a global strategic intelligence analyst. Analyze this coordination problem and extract entities, structure, and map to CIPF v4.0 + UHDA variables.

Problem: ${problem}

Return a JSON object with ONLY these keys:
{
  "entities": ["entity1", "entity2"],
  "executiveSummary": {
    "globalRiskIndicator": 0.72,
    "top10Insights": ["insight1", "insight2", "...up to 10"],
    "keyDecisionTriggers": ["trigger1", "trigger2"],
    "strategicPriorityMatrix": [{"priority": "name", "urgency": "High|Medium|Low", "impact": "High|Medium|Low"}],
    "escalationTimeline": [{"date": "YYYY-MM", "event": "description"}]
  },
  "variableExplanations": [
    {"variable": "${variables.length > 0 ? variables[0].symbol : 'VAR'}", "value": 0.7, "explanation": "Why this value was assigned"}
  ],
  "mappedVariables": ${JSON.stringify(variableDefaults, null, 2).replace(/\n/g, '\n  ')}
}

Variable Definitions to guide scoring:
${variableInstructions}

UHDA Extension Variables (also include in mappedVariables, all 0-1):
- AIEI_threat: Adversarial Information Environment Index — disinformation threat level degrading institutional coherence
- Procedural_Fairness: fairness and impartiality of decision-making processes
- Voice_Inclusion: degree to which affected actors have voice in coordination
- Outcome_Proportionality: proportionality of outcomes relative to input/stakes
- Transparency: openness and auditability of institutional processes
- Density: network density of actor coordination ties
- Clustering: clustering coefficient of actor networks
- Structural_Holes: presence of brokerage opportunities in actor networks
- Small_World: small-world property of actor coordination graph
- Platform_Accessibility: accessibility of digital coordination platforms
- Algorithmic_Neutrality: neutrality of algorithmic systems in coordination
- Connectivity: digital/physical connectivity between actors
- Digital_Literacy: digital literacy of participating actors
- Proc_Complexity: procedural complexity of the coordination problem

Values 0-1 (except tau_max, sigma_max, baseline, load). Provide reasonable estimates. Keep string values concise.`;

    call1Result = await callGemini(ai, prompt);
  } catch (err: any) {
    if (retryCount < 1) {
      console.log("[Gemini] Call 1 failed, retrying...");
      return parseProblem(apiKey, problem, variables, retryCount + 1);
    }
    throw err;
  }

  // ---- CALL 2: Deep Analysis (parts 1-9) ----
  console.log("[Gemini] Call 2: Deep Analysis...");
  let call2Result: any;
  try {
    call2Result = await callGemini(
      ai,
      `Act as a geopolitical intelligence analyst. For this coordination problem, provide deep strategic analysis.

Problem: ${problem}

Return a JSON object with ONLY these keys:
{
  "part1_SituationAssessment": {
    "conflictTimeline": [{"date": "YYYY-MM", "event": "description"}],
    "powerBalance": [{"actor": "name", "powerScore": 0.8}],
    "strategicAlignment": [{"actor": "name", "alignment": "Aligned|Opposed|Neutral"}]
  },
  "part2_ActorArchitecture": {
    "actors": [{"name": "str", "type": "State|Military|Financial|Tech|Proxy|Multilateral", "capability": 0.8, "influence": 0.7, "stability": 0.6, "intentions": "str"}]
  },
  "part3_MarketImpact": {
    "assets": [{"class": "Equities|Commodities|Energy|Bonds|Currencies|Crypto|Defense|Semiconductors", "volatility": 0.3, "liquidityStress": 0.2, "shockProjection": "description", "riskExposure": "High|Medium|Low"}]
  },
  "part4_Scenarios": [
    {"name": "Scenario Name", "probability": 0.35, "description": "desc", "economicShock": 0.4, "recoveryTimeline": "Q2 2026"}
  ],
  "part5_SectorDecision": {
    "sectors": [{"name": "Energy|Defense|Semiconductors|AI|Banking|Agriculture|Logistics|Cybersecurity", "shockVulnerability": 0.7, "opportunityScore": 0.3, "resilienceScore": 0.5, "supplyChainVulnerability": "description"}]
  },
  "part6_GeographicImpact": {
    "regions": [{"name": "North America|Europe|Middle East|Asia-Pacific|Africa|Global South", "economicShockIndex": 0.6, "tradeDependency": 0.4, "strategicImpact": "desc", "militaryHotspot": "desc"}]
  },
  "part7_OrderEffects": {
    "dominoEffects": ["effect1", "effect2"],
    "blackSwanProbabilities": [{"event": "desc", "probability": 0.1, "impact": 0.9}],
    "institutionalStress": [{"institution": "UN", "stressLevel": 0.7}]
  },
  "part8_StrategicQA": [
    {"question": "Q?", "analyticalAnswer": "A", "strategicImplication": "desc", "confidenceLevel": 0.8}
  ],
  "part9_DecisionArchitecture": {
    "stakeholders": [{"type": "Governments|Investors|Corporations|Tech|International", "actionFramework": ["action1"], "riskMitigation": ["mitigation1"]}]
  }
}

Generate 4 scenarios for part4, 5-8 actors for part2, 6-8 sectors for part5, 5-10 strategic questions for part8. Keep string values concise.`,
    );
  } catch (err: any) {
    // If call 2 fails, still return call 1 results (partial data is better than nothing)
    console.error(
      "[Gemini] Call 2 failed, returning partial results:",
      err.message,
    );
    return call1Result;
  }

  // Merge results
  return { ...call1Result, ...call2Result };
}

// ===== SAFE JSON REPAIR =====
function safeRepairJSON(text: string): string {
  const result: string[] = [];
  let i = 0;
  let inString = false;

  while (i < text.length) {
    const ch = text[i];

    if (!inString) {
      if (ch === '"') {
        inString = true;
        result.push(ch);
      } else if (ch === ",") {
        let j = i + 1;
        while (j < text.length && " \n\r\t".includes(text[j])) j++;
        if (j < text.length && (text[j] === "]" || text[j] === "}")) {
          // skip trailing comma
        } else {
          result.push(ch);
        }
      } else {
        result.push(ch);
      }
    } else {
      if (ch === "\\") {
        result.push(ch);
        i++;
        if (i < text.length) result.push(text[i]);
      } else if (ch === '"') {
        inString = false;
        result.push(ch);
      } else if (ch === "\n") {
        result.push("\\n");
      } else if (ch === "\r") {
        result.push("\\r");
      } else if (ch === "\t") {
        result.push("\\t");
      } else if (ch.charCodeAt(0) < 0x20) {
        // skip control chars
      } else {
        result.push(ch);
      }
    }
    i++;
  }
  return result.join("");
}

// ===== BRACKET BALANCER (for truncated JSON) =====
function balanceBrackets(text: string): string {
  const stack: string[] = [];
  let inString = false;
  let escaped = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (escaped) { escaped = false; continue; }
    if (ch === '\\' && inString) { escaped = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (ch === '{') stack.push('}');
    else if (ch === '[') stack.push(']');
    else if (ch === '}' || ch === ']') stack.pop();
  }

  if (stack.length === 0) return text;

  // Strip trailing comma/whitespace before closing
  let trimmed = text.replace(/,\s*$/, '');
  // If we ended mid-string, close the string
  if (inString) trimmed += '"';
  // Close all open brackets in reverse order
  while (stack.length > 0) {
    trimmed += stack.pop();
  }
  console.log(`[Gemini] Bracket balancer closed ${stack.length} brackets`);
  return trimmed;
}
