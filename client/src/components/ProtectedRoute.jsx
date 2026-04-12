import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
export default function ProtectedRoute({ role }) {
  const { isAuthenticated, user, loading }=useAuth();
  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
      </div>
    );
  }
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  if (role&&user?.role!==role) {
    return <Navigate to="/login" replace />;
  }
  return <Outlet />;
}
