// Live API Fetching Service for FedABHA-X Dashboard

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000/api';

export async function fetchDashboardData() {
  try {
    const response = await fetch(`${API_BASE_URL}/fl/stats`);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Could not fetch dashboard data:", error);
    // Return graceful fallback state if server is offline
    return {
      hospitals: [],
      flStats: { currentRound: 0, globalAccuracy: 0, f1Score: 0 },
      history: [],
      consentStats: { approved: 0, blocked: 0, revoked: 0 },
      anomalies: [],
      auditTrail: []
    };
  }
}

export async function fetchPrediction(patientData) {
  try {
    const response = await fetch(`${API_BASE_URL}/predictions/predict`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(patientData),
    });
    if (!response.ok) {
      if (response.status === 403) {
        throw new Error('Consent Blocked: Access denied for this patient.');
      }
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Could not fetch prediction data:", error);
    throw error;
  }
}

export async function fetchPatientRecord(abhaId) {
  try {
    const response = await fetch(`${API_BASE_URL}/hospitals/patient/${encodeURIComponent(abhaId)}`);
    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      if (response.status === 403) {
        throw new Error(errData.detail || 'Consent Blocked: Access denied for this patient record.');
      }
      if (response.status === 404) {
        throw new Error(errData.detail || 'Patient not found with the given ABHA ID.');
      }
      throw new Error(errData.detail || `HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error("Could not fetch patient record:", error);
    throw error;
  }
}

export async function fetchSamplePatients() {
  try {
    const response = await fetch(`${API_BASE_URL}/hospitals/patients/samples`);
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.warn("Could not fetch sample patients:", error);
    return null;
  }
}

export async function triggerFLRound() {
  try {
    const response = await fetch(`${API_BASE_URL}/fl/trigger_round`, {
      method: 'POST',
    });
    if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
    return await response.json();
  } catch (error) {
    console.error("Could not trigger FL round:", error);
    throw error;
  }
}

export async function loginUser(username_or_email, password) {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username_or_email, password }),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.detail || 'Authentication failed');
    }
    return data;
  } catch (error) {
    console.error("Login request error:", error);
    throw error;
  }
}

export async function quickLoginUser(roleKey) {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/quick-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ role_key: roleKey }),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.detail || 'Quick authentication failed');
    }
    return data;
  } catch (error) {
    console.error("Quick login error:", error);
    throw error;
  }
}

export async function fetchRoles() {
  try {
    const response = await fetch(`${API_BASE_URL}/auth/roles`);
    if (!response.ok) return null;
    return await response.json();
  } catch (error) {
    console.warn("Could not fetch roles:", error);
    return null;
  }
}

export const emptyData = {
  hospitals: [],
  flStats: { currentRound: 0, globalAccuracy: 0, f1Score: 0 },
  consentStats: { approved: 0, blocked: 0, revoked: 0 },
  history: [],
  anomalies: [],
  auditTrail: []
};
