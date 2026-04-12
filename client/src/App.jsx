import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import StudentLayout from './components/StudentLayout.jsx';
import AdminLayout from './components/AdminLayout.jsx';
import Landing from './pages/Landing.jsx';
import Login from './pages/Login.jsx';
import Signup from './pages/Signup.jsx';
import Dashboard from './pages/student/Dashboard.jsx';
import ApplyRenew from './pages/student/ApplyRenew.jsx';
import ViewHistory from './pages/student/ViewHistory.jsx';
import Profile from './pages/student/Profile.jsx';
import AdminDashboard from './pages/admin/AdminDashboard.jsx';
import VerifyApplications from './pages/admin/VerifyApplications.jsx';
import Reports from './pages/admin/Reports.jsx';
export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/student" element={<ProtectedRoute role="student" />}>
          <Route element={<StudentLayout />}>
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="apply" element={<ApplyRenew />} />
            <Route path="history" element={<ViewHistory />} />
            <Route path="profile" element={<Profile />} />
          </Route>
        </Route>
        <Route path="/admin" element={<ProtectedRoute role="admin" />}>
          <Route element={<AdminLayout />}>
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="verify" element={<VerifyApplications />} />
            <Route path="reports" element={<Reports />} />
          </Route>
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
