import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, Lock, KeyRound, Building2, Eye, AlertCircle, ArrowRight, Activity } from 'lucide-react';

export default function LoginPage() {
  const { user, login, quickSwitchRole, loading, authError } = useAuth();
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!emailInput || !passwordInput) return;
    try {
      await login(emailInput, passwordInput);
      navigate('/dashboard');
    } catch (err) {
      // Error in state
    }
  };

  const handleQuickSwitch = async (roleKey) => {
    await quickSwitchRole(roleKey);
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-dark-900 text-slate-100 flex flex-col items-center justify-center p-3 font-sans">
      <div className="max-w-sm w-full space-y-3 z-10">
        {/* Compact Header Branding */}
        <div className="text-center space-y-0.5">
          <div className="inline-flex items-center space-x-1.5 px-2.5 py-0.5 bg-dark-800 border border-slate-700 rounded-full text-[10px] font-mono text-primary-400">
            <Activity className="w-3 h-3" />
            <span>FedABHA-X Security Gateway</span>
          </div>
          <h1 className="text-xl font-bold bg-gradient-to-r from-primary-400 to-indigo-300 bg-clip-text text-transparent">
            System Sign In
          </h1>
        </div>

        {/* Ultra-Compact Card */}
        <div className="bg-dark-800 border border-slate-700 rounded-xl p-4 shadow-xl space-y-3">
          {user && (
            <div className="bg-dark-900 border border-slate-700 rounded-lg p-2 flex items-center justify-between">
              <div className="flex items-center space-x-2 truncate">
                <div className="w-6 h-6 rounded-full bg-slate-700 flex items-center justify-center text-slate-100 text-[10px] font-bold shrink-0">
                  {user.name?.charAt(0)}
                </div>
                <span className="text-xs font-medium text-slate-200 truncate">{user.name} ({user.role_title})</span>
              </div>
              <button
                onClick={() => navigate('/dashboard')}
                className="px-2 py-0.5 bg-primary-600 hover:bg-primary-500 text-white rounded text-[10px] font-semibold transition shrink-0 flex items-center space-x-1"
              >
                <span>Portal</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* Quick Role Selection Buttons */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
              Quick Demo Role Login:
            </span>
            
            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => handleQuickSwitch('admin')}
                disabled={loading}
                className="p-1.5 rounded bg-dark-900 hover:bg-dark-700 border border-purple-500/40 text-center transition flex items-center justify-center space-x-1"
              >
                <KeyRound className="w-3 h-3 text-purple-400 shrink-0" />
                <span className="text-[10px] font-semibold text-purple-300">Admin</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickSwitch('hospital_a')}
                disabled={loading}
                className="p-1.5 rounded bg-dark-900 hover:bg-dark-700 border border-blue-500/40 text-center transition flex items-center justify-center space-x-1"
              >
                <Building2 className="w-3 h-3 text-blue-400 shrink-0" />
                <span className="text-[10px] font-semibold text-blue-300">Hospital A</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickSwitch('auditor')}
                disabled={loading}
                className="p-1.5 rounded bg-dark-900 hover:bg-dark-700 border border-amber-500/40 text-center transition flex items-center justify-center space-x-1"
              >
                <Eye className="w-3 h-3 text-amber-400 shrink-0" />
                <span className="text-[10px] font-semibold text-amber-300">Auditor</span>
              </button>
            </div>

            <div className="flex items-center justify-between text-[9px] text-slate-400 font-mono pt-0.5">
              <span>Nodes:</span>
              <div className="space-x-1">
                <button onClick={() => handleQuickSwitch('hospital_a')} className="px-1.5 py-0.5 bg-dark-700 rounded text-blue-300">Hosp A</button>
                <button onClick={() => handleQuickSwitch('hospital_b')} className="px-1.5 py-0.5 bg-dark-700 rounded text-teal-300">Hosp B</button>
                <button onClick={() => handleQuickSwitch('hospital_c')} className="px-1.5 py-0.5 bg-dark-700 rounded text-indigo-300">Hosp C</button>
              </div>
            </div>
          </div>

          {/* Standard Credentials Form */}
          <form onSubmit={handleSubmit} className="space-y-2 pt-2 border-t border-slate-700">
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
              Or Login Credentials:
            </span>

            {authError && (
              <div className="p-1.5 rounded bg-rose-950/50 border border-rose-800 text-rose-300 text-[10px] flex items-center gap-1">
                <AlertCircle className="w-3 h-3 shrink-0 text-rose-400" />
                <span>{authError}</span>
              </div>
            )}

            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder="admin@fedabha.org"
                className="w-full bg-dark-900 border border-slate-600 rounded px-2.5 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-primary-500"
              />
              <input
                type="password"
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-dark-900 border border-slate-600 rounded px-2.5 py-1.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-primary-500"
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-[9px] text-slate-500 font-mono">admin@fedabha.org / Admin@123</span>
              <button
                type="submit"
                disabled={loading}
                className="px-3 py-1 bg-primary-600 hover:bg-primary-500 text-white rounded text-xs font-semibold shadow transition disabled:opacity-50 flex items-center space-x-1"
              >
                <span>{loading ? 'Sign In...' : 'Sign In'}</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
