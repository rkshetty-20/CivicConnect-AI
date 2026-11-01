import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';

// Auth Pages
import Login from './pages/Login';
import Register from './pages/Register';

// Citizen Pages
import Home from './pages/citizen/Home';
import ReportIssue from './pages/citizen/ReportIssue';
import IssueFeed from './pages/citizen/IssueFeed';
import MapPage from './pages/citizen/MapPage';
import IssueDetail from './pages/citizen/IssueDetail';
import OfficerDashboard from './pages/officer/OfficerDashboard';
import AdminDashboard from './pages/admin/AdminDashboard';
import Notifications from './pages/citizen/Notifications';
import Leaderboard from './pages/citizen/Leaderboard';
import { SocketProvider } from './context/SocketContext';
import ToastContainer from './components/common/Toast';

// Loading spinner
function LoadingScreen() {
  return (
    <div className="min-h-screen bg-surface-muted flex flex-col items-center justify-center text-ink">
      <div className="w-10 h-10 border-4 border-primary-600 border-t-transparent rounded-full animate-spin" />
      <p className="mt-4 text-sm font-medium text-ink-muted">Loading...</p>
    </div>
  );
}

// Protected Route wrapper
function ProtectedRoute({ children, roles }) {
  const { isAuthenticated, loading, user } = useAuth();
  const location = useLocation();

  if (loading) return <LoadingScreen />;

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (roles && !roles.includes(user?.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}

// Redirect if already logged in
function AnonymousRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  if (loading) return <LoadingScreen />;
  if (isAuthenticated) return <Navigate to="/" replace />;
  return children;
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <SocketProvider>
          <ToastContainer />
          <Routes>
            {/* Public Auth Routes */}
            <Route path="/login" element={<AnonymousRoute><Login /></AnonymousRoute>} />
            <Route path="/register" element={<AnonymousRoute><Register /></AnonymousRoute>} />

            {/* Citizen Routes - Public */}
            <Route path="/" element={<Home />} />
            <Route path="/report" element={<ReportIssue />} />
            <Route path="/feed" element={<IssueFeed />} />
            <Route path="/map" element={<MapPage />} />
            <Route path="/leaderboard" element={<Leaderboard />} />
            <Route path="/issues/:id" element={<IssueDetail />} />
            <Route path="/notifications" element={<Notifications />} />

            {/* Officer Routes */}
            <Route path="/officer" element={<ProtectedRoute roles={['officer', 'admin']}><OfficerDashboard /></ProtectedRoute>} />

            {/* Admin Routes */}
            <Route path="/admin" element={<ProtectedRoute roles={['admin']}><AdminDashboard /></ProtectedRoute>} />

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </SocketProvider>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
