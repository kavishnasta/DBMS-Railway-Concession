import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api.js';

function formatDate(dateStr) {
  if (!dateStr) return 'N/A';
  return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function AdminDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  async function fetchDashboard() {
    setLoading(true);
    try {
      const res = await adminAPI.getDashboard();
      setData(res.data);
    } catch {
      setError('Failed to load dashboard data.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
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

  const { metrics, recent_applications } = data;

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
        <div className="metric-card">
          <div className="metric-tag mono">N&deg; 01</div>
          <div className="metric-value">{metrics.pending}</div>
          <div className="metric-label">Pending Applications</div>
          <div className="metric-sub">Awaiting review</div>
        </div>
        <div className="metric-card">
          <div className="metric-tag mono">N&deg; 02</div>
          <div className="metric-value">{metrics.approved_today}</div>
          <div className="metric-label">Approved Today</div>
          <div className="metric-sub">Actions taken today</div>
        </div>
        <div className="metric-card">
          <div className="metric-tag mono">N&deg; 03</div>
          <div className="metric-value">{metrics.total_active}</div>
          <div className="metric-label">Total Active</div>
          <div className="metric-sub">Active concessions</div>
        </div>
        <div className="metric-card">
          <div className="metric-tag mono">N&deg; 04</div>
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

        {recent_applications.length === 0 ? (
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
                {recent_applications.map(app => (
                  <tr key={app.concession_id}>
                    <td><strong>{app.name}</strong></td>
                    <td>{app.enrolment_no}</td>
                    <td>
                      <span className={`badge badge-${app.concession_type}`}>
                        {app.concession_type === 'railway' ? 'Railway' : 'Metro'}
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
