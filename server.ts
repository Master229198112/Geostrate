import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import express from 'express';
import { createServer as createViteServer } from 'vite';
import { parseProblem } from './src/backend/gemini_service';
import { retrieveEvidence } from './src/backend/evidence_service';
import { computeCIPF } from './src/lib/cipf_core';
import { computeConfidence } from './src/backend/confidence_engine';
import { generateReport } from './src/backend/report_generator';
import path from 'path';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import Razorpay from 'razorpay';

// ===== RATE LIMITER =====
const RATE_LIMIT_WINDOW = 60_000; // 1 minute
const RATE_LIMIT_MAX = 5; // 5 requests per minute per IP
const rateLimitMap = new Map<string, { count: number; firstRequest: number }>();

setInterval(() => {
  const now = Date.now();
  for (const [ip, data] of rateLimitMap) {
    if (now - data.firstRequest > RATE_LIMIT_WINDOW) rateLimitMap.delete(ip);
  }
}, 60_000);

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  if (!entry || now - entry.firstRequest > RATE_LIMIT_WINDOW) {
    rateLimitMap.set(ip, { count: 1, firstRequest: now });
    return true;
  }
  entry.count++;
  return entry.count <= RATE_LIMIT_MAX;
}

// ===== API KEY ENCRYPTION (AES-256-CBC) =====
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

