import React, { useState, useEffect } from 'react';
import { adminAPI } from '../../services/api.js';
function formatDate(dateStr) {
  if (!dateStr) return 'N/A';
  return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}
function DetailModal({ concessionId, onClose, onAction }) {
  const [detail, setDetail]=useState(null);
  const [loading, setLoading]=useState(true);
  const [actionLoading, setActionLoading]=useState(false);
  const [remarks, setRemarks]=useState('');
  const [error, setError]=useState('');
  useEffect(()=>{
    async function fetchDetail() {
      try {
        const res=await adminAPI.getApplicationDetail(concessionId);
        setDetail(res.data);
      } catch {
        setError('Failed to load application details.');
      } finally {
        setLoading(false);
      }
    }
    fetchDetail();
  }, [concessionId]);
  async function handleAction(action) {
    setActionLoading(true);
    setError('');
    try {
      await adminAPI.takeAction(concessionId, { action, remarks });
      onAction();
      onClose();
    } catch (err) {
      setError(err.response?.data?.error||'Action failed.');
    } finally {
      setActionLoading(false);
    }
  }
  return (
    <div className="modal-overlay" onClick={(e)=>e.target===e.currentTarget&&onClose()}>
      <div className="modal">
        <div className="modal-header">
          <span className="modal-title">Application Details #{concessionId}</span>
          <button className="modal-close" onClick={onClose}>&times;</button>
        </div>
        {loading ? (
          <div className="loading-container">
            <div className="loading-spinner"></div>
          </div>
        ) : error&&!detail ? (
          <div className="alert alert-error">{error}</div>
        ) : detail ? (
          <>
            <div className="modal-section">
              <div className="modal-section-title">Student Information</div>
              <div className="modal-detail">
                <span className="modal-detail-label">Name</span>
                <span className="modal-detail-value">{detail.concession.name}</span>
              </div>
              <div className="modal-detail">
                <span className="modal-detail-label">Enrolment No</span>
                <span className="modal-detail-value">{detail.concession.enrolment_no}</span>
              </div>
              <div className="modal-detail">
                <span className="modal-detail-label">Course / Year</span>
                <span className="modal-detail-value">{detail.concession.course}, Year {detail.concession.year}</span>
              </div>
              <div className="modal-detail">
                <span className="modal-detail-label">Email</span>
                <span className="modal-detail-value">{detail.concession.email}</span>
              </div>
              <div className="modal-detail">
                <span className="modal-detail-label">College</span>
                <span className="modal-detail-value">{detail.concession.college_id}</span>
              </div>
            </div>
            <div className="modal-section">
              <div className="modal-section-title">Concession Details</div>
              <div className="modal-detail">
                <span className="modal-detail-label">Route</span>
                <span className="modal-detail-value">{detail.concession.source_station} &rarr; {detail.concession.destination_station}</span>
              </div>
              <div className="modal-detail">
                <span className="modal-detail-label">Transport Type</span>
                <span className="modal-detail-value">{detail.concession.transport_type}</span>
              </div>
              <div className="modal-detail">
                <span className="modal-detail-label">Travel Class</span>
                <span className="modal-detail-value">{detail.concession.travel_class}</span>
              </div>
              <div className="modal-detail">
                <span className="modal-detail-label">Duration</span>
                <span className="modal-detail-value">{detail.concession.duration==='1_month' ? 'Monthly' : 'Quarterly'}</span>
              </div>
              <div className="modal-detail">
                <span className="modal-detail-label">Issue Date</span>
                <span className="modal-detail-value">{formatDate(detail.concession.issue_date)}</span>
              </div>
              <div className="modal-detail">
                <span className="modal-detail-label">Expiry Date</span>
                <span className="modal-detail-value">{formatDate(detail.concession.expiry_date)}</span>
              </div>
              <div className="modal-detail">
                <span className="modal-detail-label">Current Status</span>
                <span className="modal-detail-value">
                  <span className={`badge badge-${detail.concession.status}`}>{detail.concession.status}</span>
                </span>
              </div>
            </div>
            {detail.student_documents&&detail.student_documents.length > 0&&(
              <div className="modal-section">
                <div className="modal-section-title">Student Documents</div>
                <div className="doc-review-grid">
                  {detail.student_documents.map(doc=>{
                    const isPdf=doc.file_name&&doc.file_name.toLowerCase().endsWith('.pdf');
                    const openUrl=isPdf
                      ? `/api/admin/documents/proxy?doc_id=${doc.doc_id}`
                      : doc.file_path;
                    const label=doc.document_type==='aadhaar' ? 'Aadhaar Card'
                      : doc.document_type==='address_proof' ? 'Address Proof'
                      : doc.document_type==='college_id' ? 'College ID'
                      : doc.document_type.replace(/_/g,' ').replace(/\b\w/g,c=>c.toUpperCase());
                    return (
                      <div key={doc.doc_id} className="doc-review-card">
                        <div className="doc-review-preview">
                          {isPdf ? (
                            <div className="doc-review-pdf-thumb">
                              <svg viewBox="0 0 24 24" className="doc-thumb-icon"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>
                              <span>PDF</span>
                            </div>
                          ) : (
                            <img src={doc.file_path} alt={label} className="doc-review-img" />
                          )}
                        </div>
                        <div className="doc-review-meta">
                          <div className="doc-review-label">{label}</div>
                          <div className="doc-review-filename">{doc.file_name}</div>
                          <div className="doc-review-actions">
                            <span className={`badge badge-${doc.verification_status==='verified'?'active':doc.verification_status==='failed'?'rejected':'pending'}`}>
                              {doc.verification_status}
                            </span>
                            <a
                              href={doc.file_path}
                              target="_blank"
                              rel="noreferrer"
                              className="btn btn-ghost btn-sm"
                            >
                              Open &rarr;
                            </a>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            {detail.documents&&detail.documents.length > 0&&(
              <div className="modal-section">
                <div className="modal-section-title">Concession Documents</div>
                {detail.documents.map(doc=>(
                  <div key={doc.document_id} className="modal-detail">
                    <span className="modal-detail-label">{doc.document_type.replace(/_/g, ' ').replace(/\b\w/g, c=>c.toUpperCase())}</span>
                    <span className="modal-detail-value">
                      <span className={`badge badge-${doc.verification_status==='verified' ? 'active' : doc.verification_status==='failed' ? 'rejected' : 'pending'}`}>
                        {doc.verification_status}
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            )}
            {detail.approval&&(
              <div className="modal-section">
                <div className="modal-section-title">Approval Status</div>
                <div className="modal-detail">
                  <span className="modal-detail-label">Action</span>
                  <span className="modal-detail-value">
                    <span className={`badge badge-${detail.approval.action==='approved' ? 'active' : detail.approval.action==='rejected' ? 'rejected' : 'pending'}`}>
                      {detail.approval.action}
                    </span>
                  </span>
                </div>
                {detail.approval.remarks&&(
                  <div className="modal-detail">
                    <span className="modal-detail-label">Remarks</span>
                    <span className="modal-detail-value">{detail.approval.remarks}</span>
                  </div>
                )}
                {detail.approval.approved_by_name&&(
                  <div className="modal-detail">
                    <span className="modal-detail-label">Processed By</span>
                    <span className="modal-detail-value">{detail.approval.approved_by_name}</span>
                  </div>
                )}
              </div>
            )}
            {detail.concession.status==='pending'&&(
              <>
                {error&&<div className="alert alert-error">{error}</div>}
                <div className="form-group">
                  <label className="form-label">Remarks</label>
                  <textarea
                    className="form-textarea"
                    placeholder="Add remarks (optional)"
                    value={remarks}
                    onChange={(e)=>setRemarks(e.target.value)}
                  />
                </div>
                <div className="modal-actions">
                  <button
                    className="btn btn-ink"
                    onClick={()=>handleAction('approved')}
                    disabled={actionLoading}
                  >
                    {actionLoading ? 'Processing...' : 'Approve'}
                  </button>
                  <button
                    className="btn btn-ghost"
                    onClick={()=>handleAction('rejected')}
                    disabled={actionLoading}
                  >
                    {actionLoading ? 'Processing...' : 'Reject'}
                  </button>
                </div>
              </>
            )}
          </>
        ) : null}
      </div>
    </div>
  );
}
export default function VerifyApplications() {
  const [applications, setApplications]=useState([]);
  const [loading, setLoading]=useState(true);
  const [error, setError]=useState('');
  const [selectedId, setSelectedId]=useState(null);
  const [actionRemarks, setActionRemarks]=useState({});
  const [actionLoading, setActionLoading]=useState({});
  const [successMsg, setSuccessMsg]=useState('');
  async function fetchApplications() {
    setLoading(true);
    try {
      const res=await adminAPI.getPendingApplications();
      setApplications(res.data);
    } catch {
      setError('Failed to load pending applications.');
    } finally {
      setLoading(false);
    }
  }
  useEffect(()=>{
    fetchApplications();
  }, []);
  async function handleAction(id, action) {
    setActionLoading(prev=>({ ...prev, [id]: true }));
    setError('');
    setSuccessMsg('');
    try {
      const res=await adminAPI.takeAction(id, { action, remarks: actionRemarks[id]||'' });
      setSuccessMsg(res.data.message);
      fetchApplications();
    } catch (err) {
      setError(err.response?.data?.error||'Action failed.');
    } finally {
      setActionLoading(prev=>({ ...prev, [id]: false }));
    }
  }
  function formatDate(dateStr) {
    if (!dateStr) return 'N/A';
    return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
  }
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
        <div className="page-header-row">
          <div>
            <h1>Verify Applications</h1>
            <p>Review and approve or reject pending concession applications</p>
          </div>
          <button className="btn btn-ghost" onClick={fetchApplications}>
            Refresh
          </button>
        </div>
      </div>
      {error&&<div className="alert alert-error">{error}</div>}
      {successMsg&&<div className="alert alert-success">{successMsg}</div>}
      <div className="card">
        {applications.length===0 ? (
          <div className="empty-state">
            <div className="empty-state-text">No pending applications. All caught up.</div>
          </div>
        ) : (
          <div className="table-container">
            <table>
              <thead>
                <tr>
                  <th>Student</th>
                  <th>Course / Year</th>
                  <th>Route</th>
                  <th>Duration</th>
                  <th>Type</th>
                  <th>Docs</th>
                  <th>Applied</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {applications.map(app=>(
                  <tr key={app.concession_id}>
                    <td>
                      <strong>{app.name}</strong>
                      <div className="row-sub mono">{app.enrolment_no}</div>
                    </td>
                    <td>{app.course}, Y{app.year}</td>
                    <td>
                      <div>{app.source_station}</div>
                      <div className="row-sub">&rarr; {app.destination_station}</div>
                      <div className="row-sub-fine">{app.travel_class} class</div>
                    </td>
                    <td>{app.duration==='1_month' ? 'Monthly' : 'Quarterly'}</td>
                    <td>
                      <span className={`badge badge-${app.transport_type}`}>
                        {app.transport_type==='railway' ? 'Railway' : 'Metro'}
                      </span>
                    </td>
                    <td>
                      {parseInt(app.doc_count) > 0 ? (
                        <span className="doc-count-badge" title={`${app.doc_count} document(s) uploaded`}>
                          <svg viewBox="0 0 24 24" className="doc-count-icon"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                          {app.doc_count}
                        </span>
                      ) : (
                        <span className="doc-count-none">None</span>
                      )}
                    </td>
                    <td>{formatDate(app.created_at)}</td>
                    <td><span className={`badge badge-${app.status}`}>{app.status}</span></td>
                    <td>
                      <div className="row-action-stack">
                        <input
                          type="text"
                          className="form-input row-remarks"
                          placeholder="Remarks..."
                          value={actionRemarks[app.concession_id]||''}
                          onChange={(e)=>setActionRemarks(prev=>({ ...prev, [app.concession_id]: e.target.value }))}
                        />
                        <div className="action-buttons">
                          <button
                            className="btn btn-ink btn-sm"
                            onClick={()=>handleAction(app.concession_id, 'approved')}
                            disabled={actionLoading[app.concession_id]}
                          >
                            Approve
                          </button>
                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={()=>handleAction(app.concession_id, 'rejected')}
                            disabled={actionLoading[app.concession_id]}
                          >
                            Reject
                          </button>
                          <button
                            className="btn btn-ghost btn-sm"
                            onClick={()=>setSelectedId(app.concession_id)}
                          >
                            View
                          </button>
                        </div>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
      {selectedId&&(
        <DetailModal
          concessionId={selectedId}
          onClose={()=>setSelectedId(null)}
          onAction={()=>{ fetchApplications(); setSuccessMsg('Action taken successfully.'); }}
        />
      )}
    </div>
  );
}
