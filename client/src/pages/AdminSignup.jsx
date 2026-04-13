import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { authAPI } from '../services/api.js';
export default function AdminSignup() {
  const [form, setForm]=useState({ name: '', email: '', password: '', confirm_password: '' });
  const [error, setError]=useState('');
  const [loading, setLoading]=useState(false);
  const { login }=useAuth();
  const navigate=useNavigate();
  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }
  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (form.password!==form.confirm_password) {
      setError('Passwords do not match.');
      return;
    }
    setLoading(true);
    try {
      const res=await authAPI.adminSignup({ name: form.name, email: form.email, password: form.password });
      login(res.data.token, res.data.user);
      navigate('/admin/dashboard');
    } catch (err) {
      setError(err.response?.data?.error||'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }
  return (
    <div className="auth-page">
      <div className="auth-card">
        <Link to="/login" className="auth-back">&larr; Back to login</Link>
        <img src="/vjti-logo.png" alt="VJTI" className="auth-logo" />
        <h2 className="display-sm">Create admin account</h2>
        <p className="auth-sub">Register as an administrator for the concession management system.</p>
        {error&&<div className="alert alert-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Full Name <sup>*</sup></label>
            <input
              type="text"
              name="name"
              className="form-input"
              placeholder="Your name"
              value={form.name}
              onChange={handleChange}
              required
              autoFocus
            />
          </div>
          <div className="form-group">
            <label className="form-label">Email address <sup>*</sup></label>
            <input
              type="email"
              name="email"
              className="form-input"
              placeholder="you@vjti.ac.in"
              value={form.email}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Password <sup>*</sup></label>
            <input
              type="password"
              name="password"
              className="form-input"
              placeholder="Create a strong password"
              value={form.password}
              onChange={handleChange}
              required
            />
          </div>
          <div className="form-group">
            <label className="form-label">Confirm Password <sup>*</sup></label>
            <input
              type="password"
              name="confirm_password"
              className="form-input"
              placeholder="Re-enter password"
              value={form.confirm_password}
              onChange={handleChange}
              required
            />
          </div>
          <button type="submit" className="btn btn-ink btn-lg btn-full" disabled={loading}>
            {loading ? 'Creating account...' : 'Create admin account'}
          </button>
        </form>
        <div className="auth-alt" style={{ marginTop: '1.5rem' }}>
          Already have an account? <Link to="/login">Log in</Link>
        </div>
      </div>
    </div>
  );
}
