// Vercel Serverless Function — Full Router (mirrors server.ts)
import type { VercelRequest, VercelResponse } from '@vercel/node';
import crypto from 'crypto';
import { connectDB, User, Plan, PromoCode, PendingRequest, Subscriber, AdminConfig, AnalysisLog, VariableConfig } from './db.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { GoogleGenAI } from '@google/genai';
import Razorpay from 'razorpay';

// ===== CORS =====
function setCORS(req: VercelRequest, res: VercelResponse) {
  const origin = req.headers.origin || '';
  const allowed = [
    'http://localhost:3000',
    'http://localhost:5173',
    'https://geostrate.aircwou.in',
    'https://geostrate.vercel.app'
  ];
  if (!origin || allowed.includes(origin) || origin.endsWith('.vercel.app') || origin.endsWith('.aircwou.in')) {
    res.setHeader('Access-Control-Allow-Origin', origin || '*');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
}

// ===== ENCRYPTION (AES-256-CBC) =====
function deriveEncKey(secret: string): Buffer {
  return crypto.createHash('sha256').update(secret).digest();
}
function encryptKey(plainKey: string, secret: string): string {
  const key = deriveEncKey(secret);
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-cbc', key, iv);
  let encrypted = cipher.update(plainKey, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return iv.toString('hex') + ':' + encrypted;
}
function decryptKey(encStr: string, secret: string): string {
  const key = deriveEncKey(secret);
  const [ivHex, encrypted] = encStr.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv);
  let decrypted = decipher.update(encrypted, 'hex', 'utf8');
  decrypted += decipher.final('utf8');
  return decrypted;
}
function maskKey(key: string): string {
  if (key.length <= 8) return '••••••••';
  return key.substring(0, 4) + '••••' + key.substring(key.length - 4);
}

// ===== GEMINI HELPERS =====
async function callGeminiAPI(ai: any, prompt: string): Promise<any> {
  let response: any;
  let retries = 3;
  let delay = 10000;
  while (retries > 0) {
    try {
      response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
        config: { temperature: 0.2, maxOutputTokens: 32768, responseMimeType: 'application/json' }
      });
      break;
    } catch (error: any) {
      retries--;
      if (retries === 0 || !error.message?.includes('RESOURCE_EXHAUSTED')) throw error;
      await new Promise(resolve => setTimeout(resolve, delay));
      delay *= 2;
    }
  }
  if (!response) throw new Error('Failed to get response from Gemini API after retries.');
  let text = response.text || '{}';
  text = text.replace(/^```(?:json)?\s*\n?/i, '').replace(/\n?```\s*$/i, '');
  const fb = text.indexOf('{');
  const lb = text.lastIndexOf('}');
  if (fb !== -1 && lb !== -1 && lb > fb) text = text.substring(fb, lb + 1);
  try { return JSON.parse(text); } catch {}
  try { return JSON.parse(safeRepairJSON(text)); } catch (e: any) {
    throw new Error(`Failed to parse AI response: ${e.message}`);
  }
}

function safeRepairJSON(text: string): string {
  const result: string[] = [];
  let i = 0, inString = false;
  while (i < text.length) {
    const ch = text[i];
    if (!inString) {
      if (ch === '"') { inString = true; result.push(ch); }
      else if (ch === ',') {
        let j = i + 1;
        while (j < text.length && ' \n\r\t'.includes(text[j])) j++;
        if (!(j < text.length && (text[j] === ']' || text[j] === '}'))) result.push(ch);
      } else result.push(ch);
    } else {
      if (ch === '\\') { result.push(ch); i++; if (i < text.length) result.push(text[i]); }
      else if (ch === '"') { inString = false; result.push(ch); }
      else if (ch === '\n') result.push('\\n');
      else if (ch === '\r') result.push('\\r');
      else if (ch === '\t') result.push('\\t');
      else if (ch.charCodeAt(0) >= 0x20) result.push(ch);
    }
    i++;
  }
  return result.join('');
}

