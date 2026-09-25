import { createContext, useContext, useState, useEffect } from 'react';
import { loginUser, quickLoginUser, fetchRoles } from '../services/api';

const DEFAULT_SUPER_ADMIN = {
  id: "USR-001",
  username: "admin",
  email: "admin@fedabha.org",
  name: "Super Administrator",
  role: "admin",
  role_title: "Super Admin",
  hospital_id: null,
  hospital_name: "Global Network Operator",
  permissions: [
    "full_system_control",
    "manage_hospitals",
    "manage_users",
    "view_fl_rounds",
    "trigger_fl_rounds",
    "view_consent",
    "manage_consent",
    "view_security_audit_logs",
    "predict_risk"
  ]
};

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('fedabha_user');
    if (saved) {
      try { return JSON.parse(saved); } catch (e) {}
    }
    return DEFAULT_SUPER_ADMIN;
  });

  const [token, setToken] = useState(() => localStorage.getItem('fedabha_token') || 'bearer-demo-token');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      localStorage.setItem('fedabha_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('fedabha_user');
    }
  }, [user]);

  useEffect(() => {
    if (token) {
      localStorage.setItem('fedabha_token', token);
    } else {
      localStorage.removeItem('fedabha_token');
    }
  }, [token]);

  const login = async (usernameOrEmail, password) => {
    setLoading(true);
    setAuthError(null);
    try {
      const res = await loginUser(usernameOrEmail, password);
      setUser(res.user);
      setToken(res.access_token);
      setIsAuthModalOpen(false);
      return res;
    } catch (err) {
      setAuthError(err.message || 'Authentication failed');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const quickSwitchRole = async (roleKey) => {
    setLoading(true);
    setAuthError(null);
    try {
      const res = await quickLoginUser(roleKey);
      setUser(res.user);
      setToken(res.access_token);
      setIsAuthModalOpen(false);
      return res;
    } catch (err) {
      console.warn("Quick auth server error, falling back locally:", err);
      // Fallback local switch if server is starting up
      const localRoleMap = {
        admin: DEFAULT_SUPER_ADMIN,
        hospital_a: {
          id: "USR-002",
          username: "hospital_a",
          email: "hospital_a@fedabha.org",
          name: "Hospital Admin (City Care)",
          role: "hospital",
          role_title: "Hospital Admin",
          hospital_id: "hospital_A",
          hospital_name: "City Care Medical",
          permissions: ["hospital_node_access", "start_local_training", "view_own_consent", "grant_local_consent", "view_own_fl_results"]
        },
        hospital_b: {
          id: "USR-003",
          username: "hospital_b",
          email: "hospital_b@fedabha.org",
          name: "Hospital Admin (Metro Health)",
          role: "hospital",
          role_title: "Hospital Admin",
          hospital_id: "hospital_B",
          hospital_name: "Metro Health",
          permissions: ["hospital_node_access", "start_local_training", "view_own_consent", "grant_local_consent", "view_own_fl_results"]
        },
        hospital_c: {
          id: "USR-004",
          username: "hospital_c",
          email: "hospital_c@fedabha.org",
          name: "Hospital Admin (General Hospital)",
          role: "hospital",
          role_title: "Hospital Admin",
          hospital_id: "hospital_C",
          hospital_name: "General Hospital",
          permissions: ["hospital_node_access", "start_local_training", "view_own_consent", "grant_local_consent", "view_own_fl_results"]
        },
        auditor: {
          id: "USR-005",
          username: "auditor",
          email: "auditor@fedabha.org",
          name: "Compliance Auditor",
          role: "auditor",
          role_title: "Auditor",
          hospital_id: null,
          hospital_name: "Independent Regulatory Body",
          permissions: ["read_only_access", "view_consent_history", "view_revocation_events", "view_fl_participation_logs", "view_security_events"]
        }
      };

      const selected = localRoleMap[roleKey.toLowerCase()] || DEFAULT_SUPER_ADMIN;
      setUser(selected);
      setToken(`bearer-${roleKey}-token`);
      setIsAuthModalOpen(false);
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('fedabha_user');
    localStorage.removeItem('fedabha_token');
    setIsAuthModalOpen(true);
  };

  const hasPermission = (perm) => {
    if (!user) return false;
    if (user.role === 'admin') return true;
    return user.permissions?.includes(perm) || false;
  };

  const isAdmin = () => user?.role === 'admin';
  const isHospitalAdmin = () => user?.role === 'hospital';
  const isAuditor = () => user?.role === 'auditor';

  return (
    <AuthContext.Provider value={{
      user,
      token,
      loading,
      authError,
      isAuthModalOpen,
      setIsAuthModalOpen,
      login,
      quickSwitchRole,
      logout,
      hasPermission,
      isAdmin,
      isHospitalAdmin,
      isAuditor
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
