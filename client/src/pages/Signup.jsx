import React, { useState, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { authAPI } from '../services/api.js';
const DOC_TYPES=[
  { field: 'aadhaar_doc', label: 'Aadhaar Card', required: true, hint: 'JPEG, PNG or PDF / Max 5MB' },
  { field: 'address_proof', label: 'Address Proof', required: true, hint: 'Electricity bill, bank statement, etc. / Max 5MB' },
  { field: 'college_id_doc', label: 'College ID Card', required: false, hint: 'VJTI student ID card / Max 5MB' }
];
export default function Signup() {
  const [form, setForm]=useState({
    name: '', enrolment_no: '', course: '', year: '',
    email: '', phone: '', address: '', aadhaar: '',
    password: '', confirm_password: ''
  });
  const [files, setFiles]=useState({ aadhaar_doc: null, address_proof: null, college_id_doc: null });
  const [error, setError]=useState('');
  const [loading, setLoading]=useState(false);
  const [hints, setHints] = useState({
    enrolment_no: '', email: '', phone: '', aadhaar: '', password: '', confirm_password: ''
  });
  const fileRefs={ aadhaar_doc: useRef(), address_proof: useRef(), college_id_doc: useRef() };
  const { login }=useAuth();
  const navigate=useNavigate();

  function handleChange(e) {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });

    switch (name) {
      case 'enrolment_no':     validateEnrolmentNo(value, h => setFieldHint('enrolment_no', h)); break;
      case 'email':            validateEmail(value, h => setFieldHint('email', h)); break;
      case 'phone':            validatePhone(value, h => setFieldHint('phone', h)); break;
      case 'aadhaar':          validateAadhaar(value, h => setFieldHint('aadhaar', h)); break;
      case 'password':
        validatePassword(value, form.confirm_password, h => setFieldHint('password', h));
        validateConfirmPassword(form.confirm_password, value, h => setFieldHint('confirm_password', h));
        break;
      case 'confirm_password': validateConfirmPassword(value, form.password, h => setFieldHint('confirm_password', h)); break;
    }
  }

  function setFieldHint(field, value) {
    setHints(prev => ({ ...prev, [field]: value }));
  }

  function handleFileChange(e, field) {
    const file=e.target.files[0]||null;
    setFiles((prev)=>({ ...prev, [field]: file }));
  }
  function removeFile(field) {
    setFiles((prev)=>({ ...prev, [field]: null }));
    if (fileRefs[field].current) fileRefs[field].current.value='';
  }
  // ─── Validation stubs ────────────────────────────────────────────────────────

  function validateEnrolmentNo(value, setHints) {
    // TODO: fill in
    if(value.length === 0 ) {
      setHints('')
      return;
    }
    if (value.length != 9) {
      setHints('Enrollment Number should be 9 digits long');
    } else if (!(/^\d+$/.test(value))) {
      setHints('Enrollment Number should contain digits only')
    } else {
      setHints('');
    }
  }

  function validateEmail(value, setHints) {
    if (value.length === 0) {
      setHints('');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(value)) {
      setHints('Enter a valid email address');
    } else if (!value.endsWith('@vjti.ac.in')) {
      setHints('Must be a @vjti.ac.in email');
    } else {
      setHints('');
    }
}

  function validatePhone(value, setHints) {
    if (value.length === 0) {
      setHints('');
      return;
    }
    const digits = value.replace(/[\s\-\+]/g, '');
    if (!/^\d+$/.test(digits)) {
      setHints('Phone number can only contain digits');
    } else if (digits.length !== 10) {
      setHints('Must be 10 digits');
    } else {
      setHints('');
    }
}

  function validateAadhaar(value, setHints) {
    if (value.length === 0) {
      setHints('');
      return;
    }
    if (!/^\d+$/.test(value)) {
      setHints('Aadhaar number should contain digits only');
    } else if (value.length !== 12) {
      setHints('Aadhaar number should be 12 digits long');
    } else {
      setHints('');
    }
}

  function validatePassword(value, confirmValue, setHints) {
  if (value.length === 0) {
    setHints('');
    return;
  }
  if (value.length < 8) {
    setHints('Must be at least 8 characters');
  } else if (!/[A-Z]/.test(value)) {
    setHints('Must contain at least one uppercase letter');
  } else if (!/[0-9]/.test(value)) {
    setHints('Must contain at least one number');
  } else {
    setHints('');
  }
}

  function validateConfirmPassword(value, passwordValue, setHints) {
    if (value.length === 0) {
      setHints('');
      return;
    }
    if (value !== passwordValue) {
      setHints('Passwords do not match');
    } else {
      setHints('');
    }
  }

