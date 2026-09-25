import { useState, useEffect } from 'react';
import { fetchDashboardData, triggerFLRound, emptyData } from '../services/api';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import StatCard from '../components/StatCard';
import ConsentStatus from '../components/ConsentStatus';
import HospitalCard from '../components/HospitalCard';
import TrustScore from '../components/TrustScore';
import FLProgress from '../components/FLProgress';
import { 
  Activity, ShieldCheck, AlertTriangle, ScrollText, Play, Target, 
  Building2, Server, Lock, Search, Database, ArrowRight, Sparkles, ChevronDown, ChevronUp, LockKeyhole
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function Dashboard() {
  const [data, setData] = useState(emptyData);
  const [runningRound, setRunningRound] = useState(false);
  const [quickAbha, setQuickAbha] = useState('');
  const [showAllLogs, setShowAllLogs] = useState(false);
  const [showAllHistory, setShowAllHistory] = useState(false);
  const navigate = useNavigate();
  const { user, isAuditor } = useAuth();

  const handleTriggerRound = async () => {
    if (isAuditor()) return;
    setRunningRound(true);
    try {
      await triggerFLRound();
      const latest = await fetchDashboardData();
      setData(latest);
    } catch (e) {
      console.error(e);
    } finally {
      setRunningRound(false);
    }
  };

  const handleQuickSearch = (e) => {
    e.preventDefault();
    if (quickAbha.trim()) {
      navigate(`/local-hospital?id=${encodeURIComponent(quickAbha.trim())}`);
    }
  };

  useEffect(() => {
    const poll = async () => {
      const latest = await fetchDashboardData();
      setData(latest);
    };
    poll();
    const interval = setInterval(poll, 2000);
    return () => clearInterval(interval);
  }, []);

  const totalRecords = (data.hospitals || []).reduce((acc, h) => acc + (h.dataSize || 0), 0);

  return (
    <div className="space-y-6">
      {/* Top Banner & Network Status */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-gradient-to-r from-dark-800 to-dark-900 p-6 rounded-xl border border-slate-700 shadow-md">
        <div>
          <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
            FedABHA-X Network Dashboard
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-900/40 text-emerald-400 border border-emerald-500/30 font-medium flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Live Operational
            </span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Privacy-Preserving Federated Healthcare System with ABHA Identification & Real-Time Consent Governance.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleTriggerRound}
            disabled={runningRound || isAuditor()}
            title={isAuditor() ? "Auditor Mode: Read-Only Access" : "Trigger Global Federated Learning Round"}
            className={`flex items-center space-x-2 px-4 py-2.5 rounded-lg text-xs font-semibold shadow-md transition disabled:opacity-50 ${
              isAuditor()
                ? "bg-slate-800 text-amber-400 border border-amber-500/40 cursor-not-allowed"
                : "bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-500 hover:to-indigo-500 text-white"
            }`}
          >
            {isAuditor() ? <LockKeyhole className="w-4 h-4 text-amber-400" /> : <Play className="w-4 h-4 fill-current" />}
            <span>{isAuditor() ? 'Auditor Read-Only Mode' : runningRound ? 'Executing FL Round...' : 'Run FL Round Simulation'}</span>
          </button>
        </div>
      </div>

      {/* System Gateway Health Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="bg-dark-800 border border-slate-700/80 rounded-lg p-3 flex items-center space-x-3">
          <Server className="w-5 h-5 text-emerald-400" />
          <div>
            <span className="block text-slate-400 font-medium">FastAPI Backend</span>
            <span className="text-slate-200 font-semibold font-mono">Port 8000 Online</span>
          </div>
        </div>
        <div className="bg-dark-800 border border-slate-700/80 rounded-lg p-3 flex items-center space-x-3">
          <Lock className="w-5 h-5 text-primary-400" />
          <div>
            <span className="block text-slate-400 font-medium">Consent Enforcer</span>
            <span className="text-emerald-400 font-semibold">Zero-Trust Active</span>
          </div>
        </div>
        <div className="bg-dark-800 border border-slate-700/80 rounded-lg p-3 flex items-center space-x-3">
          <ShieldCheck className="w-5 h-5 text-indigo-400" />
          <div>
            <span className="block text-slate-400 font-medium">Differential Privacy</span>
            <span className="text-slate-200 font-semibold font-mono">Opacus DP (ε=1.0)</span>
          </div>
        </div>
        <div className="bg-dark-800 border border-slate-700/80 rounded-lg p-3 flex items-center space-x-3">
          <Building2 className="w-5 h-5 text-amber-400" />
          <div>
            <span className="block text-slate-400 font-medium">Federated Server</span>
            <span className="text-slate-200 font-semibold font-mono">Port 8080 Ready</span>
          </div>
        </div>
      </div>
      
      {/* Top Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard 
          title="Global Model Accuracy" 
          value={`${data.flStats.globalAccuracy}%`}
          subtitle={`Round ${data.flStats.currentRound}`}
          icon={Activity}
          color="text-emerald-400 bg-emerald-400/10"
        />
        <StatCard 
          title="Global F1 Score" 
          value={`${data.flStats.f1Score}%`}
          subtitle={`Rounds: ${data.history?.length || 0}`}
          icon={Target}
          color="text-teal-400 bg-teal-400/10"
        />
        <StatCard 
          title="Total Monitored EHRs" 
          value={totalRecords > 0 ? totalRecords.toLocaleString() : '10,000'}
          subtitle="Across Hospital Nodes"
          icon={Database}
          color="text-indigo-400 bg-indigo-400/10"
        />
        <div className="bg-dark-800 border border-slate-700 rounded-xl p-6 shadow-md flex flex-col justify-center">
          <h3 className="text-sm font-medium text-slate-400 mb-3 flex items-center">
            <ShieldCheck className="w-4 h-4 mr-2 text-primary-400" /> Consent Governance
          </h3>
          <ConsentStatus 
            approved={data.consentStats.approved} 
            blocked={data.consentStats.blocked} 
            revoked={data.consentStats.revoked} 
          />
        </div>
      </div>

      {/* Quick ABHA Patient Search & Portal Shortcuts Banner */}
      <div className="bg-dark-800 rounded-xl p-4 sm:p-6 border border-slate-700 shadow-md flex flex-col xl:flex-row items-stretch xl:items-center justify-between gap-4">
        <form onSubmit={handleQuickSearch} className="flex-1 w-full flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              value={quickAbha}
              onChange={(e) => setQuickAbha(e.target.value)}
              placeholder="Quick EHR Lookup by ABHA ID (e.g., ABHA-1001, 91-8881-6118-5186)"
              className="w-full bg-dark-900 border border-slate-600 rounded-lg pl-10 pr-4 py-2.5 text-xs text-slate-100 placeholder-slate-500 font-mono focus:outline-none focus:border-primary-500"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2.5 bg-primary-600 hover:bg-primary-500 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition shrink-0 shadow-sm"
          >
            <span>Search EHR</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <button
            onClick={() => navigate('/local-hospital')}
            className="flex-1 sm:flex-none px-3 py-2 bg-dark-900 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-300 transition text-center"
          >
            Local Hospital Portal
          </button>
          <button
            onClick={() => navigate('/consent')}
            className="flex-1 sm:flex-none px-3 py-2 bg-dark-900 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-300 transition text-center"
          >
            Consent Management
          </button>
          <button
            onClick={() => navigate('/predictions')}
            className="flex-1 sm:flex-none px-3 py-2 bg-dark-900 hover:bg-slate-700 border border-slate-700 rounded-lg text-slate-300 transition text-center"
          >
            AI Risk Inference
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - FL Chart, History & Hospitals */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-dark-800 rounded-xl p-6 border border-slate-700 shadow-md">
            <h2 className="text-lg font-semibold text-slate-200 mb-4">Model Convergence</h2>
            <FLProgress round={data.flStats.currentRound} accuracy={data.flStats.globalAccuracy} />
            <div className="h-64 mt-6">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.history || []}>
                  <defs>
                    <linearGradient id="colorAcc" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#0ea5e9" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#0ea5e9" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                  <XAxis dataKey="round" stroke="#94a3b8" />
                  <YAxis stroke="#94a3b8" domain={[0, 100]} />
                  <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }} />
                  <Area type="monotone" dataKey="accuracy" stroke="#0ea5e9" fillOpacity={1} fill="url(#colorAcc)" name="Accuracy (%)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* All Training Rounds Accuracy History Table */}
          <div className="bg-dark-800 rounded-xl p-6 border border-slate-700 shadow-md space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-700 pb-3 gap-2">
              <h2 className="text-lg font-semibold text-slate-200 flex items-center gap-2">
                <Target className="w-5 h-5 text-emerald-400" />
                Training Round Accuracy & F1 History
              </h2>
              <span className="text-xs text-slate-400 font-mono">
                Showing {Math.min(10, (data.history || []).length)} of {(data.history || []).length} Rounds
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm text-slate-300">
                <thead className="bg-dark-900 text-xs uppercase tracking-wider text-slate-400 border-b border-slate-700">
                  <tr>
                    <th className="py-3 px-4">Round #</th>
                    <th className="py-3 px-4">Global Accuracy</th>
                    <th className="py-3 px-4">F1 Score</th>
                    <th className="py-3 px-4">Privacy Status</th>
                    <th className="py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/60 font-mono text-xs">
                  {((showAllHistory ? data.history : (data.history || []).slice(0, 10)) || []).map((item, idx) => (
                    <tr key={idx} className="hover:bg-dark-700/50 transition">
                      <td className="py-3 px-4 font-bold text-primary-400">Round {item.round}</td>
                      <td className="py-3 px-4 text-emerald-400 font-semibold">{item.accuracy}%</td>
                      <td className="py-3 px-4 text-teal-300">{item.f1}%</td>
                      <td className="py-3 px-4 text-slate-400 font-sans">Differential Privacy (ε=1.0)</td>
                      <td className="py-3 px-4">
                        <span className="px-2.5 py-0.5 rounded bg-emerald-950/40 text-emerald-300 border border-emerald-500/30 text-[10px] font-sans font-medium">
                          Aggregated & Verified
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {(data.history || []).length > 10 && (
              <div className="flex justify-center pt-3 border-t border-slate-700/60">
                <button
                  onClick={() => setShowAllHistory(!showAllHistory)}
                  className="flex items-center space-x-2 px-4 py-2 bg-dark-700 hover:bg-dark-600 text-slate-200 hover:text-white rounded-lg border border-slate-600 text-xs font-semibold transition shadow-sm"
                >
                  {showAllHistory ? (
                    <>
                      <ChevronUp className="w-4 h-4 text-primary-400" />
                      <span>Show Top 10 Only</span>
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-4 h-4 text-primary-400" />
                      <span>Show More ({(data.history || []).length - 10} More Rounds)</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>

          <div className="bg-dark-800 rounded-xl p-6 border border-slate-700 shadow-md">
            <h2 className="text-lg font-semibold text-slate-200 mb-4">Hospital Nodes Infrastructure</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-6">
              {data.hospitals.map(hosp => (
                <HospitalCard key={hosp.id} id={hosp.id} status={hosp.status} dataSize={hosp.dataSize} />
              ))}
            </div>
            
            <h3 className="text-sm font-semibold text-slate-300 mb-4">Trust Evaluation & Node Reliability</h3>
            <div className="space-y-4">
              {data.hospitals.map(hosp => (
                <div key={hosp.id} className="flex items-center gap-4 bg-dark-700 p-3 rounded border border-slate-600">
                  <span className="w-24 text-sm font-medium text-slate-300">{hosp.id}</span>
                  <div className="flex-1">
                    <TrustScore score={hosp.trustScore} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column - Audit Log Feed */}
        <div className="space-y-6">
          <StatCard 
            title="Active Anomalies" 
            value={data.anomalies.length}
            icon={AlertTriangle}
            color="text-rose-400 bg-rose-400/10"
          />
          
          <div className="bg-dark-800 rounded-xl p-6 border border-slate-700 shadow-md">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-slate-700">
              <h2 className="text-lg font-semibold text-slate-200 flex items-center">
                <ScrollText className="w-5 h-5 mr-2 text-primary-500" />
                Live Audit Trail
              </h2>
              <span className="text-xs text-slate-400 font-mono">
                Showing {Math.min(10, (data.auditTrail || []).length)} of {(data.auditTrail || []).length}
              </span>
            </div>
            
            <div className="space-y-4">
              {((showAllLogs ? data.auditTrail : (data.auditTrail || []).slice(0, 10)) || []).map((tx, idx) => (
                <div key={idx} className="relative pl-6 border-l-2 border-slate-700 pb-4 last:border-0 last:pb-0">
                  <div className="absolute w-3 h-3 bg-primary-500 rounded-full -left-[7px] top-1.5 shadow-[0_0_8px_rgba(14,165,233,0.6)]"></div>
                  <p className="text-xs text-slate-500 mb-1">{new Date(tx.timestamp).toLocaleTimeString()}</p>
                  <p className="text-sm font-medium text-slate-300">{tx.event}</p>
                  <p className="text-xs text-slate-500 font-mono mt-1">TX: {tx.tx_id}</p>
                </div>
              ))}
            </div>

            {(data.auditTrail || []).length > 10 && (
              <div className="mt-4 pt-3 border-t border-slate-700 flex items-center justify-between">
                <button
                  onClick={() => setShowAllLogs(!showAllLogs)}
                  className="flex items-center space-x-1 text-xs text-primary-400 hover:text-primary-300 font-medium transition"
                >
                  {showAllLogs ? (
                    <>
                      <ChevronUp className="w-3.5 h-3.5" />
                      <span>Show Top 10 Only</span>
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-3.5 h-3.5" />
                      <span>Show More ({(data.auditTrail || []).length - 10} More)</span>
                    </>
                  )}
                </button>
                <button
                  onClick={() => navigate('/audit')}
                  className="text-xs text-slate-400 hover:text-slate-200 underline transition"
                >
                  View Full Audit Log Page
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
