import React, { useState, useEffect, useRef } from 'react';
import { studentAPI } from '../../services/api.js';
function formatDate(dateStr) {
  if (!dateStr) return 'N/A';
  return new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' });
}
export default function Profile() {
  const [profile, setProfile]=useState(null);
  const [documents, setDocuments]=useState([]);
  const [loading, setLoading]=useState(true);
  const [error, setError]=useState('');
  const [uploadMsg, setUploadMsg]=useState('');
  const [uploadErr, setUploadErr]=useState('');
  const [uploading, setUploading]=useState(false);
  const fileRef=useRef();
  useEffect(()=>{
    async function fetchData() {
      try {
        const [profileRes, docsRes]=await Promise.all([
          studentAPI.getProfile(),
          studentAPI.getDocuments()
        ]);
        setProfile(profileRes.data);
        setDocuments(docsRes.data);
      } catch {
        setError('Failed to load profile.');
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);
  async function handleAddressProofUpload(e) {
    const file=e.target.files[0];
    if (!file) return;
    setUploadErr('');
    setUploadMsg('');
    if (file.size > 5 * 1024 * 1024) {
      setUploadErr(`File too large — max 5MB (this file is ${(file.size/1024/1024).toFixed(1)}MB)`);
      if (fileRef.current) fileRef.current.value='';
      return;
    }
    setUploading(true);
    const formData=new FormData();
    formData.append('address_proof', file);
    try {
      const res=await studentAPI.updateAddressProof(formData);
      setUploadMsg(res.data.message);
      const docsRes=await studentAPI.getDocuments();
      setDocuments(docsRes.data);
    } catch (err) {
      setUploadErr(err.response?.data?.error||'Upload failed.');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value='';
    }
  }
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
  const addressDoc=documents.find(d=>d.document_type==='address_proof');
  const aadhaarDoc=documents.find(d=>d.document_type==='aadhaar');
  return (
    <div>
      <div className="page-header">
        <h1>My Profile</h1>
        <p>Your personal and academic information</p>
      </div>
      <div className="cards-grid">
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Academic Information</div>
              <div className="card-subtitle">Your enrollment details</div>
            </div>
          </div>
          <div className="profile-section">
            <div className="profile-field">
              <span className="profile-field-label">Full Name</span>
              <span className="profile-field-value">{profile.name}</span>
            </div>
            <div className="profile-field">
              <span className="profile-field-label">Enrolment Number</span>
              <span className="profile-field-value">{profile.enrolment_no}</span>
            </div>
            <div className="profile-field">
              <span className="profile-field-label">Course</span>
              <span className="profile-field-value">{profile.course}</span>
            </div>
            <div className="profile-field">
              <span className="profile-field-label">Year</span>
              <span className="profile-field-value">Year {profile.year}</span>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Contact Information</div>
              <div className="card-subtitle">Your contact details</div>
            </div>
          </div>
          <div className="profile-section">
            <div className="profile-field">
              <span className="profile-field-label">Email Address</span>
              <span className="profile-field-value">{profile.email}</span>
            </div>
            <div className="profile-field">
              <span className="profile-field-label">Phone Number</span>
              <span className="profile-field-value">{profile.phone||'Not provided'}</span>
            </div>
            <div className="profile-field">
              <span className="profile-field-label">Residential Address</span>
              <span className="profile-field-value">{profile.address||'Not provided'}</span>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Verification</div>
              <div className="card-subtitle">Identity and account status</div>
            </div>
          </div>
          <div className="profile-section">
            <div className="profile-field">
              <span className="profile-field-label">Aadhaar (Masked)</span>
              <span className="profile-field-value">{profile.aadhaar_masked||'Not provided'}</span>
            </div>
            <div className="profile-field">
              <span className="profile-field-label">Account Status</span>
              <span className="profile-field-value">
                <span className={`badge badge-${profile.status==='active' ? 'active' : 'rejected'}`}>
                  {profile.status}
                </span>
              </span>
            </div>
            <div className="profile-field">
              <span className="profile-field-label">Member Since</span>
              <span className="profile-field-value">{formatDate(profile.created_at)}</span>
            </div>
          </div>
        </div>
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Documents</div>
              <div className="card-subtitle">Uploaded identity and address documents</div>
            </div>
          </div>
          <div className="profile-section">
            <div className="profile-field">
              <span className="profile-field-label">Aadhaar Card</span>
              <span className="profile-field-value">
                {aadhaarDoc ? (
                  <span className={`badge badge-${aadhaarDoc.verification_status==='verified' ? 'active' : 'pending'}`}>
                    {aadhaarDoc.verification_status}
                  </span>
                ) : 'Not uploaded'}
              </span>
            </div>
            <div className="profile-field">
              <span className="profile-field-label">Address Proof</span>
              <span className="profile-field-value">
                {addressDoc ? (
                  <>
                    <span className={`badge badge-${addressDoc.verification_status==='verified' ? 'active' : 'pending'}`}>
                      {addressDoc.verification_status}
                    </span>
                    <span className="profile-doc-name">{addressDoc.file_name}</span>
                  </>
                ) : 'Not uploaded'}
              </span>
            </div>
            {uploadMsg&&<div className="alert alert-success">{uploadMsg}</div>}
            {uploadErr&&<div className="alert alert-error">{uploadErr}</div>}
            <div className="profile-upload-section">
              <p className="form-hint">
                Need to update your address proof? Upload a new document below.
                It will be re-verified by the admin.
              </p>
              <div className="profile-upload-row">
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={()=>fileRef.current?.click()}
                  disabled={uploading}
                >
                  {uploading ? 'Uploading...' : 'Upload new address proof'}
                </button>
                <input
                  type="file"
                  ref={fileRef}
                  accept="image/jpeg,image/png,image/jpg,application/pdf"
                  style={{ display: 'none' }}
                  onChange={handleAddressProofUpload}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
