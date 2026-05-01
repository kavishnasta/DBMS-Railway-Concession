import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api.js';
function formatDate(dateStr) {
  if (!dateStr) return 'N/A';
  return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}
export default function AdminDashboard() {
  const [data, setData]=useState(null);
  const [loading, setLoading]=useState(true);
  const [error, setError]=useState('');
  async function fetchDashboard() {
    setLoading(true);
    try {
      const res=await adminAPI.getDashboard();
      setData(res.data);
    } catch {
      setError('Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  }
  useEffect(()=>{
    fetchDashboard();
  }, []);
  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
      </div>
    );
  }
  if (error) {
    return <div className="alert alert-error">{error}</div>;
  }
  const { metrics, recent_applications }=data;
  return (
    <div>
      <div className="page-header">
        <div className="page-header-row">
          <div>
            <h1>Admin Dashboard</h1>
            <p>Overview of concession management system</p>
          </div>
          <button className="btn btn-ghost" onClick={fetchDashboard}>
            Refresh
          </button>
        </div>
      </div>
      <div className="metrics-grid">
        <div className="metric-card metric-card--amber">
          <div className="metric-icon-row">
            <svg viewBox="0 0 24 24" className="metric-icon-svg"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            <span className="metric-icon-label">Pending</span>
          </div>
          <div className="metric-value">{metrics.pending}</div>
          <div className="metric-label">Pending Applications</div>
          <div className="metric-sub">Awaiting review</div>
        </div>
        <div className="metric-card metric-card--green">
          <div className="metric-icon-row">
            <svg viewBox="0 0 24 24" className="metric-icon-svg"><polyline points="20 6 9 17 4 12"/></svg>
            <span className="metric-icon-label">Today</span>
          </div>
          <div className="metric-value">{metrics.approved_today}</div>
          <div className="metric-label">Approved Today</div>
          <div className="metric-sub">Actions taken today</div>
        </div>
        <div className="metric-card metric-card--blue">
          <div className="metric-icon-row">
            <svg viewBox="0 0 24 24" className="metric-icon-svg"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>
            <span className="metric-icon-label">Active</span>
          </div>
          <div className="metric-value">{metrics.total_active}</div>
          <div className="metric-label">Total Active</div>
          <div className="metric-sub">Active concessions</div>
        </div>
        <div className="metric-card metric-card--ink">
          <div className="metric-icon-row">
            <svg viewBox="0 0 24 24" className="metric-icon-svg"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            <span className="metric-icon-label">Students</span>
          </div>
          <div className="metric-value">{metrics.total_students}</div>
          <div className="metric-label">Total Students</div>
          <div className="metric-sub">Registered students</div>
        </div>
      </div>
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Recent Applications</div>
            <div className="card-subtitle">Last 10 concession applications</div>
          </div>
        </div>
        {recent_applications.length===0 ? (
          <div className="empty-state">
            <div className="empty-state-text">No applications found.</div>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Student Name</th>
                  <th>Enrolment No</th>
                  <th>Type</th>
                  <th>Route</th>
                  <th>Applied Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {recent_applications.map(app=>(
                  <tr key={app.concession_id}>
                    <td><strong>{app.name}</strong></td>
                    <td>{app.enrolment_no}</td>
                    <td>
                      <span className={`badge badge-${app.concession_type}`}>
                        {app.concession_type==='railway' ? 'Railway' : 'Metro'}
                      </span>
                    </td>
                    <td>{app.source_station} &rarr; {app.destination_station}</td>
                    <td>{formatDate(app.created_at)}</td>
                    <td><span className={`badge badge-${app.status}`}>{app.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
