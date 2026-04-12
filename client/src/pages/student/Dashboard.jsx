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
        <div className="concession-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div className="concession-card-label">Active Concession Pass</div>
              <div className="concession-card-value" style={{ fontSize: '1.3rem' }}>
                {active_concession.source_station} &rarr; {active_concession.destination_station}
              </div>
            </div>
            <span className="badge" style={{ background: '#dbe6f3', color: '#3b6ba5', fontSize: '0.72rem' }}>
              ACTIVE
            </span>
          </div>
          <div className="concession-card-grid">
            <div>
              <div className="concession-card-label">Transport Type</div>
              <div className="concession-card-value">{active_concession.transport_type.charAt(0).toUpperCase() + active_concession.transport_type.slice(1)}</div>
            </div>
            <div>
              <div className="concession-card-label">Travel Class</div>
              <div className="concession-card-value">{active_concession.travel_class.charAt(0).toUpperCase() + active_concession.travel_class.slice(1)} Class</div>
            </div>
            <div>
              <div className="concession-card-label">Duration</div>
              <div className="concession-card-value">{active_concession.duration==='1_month' ? 'Monthly' : 'Quarterly'}</div>
            </div>
            <div>
              <div className="concession-card-label">Issue Date</div>
              <div className="concession-card-value">{formatDate(active_concession.issue_date)}</div>
            </div>
            <div>
              <div className="concession-card-label">Expiry Date</div>
              <div className="concession-card-value">{formatDate(active_concession.expiry_date)}</div>
            </div>
            <div>
              <div className="concession-card-label">Concession ID</div>
              <div className="concession-card-value">#{active_concession.concession_id}</div>
            </div>
          </div>
        </div>
      ) : (
        <div className="card">
          <div style={{ textAlign: 'center', padding: '2rem 1rem' }}>
            <h3 style={{ color: '#111', marginBottom: '0.5rem' }}>No Active Concession</h3>
            <p style={{ color: '#888', marginBottom: '1.25rem', fontSize: '0.875rem' }}>
              Apply for your first railway or metro concession pass to get started.
            </p>
            <Link to="/student/apply" className="btn btn-primary">
              Apply for Concession
            </Link>
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