// ─────────────────────────────────────────────────────────────────────────────
  function hintClass(hint) {
    return hint ? 'hint error' : 'hint';
  }
  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    if (!form.name||!form.enrolment_no||!form.course||!form.year||!form.email||!form.password) {
      setError('Please fill in all required fields.');
      return;
    }
    if (form.password!==form.confirm_password) {
      setError('Passwords do not match.');
      return;
    }
    if (parseInt(form.year) < 1||parseInt(form.year) > 4) {
      setError('Year must be between 1 and 4.');
      return;
    }
    if (!files.aadhaar_doc) {
      setError('Aadhaar Card document is required.');
      return;
    }
    if (!files.address_proof) {
      setError('Address Proof document is required.');
      return;
    }
    const formData=new FormData();
    formData.append('name', form.name);
    formData.append('enrolment_no', form.enrolment_no);
    formData.append('course', form.course);
    formData.append('year', form.year);
    formData.append('email', form.email);
    formData.append('password', form.password);
    if (form.phone) formData.append('phone', form.phone);
    if (form.address) formData.append('address', form.address);
    if (form.aadhaar) formData.append('aadhaar', form.aadhaar);
    if (files.aadhaar_doc) formData.append('aadhaar_doc', files.aadhaar_doc);
    if (files.address_proof) formData.append('address_proof', files.address_proof);
    if (files.college_id_doc) formData.append('college_id_doc', files.college_id_doc);
    setLoading(true);
    try {
      const res=await authAPI.studentSignup(formData);
      login(res.data.token, res.data.user);
      navigate('/student/dashboard');
    } catch (err) {
      setError(err.response?.data?.error||'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  }
  return (
    <div className="auth-page">
      <div className="signup-card">
        <Link to="/" className="auth-back">&larr; Home</Link>
        <img src="/vjti-logo.png" alt="VJTI" className="auth-logo" />
        <h2 className="display-sm">Create your student account</h2>
        <p className="auth-sub">
          Sign up to apply for railway concessions. Your details are used only
          to verify your enrolment.
        </p>
        {error&&<div className="alert alert-error">{error}</div>}
        <form onSubmit={handleSubmit}>
          <h3 className="form-section-title">Academic details</h3>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Full Name <sup>*</sup></label>
              <input type="text" name="name" className="form-input" placeholder="Aarav Shinde" value={form.name} onChange={handleChange} required />
            </div>
            <div className="form-group">
              <label className="form-label">Enrolment No. <sup>*</sup></label>
              <input type="text" name="enrolment_no" className="form-input" placeholder="221080045" value={form.enrolment_no} onChange={handleChange} required />
              <div className={hintClass(hints.enrolment_no)}>{hints.enrolment_no}</div>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Course <sup>*</sup></label>
              <select name="course" className="form-select" value={form.course} onChange={handleChange} required>
                <option value="">Select course</option>
                <option value="B.Tech">B.Tech</option>
                <option value="M.Tech">M.Tech</option>
                <option value="PhD">PhD</option>
                <option value="Diploma">Diploma</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Year <sup>*</sup></label>
              <select name="year" className="form-select" value={form.year} onChange={handleChange} required>
                <option value="">Select year</option>
                <option value="1">First year</option>
                <option value="2">Second year</option>
                <option value="3">Third year</option>
                <option value="4">Fourth year</option>
              </select>
            </div>
          </div>
          <h3 className="form-section-title">Contact</h3>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Email <sup>*</sup></label>
              <input type="email" name="email" className="form-input" placeholder="you@vjti.ac.in" value={form.email} onChange={handleChange} required />
              <div className={hintClass(hints.email)}>{hints.email}</div>
            </div>
            <div className="form-group">
              <label className="form-label">Phone</label>
              <input type="tel" name="phone" className="form-input" placeholder="+91 98765 43210" value={form.phone} onChange={handleChange} />
              <div className={hintClass(hints.phone)}>{hints.phone}</div>
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Residential Address</label>
            <textarea name="address" className="form-textarea" placeholder="Full residential address" value={form.address} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label className="form-label">Aadhaar Number</label>
            <input type="text" name="aadhaar" className="form-input" placeholder="12-digit Aadhaar number" value={form.aadhaar} onChange={handleChange} maxLength={12} />
            <div className={hintClass(hints.aadhaar)}>{hints.aadhaar}</div>
            <div className="form-hint">Stored in masked format &mdash; only last 4 digits visible.</div>
          </div>
          <h3 className="form-section-title">Documents</h3>
          <p className="form-hint" style={{ marginBottom: '1rem' }}>
            Upload clear scans or photos. Accepted: JPEG, PNG, PDF. Max 5MB each.
          </p>
          {DOC_TYPES.map((doc)=>(
            <div key={doc.field} className="form-group">
              <label className="form-label">
                {doc.label} {doc.required&&<sup>*</sup>}
              </label>
              {files[doc.field] ? (
                <div className="doc-uploaded">
                  <span className="doc-uploaded-name">{files[doc.field].name}</span>
                  <span className="doc-uploaded-size mono">
                    {(files[doc.field].size / 1024).toFixed(0)} KB
                  </span>
                  <button type="button" className="doc-remove" onClick={()=>removeFile(doc.field)}>
                    Remove
                  </button>
                </div>
              ) : (
                <div
                  className="doc-dropzone"
                  onClick={()=>fileRefs[doc.field].current?.click()}
                >
                  <div className="doc-dropzone-label">Click to upload {doc.label}</div>
                  <div className="doc-dropzone-hint mono">{doc.hint}</div>
                </div>
              )}
              <input
                type="file"
                ref={fileRefs[doc.field]}
                accept="image/jpeg,image/png,image/jpg,application/pdf"
                style={{ display: 'none' }}
                onChange={(e)=>handleFileChange(e, doc.field)}
              />
            </div>
          ))}
          <h3 className="form-section-title">Password</h3>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Password <sup>*</sup></label>
              <input type="password" name="password" className="form-input" placeholder="Create a strong password" value={form.password} onChange={handleChange} required />
              <div className={hintClass(hints.password)}>{hints.password}</div>
            </div>
            <div className="form-group">
              <label className="form-label">Confirm <sup>*</sup></label>
              <input type="password" name="confirm_password" className="form-input" placeholder="Re-enter password" value={form.confirm_password} onChange={handleChange} required />
              <div className={hintClass(hints.confirm_password)}>{hints.confirm_password}</div>
            </div>
          </div>
          <button type="submit" className="btn btn-ink btn-lg btn-full" disabled={loading} style={{ marginTop: '1rem' }}>
            {loading ? 'Creating account...' : 'Create account'}
          </button>
        </form>
        <div className="auth-alt" style={{ marginTop: '1.5rem' }}>
          Already registered? <Link to="/login">Log in here</Link>
        </div>
      </div>
    </div>
  );
}
