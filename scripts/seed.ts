import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { connectDB, PromoCode, Plan, AdminConfig } from '../src/backend/db';

async function seed() {
  await connectDB();

  // Seed Plans
  const plans = [
    { planId: 'plan_basic', name: 'Basic', price: 99, currency: 'INR', downloads: 3, features: { ppt: false, pdf: true }, isActive: true, includesApiKey: false },
    { planId: 'plan_pro', name: 'Pro', price: 199, currency: 'INR', downloads: 10, features: { ppt: true, pdf: true }, isActive: true, includesApiKey: false },
    { planId: 'plan_advance', name: 'Advance', price: 499, currency: 'INR', downloads: 50, features: { ppt: true, pdf: true }, isActive: true, includesApiKey: true },
  ];
  for (const p of plans) {
    await Plan.findOneAndUpdate({ planId: p.planId }, p, { upsert: true });
  }
  console.log('✅ Plans seeded');

  // Seed Promo Codes
  const promos = [
    { code: 'WOXSEN2026', features: { ppt: true, pdf: true }, maxUses: 100, usedCount: 0, validFrom: '2026-01-01', validUntil: '2026-12-31', isActive: true },
    { code: 'VISHAL2026', features: { ppt: true, pdf: true }, maxUses: 100, usedCount: 0, validFrom: '2026-03-09', validUntil: '2027-03-09', isActive: true },
  ];
  for (const pc of promos) {
    await PromoCode.findOneAndUpdate({ code: pc.code }, pc, { upsert: true });
  }
  console.log('✅ Promo codes seeded');

  // Seed Admin Password (hashed)
  const initialPass = process.env.ADMIN_PASSWORD_INITIAL || 'geostrate_admin_2026';
  const hashed = await bcrypt.hash(initialPass, 12);
  await AdminConfig.findOneAndUpdate(
    { key: 'adminPassword' },
    { key: 'adminPassword', value: hashed },
    { upsert: true }
  );
  console.log('✅ Admin password seeded (bcrypt hashed)');

  await mongoose.disconnect();
  console.log('🎉 Seed complete. DB disconnected.');
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