async function startServer() {
  const app = express();
  const PORT = 3000;

  // CORS
  app.use((req, res, next) => {
    const origin = req.headers.origin || '';
    const allowed = [
      'http://localhost:3000', 
      'http://localhost:5173', 
      'https://geostrate.aircwou.in',
      'https://geostrate.vercel.app'
    ];
    if (!origin || allowed.includes(origin) || origin.endsWith('.vercel.app') || origin.endsWith('.aircwou.in')) {
      res.header('Access-Control-Allow-Origin', origin || '*');
    }
    res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    if (req.method === 'OPTIONS') return res.sendStatus(204);
    next();
  });

  app.use(express.json({ limit: '10mb' }));

  // ===== YOUTUBE SEARCH (for Live News Panel) =====
  app.get('/api/youtube-search', async (req: any, res: any) => {
    try {
      const query = req.query.q as string;
      if (!query) return res.status(400).json({ error: 'Query required' });

      const ytKey = process.env.YOUTUBE_API_KEY;
      if (!ytKey) {
        return res.status(200).json({ videos: [], message: 'YOUTUBE_API_KEY not configured' });
      }

      // Search YouTube for recent relevant videos (news, live, or recent uploads)
      const searchUrl = new URL('https://www.googleapis.com/youtube/v3/search');
      searchUrl.searchParams.set('part', 'snippet');
      searchUrl.searchParams.set('q', `${query} news latest`);
      searchUrl.searchParams.set('type', 'video');
      searchUrl.searchParams.set('order', 'relevance');
      searchUrl.searchParams.set('maxResults', '4');
      searchUrl.searchParams.set('videoEmbeddable', 'true');
      searchUrl.searchParams.set('relevanceLanguage', 'en');
      searchUrl.searchParams.set('key', ytKey);

      const response = await fetch(searchUrl.toString());
      if (!response.ok) {
        const err = await response.text();
        console.error('YouTube API error:', err);
        return res.status(200).json({ videos: [], message: 'YouTube API error' });
      }

      const data = await response.json();
      const videos = (data.items || []).map((item: any) => ({
        id: item.id?.videoId,
        title: item.snippet?.title,
        channel: item.snippet?.channelTitle,
        thumbnail: item.snippet?.thumbnails?.medium?.url,
        publishedAt: item.snippet?.publishedAt,
      }));

      res.json({ videos });
    } catch (err: any) {
      console.error('YouTube search error:', err.message);
      res.status(200).json({ videos: [], message: 'Search failed' });
    }
  });

  app.post('/api/analyze', async (req, res) => {
    try {
      const clientIp = req.ip || req.socket.remoteAddress || 'unknown';
      if (!checkRateLimit(clientIp)) {
        return res.status(429).json({ error: 'Too many requests. Please wait a minute before trying again.' });
      }

      let { apiKey, problem } = req.body;
      if (!problem) {
        return res.status(400).json({ error: 'Problem is required.' });
      }

      // If user is logged in and has a stored key, use that instead
      const authToken = req.headers.authorization?.split(' ')[1];
      if (!apiKey && authToken) {
        try {
          const jwt = (await import('jsonwebtoken')).default;
          const JWT_SECRET_LOCAL = process.env.JWT_SECRET || 'fallback_secret';
          const decoded: any = jwt.verify(authToken, JWT_SECRET_LOCAL);
          if (decoded.userId) {
            const { User, Plan } = await import('./api/db.js');
            const user = await User.findById(decoded.userId);
            if (user) {
              // Priority: user's personal key > plan-level key
              if (user.encryptedApiKey) {
                apiKey = decryptKey(user.encryptedApiKey, JWT_SECRET_LOCAL);
              } else if (user.plan) {
                const plan = await Plan.findOne({ name: user.plan });
                if (plan?.encryptedApiKey) {
                  apiKey = decryptKey(plan.encryptedApiKey, JWT_SECRET_LOCAL);
                }
              }
            }
          }
        } catch { /* token invalid, continue without stored key */ }
      }

      if (!apiKey) {
        return res.status(400).json({ error: 'API Key is required. Please enter a key or set one in your profile.' });
      }

      // 1. Gemini parses entities and structure
      const parsedData = await parseProblem(apiKey, problem);
      
      // 2. Evidence retrieval
      const evidence = retrieveEvidence(problem, parsedData.entities);

      // 3. Compute CIPF deterministically
      // Fill missing variables with defaults
      const defaultVars = {
        HPA: 0.5, EII: 0.5, CLS: 0.5, GPI: 0.5, SI: 0.5,
        WMC: 0.5, PS: 0.5, EF: 0.5, AC: 0.5,
        ERA: 0.5, ERE: 0.5, ST: 0.5, IC: 0.5,
        TC: 0.5, PC: 0.5, SCFR: 0.5, EVC: 0.5, FER: 0.5,
        NC: 0.5, TI: 0.5, RNA: 0.5, RC: 0.5,
        CCR: 0.5, SNR: 0.5, LCA: 0.5, VM: 0.5,
        SC: 0.5, OM: 0.5, EPC: 0.5, VT: 0.5,
        RCC: 0.5, POC: 0.5, LTO: 0.5, CPT: 0.5,
        PPPA: 0.5, SQ: 0.5, AS: 0.5, DAB: 0.5,
        Flexibility: 0.5, tau: 1, tau_max: 10, f: 0.5, sigma: 1, sigma_max: 10, rho: 0.5,
        VW: 0.5, Complexity: 0.5, baseline: 1, alpha: 0.1, load: 2, lambda: 0.1,
        Deltas: [0.1, 0.05, 0.02, 0.01, 0.01, 0.01],
        alpha_IC: 0.1, GroupBonus: 0.1, alpha_PD: 0.5, ELF: 0.5,
        ResourceAvailability: 1, EcologicalCapacity: 1, ClimateBudget: 1,
        weights: [1]
      };

      const inputs = { ...defaultVars, ...(parsedData.mappedVariables || {}) };
      
      // Ensure Deltas is an array of 6
      if (!Array.isArray(inputs.Deltas) || inputs.Deltas.length !== 6) {
        inputs.Deltas = defaultVars.Deltas;
      }

      const cipfResults = computeCIPF(inputs as any);

      // 4. Confidence Propagation
      // Mocking layer confidences based on evidence relevance
      const avgRelevance = evidence.historicalCases.reduce((acc, c) => acc + c.relevance, 0) / evidence.historicalCases.length;
      const confidence = computeConfidence({
        C_L0: 0.8 + (avgRelevance * 0.1),
        C_L1: 0.75 + (avgRelevance * 0.1),
        C_L2: 0.85,
        C_L3: 0.80
      });

      // 5. Generate Report
      const report = `Geostrate CIPF v4.0 Report\nΨ_final: ${cipfResults.Psi_final.toFixed(4)}\nStatus: ${cipfResults.Psi_final >= 0.387 ? 'VIABLE' : 'CRITICAL RISK'}\nConfidence: ${(confidence.C_final * 100).toFixed(1)}%`;

    // Save Analysis History to Database
    const { guestName, guestEmail, guestMobile, guestCountry } = req.body;
    const riskScore = parsedData?.executiveSummary?.globalRiskIndicator || 0;
    
    let userId = null;
    let userType = 'guest';
    const authTokenForHistory = req.headers.authorization?.split(' ')[1];
    
    if (authTokenForHistory) {
      try {
        const jwt = (await import('jsonwebtoken')).default;
        const JWT_SECRET_LOCAL = process.env.JWT_SECRET || 'fallback_secret';
        const decoded: any = jwt.verify(authTokenForHistory, JWT_SECRET_LOCAL);
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

    res.status(200).json({
      parsedData,
      evidence,
      cipf: cipfResults,
      confidence,
      report,
      inputs
    });

    } catch (error: any) {
      console.error(error);
      res.status(500).json({ error: error.message || 'An error occurred during analysis.' });
    }
  });

  // ===== SUBSCRIPTION & PROMO API (MongoDB) =====
  const { connectDB, PromoCode, Subscriber, PendingRequest, Plan, AdminConfig, User, AnalysisLog } = await import('./api/db.js');
  const bcrypt = (await import('bcryptjs')).default;
  const jwt = (await import('jsonwebtoken')).default;
  const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret';

  await connectDB();

  // ===== USER AUTH =====

  // User auth middleware
  const requireUser = async (req: any, res: any, next: any) => {
    try {
      const token = req.headers.authorization?.split(' ')[1];
      if (!token) return res.status(401).json({ error: 'Not logged in' });
      const decoded: any = jwt.verify(token, JWT_SECRET);
      if (!decoded.userId) return res.status(401).json({ error: 'Invalid token' });
      req.userId = decoded.userId;
      next();
    } catch {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
  };

  // Register
  app.post('/api/auth/register', async (req, res) => {
    try {
      const { name, email, password } = req.body;
      if (!name || !email || !password) return res.status(400).json({ error: 'Name, email, and password are required' });
      if (password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });

      const exists = await User.findOne({ email: email.toLowerCase() });
      if (exists) return res.status(400).json({ error: 'An account with this email already exists' });

      const passwordHash = await bcrypt.hash(password, 12);
      const user = await User.create({
        email: email.toLowerCase(),
        name: name.trim(),
        passwordHash,
      });

      const token = jwt.sign({ userId: user._id, role: 'user' }, JWT_SECRET, { expiresIn: '7d' });
      res.json({
        success: true, token,
        user: { id: user._id, name: user.name, email: user.email, mobile: user.mobile || '', country: user.country || '', plan: user.plan, features: user.features, downloadsAllowed: user.downloadsAllowed, downloadsUsed: user.downloadsUsed, expiresAt: user.expiresAt }
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Login
  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password } = req.body;
      if (!email || !password) return res.status(400).json({ error: 'Email and password are required' });

      const user = await User.findOne({ email: email.toLowerCase() });
      if (!user) return res.status(401).json({ error: 'Invalid email or password' });

      const match = await bcrypt.compare(password, user.passwordHash);
      if (!match) return res.status(401).json({ error: 'Invalid email or password' });

      const token = jwt.sign({ userId: user._id, role: 'user' }, JWT_SECRET, { expiresIn: '7d' });
      res.json({
        success: true, token,
        user: { id: user._id, name: user.name, email: user.email, mobile: user.mobile || '', country: user.country || '', plan: user.plan, features: user.features, downloadsAllowed: user.downloadsAllowed, downloadsUsed: user.downloadsUsed, expiresAt: user.expiresAt }
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Get current user profile
  app.get('/api/auth/me', requireUser, async (req: any, res) => {
    try {
      const user = await User.findById(req.userId).select('-passwordHash');
      if (!user) return res.status(404).json({ error: 'User not found' });
      res.json({
        user: { id: user._id, name: user.name, email: user.email, mobile: user.mobile || '', country: user.country || '', plan: user.plan, features: user.features, downloadsAllowed: user.downloadsAllowed, downloadsUsed: user.downloadsUsed, expiresAt: user.expiresAt }
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Download permission check (server-side gating)
  app.post('/api/auth/download', requireUser, async (req: any, res) => {
    try {
      const { type } = req.body; // 'pdf' or 'ppt'
      const user = await User.findById(req.userId);
      if (!user) return res.status(404).json({ error: 'User not found' });

      if (!user.plan) return res.status(403).json({ error: 'No active subscription. Please purchase a plan.' });
      if (!user.isActive) return res.status(403).json({ error: 'Account deactivated. Contact admin.' });

      const now = new Date().toISOString().split('T')[0];
      if (user.expiresAt && now > user.expiresAt) return res.status(403).json({ error: 'Subscription expired' });
      if (user.downloadsUsed >= user.downloadsAllowed) return res.status(403).json({ error: 'Download limit reached. Upgrade your plan.' });

      if (type === 'ppt' && !user.features.ppt) return res.status(403).json({ error: 'PPT export not included in your plan' });
      if (type === 'pdf' && !user.features.pdf) return res.status(403).json({ error: 'PDF export not included in your plan' });

      // Decrement usage
      await User.updateOne({ _id: user._id }, { $inc: { downloadsUsed: 1 } });
      res.json({ success: true, downloadsUsed: user.downloadsUsed + 1, downloadsAllowed: user.downloadsAllowed });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Update user profile (name)
  app.put('/api/auth/profile', requireUser, async (req: any, res) => {
    try {
      const { name } = req.body;
      if (!name || !name.trim()) return res.status(400).json({ error: 'Name is required' });
      await User.updateOne({ _id: req.userId }, { name: name.trim() });
      const user = await User.findById(req.userId).select('-passwordHash -encryptedApiKey');
      res.json({
        success: true,
        user: { id: user._id, name: user.name, email: user.email, plan: user.plan, features: user.features, downloadsAllowed: user.downloadsAllowed, downloadsUsed: user.downloadsUsed, expiresAt: user.expiresAt }
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ===== API KEY MANAGEMENT =====

  // Save user's own API key (encrypted)
  app.put('/api/auth/api-key', requireUser, async (req: any, res) => {
    try {
      const { apiKey } = req.body;
      if (!apiKey || !apiKey.trim()) return res.status(400).json({ error: 'API Key is required' });
      const encrypted = encryptKey(apiKey.trim(), JWT_SECRET);
      await User.updateOne({ _id: req.userId }, { encryptedApiKey: encrypted });
      res.json({ success: true, keyHint: maskKey(apiKey.trim()) });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Check if user has a stored key
  app.get('/api/auth/has-key', requireUser, async (req: any, res) => {
    try {
      const user = await User.findById(req.userId);
      if (!user) return res.status(404).json({ error: 'User not found' });

      let hasKey = false;
      let keyHint = '';
      let keySource = '';

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

      res.json({ hasKey, keyHint, keySource });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Remove user's personal API key
  app.delete('/api/auth/api-key', requireUser, async (req: any, res) => {
    try {
      await User.updateOne({ _id: req.userId }, { encryptedApiKey: null });
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ===== RAZORPAY PAYMENT =====
  const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || '',
    key_secret: process.env.RAZORPAY_KEY_SECRET || '',
  });

  // Get Razorpay key (public, for frontend)
  app.get('/api/payment/key', (_req, res) => {
    res.json({ key: process.env.RAZORPAY_KEY_ID });
  });

  // Create Razorpay order
  app.post('/api/payment/create-order', requireUser, async (req: any, res) => {
    try {
      const { planId } = req.body;
      const user = await User.findById(req.userId);
      if (!user) return res.status(404).json({ error: 'User not found' });

      const plan = await Plan.findOne({ planId });
      if (!plan) return res.status(404).json({ error: 'Plan not found' });

      if (plan.price === 0) {
        // Free plan — activate immediately
        await User.updateOne({ _id: user._id }, {
          plan: plan.name,
          features: plan.features,
          downloadsAllowed: plan.downloads,
          downloadsUsed: 0,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          isActive: true,
        });
        return res.json({ success: true, free: true, message: 'Free plan activated!' });
      }

      const amount = Math.round(plan.price * 100); // Razorpay expects paise (integer)
      const receipt = `rcpt_${Date.now()}`.slice(0, 40); // Max 40 chars

      console.log('[Razorpay] Creating order:', { amount, currency: plan.currency || 'INR', planId, receipt });

      const order = await razorpay.orders.create({
        amount,
        currency: plan.currency || 'INR',
        receipt,
        notes: {
          planId: String(planId),
          planName: String(plan.name),
          userId: String(user._id),
          userEmail: String(user.email),
        },
      });

      console.log('[Razorpay] Order created:', order.id);

      res.json({
        success: true,
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        planName: plan.name,
        key: process.env.RAZORPAY_KEY_ID,
      });
    } catch (err: any) {
      console.error('[Razorpay] Order creation error:', err);
      res.status(500).json({ error: err.message || 'Failed to create payment order' });
    }
  });

  // Verify payment and activate plan
  app.post('/api/payment/verify', requireUser, async (req: any, res) => {
    try {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature, planId } = req.body;

      // Verify signature
      const body = razorpay_order_id + '|' + razorpay_payment_id;
      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
        .update(body)
        .digest('hex');

      if (expectedSignature !== razorpay_signature) {
        return res.status(400).json({ error: 'Payment verification failed. Invalid signature.' });
      }

      const user = await User.findById(req.userId);
      if (!user) return res.status(404).json({ error: 'User not found' });

      const plan = await Plan.findOne({ planId });
      if (!plan) return res.status(404).json({ error: 'Plan not found' });

      // Activate plan on user
      await User.updateOne({ _id: user._id }, {
        plan: plan.name,
        features: plan.features,
        downloadsAllowed: plan.downloads,
        downloadsUsed: 0,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        isActive: true,
      });

      // Store payment record
      await PendingRequest.create({
        email: user.email,
        userId: user._id,
        planId,
        requestType: 'payment',
        status: 'completed',
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        requestedAt: new Date().toISOString(),
      });

      res.json({ success: true, message: 'Payment successful! Your plan is now active.' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Refill usage quota (creates order for the refill price, or free reset)
  app.post('/api/payment/refill', requireUser, async (req: any, res) => {
    try {
      const user = await User.findById(req.userId);
      if (!user) return res.status(404).json({ error: 'User not found' });
      if (!user.plan) return res.status(400).json({ error: 'No active plan' });

      const plan = await Plan.findOne({ name: user.plan });
      if (!plan) return res.status(404).json({ error: 'Plan not found' });

      if (plan.price === 0) {
        // Free plan refill — just reset
        await User.updateOne({ _id: user._id }, { downloadsUsed: 0 });
        return res.json({ success: true, free: true, message: 'Usage quota reset!' });
      }

      // Create refill order (5% discount on plan price)
      const refillPrice = Math.round(plan.price * 0.95 * 100); // 5% off, in paise
      const receipt = `refill_${Date.now()}`.slice(0, 40);

      const order = await razorpay.orders.create({
        amount: refillPrice,
        currency: plan.currency || 'INR',
        receipt,
        notes: {
          planId: String(plan.planId),
          type: 'refill',
          userId: String(user._id),
          userEmail: String(user.email),
          discount: '5%',
        },
      });

      res.json({
        success: true,
        orderId: order.id,
        amount: order.amount,
        currency: order.currency,
        planName: plan.name,
        key: process.env.RAZORPAY_KEY_ID,
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Verify refill payment
  app.post('/api/payment/verify-refill', requireUser, async (req: any, res) => {
    try {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

      const body = razorpay_order_id + '|' + razorpay_payment_id;
      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || '')
        .update(body)
        .digest('hex');

      if (expectedSignature !== razorpay_signature) {
        return res.status(400).json({ error: 'Payment verification failed.' });
      }

      const user = await User.findById(req.userId);
      if (!user) return res.status(404).json({ error: 'User not found' });

      await User.updateOne({ _id: user._id }, { downloadsUsed: 0 });

      // Store payment record
      await PendingRequest.create({
        email: user.email,
        userId: user._id,
        planId: user.plan,
        requestType: 'refill',
        status: 'completed',
        razorpayOrderId: razorpay_order_id,
        razorpayPaymentId: razorpay_payment_id,
        requestedAt: new Date().toISOString(),
      });

      res.json({ success: true, message: 'Refill successful! Usage quota reset.' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Fetch available plans (public)
  app.get('/api/plans', async (_req, res) => {
    try {
      const plans = await Plan.find({}).sort({ price: 1 });
      res.json({ plans });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Promo Code Validation
  app.post('/api/promo/validate', async (req, res) => {
    try {
      const { code } = req.body;
      const promo = await PromoCode.findOne({ code, isActive: true });
      if (!promo) return res.status(404).json({ error: 'Invalid or inactive promo code' });

      const now = new Date().toISOString().split('T')[0];
      if (now < promo.validFrom || now > promo.validUntil) {
        return res.status(400).json({ error: 'Promo code expired or not yet valid' });
      }
      if (promo.usedCount >= promo.maxUses) {
        return res.status(400).json({ error: 'Promo code max uses reached' });
      }

      await PromoCode.updateOne({ _id: promo._id }, { $inc: { usedCount: 1 } });
      res.json({ success: true, features: promo.features });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Subscription Request (Dummy Payment)
  app.post('/api/subscribe/request', async (req, res) => {
    try {
      const { email, planId } = req.body;
      const existing = await PendingRequest.findOne({ email, status: 'pending' });
      if (existing) return res.status(400).json({ error: 'Request already pending for this email' });

      await PendingRequest.create({
        email, planId, status: 'pending', requestedAt: new Date().toISOString()
      });
      res.json({ success: true, message: 'Payment simulated. Request sent to admin for activation.' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Subscriber Validation
  app.post('/api/subscribe/validate', async (req, res) => {
    try {
      const { email } = req.body;
      const sub = await Subscriber.findOne({ email, isActive: true });
      if (!sub) return res.status(404).json({ error: 'No active subscription found for this email' });

      const now = new Date().toISOString().split('T')[0];
      if (now > sub.expiresAt) return res.status(400).json({ error: 'Subscription expired' });
      if (sub.downloadsUsed >= sub.downloadsAllowed) return res.status(400).json({ error: 'Download limit reached' });

      res.json({ success: true, sub });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Decrement Subscriber Usage
  app.post('/api/subscribe/use', async (req, res) => {
    try {
      const { email } = req.body;
      await Subscriber.updateOne({ email, isActive: true }, { $inc: { downloadsUsed: 1 } });
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Admin Auth Middleware (JWT)
  const requireAdmin = async (req: any, res: any, next: any) => {
    try {
      const token = req.headers.authorization?.split(' ')[1];
      if (!token) return res.status(401).json({ error: 'No token provided' });
      jwt.verify(token, JWT_SECRET);
      next();
    } catch {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
  };

  // Admin Login (bcrypt + JWT)
  app.post('/api/admin/login', async (req, res) => {
    try {
      const { password } = req.body;
      const config = await AdminConfig.findOne({ key: 'adminPassword' });
      if (!config) return res.status(500).json({ error: 'Admin password not configured. Run seed script.' });

      const match = await bcrypt.compare(password, config.value);
      if (!match) return res.status(401).json({ error: 'Invalid password' });

      const token = jwt.sign({ role: 'admin' }, JWT_SECRET, { expiresIn: '4h' });
      res.json({ success: true, token });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Admin Change Password
  app.post('/api/admin/change-password', requireAdmin, async (req: any, res) => {
    try {
      const { oldPassword, newPassword } = req.body;
      if (!oldPassword || !newPassword || newPassword.length < 6) {
        return res.status(400).json({ error: 'New password must be at least 6 characters' });
      }

      const config = await AdminConfig.findOne({ key: 'adminPassword' });
      if (!config) return res.status(500).json({ error: 'Admin password not configured' });

      const match = await bcrypt.compare(oldPassword, config.value);
      if (!match) return res.status(401).json({ error: 'Current password is incorrect' });

      const hashed = await bcrypt.hash(newPassword, 12);
      await AdminConfig.updateOne({ key: 'adminPassword' }, { value: hashed });
      res.json({ success: true, message: 'Password changed successfully' });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Admin Data Read (all collections)
  app.get('/api/admin/data', requireAdmin, async (req: any, res) => {
    try {
      const [promoCodes, subscribers, pendingRequests, plans] = await Promise.all([
        PromoCode.find().lean(),
        User.find({ plan: { $ne: null } }).select('-passwordHash').lean(),
        PendingRequest.find({ status: 'pending' }).lean(),
        Plan.find().lean(),
      ]);
      res.json({ promoCodes, subscribers, pendingRequests, plans });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Admin Data Write (targeted collection updates)
  app.post('/api/admin/data', requireAdmin, async (req: any, res) => {
    try {
      const { promoCodes, subscribers, pendingRequests, plans } = req.body;

      if (promoCodes) {
        for (const pc of promoCodes) {
          const { _id, ...data } = pc;
          if (_id) await PromoCode.findByIdAndUpdate(_id, data, { upsert: true });
          else await PromoCode.create(data);
        }
      }
      if (subscribers) {
        for (const sub of subscribers) {
          const { _id, ...data } = sub;
          if (_id) await Subscriber.findByIdAndUpdate(_id, data, { upsert: true });
          else await Subscriber.create(data);
        }
      }
      if (pendingRequests) {
        // Replace entire pending list (admin may have approved/rejected)
        await PendingRequest.deleteMany({ status: 'pending' });
        const pending = pendingRequests.filter((r: any) => r.status === 'pending');
        if (pending.length) await PendingRequest.insertMany(pending);
      }

      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Admin Toggle User Active Status
  app.post('/api/admin/toggle-user/:id', requireAdmin, async (req: any, res) => {
    try {
      const user = await User.findById(req.params.id);
      if (!user) return res.status(404).json({ error: 'User not found' });
      await User.updateOne({ _id: user._id }, { isActive: !user.isActive });
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Admin Set API Key for a user (Advance plan)
  app.post('/api/admin/user/:id/api-key', requireAdmin, async (req: any, res) => {
    try {
      const { apiKey } = req.body;
      const user = await User.findById(req.params.id);
      if (!user) return res.status(404).json({ error: 'User not found' });

      if (!apiKey || !apiKey.trim()) {
        await User.updateOne({ _id: user._id }, { encryptedApiKey: null });
        return res.json({ success: true, removed: true });
      }

      const encrypted = encryptKey(apiKey.trim(), JWT_SECRET);
      await User.updateOne({ _id: user._id }, { encryptedApiKey: encrypted });
      res.json({ success: true, keyHint: maskKey(apiKey.trim()) });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Admin Update Single Plan
  app.post('/api/admin/plan/:id', requireAdmin, async (req: any, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
      // Only allow safe fields
      const allowed: any = {};
      if (updates.name !== undefined) allowed.name = updates.name;
      if (updates.price !== undefined) allowed.price = Number(updates.price);
      if (updates.downloads !== undefined) allowed.downloads = Number(updates.downloads);
      if (updates.features !== undefined) allowed.features = updates.features;
      if (updates.isActive !== undefined) allowed.isActive = updates.isActive;

      await Plan.findByIdAndUpdate(id, allowed);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Admin Set/Remove Plan-level API Key
  app.post('/api/admin/plan/:id/api-key', requireAdmin, async (req: any, res) => {
    try {
      const { apiKey } = req.body;
      if (!apiKey || !apiKey.trim()) {
        // Remove key
        await Plan.findByIdAndUpdate(req.params.id, { encryptedApiKey: null });
        return res.json({ success: true, removed: true });
      }
      const encrypted = encryptKey(apiKey.trim(), JWT_SECRET);
      await Plan.findByIdAndUpdate(req.params.id, { encryptedApiKey: encrypted });
      res.json({ success: true, keyHint: maskKey(apiKey.trim()) });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Admin: Approve user plan directly
  app.post('/api/admin/approve-user/:requestId', requireAdmin, async (req: any, res) => {
    try {
      const pending = await PendingRequest.findById(req.params.requestId);
      if (!pending) return res.status(404).json({ error: 'Request not found' });

      const plan = await Plan.findOne({ planId: pending.planId });
      if (!plan) return res.status(404).json({ error: 'Plan not found' });

      if (pending.requestType === 'refill') {
        // Refill: just reset usage, keep same plan
        await User.updateOne({ email: pending.email }, { downloadsUsed: 0 });
      } else {
        // New buy or plan change
        const userUpdate = {
          plan: plan.name,
          features: plan.features,
          downloadsAllowed: plan.downloads,
          downloadsUsed: 0,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
          isActive: true,
        };
        await User.updateOne({ email: pending.email }, userUpdate);
      }

      await PendingRequest.findByIdAndDelete(pending._id);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // Admin: Reject user plan request
  app.post('/api/admin/reject-request/:requestId', requireAdmin, async (req: any, res) => {
    try {
      await PendingRequest.findByIdAndDelete(req.params.requestId);
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static('dist'));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
