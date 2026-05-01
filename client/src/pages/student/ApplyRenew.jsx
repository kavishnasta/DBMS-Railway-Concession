import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { concessionAPI } from '../../services/api.js';
// Allowed source stations and which railway line they belong to
// key is unique; name is the actual station name sent to the API
const SOURCE_STATIONS=[
  { key: 'Dadar-western', name: 'Dadar', line: 'western', display: 'Dadar (Western Line)' },
  { key: 'Dadar-central', name: 'Dadar', line: 'central', display: 'Dadar (Central Line)' },
  { key: 'Matunga',       name: 'Matunga',      line: 'central',  display: 'Matunga (Central Line)' },
  { key: 'Wadala Road',   name: 'Wadala Road',  line: 'harbour',  display: 'Wadala Road (Harbour Line)' },
  { key: "King\u2019s Circle", name: "King\u2019s Circle", line: 'harbour', display: "King\u2019s Circle (Harbour Line)" },
];
export default function ApplyRenew() {
  const [stations, setStations]=useState({ railway: {}, metro: {} });
  const [existingConcession, setExistingConcession]=useState(null);
  const [form, setForm]=useState({
    transport_type: 'railway',
    source_key: '',
    source_station: '',
    destination_station: '',
    travel_class: 'second',
    duration: '1_month'
  });
  const [loading, setLoading]=useState(false);
  const [pageLoading, setPageLoading]=useState(true);
  const [success, setSuccess]=useState('');
  const [error, setError]=useState('');
  useEffect(()=>{
    async function init() {
      try {
        const [stationsRes, historyRes]=await Promise.all([
          concessionAPI.getStations(),
          concessionAPI.getHistory()
        ]);
        setStations(stationsRes.data);
        const pending=historyRes.data.find(c=>c.status==='pending');
        if (pending) {
          setExistingConcession({ ...pending, blockReason: 'pending' });
        } else {
          const active=historyRes.data.find(c=>c.status==='active');
          if (active) {
            const expiry=new Date(active.expiry_date);
            const today=new Date();
            today.setHours(0,0,0,0);
            expiry.setHours(0,0,0,0);
            const daysLeft=Math.ceil((expiry - today)/(1000*60*60*24));
            if (daysLeft>3) setExistingConcession({ ...active, blockReason: 'active', daysLeft });
          }
        }
      } catch {
        setError('Failed to load data.');
      } finally {
        setPageLoading(false);
      }
    }
    init();
  }, []);
  const selectedSourceMeta=useMemo(()=>{
    return SOURCE_STATIONS.find(s=>s.key===form.source_key)||null;
  }, [form.source_key]);
  const destinationStations=useMemo(()=>{
    if (!selectedSourceMeta) return [];
    const lineObj=stations.railway[selectedSourceMeta.line];
    if (!lineObj) return [];
    return lineObj.stations.filter(s=>s.name!==form.source_station);
  }, [stations, selectedSourceMeta, form.source_station]);
  function handleSourceChange(key) {
    const meta=SOURCE_STATIONS.find(s=>s.key===key)||null;
    setForm({ ...form, source_key: key, source_station: meta ? meta.name : '', destination_station: '' });
  }
  function handleDurationChange(dur) {
    setForm({ ...form, duration: dur });
  }
  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!form.source_station||!form.destination_station) {
      setError('Please select both source and destination stations.');
      return;
    }
    setLoading(true);
    try {
      const res=await concessionAPI.apply(form);
      setSuccess(`${res.data.message} (Concession ID: #${res.data.concession_id})`);
      const historyRes=await concessionAPI.getHistory();
      const pending=historyRes.data.find(c=>c.status==='pending');
      if (pending) setExistingConcession({ ...pending, blockReason: 'pending' });
      setForm({
        transport_type: 'railway',
        source_key: '',
        source_station: '',
        destination_station: '',
        travel_class: 'second',
        duration: '1_month'
      });
    } catch (err) {
      setError(err.response?.data?.error||'Failed to submit application.');
    } finally {
      setLoading(false);
    }
  }
  if (pageLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
      </div>
    );
  }
  if (existingConcession) {
    const isPending=existingConcession.blockReason==='pending';
    return (
      <div>
        <div className="page-header">
          <h1>Apply / Renew Concession</h1>
          <p>Submit a new concession application for railway travel</p>
        </div>
        <div className="card">
          <div className="card-header">
            <div className="card-title">Concession Already Active</div>
          </div>
          <div style={{ padding: '1rem 0' }}>
            <p style={{ marginBottom: '1rem' }}>
              You already hold a <strong>{statusLabel}</strong> concession and cannot apply for another until it expires or is cancelled.
            </p>
            <div className="profile-field">
              <span className="profile-field-label">Route</span>
              <span className="profile-field-value">{existingConcession.source_station} &rarr; {existingConcession.destination_station}</span>
            </div>
            <div className="profile-field">
              <span className="profile-field-label">Status</span>
              <span className="profile-field-value"><span className={`badge badge-${existingConcession.status}`}>{existingConcession.status}</span></span>
            </div>
            <div className="profile-field">
              <span className="profile-field-label">Expiry</span>
              <span className="profile-field-value">{existingConcession.expiry_date ? new Date(existingConcession.expiry_date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A'}</span>
            </div>
            <div style={{ marginTop: '1.5rem' }}>
              <Link to="/student/history" className="btn btn-ghost">View concession history</Link>
            </div>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div>
      <div className="page-header">
        <h1>Apply / Renew Concession</h1>
        <p>Submit a new concession application for railway travel</p>
      </div>
      {success&&<div className="alert alert-success">{success}</div>}
      {error&&<div className="alert alert-error">{error}</div>}
      <form onSubmit={handleSubmit} className="apply-form">
        <div className="card">
          <div className="card-header">
            <div className="card-title">Route Details</div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Source Station *</label>
              <select
                className="form-select"
                value={form.source_key}
                onChange={(e)=>handleSourceChange(e.target.value)}
                required
              >
                <option value="">Select source station</option>
                {SOURCE_STATIONS.map((s)=>(
                  <option key={s.key} value={s.key}>{s.display}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Destination Station *</label>
              <select
                className="form-select"
                value={form.destination_station}
                onChange={(e)=>setForm({ ...form, destination_station: e.target.value })}
                required
                disabled={!form.source_station}
              >
                <option value="">
                  {form.source_station ? 'Select destination station' : 'Select a source station first'}
                </option>
                {destinationStations.map((s)=>(
                  <option key={s.name} value={s.name}>
                    {s.name}{s.code ? ` (${s.code})` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {selectedSourceMeta&&(
            <p className="form-hint">
              Showing stations on the <strong>
                {stations.railway[selectedSourceMeta.line]?.label}
              </strong>
            </p>
          )}
          <div className="form-group" style={{ marginTop: '1rem' }}>
            <label className="form-label">Travel Class *</label>
            <select
              className="form-select"
              value={form.travel_class}
              onChange={(e)=>setForm({ ...form, travel_class: e.target.value })}
              required
            >
              <option value="second">Second Class</option>
              <option value="first">First Class</option>
            </select>
          </div>
        </div>
        <div className="card">
          <div className="card-header">
            <div className="card-title">Duration</div>
          </div>
          <div className="radio-group">
            <label className={`radio-option${form.duration==='1_month' ? ' selected' : ''}`}>
              <input
                type="radio"
                name="duration"
                value="1_month"
                checked={form.duration==='1_month'}
                onChange={()=>handleDurationChange('1_month')}
              />
              Monthly
            </label>
            <label className={`radio-option${form.duration==='3_months' ? ' selected' : ''}`}>
              <input
                type="radio"
                name="duration"
                value="3_months"
                checked={form.duration==='3_months'}
                onChange={()=>handleDurationChange('3_months')}
              />
              Quarterly
            </label>
          </div>
        </div>
        <button type="submit" className="btn btn-ink btn-lg btn-full" disabled={loading}>
          {loading ? 'Submitting application...' : 'Submit concession application'}
        </button>
      </form>
    </div>
  );
}
