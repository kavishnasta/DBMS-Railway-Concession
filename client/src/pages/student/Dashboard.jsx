import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { studentAPI } from '../../services/api.js';
function formatDate(dateStr) {
  if (!dateStr) return 'N/A';
  return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}
function StatusBadge({ status }) {
  return <span className={`badge badge-${status||'pending'}`}>{status||'N/A'}</span>;
}
export default function Dashboard() {
  const [data, setData]=useState(null);
  const [loading, setLoading]=useState(true);
  const [error, setError]=useState('');
  useEffect(()=>{
    async function fetchDashboard() {
      try {
        const res=await studentAPI.getDashboard();
        setData(res.data);
      } catch (err) {
        setError('Failed to load dashboard data.');
      } finally {
        setLoading(false);
      }
    }
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
  const { student, active_concession, total_renewals, next_expiry }=data;
  return (
    <div>
      <div className="page-header">
        <h1>Welcome back, <strong style={{ color: '#1a2332' }}>{student.name}</strong></h1>
        <p className="greeting">Enrolment No: <strong>{student.enrolment_no}</strong> &bull; {student.course}, Year {student.year}</p>
      </div>
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-value">{active_concession ? active_concession.concession_type.charAt(0).toUpperCase() + active_concession.concession_type.slice(1) : 'None'}</div>
          <div className="metric-label">Active Concession</div>
          <div className="metric-sub">{active_concession ? `${active_concession.source_station} \u2192 ${active_concession.destination_station}` : 'No active concession'}</div>
        </div>
        <div className="metric-card">
          <div className="metric-value">
            <StatusBadge status={active_concession ? active_concession.status : 'None'} />
          </div>
          <div className="metric-label">Current Status</div>
          <div className="metric-sub">{active_concession ? 'Concession is active' : 'No active concession'}</div>
        </div>
        <div className="metric-card">
          <div className="metric-value">{total_renewals}</div>
          <div className="metric-label">Total Applications</div>
          <div className="metric-sub">Including all statuses</div>
        </div>
        <div className="metric-card">
          <div className="metric-value" style={{ fontSize: '1.1rem' }}>{formatDate(next_expiry)}</div>
          <div className="metric-label">Next Expiry</div>
          <div className="metric-sub">{next_expiry ? 'Upcoming expiration' : 'No active concession'}</div>
        </div>
      </div>
      {active_concession ? (
        <div className="pass-card">
          <div className="pass-card-header">
            <div>
              <div className="pass-card-eyebrow">
                {active_concession.transport_type === 'railway' ? (
                  <svg viewBox="0 0 24 24" className="pass-card-icon"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>
                ) : (
                  <svg viewBox="0 0 24 24" className="pass-card-icon"><rect x="1" y="3" width="15" height="13" rx="2"/><path d="M16 8h4l3 5v3h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
                )}
                {active_concession.transport_type.charAt(0).toUpperCase() + active_concession.transport_type.slice(1)} Concession Pass
              </div>
              <div className="pass-card-route">
                {active_concession.source_station}
                <svg viewBox="0 0 24 24" className="pass-route-arrow"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
                {active_concession.destination_station}
              </div>
            </div>
            <span className="badge badge-active">Active</span>
          </div>
          <div className="pass-card-divider"></div>
          <div className="concession-card-grid">
            <div>
              <div className="concession-card-label">Travel Class</div>
              <div className="concession-card-value">{active_concession.travel_class.charAt(0).toUpperCase() + active_concession.travel_class.slice(1)} Class</div>
            </div>
            <div>
              <div className="concession-card-label">Duration</div>
              <div className="concession-card-value">{active_concession.duration === '1_month' ? 'Monthly' : 'Quarterly'}</div>
            </div>
            <div>
              <div className="concession-card-label">Issue Date</div>
              <div className="concession-card-value">{formatDate(active_concession.issue_date)}</div>
            </div>
            <div>
              <div className="concession-card-label">Expiry Date</div>
              <div className="concession-card-value">{formatDate(active_concession.expiry_date)}</div>
            </div>
          </div>
          <div className="pass-card-footer">
            <span className="concession-card-label">Pass ID &nbsp;#</span>
            <span className="pass-card-id">{active_concession.concession_id}</span>
          </div>
        </div>
      ) : (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">
              <svg viewBox="0 0 24 24" style={{ width: 40, height: 40, stroke: 'var(--ink-20)', fill: 'none', strokeWidth: 1.4, strokeLinecap: 'round', strokeLinejoin: 'round' }}><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/><line x1="12" y1="12" x2="12" y2="16"/><line x1="10" y1="14" x2="14" y2="14"/></svg>
            </div>
            <div className="empty-state-text">No active concession pass</div>
            <p style={{ fontSize: '0.82rem', color: 'var(--ink-40)', marginTop: '0.4rem', marginBottom: '1.25rem' }}>
              Apply for a railway or metro concession to get started.
            </p>
            <Link to="/student/apply" className="btn btn-primary">Apply for Concession</Link>
          </div>
        </div>
      )}
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Quick Actions</div>
            <div className="card-subtitle">Manage your concession</div>
          </div>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <Link to="/student/apply" className="btn btn-primary">
            Apply / Renew Concession
          </Link>
          <Link to="/student/history" className="btn btn-secondary">
            View History
          </Link>
          <Link to="/student/profile" className="btn btn-secondary">
            View Profile
          </Link>
        </div>
      </div>
    </div>
  );
}
