import React, { useState, useEffect, useMemo } from 'react';
import { concessionAPI } from '../../services/api.js';

// Allowed source stations and which railway line they belong to
const SOURCE_STATIONS = [
  { name: 'Dadar',        line: 'central',  display: 'Dadar (Central Line)' },
  { name: 'Matunga',      line: 'central',  display: 'Matunga (Central Line)' },
  { name: 'Wadala Road',  line: 'harbour',  display: 'Wadala Road (Harbour Line)' },
  { name: "King\u2019s Circle", line: 'harbour', display: "King\u2019s Circle (Harbour Line)" },
];

export default function ApplyRenew() {
  const [stations, setStations] = useState({ railway: {}, metro: {} });
  const [form, setForm] = useState({
    transport_type: 'railway',
    source_station: '',
    destination_station: '',
    travel_class: 'second',
    duration: '1_month'
  });
  const [loading, setLoading] = useState(false);
  const [stationsLoading, setStationsLoading] = useState(true);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchStations() {
      try {
        const res = await concessionAPI.getStations();
        setStations(res.data);
      } catch {
        setError('Failed to load stations.');
      } finally {
        setStationsLoading(false);
      }
    }
    fetchStations();
  }, []);

  // Determine which line the selected source station is on
  const selectedSourceMeta = useMemo(() => {
    return SOURCE_STATIONS.find(s => s.name === form.source_station) || null;
  }, [form.source_station]);

  // Destination options: all stations on the source's line, excluding the source itself
  const destinationStations = useMemo(() => {
    if (!selectedSourceMeta) return [];
    const lineObj = stations.railway[selectedSourceMeta.line];
    if (!lineObj) return [];
    return lineObj.stations.filter(s => s.name !== form.source_station);
  }, [stations, selectedSourceMeta, form.source_station]);

  function handleSourceChange(sourceName) {
    setForm({ ...form, source_station: sourceName, destination_station: '' });
  }

  function handleDurationChange(dur) {
    setForm({ ...form, duration: dur });
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!form.source_station || !form.destination_station) {
      setError('Please select both source and destination stations.');
      return;
    }

    setLoading(true);
    try {
      const res = await concessionAPI.apply(form);
      setSuccess(`${res.data.message} (Concession ID: #${res.data.concession_id})`);
      setForm({
        transport_type: 'railway',
        source_station: '',
        destination_station: '',
        travel_class: 'second',
        duration: '1_month'
      });
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to submit application.');
    } finally {
      setLoading(false);
    }
  }

  if (stationsLoading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div>
      <div className="page-header">
        <h1>Apply / Renew Concession</h1>
        <p>Submit a new concession application for railway travel</p>
      </div>

      {success && <div className="alert alert-success">{success}</div>}
      {error && <div className="alert alert-error">{error}</div>}

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
                value={form.source_station}
                onChange={(e) => handleSourceChange(e.target.value)}
                required
              >
                <option value="">Select source station</option>
                {SOURCE_STATIONS.map((s) => (
                  <option key={s.name} value={s.name}>{s.display}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Destination Station *</label>
              <select
                className="form-select"
                value={form.destination_station}
                onChange={(e) => setForm({ ...form, destination_station: e.target.value })}
                required
                disabled={!form.source_station}
              >
                <option value="">
                  {form.source_station ? 'Select destination station' : 'Select a source station first'}
                </option>
                {destinationStations.map((s) => (
                  <option key={s.name} value={s.name}>
                    {s.name}{s.code ? ` (${s.code})` : ''}
                  </option>
                ))}
              </select>
            </div>
          </div>
          {selectedSourceMeta && (
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
              onChange={(e) => setForm({ ...form, travel_class: e.target.value })}
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
            <label className={`radio-option${form.duration === '1_month' ? ' selected' : ''}`}>
              <input
                type="radio"
                name="duration"
                value="1_month"
                checked={form.duration === '1_month'}
                onChange={() => handleDurationChange('1_month')}
              />
              Monthly
            </label>
            <label className={`radio-option${form.duration === '3_months' ? ' selected' : ''}`}>
              <input
                type="radio"
                name="duration"
                value="3_months"
                checked={form.duration === '3_months'}
                onChange={() => handleDurationChange('3_months')}
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
