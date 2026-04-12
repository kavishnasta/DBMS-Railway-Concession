import axios from 'axios';
const api=axios.create({
  baseURL: '/api',
  timeout: 10000
});
api.interceptors.request.use((config)=>{
  const token=localStorage.getItem('token');
  if (token) {
    config.headers.Authorization=`Bearer ${token}`;
  }
  return config;
});
api.interceptors.response.use(
  (response)=>response,
  (error)=>{
    const url=error.config?.url||'';
    const isAuthRoute=url.startsWith('/auth/');
    if (!isAuthRoute&&error.response&&(error.response.status===401||error.response.status===403)) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href='/login';
    }
    return Promise.reject(error);
  }
);
export const authAPI={
  studentSignup: (formData)=>api.post('/auth/student/signup', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  studentLogin: (data)=>api.post('/auth/student/login', data),
  adminLogin: (data)=>api.post('/auth/admin/login', data)
};
export const studentAPI={
  getProfile: ()=>api.get('/student/profile'),
  getDashboard: ()=>api.get('/student/dashboard'),
  getDocuments: ()=>api.get('/student/documents'),
  updateAddressProof: (formData)=>api.post('/student/documents/address-proof', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  })
};
export const concessionAPI={
  getStations: ()=>api.get('/concessions/stations'),
  apply: (data)=>api.post('/concessions/apply', data),
  getHistory: ()=>api.get('/concessions/history')
};
export const adminAPI={
  getDashboard: ()=>api.get('/admin/dashboard'),
  getPendingApplications: ()=>api.get('/admin/applications/pending'),
  getApplicationDetail: (id)=>api.get(`/admin/applications/${id}`),
  takeAction: (id, data)=>api.patch(`/admin/applications/${id}/action`, data),
  getReports: ()=>api.get('/admin/reports')
};
