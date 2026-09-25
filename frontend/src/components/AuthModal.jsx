import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Lock, KeyRound, Building2, Eye, X, AlertCircle, ArrowRight } from 'lucide-react';

export default function AuthModal() {
  const { user, isAuthModalOpen, setIsAuthModalOpen, login, quickSwitchRole, loading, authError } = useAuth();
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const location = useLocation();

  // Hide modal on the dedicated /login route to prevent overlapping
  if (!isAuthModalOpen || location.pathname === '/login') return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!emailInput || !passwordInput) return;
    try {
      await login(emailInput, passwordInput);
    } catch (err) {
      // Handled in context
    }
  };

  const handleQuickSwitch = async (roleKey) => {
    await quickSwitchRole(roleKey);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 bg-black/60 backdrop-blur-sm">
      <div className="bg-dark-800 border border-slate-700 rounded-xl max-w-sm w-full p-4 shadow-2xl space-y-3 relative max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-700 pb-2">
          <div className="flex items-center space-x-2">
            <Lock className="w-4 h-4 text-primary-400" />
            <h2 className="text-xs font-bold text-slate-100 uppercase tracking-wider">Switch Role / Login</h2>
          </div>
          <button
            onClick={() => setIsAuthModalOpen(false)}
            className="text-slate-400 hover:text-slate-100 p-1 rounded hover:bg-dark-700 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Current Active Account Status */}
        {user && (
          <div className="bg-dark-900 border border-slate-700 rounded-lg p-2 flex items-center justify-between text-xs">
            <span className="text-slate-300 font-medium truncate">{user.name}</span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-primary-500/10 text-primary-400 border border-primary-500/30 shrink-0">
              {user.role_title}
            </span>
          </div>
        )}

        {/* Quick Role Switcher Buttons */}
        <div className="space-y-1.5">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
            Single-Click Role Switch:
          </span>
          <div className="grid grid-cols-3 gap-1.5">
            <button
              type="button"
              onClick={() => handleQuickSwitch('admin')}
              disabled={loading}
              className={`p-1.5 rounded border text-center transition flex items-center justify-center space-x-1 ${
                user?.role === 'admin' 
                  ? 'bg-purple-950/50 border-purple-500 text-purple-300 font-semibold'
                  : 'bg-dark-900 hover:bg-dark-700 border-slate-700 text-slate-300'
              }`}
            >
              <KeyRound className="w-3 h-3 text-purple-400 shrink-0" />
              <span className="text-[10px]">Admin</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickSwitch('hospital_a')}
              disabled={loading}
              className={`p-1.5 rounded border text-center transition flex items-center justify-center space-x-1 ${
                user?.role === 'hospital' && user?.hospital_id === 'hospital_A'
                  ? 'bg-blue-950/50 border-blue-500 text-blue-300 font-semibold'
                  : 'bg-dark-900 hover:bg-dark-700 border-slate-700 text-slate-300'
              }`}
            >
              <Building2 className="w-3 h-3 text-blue-400 shrink-0" />
              <span className="text-[10px]">Hospital A</span>
            </button>

            <button
              type="button"
              onClick={() => handleQuickSwitch('auditor')}
              disabled={loading}
              className={`p-1.5 rounded border text-center transition flex items-center justify-center space-x-1 ${
                user?.role === 'auditor'
                  ? 'bg-amber-950/50 border-amber-500 text-amber-300 font-semibold'
                  : 'bg-dark-900 hover:bg-dark-700 border-slate-700 text-slate-300'
              }`}
            >
              <Eye className="w-3 h-3 text-amber-400 shrink-0" />
              <span className="text-[10px]">Auditor</span>
            </button>
          </div>

          <div className="flex items-center justify-between text-[9px] text-slate-400 font-mono pt-0.5">
            <span>Hospital Nodes:</span>
            <div className="space-x-1">
              <button onClick={() => handleQuickSwitch('hospital_a')} className="px-1.5 py-0.5 bg-dark-700 rounded text-blue-300">Hosp A</button>
              <button onClick={() => handleQuickSwitch('hospital_b')} className="px-1.5 py-0.5 bg-dark-700 rounded text-teal-300">Hosp B</button>
              <button onClick={() => handleQuickSwitch('hospital_c')} className="px-1.5 py-0.5 bg-dark-700 rounded text-indigo-300">Hosp C</button>
            </div>
          </div>
        </div>

        {/* Credentials Form */}
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
              className="w-full bg-dark-900 border border-slate-600 rounded px-2 py-1 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-primary-500"
            />
            <input
              type="password"
              value={passwordInput}
              onChange={(e) => setPasswordInput(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-dark-900 border border-slate-600 rounded px-2 py-1 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-primary-500"
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
  );
}
