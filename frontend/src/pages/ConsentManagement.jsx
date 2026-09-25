import { useState, useEffect } from 'react';
import { fetchDashboardData, emptyData } from '../services/api';
import { useAuth } from '../context/AuthContext';
import ConsentStatus from '../components/ConsentStatus';
import { ShieldCheck, Database, Ban, FileWarning, Search, CheckCircle, RefreshCw, Building2, Clock, LockKeyhole } from 'lucide-react';
import StatCard from '../components/StatCard';

export default function ConsentManagement() {
  const [data, setData] = useState(emptyData);
  const [patientId, setPatientId] = useState('');
  const [validDays, setValidDays] = useState(365);
  const [actionStatus, setActionStatus] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const { user, isAuditor } = useAuth();

  const refreshData = async () => {
    const latest = await fetchDashboardData();
    setData(latest);
  };

  useEffect(() => {
    refreshData();
    const interval = setInterval(refreshData, 2000);
    return () => clearInterval(interval);
  }, []);

  const handleConsentAction = async (action) => {
    if (isAuditor()) {
      setActionStatus("⚠️ Auditor Read-Only Mode: Consent modification prohibited.");
      return;
    }
    if (!patientId.trim()) {
       setActionStatus("Please enter a Patient ID / ABHA ID or select a sample below.");
       return;
    }
    setIsProcessing(true);
    setActionStatus(`Processing ${action.toUpperCase()} consent for ${patientId.trim()}...`);
    try {
       const url = action === 'grant' 
         ? `http://localhost:8000/api/consent/grant/${patientId.trim()}?valid_days=${validDays}`
         : `http://localhost:8000/api/consent/revoke/${patientId.trim()}`;
       const res = await fetch(url, { method: 'POST' });
       const resultData = await res.json();
       if (res.ok) {
           setActionStatus(`✅ ${resultData.message || 'Consent updated successfully.'}`);
           await refreshData();
       } else {
           setActionStatus(`❌ Failed to ${action} consent: ${resultData.detail || 'Error'}`);
       }
    } catch (e) {
       setActionStatus("❌ Network error while updating consent policy.");
    } finally {
       setIsProcessing(false);
    }
  };

  const sampleIds = [
    { id: 'ABHA-1001', label: 'ABHA-1001 (Hosp A)' },
    { id: 'ABHA-2001', label: 'ABHA-2001 (Hosp B)' },
    { id: 'ABHA-3001', label: 'ABHA-3001 (Hosp C)' },
    { id: 'ABHA-REVOKE-99', label: 'ABHA-REVOKE-99' }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-slate-100 flex items-center">
          <ShieldCheck className="mr-3 w-8 h-8 text-primary-500" /> Consent Management
        </h1>
        <button
          onClick={refreshData}
          className="flex items-center text-xs bg-dark-700 hover:bg-dark-600 text-slate-300 px-3 py-1.5 rounded-lg border border-slate-600 transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5 mr-1.5" /> Sync Live Network
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard 
          title="Total Approved" 
          value={data.consentStats.approved}
          icon={Database}
          color="text-blue-400 bg-blue-400/10"
        />
        <StatCard 
          title="Total Blocked" 
          value={data.consentStats.blocked}
          icon={Ban}
          color="text-rose-400 bg-rose-400/10"
        />
        <StatCard 
          title="Total Revoked" 
          value={data.consentStats.revoked}
          icon={FileWarning}
          color="text-slate-400 bg-slate-400/10"
        />
      </div>

      {/* Multi-Hospital Consent Governance & FL Participation Matrix Card */}
      <div className="bg-dark-800 rounded-xl p-6 border border-slate-700 shadow-md space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-700 pb-3 gap-2">
          <h2 className="text-lg font-semibold text-slate-200 flex items-center gap-2">
            <Building2 className="w-5 h-5 text-primary-400" /> Multi-Hospital Consent Governance Matrix
          </h2>
          <div className="flex items-center gap-4 text-xs font-mono text-slate-300">
            <span>Current FL Round: <strong className="text-emerald-400">{data.flStats?.currentRound || 1}</strong></span>
            <span>Participating Clients: <strong className="text-primary-400">3 / 3</strong></span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 font-mono text-xs">
          {(data.hospitals || []).map((hosp) => {
            const isAllowed = hosp.status === 'Online' && (hosp.trustScore === undefined || hosp.trustScore >= 0.6);
            const hospNames = {
              hospital_A: 'City Care Medical',
              hospital_B: 'Metro Health Center',
              hospital_C: 'General Hospital'
            };
            const hospLabel = hosp.id.replace('_', ' ').toUpperCase();
            
            return (
              <div key={hosp.id} className="bg-dark-900 border border-slate-700 rounded-xl p-4 flex items-center justify-between shadow-sm">
                <div>
                  <span className="font-bold text-slate-100 text-sm font-sans block">{hospLabel}</span>
                  <span className="text-slate-400 block mt-0.5 font-sans text-[11px]">
                    {hospNames[hosp.id] || hosp.id} ({hosp.dataSize ? hosp.dataSize.toLocaleString() : '0'})
                  </span>
                </div>
                <div className="text-right space-y-1">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-sans font-semibold block ${
                    isAllowed 
                      ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-500/30' 
                      : 'bg-red-950/40 text-red-300 border border-red-500/30'
                  }`}>
                    {isAllowed ? 'ACTIVE' : 'REVOKED / BLOCKED'}
                  </span>
                  <span className={`font-bold block ${isAllowed ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {isAllowed ? 'ALLOWED' : 'NOT ALLOWED'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-dark-800 rounded-xl p-6 border border-slate-700 shadow-md">
            <h2 className="text-lg font-semibold text-slate-200 mb-6">Live Network Consent Breakdown</h2>
            <ConsentStatus 
                approved={data.consentStats.approved} 
                blocked={data.consentStats.blocked} 
                revoked={data.consentStats.revoked} 
            />
            <p className="mt-8 text-sm text-slate-400">
              The zero-trust consent enforcement engine checks MongoDB & in-memory policy state before returning EHR data or participating in FL model aggregation.
            </p>
          </div>
          
          <div className="bg-dark-800 rounded-xl p-6 border border-slate-700 shadow-md flex flex-col">
             <h2 className="text-lg font-semibold text-slate-200 mb-2">Live Consent Controller</h2>
             <p className="text-sm text-slate-400 mb-4">Dynamically grant or revoke ABHA consent policies across the network in real-time.</p>
             
             <div className="flex-1 flex flex-col space-y-4">
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-slate-500" />
                  </div>
                  <input
                    type="text"
                    className="block w-full pl-10 pr-3 py-2 border border-slate-600 rounded-md leading-5 bg-dark-900 text-slate-300 placeholder-slate-500 focus:outline-none focus:bg-dark-700 focus:border-primary-500 sm:text-sm transition-colors"
                    placeholder="Enter ABHA ID or Patient ID (e.g. ABHA-1001)"
                    value={patientId}
                    onChange={(e) => setPatientId(e.target.value)}
                  />
                </div>

                {/* Quick Select Preset Buttons */}
                <div>
                  <span className="text-xs text-slate-400 block mb-1.5 font-medium">Quick Select Sample ABHA IDs:</span>
                  <div className="flex flex-wrap gap-2">
                    {sampleIds.map((s) => (
                      <button
                        key={s.id}
                        type="button"
                        onClick={() => setPatientId(s.id)}
                        className={`text-xs px-2.5 py-1 rounded border transition-colors ${
                          patientId === s.id
                            ? 'bg-primary-600/30 border-primary-500 text-primary-300 font-semibold'
                            : 'bg-dark-900 border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-500'
                        }`}
                      >
                        {s.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Consent Validity Period Selector */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-xs text-slate-400 font-medium mb-1 flex items-center">
                      <Clock className="w-3.5 h-3.5 mr-1 text-primary-400 shrink-0" /> Consent Validity Period:
                    </label>
                    <select
                      value={validDays}
                      onChange={(e) => setValidDays(Number(e.target.value))}
                      className="w-full bg-dark-900 border border-slate-600 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-primary-500 font-mono"
                    >
                      <option value={30}>30 Days (Short-term Authorization)</option>
                      <option value={90}>90 Days (Quarterly Research)</option>
                      <option value={365}>365 Days (1-Year Standard Grant)</option>
                      <option value={0}>0 Days (Expired / Passed - Test Block)</option>
                    </select>
                  </div>

                  <div className="flex items-end">
                    <div className="text-[11px] text-slate-400 bg-dark-900 border border-slate-700 p-2 rounded-lg w-full flex items-center justify-between">
                      <span>Expiration:</span>
                      <strong className={validDays > 0 ? "text-emerald-400 font-mono" : "text-rose-400 font-mono"}>
                        {validDays > 0 
                          ? new Date(Date.now() + validDays * 86400000).toLocaleDateString() 
                          : 'Expired Yesterday'}
                      </strong>
                    </div>
                  </div>
                </div>
                
                <div className="flex gap-4 pt-2">
                   <button 
                      disabled={isProcessing}
                      onClick={() => handleConsentAction('grant')}
                      className="flex-1 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-semibold py-2.5 px-4 rounded transition-colors flex justify-center items-center text-sm shadow-sm"
                   >
                     <CheckCircle className="w-4 h-4 mr-2" /> Grant Consent
                   </button>
                   <button 
                      disabled={isProcessing}
                      onClick={() => handleConsentAction('revoke')}
                      className="flex-1 bg-rose-600 hover:bg-rose-500 disabled:opacity-50 text-white font-semibold py-2.5 px-4 rounded transition-colors flex justify-center items-center text-sm shadow-sm"
                   >
                     <Ban className="w-4 h-4 mr-2" /> Revoke Consent
                   </button>
                </div>
                
                {actionStatus && (
                   <div className="mt-4 p-3 bg-dark-900 border border-slate-700 rounded text-sm text-slate-300 text-center font-medium">
                     {actionStatus}
                   </div>
                )}
             </div>
          </div>
      </div>
    </div>
  );
}

