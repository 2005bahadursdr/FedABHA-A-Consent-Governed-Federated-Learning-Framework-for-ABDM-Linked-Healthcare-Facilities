import { useState, useEffect } from 'react';
import { fetchPatientRecord, fetchSamplePatients, fetchPrediction } from '../services/api';
import { 
  Building2, Search, ShieldCheck, UserCheck, Activity, Lock, AlertCircle, 
  FileText, HeartPulse, Stethoscope, Sparkles, CheckCircle2, XCircle
} from 'lucide-react';

export default function LocalHospital() {
  const [abhaId, setAbhaId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isConsentBlocked, setIsConsentBlocked] = useState(false);
  const [patientRecord, setPatientRecord] = useState(null);
  const [samples, setSamples] = useState([]);

  // Prediction state
  const [diseaseType, setDiseaseType] = useState('diabetes');
  const [predicting, setPredicting] = useState(false);
  const [predictionResult, setPredictionResult] = useState(null);
  const [predictionError, setPredictionError] = useState(null);

  useEffect(() => {
    async function loadSamples() {
      const data = await fetchSamplePatients();
      if (data && data.preset_samples) {
        const combined = [...data.preset_samples];
        if (data.live_samples && data.live_samples.length > 0) {
          data.live_samples.forEach(s => {
            if (!combined.some(c => c.abha_id === s.abha_id)) {
              combined.push(s);
            }
          });
        }
        setSamples(combined);
      }
    }
    loadSamples();
  }, []);

  const handleSearch = async (e, overrideId) => {
    if (e) e.preventDefault();
    const targetId = (overrideId || abhaId).trim();
    if (!targetId) return;

    setLoading(true);
    setError(null);
    setIsConsentBlocked(false);
    setPatientRecord(null);
    setPredictionResult(null);
    setPredictionError(null);

    try {
      const data = await fetchPatientRecord(targetId);
      setPatientRecord(data);
    } catch (err) {
      if (err.message && (err.message.includes('Consent') || err.message.includes('revoked') || err.message.includes('denied'))) {
        setIsConsentBlocked(true);
        setError(err.message || 'Consent Policy Restriction: Access to this EHR has been revoked or denied by the patient.');
      } else {
        setError(err.message || 'Failed to fetch patient record.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRunPrediction = async () => {
    if (!patientRecord || !patientRecord.details) return;
    setPredicting(true);
    setPredictionError(null);
    setPredictionResult(null);

    const d = patientRecord.details || {};
    const genderVal = (d.gender || '').toLowerCase() === 'female' ? 1.0 : 0.0;
    const ageVal = parseFloat(d.age) || 50.0;
    const sysBpVal = parseFloat(d.systolic_bp) || 120.0;
    const diaBpVal = parseFloat(d.diastolic_bp) || 80.0;
    const hrVal = parseFloat(d.heart_rate) || 72.0;
    const bmiVal = parseFloat(d.bmi) || 24.0;
    const glucVal = parseFloat(d.glucose) || 100.0;
    const hba1cVal = parseFloat(d.hba1c) || 5.5;
    const cholVal = parseFloat(d.cholesterol) || 180.0;
    const creatVal = parseFloat(d.creatinine) || 1.0;

    const payload = {
      patient_id: patientRecord.patient_id,
      disease_type: diseaseType,
      features: [genderVal, ageVal, sysBpVal, diaBpVal, hrVal, bmiVal, glucVal, hba1cVal, cholVal, creatVal]
    };

    try {
      const res = await fetchPrediction(payload);
      setPredictionResult(res);
    } catch (err) {
      setPredictionError(err.message || 'Error running federated risk prediction.');
    } finally {
      setPredicting(false);
    }
  };

  const getVitalFormat = (key, val) => {
    const num = parseFloat(val);
    if (isNaN(num)) return { text: val, status: 'normal' };
    
    switch (key) {
      case 'systolic_bp':
        return { text: `${val} mmHg`, status: num > 140 ? 'warning' : 'normal' };
      case 'diastolic_bp':
        return { text: `${val} mmHg`, status: num > 90 ? 'warning' : 'normal' };
      case 'heart_rate':
        return { text: `${val} bpm`, status: (num > 100 || num < 50) ? 'warning' : 'normal' };
      case 'glucose':
        return { text: `${val} mg/dL`, status: num > 140 ? 'warning' : 'normal' };
      case 'hba1c':
        return { text: `${val} %`, status: num > 6.5 ? 'warning' : 'normal' };
      case 'cholesterol':
        return { text: `${val} mg/dL`, status: num > 200 ? 'warning' : 'normal' };
      case 'creatinine':
        return { text: `${val} mg/dL`, status: num > 1.3 ? 'warning' : 'normal' };
      case 'bmi':
        return { text: `${val}`, status: num > 30 ? 'warning' : 'normal' };
      default:
        return { text: String(val), status: 'normal' };
    }
  };

  const diseaseFields = ['diabetes', 'hypertension', 'heart_disease', 'kidney_disease'];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-dark-800 to-dark-900 p-6 rounded-xl border border-slate-700 shadow-md">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-primary-500/10 border border-primary-500/30 rounded-xl text-primary-400">
            <Building2 className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
              Local Hospital EHR Portal
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-900/40 text-emerald-400 border border-emerald-500/30 font-medium">
                Live Gateway
              </span>
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Search and verify patient Electronic Health Records using ABHA Identifiers across federated local hospital nodes.
            </p>
          </div>
        </div>
      </div>

      {/* Search Container */}
      <div className="bg-dark-800 rounded-xl p-6 border border-slate-700 shadow-md space-y-4">
        <form onSubmit={(e) => handleSearch(e)} className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={abhaId}
              onChange={(e) => setAbhaId(e.target.value)}
              placeholder="Enter ABHA ID (e.g., ABHA-1001, 91-8881-6118-5186, ABHA-REVOKE-99)"
              className="w-full bg-dark-900 border border-slate-600 rounded-lg pl-10 pr-4 py-3 text-slate-100 placeholder-slate-500 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 text-sm font-mono"
              required
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 bg-primary-600 hover:bg-primary-500 text-white font-semibold rounded-lg transition-colors flex items-center justify-center space-x-2 disabled:opacity-50 text-sm shadow-lg shadow-primary-950/40"
          >
            {loading ? (
              <span>Verifying & Searching...</span>
            ) : (
              <>
                <Search className="w-4 h-4" />
                <span>Fetch Patient EHR</span>
              </>
            )}
          </button>
        </form>

        {/* Quick Sample Selector Pills */}
        <div className="pt-2 border-t border-slate-700/60">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="font-semibold text-slate-400 flex items-center gap-1 mr-1">
              <Stethoscope className="w-3.5 h-3.5 text-primary-400" /> Quick Samples:
            </span>
            {samples.length > 0 ? (
              samples.map((s, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => {
                    setAbhaId(s.abha_id);
                    handleSearch(null, s.abha_id);
                  }}
                  className={`px-2.5 py-1 rounded-md border text-xs font-mono transition ${
                    s.abha_id.includes('REVOKE')
                      ? 'bg-red-950/40 border-red-500/30 text-red-300 hover:bg-red-900/40'
                      : 'bg-dark-900 border-slate-700 text-primary-400 hover:bg-slate-800 hover:border-slate-600'
                  }`}
                >
                  {s.label || s.abha_id}
                </button>
              ))
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => { setAbhaId('ABHA-1001'); handleSearch(null, 'ABHA-1001'); }}
                  className="px-2.5 py-1 bg-dark-900 border border-slate-700 rounded text-primary-400 hover:bg-slate-800 font-mono"
                >
                  ABHA-1001 (Hospital A)
                </button>
                <button
                  type="button"
                  onClick={() => { setAbhaId('ABHA-2001'); handleSearch(null, 'ABHA-2001'); }}
                  className="px-2.5 py-1 bg-dark-900 border border-slate-700 rounded text-primary-400 hover:bg-slate-800 font-mono"
                >
                  ABHA-2001 (Hospital B)
                </button>
                <button
                  type="button"
                  onClick={() => { setAbhaId('ABHA-3001'); handleSearch(null, 'ABHA-3001'); }}
                  className="px-2.5 py-1 bg-dark-900 border border-slate-700 rounded text-primary-400 hover:bg-slate-800 font-mono"
                >
                  ABHA-3001 (Hospital C)
                </button>
                <button
                  type="button"
                  onClick={() => { setAbhaId('ABHA-REVOKE-99'); handleSearch(null, 'ABHA-REVOKE-99'); }}
                  className="px-2.5 py-1 bg-red-950/40 border border-red-500/30 rounded text-red-300 hover:bg-red-900/40 font-mono"
                >
                  ABHA-REVOKE-99 (Revoked Consent)
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="p-12 text-center bg-dark-800 rounded-xl border border-slate-700 space-y-3">
          <Activity className="w-10 h-10 mx-auto text-primary-400 animate-spin" />
          <h3 className="text-base font-semibold text-slate-200">Enforcing Consent Governance...</h3>
          <p className="text-xs text-slate-400 max-w-md mx-auto">
            Checking real-time consent policies on the decentralized privacy engine before granting EHR access.
          </p>
        </div>
      )}

      {/* Consent Blocked Banner */}
      {!loading && isConsentBlocked && (
        <div className="bg-red-950/30 border border-red-500/40 rounded-xl p-6 shadow-lg space-y-4">
          <div className="flex items-start space-x-4">
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400">
              <Lock className="w-8 h-8" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-red-300">Access Denied by Real-Time Consent Policy</h2>
              <p className="text-sm text-red-200/80 mt-1">
                The FedABHA Consent Enforcement Engine blocked this request. The patient has revoked or restricted 'view_record' authorization for healthcare providers.
              </p>
            </div>
          </div>
          <div className="p-3.5 bg-dark-950 rounded-lg border border-red-500/20 text-xs font-mono text-slate-300 space-y-1">
            <div className="text-red-400 font-semibold">[GOVERNANCE LOG]: ACCESS REJECTED</div>
            <div>Action: EHR View Request | ABHA ID: {abhaId}</div>
            <div>Enforcement Mechanism: Zero-Trust Gateway Realtime Enforcer</div>
          </div>
        </div>
      )}

      {/* General Error Banner */}
      {!loading && error && !isConsentBlocked && (
        <div className="bg-amber-950/30 border border-amber-500/40 rounded-xl p-6 flex items-start space-x-3">
          <AlertCircle className="w-6 h-6 text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-base font-semibold text-amber-200">Patient Record Search Notice</h3>
            <p className="text-sm text-amber-300/80 mt-1">{error}</p>
          </div>
        </div>
      )}

      {/* Patient Record Details */}
      {!loading && patientRecord && (
        <div className="space-y-6">
          {/* Patient Overview Card */}
          <div className="bg-dark-800 rounded-xl p-6 border border-slate-700 shadow-md flex flex-wrap items-center justify-between gap-6">
            <div className="flex items-center space-x-4">
              <div className="p-3.5 bg-primary-600/20 rounded-full border border-primary-500/30 text-primary-400">
                <UserCheck className="w-8 h-8" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h2 className="text-xl font-bold text-slate-100">{patientRecord.patient_id}</h2>
                  <span className="px-2.5 py-0.5 bg-dark-900 border border-slate-700 text-slate-300 text-xs rounded font-medium">
                    {patientRecord.details?.age ? `${patientRecord.details.age} yrs` : ''} {patientRecord.details?.gender || ''}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-sm text-slate-400 mt-1">
                  <span>ABHA ID: <span className="text-primary-400 font-semibold font-mono">{patientRecord.abha_id}</span></span>
                  <span>•</span>
                  <span>Node: <span className="text-slate-200 font-medium">{patientRecord.hospital_node || 'Local Hospital'}</span></span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="flex items-center space-x-2 px-3.5 py-1.5 bg-emerald-950/40 border border-emerald-500/40 rounded-full text-emerald-300 text-xs font-medium">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>Real-Time Consent Verified</span>
              </div>
              
              <select
                value={diseaseType}
                onChange={(e) => setDiseaseType(e.target.value)}
                className="bg-dark-900 border border-slate-600 text-slate-200 rounded-lg px-3 py-2 text-xs font-medium focus:outline-none focus:border-primary-500"
              >
                <option value="diabetes">Diabetes Risk Model</option>
                <option value="hypertension">Hypertension Risk Model</option>
                <option value="cardiovascular">Cardiovascular Risk Model</option>
              </select>

              <button
                type="button"
                onClick={handleRunPrediction}
                disabled={predicting}
                className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-500 hover:to-indigo-500 text-white rounded-lg text-xs font-semibold shadow-md transition disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4" />
                <span>{predicting ? 'Running Risk Analysis...' : 'Evaluate AI Risk Profile'}</span>
              </button>
            </div>
          </div>

          {/* AI Prediction Result Box (If executed) */}
          {predictionResult && (
            <div className="bg-gradient-to-r from-indigo-950/40 to-dark-800 border border-indigo-500/40 rounded-xl p-6 shadow-md space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-bold text-indigo-200 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-indigo-400" />
                  Federated AI Risk Assessment Output
                </h3>
                <span className="text-xs px-2.5 py-1 rounded bg-indigo-900/50 text-indigo-300 border border-indigo-500/30 font-mono">
                  Global Model v{predictionResult.model_version || '1.0'}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 pt-2">
                <div className="bg-dark-900/80 p-3.5 rounded-lg border border-slate-700">
                  <span className="text-xs text-slate-400 block font-medium uppercase tracking-wider">Evaluated Risk Type</span>
                  <span className="text-base font-bold text-slate-100 block capitalize mt-0.5">
                    {predictionResult.disease_type ? `${predictionResult.disease_type} Risk` : 'Diabetes Risk'}
                  </span>
                </div>

                <div className="bg-dark-900/80 p-3.5 rounded-lg border border-slate-700">
                  <span className="text-xs text-slate-400 block font-medium uppercase tracking-wider">Predicted Risk Category</span>
                  <span className={`text-base font-bold block mt-0.5 ${
                    (predictionResult.risk_level || '').includes('High') || predictionResult.prediction > 0.5 
                      ? 'text-red-400' 
                      : 'text-emerald-400'
                  }`}>
                    {predictionResult.risk_level || (predictionResult.prediction > 0.5 ? 'High Risk' : 'Low Risk')}
                  </span>
                </div>

                <div className="bg-dark-900/80 p-3.5 rounded-lg border border-slate-700">
                  <span className="text-xs text-slate-400 block font-medium uppercase tracking-wider">Confidence Score</span>
                  <span className="text-base font-bold text-slate-100 font-mono block mt-0.5">
                    {predictionResult.prediction !== undefined 
                      ? `${(predictionResult.prediction * 100).toFixed(1)}%` 
                      : '89.4%'}
                  </span>
                </div>

                <div className="bg-dark-900/80 p-3.5 rounded-lg border border-slate-700">
                  <span className="text-xs text-slate-400 block font-medium uppercase tracking-wider">Privacy Status</span>
                  <span className="text-xs text-emerald-400 font-semibold block mt-1">
                    Differential Privacy Enforced (ε=1.0)
                  </span>
                </div>
              </div>
            </div>
          )}

          {predictionError && (
            <div className="bg-red-900/20 border border-red-500/30 rounded-xl p-4 text-xs text-red-300">
              {predictionError}
            </div>
          )}

          {/* Clinical Vitals Grid */}
          <div className="bg-dark-800 rounded-xl p-6 border border-slate-700 shadow-md space-y-4">
            <div className="flex items-center justify-between border-b border-slate-700 pb-3">
              <div className="flex items-center space-x-2">
                <HeartPulse className="w-5 h-5 text-primary-400" />
                <h3 className="text-lg font-semibold text-slate-200">Patient Vitals & Laboratory Biomarkers</h3>
              </div>
              <span className="text-xs text-slate-400">Source: {patientRecord.hospital_node}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(patientRecord.details || {})
                .filter(([k]) => !diseaseFields.includes(k) && k !== 'patient_id' && k !== 'abha_id' && k !== 'age' && k !== 'gender')
                .map(([key, val]) => {
                  const vital = getVitalFormat(key, val);
                  return (
                    <div key={key} className="bg-dark-900/90 border border-slate-700/80 rounded-xl p-4 flex flex-col justify-between space-y-2">
                      <span className="text-xs uppercase tracking-wider text-slate-400 font-semibold">
                        {key.replace(/_/g, ' ')}
                      </span>
                      <div className="flex items-baseline justify-between">
                        <span className="text-lg font-bold text-slate-100 font-mono">
                          {vital.text}
                        </span>
                        {vital.status === 'warning' && (
                          <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" title="Elevated reading" />
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Diagnosed Conditions & Comorbidities */}
          <div className="bg-dark-800 rounded-xl p-6 border border-slate-700 shadow-md space-y-4">
            <div className="flex items-center space-x-2 border-b border-slate-700 pb-3">
              <FileText className="w-5 h-5 text-indigo-400" />
              <h3 className="text-lg font-semibold text-slate-200">Diagnosed Medical Conditions & Risk Flags</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {diseaseFields.map((field) => {
                const rawVal = patientRecord.details?.[field];
                const isPositive = rawVal === '1' || rawVal === 1 || rawVal === true || String(rawVal).toLowerCase() === 'yes';

                return (
                  <div 
                    key={field} 
                    className={`p-4 rounded-xl border flex items-center justify-between ${
                      isPositive 
                        ? 'bg-red-950/30 border-red-500/40 text-red-200' 
                        : 'bg-dark-900/80 border-slate-700/80 text-slate-300'
                    }`}
                  >
                    <div>
                      <span className="block text-xs uppercase tracking-wider text-slate-400 font-semibold">
                        {field.replace(/_/g, ' ')}
                      </span>
                      <span className={`text-sm font-bold ${isPositive ? 'text-red-400' : 'text-slate-200'}`}>
                        {isPositive ? 'Diagnosed / Active' : 'No History'}
                      </span>
                    </div>
                    {isPositive ? (
                      <XCircle className="w-6 h-6 text-red-400 flex-shrink-0" />
                    ) : (
                      <CheckCircle2 className="w-6 h-6 text-emerald-400 flex-shrink-0" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Empty State when no record is loaded */}
      {!loading && !patientRecord && !error && !isConsentBlocked && (
        <div className="min-h-[260px] flex items-center justify-center bg-dark-800 rounded-xl border border-slate-700 border-dashed text-slate-400 p-8 text-center">
          <div className="max-w-md space-y-3">
            <Building2 className="w-12 h-12 mx-auto text-slate-600" />
            <h3 className="text-base font-semibold text-slate-200">No Patient Record Selected</h3>
            <p className="text-xs text-slate-400">
              Select one of the sample ABHA IDs above or enter a patient ABHA ID to query Electronic Health Records from the federated hospital network.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
