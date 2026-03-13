import React, { useState } from 'react';
import { X, User, Mail, Lock, LogIn, UserPlus, AlertCircle } from 'lucide-react';
import { useUser } from '../context/UserContext';

interface Props {
  onClose: () => void;
}

export default function AuthModal({ onClose }: Props) {
  const { login, register } = useUser();
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPass, setConfirmPass] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await login(email, password);
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (password !== confirmPass) {
      setError('Passwords do not match');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters');
      return;
    }
    setLoading(true);
    try {
      await register(name, email, password);
      onClose();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg shadow-2xl max-w-md w-full overflow-hidden" onClick={e => e.stopPropagation()}>
        
        {/* Tabs */}
        <div className="flex border-b border-slate-200 dark:border-slate-700">
          <button
            onClick={() => { setTab('login'); setError(''); }}
            className={`flex-1 py-4 text-sm font-semibold tracking-wide uppercase transition-colors flex items-center justify-center gap-2 ${tab === 'login' ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 bg-blue-50/50 dark:bg-blue-900/10' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'}`}
          >
            <LogIn className="w-4 h-4" /> Login
          </button>
          <button
            onClick={() => { setTab('register'); setError(''); }}
            className={`flex-1 py-4 text-sm font-semibold tracking-wide uppercase transition-colors flex items-center justify-center gap-2 ${tab === 'register' ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400 bg-blue-50/50 dark:bg-blue-900/10' : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-300'}`}
          >
            <UserPlus className="w-4 h-4" /> Register
          </button>
        </div>

        <div className="p-6">
          {error && (
            <div className="mb-4 p-3 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 text-rose-600 dark:text-rose-400 text-sm rounded-sm flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {tab === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
                Sign in to your account to access your subscription and downloads.
              </p>
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-sm text-sm focus:outline-none focus:border-blue-500" required />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••" className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-sm text-sm focus:outline-none focus:border-blue-500" required />
                </div>
              </div>
              <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 rounded-sm transition-colors uppercase tracking-widest text-xs disabled:opacity-50">
                {loading ? 'Signing in...' : 'Sign In'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              <p className="text-sm text-slate-600 dark:text-slate-300 mb-4">
                Create an account to purchase plans and track your downloads.
              </p>
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="Your Name" className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-sm text-sm focus:outline-none focus:border-blue-500" required />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">Email</label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="you@example.com" className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-sm text-sm focus:outline-none focus:border-blue-500" required />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Min 6 characters" className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-sm text-sm focus:outline-none focus:border-blue-500" required minLength={6} />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-1">Confirm Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input type="password" value={confirmPass} onChange={e => setConfirmPass(e.target.value)} placeholder="••••••" className="w-full pl-9 pr-4 py-2.5 bg-slate-50 dark:bg-slate-700/50 border border-slate-200 dark:border-slate-600 rounded-sm text-sm focus:outline-none focus:border-blue-500" required minLength={6} />
                </div>
              </div>
              <button type="submit" disabled={loading} className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-2.5 rounded-sm transition-colors uppercase tracking-widest text-xs disabled:opacity-50">
                {loading ? 'Creating Account...' : 'Create Account'}
              </button>
            </form>
          )}
        </div>

        <div className="px-6 py-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-700 flex justify-end">
          <button onClick={onClose} className="text-sm font-medium text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200">
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
