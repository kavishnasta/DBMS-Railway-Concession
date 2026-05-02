const express=require('express');
const router=express.Router();
const path=require('path');
const pool=require('../config/db');
const PDFDocument=require('pdfkit');
const { verifyStudent }=require('../middleware/auth');
const { RAILWAY_LINES, METRO_LINES }=require('../data/mmrStations');
const LOGO_PATH=path.resolve(__dirname, '../../client/public/vjti-logo.png');
router.get('/stations', (req, res)=>{
  res.json({ railway: RAILWAY_LINES, metro: METRO_LINES });
});
router.post('/apply', verifyStudent, async (req, res)=>{
  const { transport_type, source_station, destination_station, travel_class, duration }=req.body;
  if (!transport_type||!source_station||!destination_station||!travel_class||!duration) {
    return res.status(400).json({ error: 'All fields are required' });
  }
  const client=await pool.connect();
  try {
    await client.query('BEGIN');
    const routeResult=await client.query(
      `SELECT route_id FROM route
       WHERE source_station=$1 AND destination_station=$2 AND travel_class=$3 AND transport_type=$4`,
      [source_station, destination_station, travel_class, transport_type]
    );
    let routeId;
    if (routeResult.rows.length > 0) {
      routeId=routeResult.rows[0].route_id;
    } else {
      const newRoute=await client.query(
        `INSERT INTO route (source_station, destination_station, travel_class, transport_type)
         VALUES ($1, $2, $3, $4) RETURNING route_id`,
        [source_station, destination_station, travel_class, transport_type]
      );
      routeId=newRoute.rows[0].route_id;
    }
    // Block if student has a pending concession (no buffer applies to pending)
    const pendingConcession=await client.query(
      `SELECT concession_id FROM concession WHERE student_id=$1 AND status='pending'`,
      [req.user.id]
    );
    if (pendingConcession.rows.length>0) {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'You already have a pending concession awaiting approval.' });
    }
    // Block if student has an active concession that does not expire within 3 days
    const activeConcession=await client.query(
      `SELECT concession_id, expiry_date FROM concession WHERE student_id=$1 AND status='active'`,
      [req.user.id]
    );
    if (activeConcession.rows.length>0) {
      const expiry=new Date(activeConcession.rows[0].expiry_date);
      const today=new Date();
      today.setHours(0,0,0,0);
      expiry.setHours(0,0,0,0);
      const daysLeft=Math.ceil((expiry - today)/(1000*60*60*24));
      if (daysLeft>3) {
        await client.query('ROLLBACK');
        return res.status(409).json({ error: `Your current concession is still active and expires in ${daysLeft} day${daysLeft===1?'':'s'}. You can apply for a renewal within 3 days of expiry.` });
      }
    }
    const issueDate=new Date();
    const expiryDate=new Date(issueDate);
    if (duration==='1_month') {
      expiryDate.setMonth(expiryDate.getMonth() + 1);
    } else {
      expiryDate.setMonth(expiryDate.getMonth() + 3);
    }
    const concessionResult=await client.query(
      `INSERT INTO concession (student_id, route_id, concession_type, duration, issue_date, expiry_date, status)
       VALUES ($1, $2, $3, $4, $5, $6, 'pending') RETURNING concession_id`,
      [req.user.id, routeId, transport_type, duration, issueDate.toISOString().split('T')[0], expiryDate.toISOString().split('T')[0]]
    );
    const concessionId=concessionResult.rows[0].concession_id;
    await client.query(
      `INSERT INTO document (concession_id, document_type, verification_status)
       VALUES ($1, 'college_id', 'pending')`,
      [concessionId]
    );
    await client.query(
      `INSERT INTO approval (concession_id, action) VALUES ($1, 'pending')`,
      [concessionId]
    );
    await client.query('COMMIT');
    res.status(201).json({
      message: 'Concession application submitted and pending review',
      concession_id: concessionId,
      status: 'pending'
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Server error during application' });
  } finally {
    client.release();
  }
});
router.get('/history', verifyStudent, async (req, res)=>{
  try {
    const result=await pool.query(
      `SELECT c.concession_id, c.concession_type, c.duration, c.issue_date, c.expiry_date, c.status, c.created_at,
              r.source_station, r.destination_station, r.travel_class, r.transport_type,
              ap.remarks, ap.action as approval_action
       FROM concession c
       JOIN route r ON c.route_id=r.route_id
       LEFT JOIN approval ap ON ap.concession_id=c.concession_id
       WHERE c.student_id=$1
       ORDER BY c.created_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});
router.get('/receipt/:id', verifyStudent, async (req, res)=>{
  const { id }=req.params;
  try {
    const result=await pool.query(
      `SELECT c.concession_id, c.concession_type, c.duration, c.issue_date, c.expiry_date, c.status,
              r.source_station, r.destination_station, r.travel_class, r.transport_type,
              s.name, s.enrolment_no, s.course, s.year, s.email, s.phone,
              ap.action as approval_action, ap.approval_date, ap.remarks,
              a.name as approved_by
       FROM concession c
       JOIN route r ON c.route_id=r.route_id
       JOIN student s ON c.student_id=s.student_id
       LEFT JOIN approval ap ON ap.concession_id=c.concession_id
       LEFT JOIN admin a ON ap.approved_by=a.admin_id
       WHERE c.concession_id=$1 AND c.student_id=$2`,
      [id, req.user.id]
    );
    if (result.rows.length===0) {
      return res.status(404).json({ error: 'Concession not found' });
    }
    const c=result.rows[0];
    if (c.status!=='active') {
      return res.status(400).json({ error: 'Receipt is only available for active concessions' });
    }
    const fmt=(d)=>d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'N/A';
    const doc=new PDFDocument({ size: 'A4', margin: 50 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="concession-receipt-${id}.pdf"`);
    doc.pipe(res);

    // Header bar
    doc.rect(0, 0, doc.page.width, 90).fill('#1a2332');

    // VJTI logo
    doc.image(LOGO_PATH, 18, 10, { width: 70, height: 70 });

    // College name
    doc.fill('#ffffff').fontSize(16).font('Helvetica-Bold')
       .text('Veermata Jijabai Technological Institute', 100, 22, { width: 420 });
    doc.fontSize(9).font('Helvetica')
       .text('H.R. Mahajani Road, Matunga, Mumbai - 400 019 | www.vjti.ac.in', 100, 42, { width: 420 });
    doc.fontSize(10).font('Helvetica-Bold')
       .text('Railway Concession Receipt', 100, 57, { width: 420 });

    // Status badge
    doc.roundedRect(doc.page.width - 110, 28, 70, 22, 4).fill('#22c55e');
    doc.fill('#ffffff').fontSize(9).font('Helvetica-Bold')
       .text('ACTIVE', doc.page.width - 103, 35);

    doc.moveDown(3);

    // Section: Student Information
    const sectionY=(y)=>{
      doc.rect(50, y, doc.page.width - 100, 20).fill('#f0ebe0');
      doc.fill('#1a2332').fontSize(10).font('Helvetica-Bold').text('STUDENT INFORMATION', 58, y + 5);
      return y + 28;
    };

    let y=sectionY(110);
    const field=(label, value, x, rowY)=>{
      doc.fill('#6b7280').fontSize(8).font('Helvetica').text(label, x, rowY);
      doc.fill('#111827').fontSize(10).font('Helvetica-Bold').text(value||'N/A', x, rowY + 12);
    };
    field('Full Name', c.name, 50, y);
    field('Enrolment No.', c.enrolment_no, 250, y);
    field('Course & Year', `${c.course}, Year ${c.year}`, 400, y);
    y+=42;
    field('Email', c.email, 50, y);
    field('Phone', c.phone||'N/A', 250, y);
    y+=42;

    // Section: Concession Details
    y=sectionY(y);
    field('Pass ID', `#${c.concession_id}`, 50, y);
    field('Transport Type', c.transport_type.charAt(0).toUpperCase()+c.transport_type.slice(1), 250, y);
    field('Travel Class', c.travel_class.charAt(0).toUpperCase()+c.travel_class.slice(1)+' Class', 400, y);
    y+=42;
    field('Source Station', c.source_station, 50, y);
    field('Destination Station', c.destination_station, 250, y);
    field('Duration', c.duration==='1_month' ? 'Monthly (1 Month)' : 'Quarterly (3 Months)', 400, y);
    y+=42;
    field('Issue Date', fmt(c.issue_date), 50, y);
    field('Expiry Date', fmt(c.expiry_date), 250, y);
    field('Approved By', c.approved_by||'Admin', 400, y);
    y+=42;

    if (c.remarks) {
      field('Remarks', c.remarks, 50, y);
      y+=42;
    }

    // Validity bar
    y+=10;
    doc.rect(50, y, doc.page.width - 100, 40).fill('#fef9f0').stroke('#d4a853');
    doc.fill('#92400e').fontSize(9).font('Helvetica-Bold')
       .text(`This pass is valid from ${fmt(c.issue_date)} to ${fmt(c.expiry_date)} for travel between ${c.source_station} and ${c.destination_station} by ${c.transport_type} in ${c.travel_class} class.`, 58, y + 8, { width: doc.page.width - 120 });

    // Footer
    const footerY=doc.page.height - 60;
    doc.rect(0, footerY, doc.page.width, 60).fill('#f8f5f0');
    doc.fill('#6b7280').fontSize(8).font('Helvetica')
       .text(`Generated on ${fmt(new Date())} | VJTI Concession Management System | This is a computer-generated receipt and does not require a signature.`, 50, footerY + 10, { width: doc.page.width - 100, align: 'center' });
    doc.fill('#9ca3af').fontSize(7)
       .text('For queries contact: concession@vjti.ac.in', 50, footerY + 28, { width: doc.page.width - 100, align: 'center' });

    doc.end();
  } catch (err) {
    console.error(err);
    if (!res.headersSent) res.status(500).json({ error: 'Server error generating receipt' });
  }
});

module.exports=router;
