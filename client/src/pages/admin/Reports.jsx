import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer
} from 'recharts';
import { adminAPI } from '../../services/api.js';
export default function Reports() {
  const [data, setData]=useState(null);
  const [loading, setLoading]=useState(true);
  const [error, setError]=useState('');
  const [downloading, setDownloading]=useState(false);
  async function handleDownloadPDF() {
    setDownloading(true);
    try {
      const res=await adminAPI.downloadReportPDF();
      const url=window.URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }));
      const a=document.createElement('a');
      a.href=url;
      a.download=`vjti-concession-report-${new Date().toISOString().split('T')[0]}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      alert('Failed to generate PDF report. Please try again.');
    } finally {
      setDownloading(false);
    }
  }
  useEffect(()=>{
    async function fetchReports() {
      try {
        const res=await adminAPI.getReports();
        setData(res.data);
      } catch {
        setError('Failed to load reports.');
      } finally {
        setLoading(false);
      }
    }
    fetchReports();
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
  const { concessions_by_month, popular_routes }=data;
  const totalConcessions=popular_routes.reduce((sum, r)=>sum + parseInt(r.student_count), 0);
  const totalRailway=popular_routes.filter(r=>r.transport_type==='railway').reduce((sum, r)=>sum + parseInt(r.student_count), 0);
  const totalMetro=popular_routes.filter(r=>r.transport_type==='metro').reduce((sum, r)=>sum + parseInt(r.student_count), 0);
  const chartData=concessions_by_month.map(row=>({
    month: row.month,
    Total: parseInt(row.total),
    Railway: parseInt(row.railway),
    Metro: parseInt(row.metro)
  }));
  return (
    <div>
      <div className="page-header" style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1>Reports & Analytics</h1>
          <p>Insights into concession usage and trends</p>
        </div>
        <button
          className="btn btn-primary"
          style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', whiteSpace: 'nowrap' }}
          onClick={handleDownloadPDF}
          disabled={downloading}
        >
          <svg viewBox="0 0 24 24" style={{ width: 15, height: 15, stroke: 'currentColor', fill: 'none', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' }}>
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          {downloading ? 'Generating...' : 'Download PDF Report'}
        </button>
      </div>
      <div className="metrics-grid">
        <div className="metric-card metric-card--ink">
          <div className="metric-icon-row">
            <svg viewBox="0 0 24 24" className="metric-icon-svg"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>
            <span className="metric-icon-label">All Types</span>
          </div>
          <div className="metric-value">{totalConcessions}</div>
          <div className="metric-label">Total Concessions</div>
          <div className="metric-sub">From top routes</div>
        </div>
        <div className="metric-card metric-card--amber">
          <div className="metric-icon-row">
            <svg viewBox="0 0 24 24" className="metric-icon-svg"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            <span className="metric-icon-label">Railway</span>
          </div>
          <div className="metric-value">{totalRailway}</div>
          <div className="metric-label">Railway Passes</div>
          <div className="metric-sub">From top routes</div>
        </div>
        <div className="metric-card metric-card--blue">
          <div className="metric-icon-row">
            <svg viewBox="0 0 24 24" className="metric-icon-svg"><rect x="1" y="3" width="15" height="13" rx="2"/><path d="M16 8h4l3 5v3h-7V8z"/><circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/></svg>
            <span className="metric-icon-label">Metro</span>
          </div>
          <div className="metric-value">{totalMetro}</div>
          <div className="metric-label">Metro Passes</div>
          <div className="metric-sub">From top routes</div>
        </div>
        <div className="metric-card metric-card--green">
          <div className="metric-icon-row">
            <svg viewBox="0 0 24 24" className="metric-icon-svg"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
            <span className="metric-icon-label">History</span>
          </div>
          <div className="metric-value">{concessions_by_month.length}</div>
          <div className="metric-label">Months Tracked</div>
          <div className="metric-sub">Last 6 months</div>
        </div>
      </div>
      <div className="reports-grid">
        <div className="card card-full">
          <div className="card-header">
            <div>
              <div className="card-title">Concessions Per Month</div>
              <div className="card-subtitle">Breakdown of railway vs metro concessions over the last 6 months</div>
            </div>
          </div>
          {chartData.length===0 ? (
            <div className="empty-state">
              <div className="empty-state-text">No monthly data available yet.</div>
            </div>
          ) : (
            <div className="chart-container">
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={chartData} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e6dfcd" />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#3a3a3a' }} />
                  <YAxis tick={{ fontSize: 12, fill: '#3a3a3a' }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="Total" fill="#141414" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="Railway" fill="#b8421f" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="Metro" fill="#8a8472" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">Most Used Routes</div>
            <div className="card-subtitle">Top 10 routes by concession count</div>
          </div>
        </div>
        {popular_routes.length===0 ? (
          <div className="empty-state">
            <div className="empty-state-text">No route data available yet.</div>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Rank</th>
                  <th>Route</th>
                  <th>Type</th>
                  <th>Student Count</th>
                  <th>Share</th>
                </tr>
              </thead>
              <tbody>
                {popular_routes.map((route, index)=>(
                  <tr key={index}>
                    <td>
                      <div className="rank-number">{index + 1}</div>
                    </td>
                    <td>
                      <strong>{route.source_station}</strong>
                      <span className="route-arrow">&rarr;</span>
                      <strong>{route.destination_station}</strong>
                    </td>
                    <td>
                      <span className={`badge badge-${route.transport_type}`}>
                        {route.transport_type==='railway' ? 'Railway' : 'Metro'}
                      </span>
                    </td>
                    <td><strong>{route.student_count}</strong></td>
                    <td className="route-share-cell">
                      <div className="route-share-row">
                        <div className="route-share-bar">
                          <div className="progress-bar-container">
                            <div
                              className="progress-bar-fill"
                              style={{ width: `${Math.min(parseFloat(route.percentage), 100)}%` }}
                            ></div>
                          </div>
                        </div>
                        <span className="route-share-pct mono">
                          {route.percentage}%
                        </span>
                      </div>
                    </td>
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
