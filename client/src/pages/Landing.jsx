import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

export default function Landing() {
  const { isAuthenticated, user } = useAuth();

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
                to={user?.role === 'admin' ? '/admin/dashboard' : '/student/dashboard'}
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
          <h2 className="display-sm section-title-center">How it works</h2>
          <div className="how-grid">
            <article className="how-item">
              <div className="how-num">1</div>
              <h3>Register</h3>
              <p>Sign up with your enrolment number and college details.</p>
            </article>
            <article className="how-item">
              <div className="how-num">2</div>
              <h3>Apply</h3>
              <p>Select your line, stations, travel class, and duration.</p>
            </article>
            <article className="how-item">
              <div className="how-num">3</div>
              <h3>Collect</h3>
              <p>Once approved, collect the concession letter from the college office.</p>
            </article>
          </div>
        </div>
      </section>

    </div>
  );
}