async function parseProblem(apiKey: string, problem: string, variables: any[] = [], retryCount: number = 0) {
  const ai = new GoogleGenAI({ apiKey });

  const variableDefaults = variables.reduce((acc: any, v: any) => {
    acc[v.symbol] = v.defaultValue;
    return acc;
  }, {});

  const variableInstructions = variables
    .filter(v => v.description)
    .map(v => `- ${v.symbol}: ${v.description}`)
    .join('\n');

  if (Object.keys(variableDefaults).length === 0) {
    variableDefaults['HPA'] = 0.5;
  }

  let call1Result: any;
  try {
    const prompt = `Act as a global strategic intelligence analyst. Analyze this coordination problem and extract entities, structure, and map to CIPF v4.0 variables.

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

Values 0-1 (except tau_max, sigma_max, baseline, load). Provide reasonable estimates. Keep string values concise.`;

    call1Result = await callGeminiAPI(ai, prompt);
  } catch (err: any) {
    if (retryCount < 1) return parseProblem(apiKey, problem, variables, retryCount + 1);
    throw err;
  }

  let call2Result: any;
  try {
    call2Result = await callGeminiAPI(ai, `Act as a geopolitical intelligence analyst. For this coordination problem, provide deep strategic analysis.

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

Generate 4 scenarios for part4, 5-8 actors for part2, 6-8 sectors for part5, 5-10 strategic questions for part8. Keep string values concise.`);
  } catch (err: any) {
    return call1Result;
  }

  return { ...call1Result, ...call2Result };
}

// ===== CIPF COMPUTE =====
function computeCIPF(inputs: any, variables: any[] = []) {
  const metrics: Record<string, number> = {};
  ['SCM', 'CCI', 'ERC', 'RQ', 'SRC', 'IFA', 'DRC', 'IAQ', 'TPM'].forEach(m => metrics[m] = 0);

  if (variables && variables.length > 0) {
    variables.forEach(v => {
      if (v.metric && metrics[v.metric] !== undefined) {
        metrics[v.metric] += (inputs[v.symbol] || 0) * (v.weight || 0);
      }
    });
  } else {
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
    RQ_adj, rho_optimal, DeltaSum: 0,
    dominantDelta: `Delta_${dominantDeltaIndex + 1} (${maxDelta})`,
    bindingConstraint: PCE < (Psi * Psi_structural_modifier * Psi_cultural_modifier) ? 'Physical Constraint Envelope (PCE)' : 'Structural/Cultural Capacity'
  };
}

// ===== AUTH MIDDLEWARE =====
async function getUserId(req: VercelRequest, jwt: any, JWT_SECRET: string): Promise<string | null> {
  const token = (req.headers.authorization || '').split(' ')[1];
  if (!token) return null;
  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);
    return decoded.userId || null;
  } catch { return null; }
}

