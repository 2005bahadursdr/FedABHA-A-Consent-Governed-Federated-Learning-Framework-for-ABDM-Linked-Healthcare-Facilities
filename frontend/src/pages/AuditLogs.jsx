import { useState, useEffect } from 'react';
import { fetchDashboardData, emptyData } from '../services/api';
import { ScrollText, ShieldCheck, RefreshCw, ChevronDown, ChevronUp, Filter } from 'lucide-react';

export default function AuditLogs() {
  const [data, setData] = useState(emptyData);
  const [showAll, setShowAll] = useState(false);

  const refreshData = async () => {
    const latest = await fetchDashboardData();
    setData(latest);
  };

  useEffect(() => {
    refreshData();
    const interval = setInterval(refreshData, 2000);
    return () => clearInterval(interval);
  }, []);

  const auditTrail = data.auditTrail || [];
  const displayedLogs = showAll ? auditTrail : auditTrail.slice(0, 10);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-slate-100 flex items-center">
            <ScrollText className="mr-3 w-7 h-7 sm:w-8 sm:h-8 text-primary-500 shrink-0" /> Immutable Audit Logs
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Blockchain-anchored cryptographic trail of consent grants, data access events, and model aggregations.
          </p>
        </div>
        <div className="flex items-center space-x-3 shrink-0">
          <button
            onClick={refreshData}
            className="flex items-center text-xs bg-dark-700 hover:bg-dark-600 text-slate-300 px-3 py-2 rounded-lg border border-slate-600 transition-colors shadow-sm"
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Sync Logs
          </button>
        </div>
      </div>

      <div className="bg-dark-800 rounded-xl p-4 sm:p-6 border border-slate-700 shadow-md space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-700 pb-3 gap-2">
          <h2 className="text-base sm:text-lg font-semibold text-slate-200 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-400" /> System Action & Consent Audit Feed
          </h2>
          <div className="flex items-center space-x-3 text-xs">
            <span className="text-slate-400 font-mono">
              Showing <strong className="text-primary-400">{displayedLogs.length}</strong> of <strong className="text-slate-200">{auditTrail.length}</strong> Events
            </span>
            {auditTrail.length > 10 && (
              <button
                onClick={() => setShowAll(!showAll)}
                className="flex items-center space-x-1 text-xs px-2.5 py-1 rounded bg-primary-500/10 hover:bg-primary-500/20 text-primary-400 border border-primary-500/30 transition font-medium"
              >
                <Filter className="w-3 h-3" />
                <span>{showAll ? 'Show Top 10' : 'Show All'}</span>
              </button>
            )}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="bg-dark-900 text-xs uppercase tracking-wider text-slate-400 border-b border-slate-700">
              <tr>
                <th className="py-3 px-4">Transaction ID</th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4">Event Description</th>
                <th className="py-3 px-4">Verification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700/60 font-mono text-xs">
              {displayedLogs.map((tx, idx) => (
                <tr key={idx} className="hover:bg-dark-700/50 transition">
                  <td className="py-3 px-4 text-primary-400 font-bold">{tx.tx_id}</td>
                  <td className="py-3 px-4 text-slate-400 font-sans">{new Date(tx.timestamp).toLocaleString()}</td>
                  <td className="py-3 px-4 text-slate-200 font-sans">{tx.event}</td>
                  <td className="py-3 px-4 font-sans">
                    <span className="px-2.5 py-0.5 rounded bg-emerald-950/40 text-emerald-300 border border-emerald-500/30 text-[10px] font-medium">
                      Cryptographically Verified
                    </span>
                  </td>
                </tr>
              ))}

              {displayedLogs.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-6 text-center text-slate-400 font-sans text-xs">
                    No audit log records found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Show More / Show Top 10 Expand/Collapse Button */}
        {auditTrail.length > 10 && (
          <div className="flex justify-center pt-3 border-t border-slate-700/60">
            <button
              onClick={() => setShowAll(!showAll)}
              className="flex items-center space-x-2 px-4 py-2 bg-dark-700 hover:bg-dark-600 text-slate-200 hover:text-white rounded-lg border border-slate-600 text-xs font-semibold transition shadow-sm"
            >
              {showAll ? (
                <>
                  <ChevronUp className="w-4 h-4 text-primary-400" />
                  <span>Show Top 10 Only</span>
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4 text-primary-400" />
                  <span>Show More ({auditTrail.length - 10} More Events)</span>
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}


