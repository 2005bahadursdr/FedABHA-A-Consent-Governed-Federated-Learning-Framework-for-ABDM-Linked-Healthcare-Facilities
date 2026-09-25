import { useState } from 'react';
import { fetchPrediction } from '../services/api';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { Brain, ShieldAlert, Sparkles, Activity, Stethoscope, CheckCircle, AlertTriangle } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export default function Predictions() {
  const [patientId, setPatientId] = useState('SYN-PAT-9531b5de');
  const [diseaseType, setDiseaseType] = useState('diabetes');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [result, setResult] = useState(null);

  // Clinical Vitals Form State
  const [vitals, setVitals] = useState({
    gender: 'female',
    age: 62,
    systolic_bp: 140,
    diastolic_bp: 90,
    heart_rate: 79,
    bmi: 34.5,
    glucose: 165,
    hba1c: 6.8,
    cholesterol: 220,
    creatinine: 1.4,
  });

  const handleInputChange = (field, value) => {
    setVitals(prev => ({ ...prev, [field]: value }));
  };

  const loadPreset = (presetType) => {
    if (presetType === 'high_risk') {
      setPatientId('SYN-PAT-HIGH-RISK');
      setVitals({
        gender: 'male',
        age: 68,
        systolic_bp: 155,
        diastolic_bp: 98,
        heart_rate: 88,
        bmi: 36.2,
        glucose: 185,
        hba1c: 7.4,
        cholesterol: 245,
        creatinine: 1.8,
      });
    } else if (presetType === 'healthy') {
      setPatientId('SYN-PAT-HEALTHY');
      setVitals({
        gender: 'female',
        age: 32,
        systolic_bp: 115,
        diastolic_bp: 75,
        heart_rate: 68,
        bmi: 21.4,
        glucose: 92,
        hba1c: 4.9,
        cholesterol: 165,
        creatinine: 0.8,
      });
    } else if (presetType === 'revoked') {
      setPatientId('ABHA-REVOKE-99');
    }
  };

  const handlePredict = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    const genderVal = vitals.gender === 'female' ? 1.0 : 0.0;
    const realFeatures = [
      genderVal,
      parseFloat(vitals.age) || 50,
      parseFloat(vitals.systolic_bp) || 120,
      parseFloat(vitals.diastolic_bp) || 80,
      parseFloat(vitals.heart_rate) || 72,
      parseFloat(vitals.bmi) || 24,
      parseFloat(vitals.glucose) || 100,
      parseFloat(vitals.hba1c) || 5.5,
      parseFloat(vitals.cholesterol) || 180,
      parseFloat(vitals.creatinine) || 1.0,
    ];

    try {
      const data = await fetchPrediction({
        patient_id: patientId.trim() || 'PATIENT-DEFAULT',
        disease_type: diseaseType,
        features: realFeatures,
      });
      setResult(data);
    } catch (err) {
      setError(err.message || 'Error running federated risk prediction.');
    } finally {
      setLoading(false);
    }
  };

  const chartData = result?.explainability
    ? Object.entries(result.explainability)
        .map(([name, value]) => ({ 
          name: name.replace(/_/g, ' ').toUpperCase(), 
          value: parseFloat((value * 100).toFixed(2)) 
        }))
        .sort((a, b) => b.value - a.value)
    : [];

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-dark-800 to-dark-900 p-6 rounded-xl border border-slate-700 shadow-md">
        <div className="flex items-center space-x-4">
          <div className="p-3 bg-primary-500/10 border border-primary-500/30 rounded-xl text-primary-400">
            <Brain className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-100 flex items-center gap-2">
              Global Model Risk Prediction & XAI
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              Evaluate real patient clinical vitals against the privacy-preserved global model and inspect Explainable AI (SHAP) feature attributions.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Real Clinical Vitals Form */}
        <div className="lg:col-span-5 bg-dark-800 rounded-xl p-6 border border-slate-700 shadow-md space-y-4">
          <div className="flex items-center justify-between border-b border-slate-700 pb-3">
            <h2 className="text-lg font-semibold text-slate-200 flex items-center gap-2">
              <Stethoscope className="w-5 h-5 text-primary-400" /> Clinical Vitals Input
            </h2>
          </div>

          {/* Quick Preset Buttons */}
          <div className="flex flex-wrap gap-2 text-xs pt-1">
            <span className="text-slate-400 font-medium self-center">Presets:</span>
            <button
              type="button"
              onClick={() => loadPreset('high_risk')}
              className="px-2.5 py-1 bg-red-950/40 border border-red-500/40 text-red-300 rounded hover:bg-red-900/40 font-mono transition"
            >
              High Risk Diabetic
            </button>
            <button
              type="button"
              onClick={() => loadPreset('healthy')}
              className="px-2.5 py-1 bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 rounded hover:bg-emerald-900/40 font-mono transition"
            >
              Healthy Baseline
            </button>
            <button
              type="button"
              onClick={() => loadPreset('revoked')}
              className="px-2.5 py-1 bg-amber-950/40 border border-amber-500/40 text-amber-300 rounded hover:bg-amber-900/40 font-mono transition"
            >
              Consent Revoked Test
            </button>
          </div>

          <form onSubmit={handlePredict} className="space-y-4 pt-2">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Patient ID</label>
                <input
                  type="text"
                  value={patientId}
                  onChange={(e) => setPatientId(e.target.value)}
                  className="w-full bg-dark-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-100 font-mono focus:border-primary-500 focus:outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase text-slate-400 mb-1">Target Model</label>
                <select
                  value={diseaseType}
                  onChange={(e) => setDiseaseType(e.target.value)}
                  className="w-full bg-dark-900 border border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-100 focus:border-primary-500 focus:outline-none"
                >
                  <option value="diabetes">Diabetes Risk Model</option>
                  <option value="hypertension">Hypertension Risk Model</option>
                </select>
              </div>
            </div>

            {/* Vitals Form Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <div>
                <label className="block text-xs text-slate-400 font-medium mb-1">Gender</label>
                <select
                  value={vitals.gender}
                  onChange={(e) => handleInputChange('gender', e.target.value)}
                  className="w-full bg-dark-900 border border-slate-600 rounded-lg px-3 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-primary-500"
                >
                  <option value="female">Female</option>
                  <option value="male">Male</option>
                </select>
              </div>

              <div>
                <label className="block text-xs text-slate-400 font-medium mb-1">Age (Years)</label>
                <input
                  type="number"
                  value={vitals.age}
                  onChange={(e) => handleInputChange('age', e.target.value)}
                  className="w-full bg-dark-900 border border-slate-600 rounded-lg px-3 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 font-medium mb-1">Fasting Glucose (mg/dL)</label>
                <input
                  type="number"
                  value={vitals.glucose}
                  onChange={(e) => handleInputChange('glucose', e.target.value)}
                  className="w-full bg-dark-900 border border-slate-600 rounded-lg px-3 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 font-medium mb-1">HbA1c (%)</label>
                <input
                  type="number"
                  step="0.1"
                  value={vitals.hba1c}
                  onChange={(e) => handleInputChange('hba1c', e.target.value)}
                  className="w-full bg-dark-900 border border-slate-600 rounded-lg px-3 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 font-medium mb-1">Systolic BP (mmHg)</label>
                <input
                  type="number"
                  value={vitals.systolic_bp}
                  onChange={(e) => handleInputChange('systolic_bp', e.target.value)}
                  className="w-full bg-dark-900 border border-slate-600 rounded-lg px-3 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 font-medium mb-1">Diastolic BP (mmHg)</label>
                <input
                  type="number"
                  value={vitals.diastolic_bp}
                  onChange={(e) => handleInputChange('diastolic_bp', e.target.value)}
                  className="w-full bg-dark-900 border border-slate-600 rounded-lg px-3 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 font-medium mb-1">BMI</label>
                <input
                  type="number"
                  step="0.1"
                  value={vitals.bmi}
                  onChange={(e) => handleInputChange('bmi', e.target.value)}
                  className="w-full bg-dark-900 border border-slate-600 rounded-lg px-3 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-primary-500"
                />
              </div>

              <div>
                <label className="block text-xs text-slate-400 font-medium mb-1">Cholesterol (mg/dL)</label>
                <input
                  type="number"
                  value={vitals.cholesterol}
                  onChange={(e) => handleInputChange('cholesterol', e.target.value)}
                  className="w-full bg-dark-900 border border-slate-600 rounded-lg px-3 py-1.5 text-xs text-slate-200 font-mono focus:outline-none focus:border-primary-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-primary-600 to-indigo-600 hover:from-primary-500 hover:to-indigo-500 text-white rounded-lg font-semibold shadow-lg transition flex items-center justify-center space-x-2 text-sm disabled:opacity-50 mt-2"
            >
              {loading ? (
                <span>Running Neural Network Inference...</span>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Evaluate Real Risk & Compute XAI</span>
                </>
              )}
            </button>
          </form>

          {error && (
            <div className="p-4 bg-red-950/40 border border-red-500/40 rounded-xl flex items-start space-x-3">
              <ShieldAlert className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div className="text-xs text-red-200">{error}</div>
            </div>
          )}
        </div>

        {/* Right Column: Prediction Results & XAI Explainability */}
        <div className="lg:col-span-7 space-y-6">
          {result ? (
            <>
              {/* Prediction Outcome Card */}
              <div className={cn(
                "rounded-xl p-6 border shadow-md space-y-3",
                result.risk_level === 'High Risk' 
                  ? "bg-gradient-to-r from-red-950/30 to-dark-800 border-red-500/40" 
                  : "bg-gradient-to-r from-emerald-950/30 to-dark-800 border-emerald-500/40"
              )}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                    Neural Network Prediction Outcome
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-medium bg-dark-900 border border-slate-700 text-slate-300">
                    Patient: {result.patient_id}
                  </span>
                </div>

                <div className="flex items-baseline justify-between pt-1">
                  <div>
                    <h2 className={cn(
                      "text-3xl font-extrabold tracking-tight",
                      result.risk_level === 'High Risk' ? "text-red-400" : "text-emerald-400"
                    )}>
                      {result.risk_level}
                    </h2>
                    <p className="text-xs text-slate-400 mt-1">
                      Target Disease: <span className="text-slate-200 capitalize font-medium">{result.disease_type}</span>
                    </p>
                  </div>

                  <div className="text-right">
                    <span className="text-2xl font-bold font-mono text-slate-100">
                      {(result.prediction * 100).toFixed(1)}%
                    </span>
                    <span className="block text-xs text-slate-400">Risk Confidence</span>
                  </div>
                </div>
              </div>

              {/* XAI SHAP Chart */}
              <div className="bg-dark-800 rounded-xl p-6 border border-slate-700 shadow-md space-y-4">
                <div className="flex items-center justify-between border-b border-slate-700 pb-3">
                  <h3 className="text-base font-bold text-slate-200 flex items-center gap-2">
                    <Activity className="w-5 h-5 text-primary-400" />
                    Explainable AI (Feature Impact Contribution)
                  </h3>
                  <span className="text-xs text-slate-400">SHAP / Gradient Sensitivity</span>
                </div>

                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} layout="vertical" margin={{ top: 5, right: 30, left: 70, bottom: 5 }}>
                      <XAxis type="number" hide />
                      <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 11 }} />
                      <Tooltip 
                        cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                        contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #334155', borderRadius: '8px', color: '#f1f5f9' }}
                        formatter={(val) => [`${val}%`, 'Impact Weight']}
                      />
                      <Bar dataKey="value" barSize={18} radius={[0, 4, 4, 0]}>
                        {chartData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={index < 3 ? '#0ea5e9' : '#64748b'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <p className="text-xs text-slate-400 text-center border-t border-slate-700/60 pt-3">
                  Bar lengths represent the relative clinical contribution of each patient feature to the final risk output.
                </p>
              </div>
            </>
          ) : (
            <div className="h-full min-h-[320px] flex items-center justify-center bg-dark-800 rounded-xl border border-slate-700 border-dashed text-slate-400 p-8 text-center">
              <div className="max-w-md space-y-3">
                <Brain className="w-12 h-12 mx-auto text-slate-600" />
                <h3 className="text-base font-semibold text-slate-200">Real-Time Model Inference Ready</h3>
                <p className="text-xs text-slate-400">
                  Enter patient clinical vitals on the left or select a preset profile to evaluate real risk probability and view feature explainability.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