// ===== MAIN HANDLER (URL Router) =====
export default async function handler(req: VercelRequest, res: VercelResponse) {
  setCORS(req, res);
  if (req.method === 'OPTIONS') return res.status(204).end();

  const url = req.url || '';
  // Strip query string for matching
  const path = url.split('?')[0].replace(/\/+$/, '');

  // ===== HEALTH CHECK (no DB needed) =====
  if (path === '/api/health' && req.method === 'GET') {
    return res.status(200).json({
      ok: true,
      env: {
        MONGODB_URI: !!process.env.MONGODB_URI,
        JWT_SECRET: !!process.env.JWT_SECRET,
        RAZORPAY_KEY_ID: !!process.env.RAZORPAY_KEY_ID,
        YOUTUBE_API_KEY: !!process.env.YOUTUBE_API_KEY,
      }
    });
  }

  // ===== DB SETUP =====
  const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

  try {
    await connectDB();
  } catch (dbErr: any) {
    console.error('[Vercel] DB/Setup error:', dbErr.message);
    return res.status(500).json({
      error: `Server setup failed: ${dbErr.message}`,
      hint: 'Ensure MONGODB_URI, JWT_SECRET are set in Vercel Environment Variables'
    });
  }

  // Helper: require user auth
  const requireUser = async (): Promise<string | null> => {
    const userId = await getUserId(req, jwt, JWT_SECRET);
    if (!userId) { res.status(401).json({ error: 'Not logged in' }); return null; }
    return userId;
  };

  // Helper: require admin auth
  const requireAdmin = (): boolean => {
    const token = (req.headers.authorization || '').split(' ')[1];
    if (!token) { res.status(401).json({ error: 'No token provided' }); return false; }
    try { jwt.verify(token, JWT_SECRET); return true; }
    catch { res.status(401).json({ error: 'Invalid or expired token' }); return false; }
  };

  try {
    // ═══════════ AUTH ROUTES ═══════════

    // POST /api/auth/register
    if (path === '/api/auth/register' && req.method === 'POST') {
      const { name, email, password } = req.body;
      if (!name || !email || !password) return res.status(400).json({ error: 'Name, email, and password are required' });
      if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });
      const exists = await User.findOne({ email: email.toLowerCase() });
      if (exists) return res.status(400).json({ error: 'An account with this email already exists' });
      const passwordHash = await bcrypt.hash(password, 12);
      const user = await User.create({ email: email.toLowerCase(), name: name.trim(), passwordHash });
      const token = jwt.sign({ userId: user._id, role: 'user' }, JWT_SECRET, { expiresIn: '7d' });
      return res.json({
        success: true, token,
        user: { id: user._id, name: user.name, email: user.email, mobile: user.mobile || '', country: user.country || '', plan: user.plan, features: user.features, downloadsAllowed: user.downloadsAllowed, downloadsUsed: user.downloadsUsed, expiresAt: user.expiresAt }
      });
    }

    // POST /api/auth/login
    if (path === '/api/auth/login' && req.method === 'POST') {
      const { email, password } = req.body;
      if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });
      const user = await User.findOne({ email: email.toLowerCase() });
      if (!user) return res.status(401).json({ error: 'Invalid email or password' });
      const match = await bcrypt.compare(password, user.passwordHash);
      if (!match) return res.status(401).json({ error: 'Invalid email or password' });
      const token = jwt.sign({ userId: user._id, role: 'user' }, JWT_SECRET, { expiresIn: '7d' });
      return res.json({
        success: true, token,
        user: { id: user._id, name: user.name, email: user.email, mobile: user.mobile || '', country: user.country || '', plan: user.plan, features: user.features, downloadsAllowed: user.downloadsAllowed, downloadsUsed: user.downloadsUsed, expiresAt: user.expiresAt }
      });
    }

    // GET /api/auth/me
    if (path === '/api/auth/me' && req.method === 'GET') {
      const userId = await requireUser();
      if (!userId) return;
      const user = await User.findById(userId).select('-passwordHash');
      if (!user) return res.status(404).json({ error: 'User not found' });
      return res.json({
        user: { id: user._id, name: user.name, email: user.email, mobile: user.mobile || '', country: user.country || '', plan: user.plan, features: user.features, downloadsAllowed: user.downloadsAllowed, downloadsUsed: user.downloadsUsed, expiresAt: user.expiresAt }
      });
    }

    // POST /api/auth/download
    if (path === '/api/auth/download' && req.method === 'POST') {
      const userId = await requireUser();
      if (!userId) return;
      const { type } = req.body;
      const user = await User.findById(userId);
      if (!user) return res.status(404).json({ error: 'User not found' });
      if (!user.plan) return res.status(403).json({ error: 'No active subscription. Please purchase a plan.' });
      if (!user.isActive) return res.status(403).json({ error: 'Account deactivated. Contact admin.' });
      const now = new Date().toISOString().split('T')[0];
      if (user.downloadsUsed >= user.downloadsAllowed) return res.status(403).json({ error: 'Download limit reached. Upgrade your plan.' });
      if (type === 'ppt' && !user.features.ppt) return res.status(403).json({ error: 'PPT export not included in your plan' });
      if (type === 'pdf' && !user.features.pdf) return res.status(403).json({ error: 'PDF export not included in your plan' });
      await User.updateOne({ _id: user._id }, { $inc: { downloadsUsed: 1 } });
      return res.json({ success: true, downloadsUsed: user.downloadsUsed + 1, downloadsAllowed: user.downloadsAllowed });
    }

    // PUT /api/auth/profile
    if (path === '/api/auth/profile' && req.method === 'PUT') {
      const userId = await requireUser();
      if (!userId) return;
      const { name } = req.body;
      if (!name || !name.trim()) return res.status(400).json({ error: 'Name is required' });
      await User.updateOne({ _id: userId }, { name: name.trim() });
      const user = await User.findById(userId).select('-passwordHash -encryptedApiKey');
      return res.json({
        success: true,
        user: { id: user._id, name: user.name, email: user.email, mobile: user.mobile || '', country: user.country || '', plan: user.plan, features: user.features, downloadsAllowed: user.downloadsAllowed, downloadsUsed: user.downloadsUsed, expiresAt: user.expiresAt }
      });
    }

    // PUT /api/auth/api-key
    if (path === '/api/auth/api-key' && req.method === 'PUT') {
      const userId = await requireUser();
      if (!userId) return;
      const { apiKey } = req.body;
      if (!apiKey || !apiKey.trim()) return res.status(400).json({ error: 'API Key is required' });
      const encrypted = encryptKey(apiKey.trim(), JWT_SECRET);
      await User.updateOne({ _id: userId }, { encryptedApiKey: encrypted });
      return res.json({ success: true, keyHint: maskKey(apiKey.trim()) });
    }

    // DELETE /api/auth/api-key
    if (path === '/api/auth/api-key' && req.method === 'DELETE') {
      const userId = await requireUser();
      if (!userId) return;
      await User.updateOne({ _id: userId }, { encryptedApiKey: null });
      return res.json({ success: true });
    }

    // GET /api/auth/has-key
    if (path === '/api/auth/has-key' && req.method === 'GET') {
      const userId = await requireUser();
      if (!userId) return;
      const user = await User.findById(userId);
      if (!user) return res.status(404).json({ error: 'User not found' });
      let hasKey = false, keyHint = '', keySource = '';
      if (user.encryptedApiKey) {
        hasKey = true;
        keyHint = maskKey(decryptKey(user.encryptedApiKey, JWT_SECRET));
        keySource = 'personal';
      } else if (user.plan) {
        const plan = await Plan.findOne({ name: user.plan });
        if (plan?.encryptedApiKey) {
          hasKey = true;
          keyHint = maskKey(decryptKey(plan.encryptedApiKey, JWT_SECRET));
          keySource = 'plan';
        }
      }
      return res.json({ hasKey, keyHint, keySource });
    }

    // ═══════════ PAYMENT ROUTES ═══════════

    // GET /api/payment/key
    if (path === '/api/payment/key' && req.method === 'GET') {
      return res.json({ key: process.env.RAZORPAY_KEY_ID });
    }

    // POST /api/payment/create-order
    if (path === '/api/payment/create-order' && req.method === 'POST') {
      const userId = await requireUser();
      if (!userId) return;
      const razorpay = new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID || '', key_secret: process.env.RAZORPAY_KEY_SECRET || '' });
      const { planId } = req.body;
      const user = await User.findById(userId);
      if (!user) return res.status(404).json({ error: 'User not found' });
      const plan = await Plan.findOne({ planId });
      if (!plan) return res.status(404).json({ error: 'Plan not found' });
      if (plan.price === 0) {
        await User.updateOne({ _id: user._id }, { plan: plan.name, features: plan.features, downloadsAllowed: plan.downloads, downloadsUsed: 0, isActive: true });
        return res.json({ success: true, free: true, message: 'Free plan activated!' });
      }
      const amount = Math.round(plan.price * 100);
      const receipt = `rcpt_${Date.now()}`.slice(0, 40);
      const order = await razorpay.orders.create({ amount, currency: plan.currency || 'INR', receipt, notes: { planId: String(planId), planName: String(plan.name), userId: String(user._id), userEmail: String(user.email) } });
      return res.json({ success: true, orderId: order.id, amount: order.amount, currency: order.currency, planName: plan.name, key: process.env.RAZORPAY_KEY_ID });
    }

    // POST /api/payment/verify
    if (path === '/api/payment/verify' && req.method === 'POST') {
      const userId = await requireUser();
      if (!userId) return;
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature, planId } = req.body;
      const body = razorpay_order_id + '|' + razorpay_payment_id;
      const expectedSignature = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '').update(body).digest('hex');
      if (expectedSignature !== razorpay_signature) return res.status(400).json({ error: 'Payment verification failed. Invalid signature.' });
      const user = await User.findById(userId);
      if (!user) return res.status(404).json({ error: 'User not found' });
      const plan = await Plan.findOne({ planId });
      if (!plan) return res.status(404).json({ error: 'Plan not found' });
      await User.updateOne({ _id: user._id }, { plan: plan.name, features: plan.features, downloadsAllowed: plan.downloads, downloadsUsed: 0, isActive: true });
      await PendingRequest.create({ email: user.email, userId: user._id, planId, requestType: 'payment', status: 'completed', razorpayOrderId: razorpay_order_id, razorpayPaymentId: razorpay_payment_id, requestedAt: new Date().toISOString() });
      return res.json({ success: true, message: 'Payment successful! Your plan is now active.' });
    }

    // POST /api/payment/refill
    if (path === '/api/payment/refill' && req.method === 'POST') {
      const userId = await requireUser();
      if (!userId) return;
      const Razorpay = (await import('razorpay')).default;
      const razorpay = new Razorpay({ key_id: process.env.RAZORPAY_KEY_ID || '', key_secret: process.env.RAZORPAY_KEY_SECRET || '' });
      const user = await User.findById(userId);
      if (!user) return res.status(404).json({ error: 'User not found' });
      if (!user.plan) return res.status(400).json({ error: 'No active plan' });
      const plan = await Plan.findOne({ name: user.plan });
      if (!plan) return res.status(404).json({ error: 'Plan not found' });
      if (plan.price === 0) {
        await User.updateOne({ _id: user._id }, { downloadsUsed: 0 });
        return res.json({ success: true, free: true, message: 'Usage quota reset!' });
      }
      const refillPrice = Math.round(plan.price * 0.95 * 100);
      const receipt = `refill_${Date.now()}`.slice(0, 40);
      const order = await razorpay.orders.create({ amount: refillPrice, currency: plan.currency || 'INR', receipt, notes: { planId: String(plan.planId), type: 'refill', userId: String(user._id), userEmail: String(user.email), discount: '5%' } });
      return res.json({ success: true, orderId: order.id, amount: order.amount, currency: order.currency, planName: plan.name, key: process.env.RAZORPAY_KEY_ID });
    }

    // POST /api/payment/verify-refill
    if (path === '/api/payment/verify-refill' && req.method === 'POST') {
      const userId = await requireUser();
      if (!userId) return;
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
      const body = razorpay_order_id + '|' + razorpay_payment_id;
      const expectedSignature = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '').update(body).digest('hex');
      if (expectedSignature !== razorpay_signature) return res.status(400).json({ error: 'Payment verification failed.' });
      const user = await User.findById(userId);
      if (!user) return res.status(404).json({ error: 'User not found' });
      await User.updateOne({ _id: user._id }, { downloadsUsed: 0 });
      await PendingRequest.create({ email: user.email, userId: user._id, planId: user.plan, requestType: 'refill', status: 'completed', razorpayOrderId: razorpay_order_id, razorpayPaymentId: razorpay_payment_id, requestedAt: new Date().toISOString() });
      return res.json({ success: true, message: 'Refill successful! Usage quota reset.' });
    }

    // ═══════════ PUBLIC ROUTES ═══════════

    // GET /api/history
    if (path === '/api/history' && req.method === 'GET') {
      const userId = await requireUser();
      if (!userId) return;
      const history = await AnalysisLog.find({ userId }).sort({ timestamp: -1 }).limit(50).lean();
      return res.json({ history });
    }

    // GET /api/plans
    if (path === '/api/plans' && req.method === 'GET') {
      const plans = await Plan.find({}).sort({ price: 1 });
      return res.json({ plans });
    }

    // POST /api/promo/validate
    if (path === '/api/promo/validate' && req.method === 'POST') {
      const { code } = req.body;
      const promo = await PromoCode.findOne({ code, isActive: true });
      if (!promo) return res.status(404).json({ error: 'Invalid or inactive promo code' });
      const now = new Date().toISOString().split('T')[0];
      if (now < promo.validFrom || now > promo.validUntil) return res.status(400).json({ error: 'Promo code expired or not yet valid' });
      if (promo.usedCount >= promo.maxUses) return res.status(400).json({ error: 'Promo code max uses reached' });
      await PromoCode.updateOne({ _id: promo._id }, { $inc: { usedCount: 1 } });
      return res.json({ success: true, features: promo.features });
    }

    // POST /api/subscribe/request
    if (path === '/api/subscribe/request' && req.method === 'POST') {
      const { email, planId } = req.body;
      const existing = await PendingRequest.findOne({ email, status: 'pending' });
      if (existing) return res.status(400).json({ error: 'Request already pending for this email' });
      await PendingRequest.create({ email, planId, status: 'pending', requestedAt: new Date().toISOString() });
      return res.json({ success: true, message: 'Payment simulated. Request sent to admin for activation.' });
    }

    // POST /api/subscribe/validate
    if (path === '/api/subscribe/validate' && req.method === 'POST') {
      const { email } = req.body;
      const sub = await Subscriber.findOne({ email, isActive: true });
      if (!sub) return res.status(404).json({ error: 'No active subscription found for this email' });
      if (sub.downloadsUsed >= sub.downloadsAllowed) return res.status(400).json({ error: 'Download limit reached' });
      return res.json({ success: true, sub });
    }

    // POST /api/subscribe/use
    if (path === '/api/subscribe/use' && req.method === 'POST') {
      const { email } = req.body;
      await Subscriber.updateOne({ email, isActive: true }, { $inc: { downloadsUsed: 1 } });
      return res.json({ success: true });
    }

    // ═══════════ ADMIN ROUTES ═══════════

    // POST /api/admin/login
    if (path === '/api/admin/login' && req.method === 'POST') {
      const { password } = req.body;
      const config = await AdminConfig.findOne({ key: 'adminPassword' });
      if (!config) return res.status(500).json({ error: 'Admin password not configured. Run seed script.' });
      const match = await bcrypt.compare(password, config.value);
      if (!match) return res.status(401).json({ error: 'Invalid password' });
      const token = jwt.sign({ role: 'admin' }, JWT_SECRET, { expiresIn: '4h' });
      return res.json({ success: true, token });
    }

    // POST /api/admin/change-password
    if (path === '/api/admin/change-password' && req.method === 'POST') {
      if (!requireAdmin()) return;
      const { oldPassword, newPassword } = req.body;
      if (!oldPassword || !newPassword || newPassword.length < 6) return res.status(400).json({ error: 'New password must be at least 6 characters' });
      const config = await AdminConfig.findOne({ key: 'adminPassword' });
      if (!config) return res.status(500).json({ error: 'Admin password not configured' });
      const match = await bcrypt.compare(oldPassword, config.value);
      if (!match) return res.status(401).json({ error: 'Current password is incorrect' });
      const hashed = await bcrypt.hash(newPassword, 12);
      await AdminConfig.updateOne({ key: 'adminPassword' }, { value: hashed });
      return res.json({ success: true, message: 'Password changed successfully' });
    }

    // GET /api/admin/data
    if (path === '/api/admin/data' && req.method === 'GET') {
      if (!requireAdmin()) return;
      const [promoCodes, subscribers, pendingRequests, plans, analysisLogs, variableConfigs] = await Promise.all([
        PromoCode.find().lean(), User.find({ plan: { $ne: null } }).select('-passwordHash').lean(),
        PendingRequest.find({ status: 'pending' }).lean(), Plan.find().lean(), AnalysisLog.find().sort({ timestamp: -1 }).limit(200).lean(),
        VariableConfig.find().lean()
      ]);
      return res.json({ promoCodes, subscribers, pendingRequests, plans, analysisLogs, variableConfigs });
    }

    // POST /api/admin/data
    if (path === '/api/admin/data' && req.method === 'POST') {
      if (!requireAdmin()) return;
      const { promoCodes, subscribers, pendingRequests, plans, variableConfigs } = req.body;
      if (promoCodes) for (const pc of promoCodes) { const { _id, ...data } = pc; if (_id) await PromoCode.findByIdAndUpdate(_id, data, { upsert: true }); else await PromoCode.create(data); }
      if (subscribers) for (const sub of subscribers) { const { _id, ...data } = sub; if (_id) await Subscriber.findByIdAndUpdate(_id, data, { upsert: true }); else await Subscriber.create(data); }
      if (pendingRequests) { await PendingRequest.deleteMany({ status: 'pending' }); const pending = pendingRequests.filter((r: any) => r.status === 'pending'); if (pending.length) await PendingRequest.insertMany(pending); }
      if (variableConfigs) for (const vc of variableConfigs) { const { _id, ...data } = vc; if (_id) await VariableConfig.findByIdAndUpdate(_id, data, { upsert: true }); else await VariableConfig.create(data); }
      return res.json({ success: true });
    }

    // POST /api/admin/toggle-user/:id
    const toggleMatch = path.match(/^\/api\/admin\/toggle-user\/(.+)$/);
    if (toggleMatch && req.method === 'POST') {
      if (!requireAdmin()) return;
      const user = await User.findById(toggleMatch[1]);
      if (!user) return res.status(404).json({ error: 'User not found' });
      await User.updateOne({ _id: user._id }, { isActive: !user.isActive });
      return res.json({ success: true });
    }

    // POST /api/admin/user/:id/api-key
    const userKeyMatch = path.match(/^\/api\/admin\/user\/(.+)\/api-key$/);
    if (userKeyMatch && req.method === 'POST') {
      if (!requireAdmin()) return;
      const { apiKey } = req.body;
      const user = await User.findById(userKeyMatch[1]);
      if (!user) return res.status(404).json({ error: 'User not found' });
      if (!apiKey || !apiKey.trim()) {
        await User.updateOne({ _id: user._id }, { encryptedApiKey: null });
        return res.json({ success: true, removed: true });
      }
      const encrypted = encryptKey(apiKey.trim(), JWT_SECRET);
      await User.updateOne({ _id: user._id }, { encryptedApiKey: encrypted });
      return res.json({ success: true, keyHint: maskKey(apiKey.trim()) });
    }

    // POST /api/admin/plan/:id
    const planUpdateMatch = path.match(/^\/api\/admin\/plan\/(.+)$/);
    if (planUpdateMatch && !path.includes('/api-key') && req.method === 'POST') {
      if (!requireAdmin()) return;
      const updates = req.body;
      const allowed: any = {};
      if (updates.name !== undefined) allowed.name = updates.name;
      if (updates.price !== undefined) allowed.price = Number(updates.price);
      if (updates.downloads !== undefined) allowed.downloads = Number(updates.downloads);
      if (updates.features !== undefined) allowed.features = updates.features;
      if (updates.isActive !== undefined) allowed.isActive = updates.isActive;
      await Plan.findByIdAndUpdate(planUpdateMatch[1], allowed);
      return res.json({ success: true });
    }

    // POST /api/admin/plan/:id/api-key
    const planKeyMatch = path.match(/^\/api\/admin\/plan\/(.+)\/api-key$/);
    if (planKeyMatch && req.method === 'POST') {
      if (!requireAdmin()) return;
      const { apiKey } = req.body;
      if (!apiKey || !apiKey.trim()) {
        await Plan.findByIdAndUpdate(planKeyMatch[1], { encryptedApiKey: null });
        return res.json({ success: true, removed: true });
      }
      const encrypted = encryptKey(apiKey.trim(), JWT_SECRET);
      await Plan.findByIdAndUpdate(planKeyMatch[1], { encryptedApiKey: encrypted });
      return res.json({ success: true, keyHint: maskKey(apiKey.trim()) });
    }

    // POST /api/admin/approve-user/:requestId
    const approveMatch = path.match(/^\/api\/admin\/approve-user\/(.+)$/);
    if (approveMatch && req.method === 'POST') {
      if (!requireAdmin()) return;
      const pending = await PendingRequest.findById(approveMatch[1]);
      if (!pending) return res.status(404).json({ error: 'Request not found' });
      const plan = await Plan.findOne({ planId: pending.planId });
      if (!plan) return res.status(404).json({ error: 'Plan not found' });
      if (pending.requestType === 'refill') {
        await User.updateOne({ email: pending.email }, { downloadsUsed: 0 });
      } else {
        await User.updateOne({ email: pending.email }, { plan: plan.name, features: plan.features, downloadsAllowed: plan.downloads, downloadsUsed: 0, isActive: true });
      }
      await PendingRequest.findByIdAndDelete(pending._id);
      return res.json({ success: true });
    }

    // POST /api/admin/reject-request/:requestId
    const rejectMatch = path.match(/^\/api\/admin\/reject-request\/(.+)$/);
    if (rejectMatch && req.method === 'POST') {
      if (!requireAdmin()) return;
      await PendingRequest.findByIdAndDelete(rejectMatch[1]);
      return res.json({ success: true });
    }

    // ═══════════ YOUTUBE SEARCH ═══════════
    if (path === '/api/youtube-search' && req.method === 'GET') {
      const query = (req.query.q || '') as string;
      if (!query) return res.status(400).json({ error: 'Query required' });
      const ytKey = process.env.YOUTUBE_API_KEY;
      if (!ytKey) return res.json({ videos: [], message: 'YOUTUBE_API_KEY not configured' });
      const searchUrl = new URL('https://www.googleapis.com/youtube/v3/search');
      searchUrl.searchParams.set('part', 'snippet');
      searchUrl.searchParams.set('q', `${query} news latest`);
      searchUrl.searchParams.set('type', 'video');
      searchUrl.searchParams.set('order', 'relevance');
      searchUrl.searchParams.set('maxResults', '4');
      searchUrl.searchParams.set('videoEmbeddable', 'true');
      searchUrl.searchParams.set('relevanceLanguage', 'en');
      searchUrl.searchParams.set('key', ytKey);
      const ytRes = await fetch(searchUrl.toString());
      if (!ytRes.ok) return res.json({ videos: [], message: 'YouTube API error' });
      const data = await ytRes.json();
      const videos = (data.items || []).map((item: any) => ({
        id: item.id?.videoId, title: item.snippet?.title, channel: item.snippet?.channelTitle,
        thumbnail: item.snippet?.thumbnails?.medium?.url, publishedAt: item.snippet?.publishedAt,
      }));
      return res.json({ videos });
    }

    // ═══════════ ANALYZE (main endpoint) ═══════════
    if ((path === '/api/analyze' || path === '/api' || path === '') && req.method === 'POST') {
      let { apiKey, problem } = req.body;

      // If user is logged in and has a stored key, use that
      const authToken = (req.headers.authorization || '').split(' ')[1];
      if (!apiKey && authToken) {
        try {
          const decoded: any = jwt.verify(authToken, JWT_SECRET);
          if (decoded.userId) {
            const user = await User.findById(decoded.userId);
            if (user?.encryptedApiKey) {
              apiKey = decryptKey(user.encryptedApiKey, JWT_SECRET);
            } else if (user?.plan) {
              const plan = await Plan.findOne({ name: user.plan });
              if (plan?.encryptedApiKey) {
                apiKey = decryptKey(plan.encryptedApiKey, JWT_SECRET);
              }
            }
          }
        } catch {}
      }

      if (!apiKey || !problem) {
        return res.status(400).json({ error: 'API Key and Problem are required.' });
      }

      const { VariableConfig } = await import('./db.js');
      const variables = await VariableConfig.find({ isActive: true }).lean();

      const parsedData = await parseProblem(apiKey, problem, variables);
      const evidence = {
        historicalCases: [
          { id: 'HC-001', description: 'Similar coordination failure in 2018', relevance: 0.85 },
          { id: 'HC-002', description: 'Successful integration in adjacent sector', relevance: 0.72 }
        ],
        structuredData: { averageHistoricalPsi: 0.42, commonFailureModes: ['Trust Fragmentation', 'Resource Depletion'] }
      };

      const defaultVars: any = variables.reduce((acc: any, v: any) => {
        acc[v.symbol] = v.defaultValue;
        return acc;
      }, {
        Deltas: [0.1, 0.05, 0.02, 0.01, 0.01, 0.01],
        weights: [1]
      });

      const inputs = { ...defaultVars, ...(parsedData.mappedVariables || {}) };
      if (!Array.isArray(inputs.Deltas) || inputs.Deltas.length !== 6) inputs.Deltas = defaultVars.Deltas;

      const cipfResults = computeCIPF(inputs, variables);
      const avgRelevance = evidence.historicalCases.reduce((acc, c) => acc + c.relevance, 0) / evidence.historicalCases.length;
      const confidence = { C_final: (0.8 + avgRelevance * 0.1 + 0.75 + avgRelevance * 0.1 + 0.85 + 0.80) / 4 };
      const report = `Geostrate CIPF v4.0 Report\nΨ_final: ${cipfResults.Psi_final.toFixed(4)}\nStatus: ${cipfResults.Psi_final >= 0.387 ? 'VIABLE' : 'CRITICAL RISK'}\nConfidence: ${(confidence.C_final * 100).toFixed(1)}%`;

      // Save Analysis History to Database
      const { guestName, guestEmail, guestMobile, guestCountry } = req.body;
      const riskScore = parsedData?.executiveSummary?.globalRiskIndicator || 0;
      
      let userId = null;
      let userType = 'guest';
      if (authToken) {
        try {
          const decoded: any = jwt.verify(authToken, JWT_SECRET);
          if (decoded.userId) {
            userId = decoded.userId;
            userType = 'user';
          }
        } catch {}
      }

      try {
        await AnalysisLog.create({
          userType,
          userId,
          guestDetails: {
            name: guestName || '',
            email: guestEmail || '',
            mobile: guestMobile || '',
            country: guestCountry || ''
          },
          problem,
          riskScore,
          psiScore: cipfResults.Psi_final,
          timestamp: new Date().toISOString()
        });
      } catch (err) {
        console.error('Failed to save analysis log:', err);
      }

      return res.status(200).json({ parsedData, evidence, cipf: cipfResults, confidence, report, inputs });
    }

    // ═══════════ 404 ═══════════
    return res.status(404).json({ error: `Route not found: ${req.method} ${path}` });

  } catch (error: any) {
    console.error('[Vercel] Error:', error.message || error);
    return res.status(500).json({ error: error.message || 'An error occurred.' });
  }
}
