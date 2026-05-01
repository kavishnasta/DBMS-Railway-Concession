const express=require('express');
const router=express.Router();
const pool=require('../config/db');
const https=require('https');
const { verifyAdmin }=require('../middleware/auth');

// Proxy a student document through the server so the browser receives it with
// correct Content-Type headers regardless of Cloudinary delivery restrictions
router.get('/documents/proxy', verifyAdmin, async (req, res)=>{
  const { doc_id }=req.query;
  if (!doc_id) return res.status(400).json({ error: 'doc_id required' });
  try {
    const result=await pool.query(
      'SELECT file_path, file_name FROM student_document WHERE doc_id=$1',
      [doc_id]
    );
    if (result.rows.length===0) return res.status(404).json({ error: 'Document not found' });
    const { file_path, file_name }=result.rows[0];
    const isPdf=file_name&&file_name.toLowerCase().endsWith('.pdf');
    https.get(file_path, (stream)=>{
      res.setHeader('Content-Type', isPdf ? 'application/pdf' : stream.headers['content-type']||'application/octet-stream');
      res.setHeader('Content-Disposition', `inline; filename="${file_name}"`);
      stream.pipe(res);
    }).on('error', ()=>res.status(502).json({ error: 'Failed to fetch document' }));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});
router.get('/dashboard', verifyAdmin, async (req, res)=>{
  try {
    const pendingResult=await pool.query(
      "SELECT COUNT(*) as count FROM concession WHERE status='pending'"
    );
    const approvedTodayResult=await pool.query(
      "SELECT COUNT(*) as count FROM approval WHERE action='approved' AND approval_date::date=CURRENT_DATE"
    );
    const totalActiveResult=await pool.query(
      "SELECT COUNT(*) as count FROM concession WHERE status='active'"
    );
    const totalStudentsResult=await pool.query(
      "SELECT COUNT(*) as count FROM student WHERE status='active'"
    );
    const recentApplicationsResult=await pool.query(
      `SELECT c.concession_id, c.concession_type, c.status, c.created_at,
              s.name, s.enrolment_no,
              r.source_station, r.destination_station
       FROM concession c
       JOIN student s ON c.student_id=s.student_id
       JOIN route r ON c.route_id=r.route_id
       ORDER BY c.created_at DESC
       LIMIT 10`
    );
    res.json({
      metrics: {
        pending: parseInt(pendingResult.rows[0].count),
        approved_today: parseInt(approvedTodayResult.rows[0].count),
        total_active: parseInt(totalActiveResult.rows[0].count),
        total_students: parseInt(totalStudentsResult.rows[0].count)
      },
      recent_applications: recentApplicationsResult.rows
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});
router.get('/applications/pending', verifyAdmin, async (req, res)=>{
  try {
    const result=await pool.query(
      `SELECT c.concession_id, c.concession_type, c.duration, c.issue_date, c.expiry_date, c.status, c.created_at,
              s.name, s.enrolment_no, s.course, s.year, s.email,
              r.source_station, r.destination_station, r.travel_class, r.transport_type,
              (SELECT COUNT(*) FROM student_document sd WHERE sd.student_id=s.student_id) AS doc_count
       FROM concession c
       JOIN student s ON c.student_id=s.student_id
       JOIN route r ON c.route_id=r.route_id
       WHERE c.status='pending'
       ORDER BY c.created_at ASC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});
router.get('/applications/:id', verifyAdmin, async (req, res)=>{
  const { id }=req.params;
  try {
    const concessionResult=await pool.query(
      `SELECT c.concession_id, c.concession_type, c.duration, c.issue_date, c.expiry_date, c.status, c.created_at,
              s.student_id, s.name, s.enrolment_no, s.course, s.year, s.email, s.phone, s.college_id, s.aadhaar_masked,
              r.route_id, r.source_station, r.destination_station, r.travel_class, r.transport_type
       FROM concession c
       JOIN student s ON c.student_id=s.student_id
       JOIN route r ON c.route_id=r.route_id
       WHERE c.concession_id=$1`,
      [id]
    );
    if (concessionResult.rows.length===0) {
      return res.status(404).json({ error: 'Concession not found' });
    }
    const approvalResult=await pool.query(
      `SELECT ap.approval_id, ap.action, ap.remarks, ap.approval_date,
              a.name as approved_by_name
       FROM approval ap
       LEFT JOIN admin a ON ap.approved_by=a.admin_id
       WHERE ap.concession_id=$1`,
      [id]
    );
    const documentResult=await pool.query(
      `SELECT d.document_id, d.document_type, d.upload_date, d.verification_status,
              a.name as verified_by_name
       FROM document d
       LEFT JOIN admin a ON d.verified_by=a.admin_id
       WHERE d.concession_id=$1`,
      [id]
    );
    const studentDocsResult=await pool.query(
      `SELECT doc_id, document_type, file_path, file_name, upload_date, verification_status
       FROM student_document
       WHERE student_id=$1
       ORDER BY upload_date ASC`,
      [concessionResult.rows[0].student_id]
    );
    res.json({
      concession: concessionResult.rows[0],
      approval: approvalResult.rows[0]||null,
      documents: documentResult.rows,
      student_documents: studentDocsResult.rows
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});
router.patch('/applications/:id/action', verifyAdmin, async (req, res)=>{
  const { id }=req.params;
  const { action, remarks }=req.body;
  if (!action||!['approved', 'rejected'].includes(action)) {
    return res.status(400).json({ error: 'Action must be approved or rejected' });
  }
  const client=await pool.connect();
  try {
    await client.query('BEGIN');
    const concessionStatus=action==='approved' ? 'active' : 'rejected';
    await client.query(
      'UPDATE concession SET status=$1 WHERE concession_id=$2',
      [concessionStatus, id]
    );
    const verificationStatus=action==='approved' ? 'verified' : 'failed';
    await client.query(
      `UPDATE approval
       SET action=$1, approved_by=$2, approval_date=NOW(), remarks=$3
       WHERE concession_id=$4`,
      [action, req.user.id, remarks||null, id]
    );
    await client.query(
      `UPDATE document SET verification_status=$1, verified_by=$2
       WHERE concession_id=$3`,
      [verificationStatus, req.user.id, id]
    );
    await client.query('COMMIT');
    res.json({ message: `Application ${action} successfully` });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Server error during action' });
  } finally {
    client.release();
  }
});
router.get('/reports', verifyAdmin, async (req, res)=>{
  try {
    const concessionsByMonthResult=await pool.query(
      `SELECT
         TO_CHAR(DATE_TRUNC('month', created_at), 'Mon YYYY') as month,
         DATE_TRUNC('month', created_at) as month_date,
         COUNT(*) as total,
         COUNT(*) FILTER (WHERE concession_type='railway') as railway,
         COUNT(*) FILTER (WHERE concession_type='metro') as metro
       FROM concession
       WHERE created_at>=NOW() - INTERVAL '6 months'
       GROUP BY DATE_TRUNC('month', created_at)
       ORDER BY month_date ASC`
    );
    const totalAll=await pool.query('SELECT COUNT(*) as count FROM concession');
    const total=parseInt(totalAll.rows[0].count)||1;
    const popularRoutesResult=await pool.query(
      `SELECT
         r.source_station, r.destination_station, r.transport_type,
         COUNT(c.concession_id) as student_count
       FROM route r
       JOIN concession c ON r.route_id=c.route_id
       GROUP BY r.route_id, r.source_station, r.destination_station, r.transport_type
       ORDER BY student_count DESC
       LIMIT 10`
    );
    const popularRoutes=popularRoutesResult.rows.map(row=>({
      ...row,
      percentage: ((parseInt(row.student_count) / total) * 100).toFixed(1)
    }));
    res.json({
      concessions_by_month: concessionsByMonthResult.rows,
      popular_routes: popularRoutes
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});
module.exports=router;