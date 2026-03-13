import React, { useState } from 'react';
import { Key, CreditCard, CheckCircle2, AlertCircle } from 'lucide-react';

interface Props {
  onClose: () => void;
  onSuccess: () => void;
}

export default function PaywallModal({ onClose, onSuccess }: Props) {
  const [tab, setTab] = useState<'promo' | 'subscribe'>('promo');
  const [code, setCode] = useState('');
  const [email, setEmail] = useState('');
  const [planId, setPlanId] = useState('plan_pro');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handlePromoSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/promo/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: code.trim() })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Invalid code');
      
      // Store access token
      sessionStorage.setItem('geostrate_access', JSON.stringify({ type: 'promo', features: data.features }));
      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscribeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address');
      return;
    }
    setLoading(true);
    setError('');
    setSuccessMsg('');
    
    try {
      // 1. Check if email ALREADY has active subscription
      const valRes = await fetch('/api/subscribe/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim() })
      });
      const valData = await valRes.json();
      
      if (valRes.ok && valData.sub) {
        // Has active subscription, allow download immediately!
        sessionStorage.setItem('geostrate_access', JSON.stringify({ type: 'sub', email: email.trim(), features: valData.sub.features }));
        onSuccess();
        return;
      }
      
      // 2. If no active sub, simulate dummy payment/request
      const reqRes = await fetch('/api/subscribe/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), planId })
      });
      const reqData = await reqRes.json();
      if (!reqRes.ok) throw new Error(reqData.error || 'Failed to process request');
      
      setSuccessMsg(reqData.message);
      // We don't call onSuccess here because they have to wait for admin approval
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-2xl max-w-md w-full overflow-hidden" onClick={e => e.stopPropagation()}>
        
        {/* Header Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-700">
          <button
            onClick={() => { setTab('promo'); setError(''); setSuccessMsg(''); }}
            className={`flex-1 py-4 text-sm font-semibold tracking-wide uppercase transition-colors ${tab === 'promo' ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 bg-blue-50/50 dark:bg-blue-900/10' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'}`}
          >
            Has Promo Code?
          </button>
          <button
            onClick={() => { setTab('subscribe'); setError(''); setSuccessMsg(''); }}
            className={`flex-1 py-4 text-sm font-semibold tracking-wide uppercase transition-colors ${tab === 'subscribe' ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 bg-blue-50/50 dark:bg-blue-900/10' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'}`}
          >
            Get Subscription
          </button>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-600 dark:text-rose-400 text-sm rounded-sm flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400 text-sm rounded-sm flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {tab === 'promo' ? (
            <form onSubmit={handlePromoSubmit} className="space-y-4">
              <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
                Enter your promo code to unlock PDF and PPT report downloads for this session.
              </p>
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">Promo Code</label>
                <div className="relative">
                  <Key className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={code}
                    onChange={e => setCode(e.target.value.toUpperCase())}
                    placeholder="e.g. WOXSEN2026"
                    className="w-full pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-sm text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading || !code}
                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-2.5 rounded-sm transition-colors disabled:opacity-50"
              >
                {loading ? 'Validating...' : 'Apply Code'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleSubscribeSubmit} className="space-y-4">
              <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
                Enter your email. If you have an active subscription, you'll get instant access. Otherwise, select a plan to request access.
              </p>
              
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="analyst@example.com"
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-sm text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:border-blue-500"
                  required
                />
              </div>

              {!successMsg && (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2 mt-4">Select Plan (to purchase)</label>
                    <div className="grid grid-cols-2 gap-2">
                      <label className={`cursor-pointer border rounded-sm p-3 flex flex-col items-center justify-center transition-colors ${planId === 'plan_basic' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' : 'border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-600 dark:text-slate-400'}`}>
                        <input type="radio" name="plan" value="plan_basic" checked={planId === 'plan_basic'} onChange={() => setPlanId('plan_basic')} className="sr-only" />
                        <span className="font-bold text-sm">Basic</span>
                        <span className="text-xs mt-1">₹99 (3 DLs)</span>
                      </label>
                      <label className={`cursor-pointer border rounded-sm p-3 flex flex-col items-center justify-center transition-colors ${planId === 'plan_pro' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300' : 'border-slate-200 dark:border-slate-600 hover:bg-slate-50 dark:hover:bg-slate-700/50 text-slate-600 dark:text-slate-400'}`}>
                        <input type="radio" name="plan" value="plan_pro" checked={planId === 'plan_pro'} onChange={() => setPlanId('plan_pro')} className="sr-only" />
                        <span className="font-bold text-sm">Pro</span>
                        <span className="text-xs mt-1">₹199 (10 DLs)</span>
                      </label>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={loading || !email}
                    className="w-full flex items-center justify-center gap-2 bg-slate-800 dark:bg-slate-700 hover:bg-slate-700 dark:hover:bg-slate-600 text-white font-medium py-2.5 rounded-sm transition-colors disabled:opacity-50 mt-2"
                  >
                    <CreditCard className="w-4 h-4" />
                    {loading ? 'Processing...' : 'Verify Access or Pay'}
                  </button>
                  <p className="text-[10px] text-center text-slate-400 dark:text-slate-500 mt-2">
                    *Dummy payment mode: clicking this will immediately send a request to admin for approval.
                  </p>
                </>
              )}
            </form>
          )}
        </div>
        
        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700 flex justify-end">
          <button onClick={onClose} className="text-sm font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200">
            Cancel
          </button>
        </div>

      </div>
    </div>
  );
}
