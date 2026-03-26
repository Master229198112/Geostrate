import React, { useState, useEffect } from 'react';
import { User as UserIcon, Mail, Edit3, Save, X, Crown, Download, Clock, Check, CreditCard, AlertCircle, CheckCircle2, RefreshCw, Key, Trash2, Lock } from 'lucide-react';
import { useUser } from '../context/UserContext';

interface Plan {
  _id: string;
  planId: string;
  name: string;
  price: number;
  downloads: number;
  features: { ppt: boolean; pdf: boolean };
  includesApiKey?: boolean;
}

interface Props {
  onClose: () => void;
}

export default function ProfilePage({ onClose }: Props) {
  const { user, token, refresh, updateProfile } = useUser();
  const [editingName, setEditingName] = useState(false);
  const [nameVal, setNameVal] = useState(user?.name || '');
  const [saving, setSaving] = useState(false);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loadingPlans, setLoadingPlans] = useState(true);
  const [buyMsg, setBuyMsg] = useState('');
  const [buyError, setBuyError] = useState('');
  const [buyingPlan, setBuyingPlan] = useState<string | null>(null);
  const [confirmChange, setConfirmChange] = useState<Plan | null>(null);

  // API Key state
  const [keyInput, setKeyInput] = useState('');
  const [keyHint, setKeyHint] = useState('');
  const [keySource, setKeySource] = useState('');
  const [keySaving, setKeySaving] = useState(false);
  const [keyMsg, setKeyMsg] = useState('');

  // Change Password state
  const [currentPwd, setCurrentPwd] = useState('');
  const [newPwd, setNewPwd] = useState('');
  const [confirmPwd, setConfirmPwd] = useState('');
  const [pwdSaving, setPwdSaving] = useState(false);
  const [pwdMsg, setPwdMsg] = useState('');
  const [pwdError, setPwdError] = useState('');

  useEffect(() => {
    fetchPlans();
    fetchKeyStatus();
  }, []);

  const fetchKeyStatus = async () => {
    try {
      const res = await fetch('/api/auth/has-key', {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.hasKey) {
        setKeyHint(data.keyHint);
        setKeySource(data.keySource);
      }
    } catch { /* ignore */ }
  };

  const fetchPlans = async () => {
    try {
      const res = await fetch('/api/plans');
      const data = await res.json();
      setPlans(data.plans || []);
    } catch { /* ignore */ }
    finally { setLoadingPlans(false); }
  };

  const handleSaveName = async () => {
    if (!nameVal.trim()) return;
    setSaving(true);
    try {
      await updateProfile(nameVal.trim());
      setEditingName(false);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async () => {
    setPwdMsg('');
    setPwdError('');
    if (!currentPwd || !newPwd) { setPwdError('All fields are required'); return; }
    if (newPwd.length < 6) { setPwdError('New password must be at least 6 characters'); return; }
    if (newPwd !== confirmPwd) { setPwdError('New passwords do not match'); return; }
    setPwdSaving(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ currentPassword: currentPwd, newPassword: newPwd })
      });
      const text = await res.text();
      let data: any;
      try { data = JSON.parse(text); } catch { throw new Error(res.ok ? 'Invalid server response' : `Server error (${res.status})`); }
      if (!res.ok) throw new Error(data.error || 'Failed to change password');
      setPwdMsg(data.message);
      setCurrentPwd(''); setNewPwd(''); setConfirmPwd('');
    } catch (err: any) {
      setPwdError(err.message);
    } finally {
      setPwdSaving(false);
    }
  };

  const openRazorpayCheckout = (orderData: any, planId: string, verifyUrl: string) => {
    const options = {
      key: orderData.key,
      amount: orderData.amount,
      currency: orderData.currency,
      name: 'Geostrate',
      description: `${orderData.planName} Plan`,
      order_id: orderData.orderId,
      handler: async (response: any) => {
        // Verify payment on server
        setBuyingPlan(planId);
        try {
          const res = await fetch(verifyUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
            body: JSON.stringify({
              razorpay_order_id: response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature: response.razorpay_signature,
              planId,
            })
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data.error || 'Verification failed');
          setBuyMsg(data.message);
          await refresh();
        } catch (err: any) {
          setBuyError(err.message);
        } finally {
          setBuyingPlan(null);
        }
      },
      prefill: {
        name: user?.name || '',
        email: user?.email || '',
      },
      theme: { color: '#2563eb' },
      modal: {
        ondismiss: () => { setBuyingPlan(null); },
      },
    };

    const rzp = new (window as any).Razorpay(options);
    rzp.open();
  };

  const handleBuyPlan = async (planId: string) => {
    setBuyMsg('');
    setBuyError('');
    setConfirmChange(null);
    setBuyingPlan(planId);
    try {
      const res = await fetch('/api/payment/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ planId })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to create order');

      if (data.free) {
        // Free plan activated instantly
        setBuyMsg(data.message);
        await refresh();
        setBuyingPlan(null);
        return;
      }

      // Open Razorpay checkout
      openRazorpayCheckout(data, planId, '/api/payment/verify');
    } catch (err: any) {
      setBuyError(err.message);
      setBuyingPlan(null);
    }
  };

  const handlePlanClick = (plan: Plan) => {
    if (user!.plan) {
      setConfirmChange(plan);
    } else {
      handleBuyPlan(plan.planId);
    }
  };

  const handleRefill = async () => {
    setBuyMsg('');
    setBuyError('');
    setBuyingPlan('refill');
    try {
      const res = await fetch('/api/payment/refill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed');

      if (data.free) {
        setBuyMsg(data.message);
        await refresh();
        setBuyingPlan(null);
        return;
      }

      // Open Razorpay for refill payment
      const currentPlan = plans.find(p => p.name === user!.plan);
      openRazorpayCheckout(data, currentPlan?.planId || '', '/api/payment/verify-refill');
    } catch (err: any) {
      setBuyError(err.message);
      setBuyingPlan(null);
    }
  };

  if (!user) return null;

  const usagePercent = user.downloadsAllowed > 0
    ? Math.min(100, (user.downloadsUsed / user.downloadsAllowed) * 100)
    : 0;



  return (
    <div className="fixed inset-0 z-[55] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-sm font-bold text-slate-800 dark:text-slate-100 uppercase tracking-widest">My Profile</h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-8">
          
          {/* ===== SECTION 1: USER DETAILS ===== */}
          <div className="bg-slate-50 dark:bg-slate-700/30 border border-slate-200 dark:border-slate-600 rounded-sm p-5">
            <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <UserIcon className="w-4 h-4" /> Account Details
            </h3>

            <div className="space-y-3">
              {/* Name */}
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest w-16 shrink-0">Name</span>
                {editingName ? (
                  <div className="flex items-center gap-2 flex-1">
                    <input
                      value={nameVal}
                      onChange={e => setNameVal(e.target.value)}
                      className="flex-1 px-3 py-1.5 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-sm text-sm focus:outline-none focus:border-blue-500"
                      autoFocus
                    />
                    <button onClick={handleSaveName} disabled={saving} className="p-1.5 bg-blue-600 text-white rounded-sm hover:bg-blue-500 transition-colors">
                      <Save className="w-3.5 h-3.5" />
                    </button>
                    <button onClick={() => { setEditingName(false); setNameVal(user.name); }} className="p-1.5 bg-slate-200 dark:bg-slate-600 text-slate-600 dark:text-slate-300 rounded-sm hover:bg-slate-300 transition-colors">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 flex-1">
                    <span className="text-sm font-medium text-slate-800 dark:text-slate-100">{user.name}</span>
                    <button onClick={() => { setEditingName(true); setNameVal(user.name); }} className="p-1 text-slate-400 hover:text-blue-500 transition-colors">
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>

              {/* Email */}
              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-slate-500 uppercase tracking-widest w-16 shrink-0">Email</span>
                <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-300">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span className="font-mono">{user.email}</span>
                </div>
              </div>
            </div>
          </div>

          {/* ===== SECTION: CHANGE PASSWORD ===== */}
          <div className="bg-slate-50 dark:bg-slate-700/30 border border-slate-200 dark:border-slate-600 rounded-sm p-5">
            <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Lock className="w-4 h-4" /> Change Password
            </h3>

            {pwdMsg && (
              <div className="mb-3 p-2 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs rounded-sm flex items-center gap-1.5">
                <CheckCircle2 className="w-3 h-3" /> {pwdMsg}
              </div>
            )}
            {pwdError && (
              <div className="mb-3 p-2 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-600 dark:text-rose-400 text-xs rounded-sm flex items-center gap-1.5">
                <AlertCircle className="w-3 h-3" /> {pwdError}
              </div>
            )}

            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1 ml-0.5">Current Password</label>
                <input
                  type="password"
                  value={currentPwd}
                  onChange={e => setCurrentPwd(e.target.value)}
                  placeholder="Enter current password"
                  className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-sm text-sm focus:outline-none focus:border-blue-500"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1 ml-0.5">New Password</label>
                  <input
                    type="password"
                    value={newPwd}
                    onChange={e => setNewPwd(e.target.value)}
                    placeholder="Min 6 characters"
                    className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-sm text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1 ml-0.5">Confirm New Password</label>
                  <input
                    type="password"
                    value={confirmPwd}
                    onChange={e => setConfirmPwd(e.target.value)}
                    placeholder="Re-enter new password"
                    className="w-full px-3 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-sm text-sm focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
              <button
                onClick={handleChangePassword}
                disabled={pwdSaving || !currentPwd || !newPwd || !confirmPwd}
                className="bg-slate-800 dark:bg-blue-600 hover:bg-slate-700 dark:hover:bg-blue-500 text-white font-bold px-5 py-2 rounded-sm text-xs uppercase tracking-widest transition-colors disabled:opacity-50"
              >
                {pwdSaving ? 'Updating...' : 'Update Password'}
              </button>
            </div>
          </div>

          {/* ===== SECTION 1.5: API KEY ===== */}
          <div className="bg-slate-50 dark:bg-slate-700/30 border border-slate-200 dark:border-slate-600 rounded-sm p-5">
            <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Key className="w-4 h-4" /> Gemini API Key
            </h3>

            {keyMsg && (
              <div className="mb-3 p-2 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs rounded-sm flex items-center gap-1.5">
                <CheckCircle2 className="w-3 h-3" /> {keyMsg}
              </div>
            )}

            {keyHint ? (
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-mono text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-700 px-3 py-1.5 rounded-sm border border-slate-200 dark:border-slate-600">
                    {keyHint}
                  </span>
                  <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-sm uppercase tracking-widest ${keySource === 'personal' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'}`}>
                    {keySource === 'personal' ? 'Personal Key' : 'Plan Key'}
                  </span>
                </div>
                {keySource === 'personal' && (
                  <button
                    onClick={async () => {
                      setKeySaving(true);
                      try {
                        await fetch('/api/auth/api-key', { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
                        setKeyHint(''); setKeySource(''); setKeyMsg('Key removed.');
                        await fetchKeyStatus();
                      } catch { /* ignore */ }
                      finally { setKeySaving(false); }
                    }}
                    disabled={keySaving}
                    className="text-xs text-rose-500 hover:text-rose-600 flex items-center gap-1 transition-colors"
                  >
                    <Trash2 className="w-3 h-3" /> Remove personal key
                  </button>
                )}
                <p className="text-[10px] text-slate-400">
                  {keySource === 'plan' ? 'This key is provided by your subscription plan. You can override it by setting a personal key below.' : 'Your personal key is encrypted and stored securely. It is never visible to anyone.'}
                </p>
              </div>
            ) : (
              <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">No API key set. Enter your own Gemini API key below, or purchase a plan that includes one.</p>
            )}

            <div className="mt-3 flex gap-2">
              <input
                type="password"
                value={keyInput}
                onChange={e => setKeyInput(e.target.value)}
                placeholder="Enter Gemini API Key"
                className="flex-1 px-3 py-2 bg-white dark:bg-slate-700 border border-slate-200 dark:border-slate-600 rounded-sm text-sm focus:outline-none focus:border-blue-500 font-mono"
              />
              <button
                onClick={async () => {
                  if (!keyInput.trim()) return;
                  setKeySaving(true); setKeyMsg('');
                  try {
                    const res = await fetch('/api/auth/api-key', {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
                      body: JSON.stringify({ apiKey: keyInput.trim() })
                    });
                    const data = await res.json();
                    if (!res.ok) throw new Error(data.error);
                    setKeyHint(data.keyHint); setKeySource('personal'); setKeyInput(''); setKeyMsg('Key saved securely!');
                  } catch (err: any) { alert(err.message); }
                  finally { setKeySaving(false); }
                }}
                disabled={keySaving || !keyInput.trim()}
                className="bg-blue-600 hover:bg-blue-500 text-white font-bold px-4 py-2 rounded-sm text-xs uppercase tracking-widest transition-colors disabled:opacity-50"
              >
                {keySaving ? '...' : 'Save Key'}
              </button>
            </div>
          </div>

          {/* ===== SECTION 2: CURRENT SUBSCRIPTION ===== */}
          <div className="bg-slate-50 dark:bg-slate-700/30 border border-slate-200 dark:border-slate-600 rounded-sm p-5">
            <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <Crown className="w-4 h-4" /> Current Subscription
            </h3>

            {user.plan ? (
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className="text-lg font-bold text-blue-600 dark:text-blue-400">{user.plan}</span>
                  <span className="text-[10px] font-bold bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-2 py-0.5 rounded-sm uppercase tracking-widest">Active</span>
                </div>

                {/* Usage Bar */}
                <div>
                  <div className="flex justify-between text-xs text-slate-500 mb-1.5">
                    <span className="flex items-center gap-1"><Download className="w-3 h-3" /> Downloads Used</span>
                    <span className="font-mono font-bold">{user.downloadsUsed} / {user.downloadsAllowed}</span>
                  </div>
                  <div className="w-full h-2.5 bg-slate-200 dark:bg-slate-600 rounded-none overflow-hidden">
                    <div
                      className={`h-full transition-all ${usagePercent >= 90 ? 'bg-rose-500' : usagePercent >= 70 ? 'bg-amber-500' : 'bg-blue-500'}`}
                      style={{ width: `${usagePercent}%` }}
                    />
                  </div>
                  {usagePercent >= 90 && (
                    <p className="text-[10px] text-rose-500 mt-1 font-bold uppercase tracking-widest">
                      {user.downloadsUsed >= user.downloadsAllowed ? 'Limit reached! Upgrade your plan.' : 'Almost at limit!'}
                    </p>
                  )}
                </div>

                {/* Features */}
                <div className="flex gap-3">
                  <div className={`flex items-center gap-1.5 text-xs ${user.features.pdf ? 'text-emerald-600' : 'text-slate-400'}`}>
                    {user.features.pdf ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />} PDF Export
                  </div>
                  <div className={`flex items-center gap-1.5 text-xs ${user.features.ppt ? 'text-emerald-600' : 'text-slate-400'}`}>
                    {user.features.ppt ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />} PPT Export
                  </div>
                </div>

                {/* Refill Button */}
                {user.downloadsUsed > 0 && (
                  <button
                    onClick={handleRefill}
                    disabled={buyingPlan !== null}
                    className="mt-2 w-full flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 rounded-sm text-xs uppercase tracking-widest transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    {buyingPlan ? 'Processing...' : 'Refill Usage Quota — 5% OFF'}
                  </button>
                )}
              </div>
            ) : (
              <div className="text-center py-4">
                <p className="text-sm text-slate-500 dark:text-slate-400">No active plan. Choose a plan below to get started!</p>
              </div>
            )}
          </div>

          {/* ===== SECTION 3: AVAILABLE PLANS ===== */}
          <div>
            <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
              <CreditCard className="w-4 h-4" /> {user.plan ? 'Upgrade / Change Plan' : 'Choose a Plan'}
            </h3>

            {buyMsg && (
              <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-sm rounded-sm flex items-start gap-2">
                <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{buyMsg}</span>
              </div>
            )}
            {buyError && (
              <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-600 dark:text-rose-400 text-sm rounded-sm flex items-start gap-2">
                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                <span>{buyError}</span>
              </div>
            )}

            {loadingPlans ? (
              <div className="flex justify-center py-6">
                <div className="w-6 h-6 border-2 border-slate-200 border-t-blue-500 rounded-full animate-spin" />
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {plans.map(p => {
                  const isCurrent = user.plan === p.name;
                  return (
                    <div key={p._id} className={`border rounded-sm p-4 flex flex-col ${isCurrent ? 'border-blue-400 dark:border-blue-500 bg-blue-50/50 dark:bg-blue-900/10' : 'border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800'}`}>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-bold text-slate-800 dark:text-slate-100">{p.name}</h4>
                        {isCurrent && <span className="text-[9px] font-bold bg-blue-600 text-white px-1.5 py-0.5 rounded-sm uppercase tracking-widest">Current</span>}
                      </div>
                      <div className="text-2xl font-mono text-blue-600 dark:text-blue-400 mb-3">
                        <span className="text-sm">₹</span>{p.price}
                      </div>
                      <ul className="space-y-1.5 mb-4 flex-1 text-xs text-slate-600 dark:text-slate-300">
                        <li className="flex items-center gap-1.5"><Check className="w-3 h-3 text-emerald-500" /> {p.downloads} Downloads</li>
                        <li className="flex items-center gap-1.5">
                          {p.features.pdf ? <Check className="w-3 h-3 text-emerald-500" /> : <X className="w-3 h-3 text-slate-300" />} PDF
                        </li>
                        <li className="flex items-center gap-1.5">
                          {p.features.ppt ? <Check className="w-3 h-3 text-emerald-500" /> : <X className="w-3 h-3 text-slate-300" />} PPT
                        </li>
                        {p.includesApiKey && (
                          <li className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 font-bold">
                            <Key className="w-3 h-3" /> API Key Included
                          </li>
                        )}
                      </ul>
                      {!isCurrent && (
                        <button
                          onClick={() => handlePlanClick(p)}
                          disabled={buyingPlan !== null}
                          className="w-full bg-slate-800 dark:bg-blue-600 hover:bg-slate-700 dark:hover:bg-blue-500 text-white font-bold py-2 rounded-sm text-xs uppercase tracking-widest transition-colors disabled:opacity-50"
                        >
                          {buyingPlan === p.planId ? 'Processing...' : user.plan ? 'Switch Plan' : 'Buy Plan'}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}

            <p className="text-[10px] text-center text-slate-400 dark:text-slate-500 mt-3">
              Payments processed securely via Razorpay.
            </p>
          </div>
        </div>

        {/* Plan Change Confirmation Dialog */}
        {confirmChange && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70" onClick={() => setConfirmChange(null)}>
            <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-sm shadow-2xl max-w-sm w-full p-6" onClick={e => e.stopPropagation()}>
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100 uppercase tracking-widest mb-3">Change Subscription?</h3>
              <p className="text-sm text-slate-600 dark:text-slate-300 mb-2">
                You currently have the <strong className="text-blue-600">{user.plan}</strong> plan.
              </p>
              <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
                Do you want to switch to <strong className="text-blue-600">{confirmChange.name}</strong> (₹{confirmChange.price}) instead?
              </p>
              <p className="text-[10px] text-amber-600 dark:text-amber-400 mb-4 font-bold uppercase tracking-widest">
                Your current plan and remaining downloads will be replaced.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setConfirmChange(null)}
                  className="flex-1 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 font-bold py-2 rounded-sm text-xs uppercase tracking-widest transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleBuyPlan(confirmChange.planId)}
                  disabled={buyingPlan !== null}
                  className="flex-1 bg-blue-600 hover:bg-blue-500 text-white font-bold py-2 rounded-sm text-xs uppercase tracking-widest transition-colors disabled:opacity-50"
                >
                  {buyingPlan ? 'Processing...' : 'Confirm Switch'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
