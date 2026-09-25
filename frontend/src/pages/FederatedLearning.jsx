import { useState, useEffect } from 'react';
import { fetchDashboardData, triggerFLRound, emptyData } from '../services/api';
import { useAuth } from '../context/AuthContext';
import FLProgress from '../components/FLProgress';
import StatCard from '../components/StatCard';
import { Network, Activity, Target, Play, ShieldCheck, ChevronDown, ChevronUp, LockKeyhole } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

export default function FederatedLearning() {
  const [data, setData] = useState(emptyData);
  const [runningRound, setRunningRound] = useState(false);
  const [showAllHistory, setShowAllHistory] = useState(false);
  const { user, isAuditor } = useAuth();

  useEffect(() => {
    const poll = async () => {
      const latest = await fetchDashboardData();
      setData(latest);
    };
    poll();
    const interval = setInterval(poll, 2000);
    return () => clearInterval(interval);
  }, []);

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

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <h1 className="text-xl sm:text-2xl font-bold text-slate-100 flex items-center">
          <Network className="mr-3 w-7 h-7 sm:w-8 sm:h-8 text-primary-500 shrink-0" /> Federated Aggregation Portal
        </h1>

        <button
          onClick={handleTriggerRound}
          disabled={runningRound || isAuditor()}
          title={isAuditor() ? "Auditor Mode: Read-Only Access" : "Trigger Global Federated Learning Round"}
          className={`w-full sm:w-auto flex items-center justify-center space-x-2 px-4 py-2.5 rounded-lg text-xs font-semibold shadow-md transition disabled:opacity-50 shrink-0 ${
            isAuditor()
              ? "bg-slate-800 text-amber-400 border border-amber-500/40 cursor-not-allowed"
              : "bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-500 hover:to-indigo-500 text-white"
          }`}
        >
          {isAuditor() ? <LockKeyhole className="w-4 h-4 text-amber-400" /> : <Play className="w-4 h-4 fill-current" />}
          <span>{isAuditor() ? 'Auditor Read-Only Mode' : runningRound ? 'Executing FL Round...' : 'Run FL Round Simulation'}</span>
        </button>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        <StatCard 
          title="Global Accuracy" 
          value={`${data.flStats.globalAccuracy}%`}
          subtitle={`Current Round: ${data.flStats.currentRound}`}
          icon={Target}
          color="text-emerald-400 bg-emerald-400/10"
        />
        <StatCard 
          title="Global F1 Score" 
          value={`${data.flStats.f1Score}%`}
          icon={Activity}
          color="text-teal-400 bg-teal-400/10"
        />
        <StatCard 
          title="Total Rounds Completed" 
          value={data.history?.length || 0}
          icon={Network}
          color="text-indigo-400 bg-indigo-400/10"
        />
      </div>

      <div className="bg-dark-800 rounded-xl p-6 border border-slate-700 shadow-md space-y-4">
        <h2 className="text-lg font-semibold text-slate-200">Current Aggregation Status: Round {data.flStats.currentRound}</h2>
        <FLProgress round={data.flStats.currentRound} accuracy={data.flStats.globalAccuracy} />
      </div>

      {/* Model Convergence Chart */}
      <div className="bg-dark-800 rounded-xl p-6 border border-slate-700 shadow-md space-y-4">
        <h2 className="text-lg font-semibold text-slate-200">Model Convergence Across Training Rounds</h2>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data.history || []}>
              <defs>
                <linearGradient id="colorAccFl" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="round" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" domain={[0, 100]} />
              <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155' }} />
              <Area type="monotone" dataKey="accuracy" stroke="#10b981" fillOpacity={1} fill="url(#colorAccFl)" name="Accuracy (%)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Training Round History Table */}
      <div className="bg-dark-800 rounded-xl p-6 border border-slate-700 shadow-md space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-700 pb-3 gap-2">
          <h2 className="text-lg font-semibold text-slate-200 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" />
            All Training Rounds Accuracy & F1 History
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
                <th className="py-3 px-4">Global Accuracy (%)</th>
                <th className="py-3 px-4">F1 Score (%)</th>
                <th className="py-3 px-4">Privacy Protection</th>
                <th className="py-3 px-4">Aggregation Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/60 font-mono text-xs">
              {((showAllHistory ? data.history : (data.history || []).slice(0, 10)) || []).map((item, idx) => (
                <tr key={idx} className="hover:bg-dark-700/50 transition">
                  <td className="py-3 px-4 font-bold text-primary-400">Round {item.round}</td>
                  <td className="py-3 px-4 text-emerald-400 font-semibold">{item.accuracy}%</td>
                  <td className="py-3 px-4 text-teal-300">{item.f1}%</td>
                  <td className="py-3 px-4 text-slate-400 font-sans">Opacus DP-SGD (ε=1.0)</td>
                  <td className="py-3 px-4">
                    <span className="px-2.5 py-0.5 rounded bg-emerald-950/40 text-emerald-300 border border-emerald-500/30 text-[10px] font-sans font-medium">
                      FedAvg Aggregated
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
      
      {/* Anomalies Box */}
      <div className="bg-dark-800 rounded-xl p-6 border border-slate-700 shadow-md">
         <h2 className="text-lg font-semibold text-slate-200 mb-4 flex items-center">
            Anomalous Weight Updates ({data.anomalies.length})
         </h2>
         {data.anomalies.length === 0 ? (
            <p className="text-slate-400 text-sm">No malicious payloads detected by the Anomaly Detector.</p>
         ) : (
            <div className="space-y-4">
              {data.anomalies.map((anom, idx) => (
                <div key={idx} className="bg-rose-900/20 text-rose-300 p-4 rounded border border-rose-800 flex justify-between items-center text-xs font-mono">
                   <span>Node: <strong>{anom.id}</strong></span>
                   <span>Z-Score: <strong>{anom.zScore}</strong></span>
                   <span>Status: <strong>{anom.status}</strong></span>
                </div>
              ))}
            </div>
         )}
      </div>
    </div>
  );
}
