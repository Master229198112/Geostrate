import mongoose from 'mongoose';

// ===== CONNECTION =====
let connected = false;

export async function connectDB() {
  if (connected) return;
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI not set in environment');

  await mongoose.connect(uri);
  connected = true;
  console.log('✅ MongoDB connected');
}

// ===== SCHEMAS =====

const promoCodeSchema = new mongoose.Schema({
  code:       { type: String, required: true, unique: true },
  features:   { ppt: Boolean, pdf: Boolean },
  maxUses:    { type: Number, default: 100 },
  usedCount:  { type: Number, default: 0 },
  validFrom:  { type: String, required: true },
  validUntil: { type: String, required: true },
  isActive:   { type: Boolean, default: true },
}, { timestamps: true, strict: false });

const subscriberSchema = new mongoose.Schema({
  email:            { type: String, required: true },
  plan:             { type: String, required: true },
  features:         { ppt: Boolean, pdf: Boolean },
  downloadsAllowed: { type: Number, required: true },
  downloadsUsed:    { type: Number, default: 0 },
  activatedAt:      { type: String, required: true },
  expiresAt:        { type: String, required: true },
  isActive:         { type: Boolean, default: true },
}, { timestamps: true, strict: false });

const pendingRequestSchema = new mongoose.Schema({
  email:       { type: String, required: true },
  planId:      { type: String, required: true },
  status:      { type: String, default: 'pending' },
  requestedAt: { type: String, required: true },
}, { timestamps: true, strict: false });

const planSchema = new mongoose.Schema({
  planId:    { type: String, required: true, unique: true },
  name:      { type: String, required: true },
  price:     { type: Number, required: true },
  currency:  { type: String, default: 'INR' },
  downloads: { type: Number, required: true },
  features:  { ppt: Boolean, pdf: Boolean },
  isActive:  { type: Boolean, default: true },
  encryptedApiKey: { type: String, default: null },  // admin sets plan-level API key (AES-256 encrypted)
}, { timestamps: true, strict: false });

const adminConfigSchema = new mongoose.Schema({
  key:   { type: String, required: true, unique: true },
  value: { type: String, required: true },
}, { timestamps: true, strict: false });

const userSchema = new mongoose.Schema({
  email:            { type: String, required: true, unique: true },
  name:             { type: String, required: true },
  mobile:           { type: String, default: '' },
  country:          { type: String, default: '' },
  passwordHash:     { type: String, required: true },
  plan:             { type: String, default: null },       // null = no plan
  features:         { ppt: { type: Boolean, default: false }, pdf: { type: Boolean, default: false } },
  downloadsAllowed: { type: Number, default: 0 },
  downloadsUsed:    { type: Number, default: 0 },
  expiresAt:        { type: String, default: null },
  isActive:         { type: Boolean, default: true },
  encryptedApiKey:  { type: String, default: null },  // user's personal API key (AES-256 encrypted)
}, { timestamps: true, strict: false });

const analysisLogSchema = new mongoose.Schema({
  userType:       { type: String, required: true }, // 'guest' | 'user'
  userId:         { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  guestDetails:   {
    name:         { type: String, default: '' },
    email:        { type: String, default: '' },
    mobile:       { type: String, default: '' },
    country:      { type: String, default: '' }
  },
  problem:        { type: String, required: true },
  riskScore:      { type: Number, required: true },
  psiScore:       { type: Number, required: true },
  timestamp:      { type: String, required: true }  // ISO String
}, { timestamps: true, strict: false });

const variableConfigSchema = new mongoose.Schema({
  metric:       { type: String, required: true }, // e.g. SCM, CCI, ERC. Can be 'INDEPENDENT' for standalone vars.
  layer:        { type: String, required: true }, // Layer 0, Layer 1, etc.
  symbol:       { type: String, required: true, unique: true }, // e.g. HPA
  name:         { type: String, required: true }, // Historical Path Allegiance
  weight:       { type: Number, default: 0 },     // 0.25
  defaultValue: { type: Number, default: 0.5 },
  description:  { type: String, default: '' },    // Description to prompt the AI with
  isActive:     { type: Boolean, default: true }
}, { timestamps: true, strict: false });

// ===== MODELS =====
export const PromoCode: mongoose.Model<any>      = mongoose.models.PromoCode      || mongoose.model('PromoCode', promoCodeSchema);
export const Subscriber: mongoose.Model<any>     = mongoose.models.Subscriber     || mongoose.model('Subscriber', subscriberSchema);
export const PendingRequest: mongoose.Model<any> = mongoose.models.PendingRequest || mongoose.model('PendingRequest', pendingRequestSchema);
export const Plan: mongoose.Model<any>           = mongoose.models.Plan           || mongoose.model('Plan', planSchema);
export const AdminConfig: mongoose.Model<any>    = mongoose.models.AdminConfig    || mongoose.model('AdminConfig', adminConfigSchema);
export const User: mongoose.Model<any>           = mongoose.models.User           || mongoose.model('User', userSchema);
export const AnalysisLog: mongoose.Model<any>    = mongoose.models.AnalysisLog    || mongoose.model('AnalysisLog', analysisLogSchema);
export const VariableConfig: mongoose.Model<any> = mongoose.models.VariableConfig || mongoose.model('VariableConfig', variableConfigSchema);
