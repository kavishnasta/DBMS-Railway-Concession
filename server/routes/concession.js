const express=require('express');
const router=express.Router();
const pool=require('../config/db');
const { verifyStudent }=require('../middleware/auth');
const { RAILWAY_LINES, METRO_LINES }=require('../data/mmrStations');
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
    const activeConcession=await client.query(
      `SELECT concession_id FROM concession
       WHERE student_id=$1 AND status IN ('active','pending')`,
      [req.user.id]
    );
    if (activeConcession.rows.length>0) {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'You already have an active or pending concession. You cannot hold more than one at a time.' });
    }
    const issueDate=new Date();
    const expiryDate=new Date(issueDate);
    if (duration==='1_month') {
      expiryDate.setMonth(expiryDate.getMonth() + 1);
    } else {
      expiryDate.setMonth(expiryDate.getMonth() + 3);
    }
    const historyCount=await client.query(
      'SELECT COUNT(*) as count FROM concession WHERE student_id=$1',
      [req.user.id]
    );
    const hasHistory=parseInt(historyCount.rows[0].count) > 0;
    const concessionStatus=hasHistory ? 'active' : 'pending';
    const concessionResult=await client.query(
      `INSERT INTO concession (student_id, route_id, concession_type, duration, issue_date, expiry_date, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING concession_id`,
      [req.user.id, routeId, transport_type, duration, issueDate.toISOString().split('T')[0], expiryDate.toISOString().split('T')[0], concessionStatus]
    );
    const concessionId=concessionResult.rows[0].concession_id;
    await client.query(
      `INSERT INTO document (concession_id, document_type, verification_status)
       VALUES ($1, 'college_id', 'pending')`,
      [concessionId]
    );
    if (hasHistory) {
      await client.query(
        `INSERT INTO approval (concession_id, action, remarks)
         VALUES ($1, 'approved', 'Auto-approved based on previous concession history')`,
        [concessionId]
      );
    } else {
      await client.query(
        `INSERT INTO approval (concession_id, action)
         VALUES ($1, 'pending')`,
        [concessionId]
      );
    }
    await client.query('COMMIT');
    res.status(201).json({
      message: hasHistory ? 'Concession auto-approved based on history' : 'Concession application submitted and pending review',
      concession_id: concessionId,
      status: concessionStatus
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
              r.source_station, r.destination_station, r.travel_class, r.transport_type
       FROM concession c
       JOIN route r ON c.route_id=r.route_id
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
module.exports=router;
