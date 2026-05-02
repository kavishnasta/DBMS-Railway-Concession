const express=require('express');
const router=express.Router();
const path=require('path');
const pool=require('../config/db');
const https=require('https');
const PDFDocument=require('pdfkit');
const { verifyAdmin }=require('../middleware/auth');
const LOGO_PATH=path.resolve(__dirname, '../../client/public/vjti-logo.png');

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
router.get('/reports/pdf', verifyAdmin, async (req, res)=>{
  try {
    const [byMonthRes, totalRes, routesRes, statusRes, classRes] = await Promise.all([
      pool.query(
        `SELECT TO_CHAR(DATE_TRUNC('month', created_at), 'Mon YYYY') as month,
                DATE_TRUNC('month', created_at) as month_date,
                COUNT(*) as total,
                COUNT(*) FILTER (WHERE concession_type='railway') as railway,
                COUNT(*) FILTER (WHERE concession_type='metro') as metro
         FROM concession
         WHERE created_at>=NOW() - INTERVAL '6 months'
         GROUP BY DATE_TRUNC('month', created_at)
         ORDER BY month_date ASC`
      ),
      pool.query('SELECT COUNT(*) as total, COUNT(*) FILTER (WHERE status=\'active\') as active, COUNT(*) FILTER (WHERE status=\'pending\') as pending, COUNT(*) FILTER (WHERE status=\'rejected\') as rejected FROM concession'),
      pool.query(
        `SELECT r.source_station, r.destination_station, r.transport_type, COUNT(c.concession_id) as student_count
         FROM route r JOIN concession c ON r.route_id=c.route_id
         GROUP BY r.route_id, r.source_station, r.destination_station, r.transport_type
         ORDER BY student_count DESC LIMIT 10`
      ),
      pool.query('SELECT COUNT(*) as count FROM student WHERE status=\'active\''),
      pool.query(
        `SELECT r.travel_class, COUNT(c.concession_id) as count
         FROM route r JOIN concession c ON r.route_id=c.route_id
         GROUP BY r.travel_class`
      )
    ]);

    const stats=totalRes.rows[0];
    const totalCount=parseInt(stats.total)||1;
    const fmt=(d)=>d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A';

    const doc=new PDFDocument({ size: 'A4', margin: 50 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="vjti-concession-report-${new Date().toISOString().split('T')[0]}.pdf"`);
    doc.pipe(res);

    // Header
    doc.rect(0, 0, doc.page.width, 90).fill('#1a2332');
    doc.image(LOGO_PATH, 18, 10, { width: 70, height: 70 });
    doc.fill('#ffffff').fontSize(16).font('Helvetica-Bold')
       .text('Veermata Jijabai Technological Institute', 100, 22, { width: 420 });
    doc.fontSize(9).font('Helvetica')
       .text('H.R. Mahajani Road, Matunga, Mumbai - 400 019 | www.vjti.ac.in', 100, 42, { width: 420 });
    doc.fontSize(10).font('Helvetica-Bold')
       .text('Railway Concession Statistics Report', 100, 57, { width: 420 });

    // Generated date badge
    doc.roundedRect(doc.page.width - 145, 28, 105, 22, 4).fill('#374151');
    doc.fill('#ffffff').fontSize(8).font('Helvetica')
       .text(`Generated: ${fmt(new Date())}`, doc.page.width - 140, 35);

    doc.moveDown(3);

    const sectionHeader=(label, y)=>{
      doc.rect(50, y, doc.page.width - 100, 20).fill('#f0ebe0');
      doc.fill('#1a2332').fontSize(10).font('Helvetica-Bold').text(label, 58, y + 5);
      return y + 28;
    };

    // Summary cards row
    let y=110;
    const cardW=89; const cardH=55; const cardGap=9;
    const cards=[
      { label: 'Total Concessions', value: stats.total, color: '#1a2332' },
      { label: 'Active', value: stats.active, color: '#16a34a' },
      { label: 'Pending', value: stats.pending, color: '#d97706' },
      { label: 'Rejected', value: stats.rejected, color: '#dc2626' },
      { label: 'Active Students', value: statusRes.rows[0].count, color: '#2563eb' },
    ];
    cards.forEach((card, i)=>{
      const cx=50 + i * (cardW + cardGap);
      doc.rect(cx, y, cardW, cardH).fill(card.color);
      doc.fill('#ffffff').fontSize(20).font('Helvetica-Bold').text(card.value, cx, y + 8, { width: cardW, align: 'center' });
      doc.fontSize(8).font('Helvetica').text(card.label, cx, y + 34, { width: cardW, align: 'center' });
    });
    y+=cardH + 20;

    // Class breakdown
    const firstClass=classRes.rows.find(r=>r.travel_class==='first')?.count||0;
    const secondClass=classRes.rows.find(r=>r.travel_class==='second')?.count||0;
    y=sectionHeader('CLASS BREAKDOWN', y);
    doc.fill('#6b7280').fontSize(9).font('Helvetica').text('First Class:', 50, y);
    doc.fill('#111827').fontSize(10).font('Helvetica-Bold').text(firstClass, 130, y);
    doc.fill('#6b7280').fontSize(9).font('Helvetica').text('Second Class:', 220, y);
    doc.fill('#111827').fontSize(10).font('Helvetica-Bold').text(secondClass, 305, y);
    y+=28;

    // Monthly trend table
    y=sectionHeader('MONTHLY CONCESSIONS (LAST 6 MONTHS)', y);
    const colW=[140, 100, 100, 100];
    const headers=['Month', 'Total', 'Railway', 'Metro'];
    // table header row
    doc.rect(50, y, doc.page.width - 100, 18).fill('#374151');
    let cx=50;
    headers.forEach((h, i)=>{
      doc.fill('#ffffff').fontSize(9).font('Helvetica-Bold').text(h, cx + 4, y + 4, { width: colW[i] - 4 });
      cx+=colW[i];
    });
    y+=18;
    byMonthRes.rows.forEach((row, idx)=>{
      if (idx % 2 === 0) doc.rect(50, y, doc.page.width - 100, 18).fill('#fafafa');
      else doc.rect(50, y, doc.page.width - 100, 18).fill('#ffffff');
      cx=50;
      [row.month, row.total, row.railway, row.metro].forEach((val, i)=>{
        doc.fill('#111827').fontSize(9).font('Helvetica').text(String(val), cx + 4, y + 4, { width: colW[i] - 4 });
        cx+=colW[i];
      });
      y+=18;
    });
    if (byMonthRes.rows.length===0) {
      doc.fill('#6b7280').fontSize(9).font('Helvetica').text('No data available for the last 6 months.', 58, y + 4);
      y+=22;
    }
    y+=16;

    // Top routes table
    y=sectionHeader('TOP 10 MOST USED ROUTES', y);
    const rColW=[30, 160, 90, 80, 70];
    const rHeaders=['#', 'Route', 'Type', 'Students', 'Share %'];
    doc.rect(50, y, doc.page.width - 100, 18).fill('#374151');
    cx=50;
    rHeaders.forEach((h, i)=>{
      doc.fill('#ffffff').fontSize(9).font('Helvetica-Bold').text(h, cx + 4, y + 4, { width: rColW[i] - 4 });
      cx+=rColW[i];
    });
    y+=18;
    routesRes.rows.forEach((route, idx)=>{
      if (idx % 2 === 0) doc.rect(50, y, doc.page.width - 100, 18).fill('#fafafa');
      else doc.rect(50, y, doc.page.width - 100, 18).fill('#ffffff');
      const pct=((parseInt(route.student_count)/totalCount)*100).toFixed(1);
      cx=50;
      [String(idx+1), `${route.source_station} to ${route.destination_station}`, route.transport_type, route.student_count, `${pct}%`].forEach((val, i)=>{
        doc.fill('#111827').fontSize(9).font('Helvetica').text(val, cx + 4, y + 4, { width: rColW[i] - 4 });
        cx+=rColW[i];
      });
      y+=18;
    });
    if (routesRes.rows.length===0) {
      doc.fill('#6b7280').fontSize(9).font('Helvetica').text('No route data available.', 58, y + 4);
      y+=22;
    }

    // Footer
    const footerY=doc.page.height - 60;
    doc.rect(0, footerY, doc.page.width, 60).fill('#f8f5f0');
    doc.fill('#6b7280').fontSize(8).font('Helvetica')
       .text(`VJTI Concession Management System | Confidential — For Internal Use Only | Generated on ${fmt(new Date())}`, 50, footerY + 10, { width: doc.page.width - 100, align: 'center' });
    doc.fill('#9ca3af').fontSize(7)
       .text('For queries contact: concession@vjti.ac.in', 50, footerY + 28, { width: doc.page.width - 100, align: 'center' });

    doc.end();
  } catch (err) {
    console.error(err);
    if (!res.headersSent) res.status(500).json({ error: 'Server error generating report' });
  }
});

module.exports=router;