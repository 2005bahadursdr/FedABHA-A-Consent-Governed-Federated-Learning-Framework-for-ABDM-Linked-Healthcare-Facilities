import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import AuthModal from './components/AuthModal';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import ConsentManagement from './pages/ConsentManagement';
import Hospitals from './pages/Hospitals';
import FederatedLearning from './pages/FederatedLearning';
import Predictions from './pages/Predictions';
import TrustEvaluation from './pages/TrustEvaluation';
import AnomalyDetection from './pages/AnomalyDetection';
import AuditLogs from './pages/AuditLogs';
import LocalHospital from './pages/LocalHospital';
import LoginPage from './pages/LoginPage';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AuthModal />
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/" element={<Layout />}>
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="local-hospital" element={<LocalHospital />} />
            <Route path="consent" element={<ConsentManagement />} />
            <Route path="hospitals" element={<Hospitals />} />
            <Route path="fl" element={<FederatedLearning />} />
            <Route path="predictions" element={<Predictions />} />
            <Route path="trust" element={<TrustEvaluation />} />
            <Route path="anomalies" element={<AnomalyDetection />} />
            <Route path="audit" element={<AuditLogs />} />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
