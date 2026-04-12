import React, { useState, useEffect } from 'react';
import { concessionAPI } from '../../services/api.js';

function formatDate(dateStr) {
  if (!dateStr) return 'N/A';
  return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function ViewHistory() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  useEffect(() => {
    async function fetchHistory() {
      try {
        const res = await concessionAPI.getHistory();
        setHistory(res.data);
      } catch {
        setError('Failed to load concession history.');
      } finally {
        setLoading(false);
      }
    }
    fetchHistory();
  }, []);

  const filtered = history.filter(c => {
    const typeMatch = filterType === 'all' || c.transport_type === filterType;
    const statusMatch = filterStatus === 'all' || c.status === filterStatus;
    return typeMatch && statusMatch;
  });

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1>Concession History</h1>
        <p>View all your past and current concession applications</p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="card">
        <div className="filters-bar">
          <select
            className="filter-select"
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="all">All Transport Types</option>
            <option value="railway">Railway</option>
            <option value="metro">Metro</option>
          </select>
          <select
            className="filter-select"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="pending">Pending</option>
            <option value="expired">Expired</option>
            <option value="rejected">Rejected</option>
          </select>
          <span className="filters-count">
            {filtered.length} record{filtered.length !== 1 ? 's' : ''} found
          </span>
        </div>

        {filtered.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-text">No concession records found.</div>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Transport</th>
                  <th>Route</th>
                  <th>Class</th>
                  <th>Duration</th>
                  <th>Issue Date</th>
                  <th>Expiry Date</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(c => (
                  <tr key={c.concession_id}>
                    <td><strong>#{c.concession_id}</strong></td>
                    <td>
                      <span className={`badge badge-${c.transport_type}`}>
                        {c.transport_type === 'railway' ? 'Railway' : 'Metro'}
                      </span>
                    </td>
                    <td>{c.source_station} &rarr; {c.destination_station}</td>
                    <td>{c.travel_class.charAt(0).toUpperCase() + c.travel_class.slice(1)}</td>
                    <td>{c.duration === '1_month' ? 'Monthly' : 'Quarterly'}</td>
                    <td>{formatDate(c.issue_date)}</td>
                    <td>{formatDate(c.expiry_date)}</td>
                    <td><span className={`badge badge-${c.status}`}>{c.status}</span></td>
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
