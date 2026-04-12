import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { authAPI } from '../services/api.js';

export default function Login() {
  const [activeTab, setActiveTab] = useState('student');
  const [studentForm, setStudentForm] = useState({ enrolment_no: '', password: '' });
  const [adminForm, setAdminForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  async function handleStudentLogin(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await authAPI.studentLogin(studentForm);
      login(res.data.token, res.data.user);
      navigate('/student/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  async function handleAdminLogin(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await authAPI.adminLogin(adminForm);
      login(res.data.token, res.data.user);
      navigate('/admin/dashboard');
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <Link to="/" className="auth-back">&larr; Home</Link>

        <img src="/vjti-logo.png" alt="VJTI" className="auth-logo" />
        <h2 className="display-sm">Log in</h2>
        <p className="auth-sub">
          Students and administrators use different credentials.
        </p>

        <div className="auth-tabs">
          <button
            type="button"
            className={`auth-tab${activeTab === 'student' ? ' active' : ''}`}
            onClick={() => { setActiveTab('student'); setError(''); }}
          >
            Student
          </button>
          <button
            type="button"
            className={`auth-tab${activeTab === 'admin' ? ' active' : ''}`}
            onClick={() => { setActiveTab('admin'); setError(''); }}
          >
            Administrator
          </button>
        </div>

        {error && <div className="alert alert-error">{error}</div>}

        {activeTab === 'student' ? (
          <form onSubmit={handleStudentLogin}>
            <div className="form-group">
              <label className="form-label">Enrolment Number</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. 221080045"
                value={studentForm.enrolment_no}
                onChange={(e) => setStudentForm({ ...studentForm, enrolment_no: e.target.value })}
                required
                autoFocus
              />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                className="form-input"
                value={studentForm.password}
                onChange={(e) => setStudentForm({ ...studentForm, password: e.target.value })}
                required
              />
            </div>
            <button type="submit" className="btn btn-ink btn-lg btn-full" disabled={loading}>
              {loading ? 'Signing in...' : 'Log in as student'}
            </button>
            <p className="auth-alt">
              First time here? <Link to="/signup">Create an account</Link>
            </p>
          </form>
        ) : (
          <form onSubmit={handleAdminLogin}>
            <div className="form-group">
              <label className="form-label">Email address</label>
              <input
                type="email"
                className="form-input"
                placeholder="you@vjti.ac.in"
                value={adminForm.email}
                onChange={(e) => setAdminForm({ ...adminForm, email: e.target.value })}
                required
                autoFocus
              />
            </div>
            <div className="form-group">
              <label className="form-label">Password</label>
              <input
                type="password"
                className="form-input"
                value={adminForm.password}
                onChange={(e) => setAdminForm({ ...adminForm, password: e.target.value })}
                required
              />
            </div>
            <button type="submit" className="btn btn-ink btn-lg btn-full" disabled={loading}>
              {loading ? 'Signing in...' : 'Log in as admin'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
