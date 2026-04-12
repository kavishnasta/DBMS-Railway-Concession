import React from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
function Icon({ d }) {
  return (
    <svg viewBox="0 0 24 24">
      <path d={d} />
    </svg>
  );
}
const NAV_ITEMS=[
  { to: '/admin/dashboard', label: 'Dashboard', icon: 'M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z' },
  { to: '/admin/verify', label: 'Verify Applications', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
  { to: '/admin/reports', label: 'Reports', icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' },
];
export default function AdminLayout() {
  const { user, logout }=useAuth();
  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="sidebar-logo">
            <img src="/vjti-logo.png" alt="VJTI" className="sidebar-logo-img" />
            <div>
              <div className="sidebar-logo-title">Admin Panel</div>
              <div className="sidebar-logo-sub">Concession Management</div>
            </div>
          </div>
        </div>
        <nav className="sidebar-nav">
          {NAV_ITEMS.map(({ to, label, icon })=>(
            <NavLink
              key={to}
              to={to}
              className={({ isActive })=>`sidebar-nav-item${isActive ? ' active' : ''}`}
            >
              <span className="sidebar-nav-icon"><Icon d={icon} /></span>
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar-footer">
          <div className="sidebar-user">
            <strong>{user?.name}</strong>
            Administrator
          </div>
          <button className="sidebar-nav-item" onClick={logout} style={{ borderRadius: '6px', color: '#f87171' }}>
            <span className="sidebar-nav-icon">
              <Icon d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H6a2 2 0 01-2-2V7a2 2 0 012-2h5a2 2 0 012 2v1" />
            </span>
            Logout
          </button>
        </div>
      </aside>
      <main className="page-content">
        <Outlet />
      </main>
    </div>
  );
}
