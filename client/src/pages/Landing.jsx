import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
export default function Landing() {
  const { isAuthenticated, user }=useAuth();
  return (
    <div className="landing">
      <nav className="nav">
        <div className="container nav-inner">
          <Link to="/" className="nav-brand">
            <img src="/vjti-logo.png" alt="VJTI" className="nav-logo" />
            <span>
              <span className="nav-brand-title">Railway Concession</span>
              <span className="nav-brand-sub">VJTI, Matunga</span>
            </span>
          </Link>
          <div className="nav-right">
            <a href="#how" className="nav-link">How it works</a>
            {isAuthenticated ? (
              <Link
                to={user?.role==='admin' ? '/admin/dashboard' : '/student/dashboard'}
                className="btn btn-ink"
              >
                Dashboard
              </Link>
            ) : (
              <>
                <Link to="/login" className="nav-link">Log in</Link>
                <Link to="/signup" className="btn btn-ink">Register</Link>
              </>
            )}
          </div>
        </div>
      </nav>
      {/* ---- HERO ---- */}
      <section className="hero">
        <div className="container hero-center">
          <img src="/vjti-logo.png" alt="VJTI Seal" className="hero-logo" />
          <h1 className="display">
            Railway concession passes,<br />
            <em>without the paperwork.</em>
          </h1>
          <p className="lede" style={{ textAlign: 'center', margin: '0 auto' }}>
            Apply and renew your season ticket concession online — for VJTI students.
          </p>
          <div className="hero-cta">
            <Link to="/signup" className="btn btn-ink btn-lg">Create an account</Link>
            <Link to="/login" className="btn btn-ghost btn-lg">I already have one</Link>
          </div>
        </div>
      </section>
      {/* ---- HOW IT WORKS ---- */}
      <section id="how" className="how">
        <div className="container">
          <div className="section-head">
            <span className="section-num">01</span>
            <span className="section-rule"></span>
            <span className="section-title">How it works</span>
          </div>
          <h2 className="display-sm" style={{ marginBottom: '2.5rem' }}>Three steps to your pass</h2>
          <div className="how-grid">
            <article className="how-item">
              <div className="how-num">1</div>
              <h3>Register</h3>
              <p>Sign up with your enrolment number, upload your Aadhaar and college ID for verification.</p>
              <span className="how-tag">One time</span>
            </article>
            <article className="how-item">
              <div className="how-num">2</div>
              <h3>Apply</h3>
              <p>Choose Railway or Metro, pick your stations, travel class, and whether you need a monthly or quarterly pass.</p>
              <span className="how-tag">Per semester</span>
            </article>
            <article className="how-item">
              <div className="how-num">3</div>
              <h3>Collect</h3>
              <p>Once the admin approves your application, collect the printed concession letter from the college office.</p>
              <span className="how-tag">At office</span>
            </article>
          </div>
        </div>
      </section>
      {/* ---- ABOUT / FEATURES ---- */}
      <section className="about">
        <div className="container">
          <div className="about-grid">
            <div className="about-lead">
              <div className="section-head section-head-sm">
                <span className="section-num">02</span>
                <span className="section-rule"></span>
                <span className="section-title">About</span>
              </div>
              <h2 className="display-sm">Built for<br /><em>VJTI students.</em></h2>
            </div>
            <div className="about-body">
              <p>Indian Railways and Mumbai Metro offer <strong>concessional season tickets</strong> to full-time college students — a significant saving on daily commute costs. Until now, getting one meant queuing at the office, filling physical forms, and chasing signatures.</p>
              <p>This portal digitises the entire workflow: students apply online, admins review and approve from a dashboard, and the college office prints the letter. No lost forms, no duplicate applications.</p>
              <div className="about-facts">
                <div>
                  <span className="fact-label">Concession types</span>
                  <span className="fact-value">Railway &amp; Metro</span>
                </div>
                <div>
                  <span className="fact-label">Durations</span>
                  <span className="fact-value">Monthly / Quarterly</span>
                </div>
                <div>
                  <span className="fact-label">Document upload</span>
                  <span className="fact-value">Cloudinary secured</span>
                </div>
                <div>
                  <span className="fact-label">Institute</span>
                  <span className="fact-value">VJTI, Matunga</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
      {/* ---- CTA STRIP ---- */}
      <section className="cta-strip">
        <div className="container cta-inner">
          <div>
            <h2 className="display-sm">Ready to apply?<br /><em>It takes 2 minutes.</em></h2>
            <p style={{ marginTop: '0.5rem' }}>Create your account and submit your first application today.</p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <Link to="/signup" className="btn btn-cream btn-lg">Create account</Link>
            <Link to="/login" className="btn btn-ghost btn-lg" style={{ borderColor: 'rgba(242,237,225,0.35)', color: 'var(--bg)' }}>Log in</Link>
          </div>
        </div>
      </section>
      {/* ---- FOOTER ---- */}
      <footer className="footer">
        <div className="container">
          <div className="footer-inner">
            <div className="footer-col">
              <span className="footer-brand">Railway Concession</span>
              <p className="footer-note">Online concession management system for VJTI, Matunga students.</p>
            </div>
            <div className="footer-col">
              <span className="footer-heading">Navigate</span>
              <a href="#how">How it works</a>
              <Link to="/login">Student login</Link>
              <Link to="/signup">Register</Link>
            </div>
            <div className="footer-col">
              <span className="footer-heading">Admin</span>
              <Link to="/login">Admin login</Link>
              <Link to="/admin/signup">Admin signup</Link>
            </div>
          </div>
          <div className="footer-base">
            <span>VJTI, Matunga &mdash; Mumbai</span>
            <span>Academic Project</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
