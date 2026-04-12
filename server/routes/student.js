const express = require('express');
const router = express.Router();
const pool = require('../config/db');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { verifyStudent } = require('../middleware/auth');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '..', 'uploads');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    cb(null, allowed.includes(file.mimetype));
  }
});

router.get('/profile', verifyStudent, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT student_id, name, enrolment_no, course, year, college_id, email, phone, address, aadhaar_masked, status, created_at
       FROM student WHERE student_id = $1`,
      [req.user.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }
    res.json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/dashboard', verifyStudent, async (req, res) => {
  try {
    const studentResult = await pool.query(
      'SELECT name, enrolment_no, course, year FROM student WHERE student_id = $1',
      [req.user.id]
    );
    if (studentResult.rows.length === 0) {
      return res.status(404).json({ error: 'Student not found' });
    }
    const student = studentResult.rows[0];

    const activeConcessionResult = await pool.query(
      `SELECT c.concession_id, c.concession_type, c.duration, c.issue_date, c.expiry_date, c.status,
              r.source_station, r.destination_station, r.travel_class, r.transport_type
       FROM concession c
       JOIN route r ON c.route_id = r.route_id
       WHERE c.student_id = $1 AND c.status = 'active'
       ORDER BY c.expiry_date DESC
       LIMIT 1`,
      [req.user.id]
    );

    const totalRenewalsResult = await pool.query(
      `SELECT COUNT(*) as count FROM concession WHERE student_id = $1`,
      [req.user.id]
    );

    const nextExpiryResult = await pool.query(
      `SELECT MIN(expiry_date) as next_expiry FROM concession WHERE student_id = $1 AND status = 'active'`,
      [req.user.id]
    );

    res.json({
      student,
      active_concession: activeConcessionResult.rows[0] || null,
      total_renewals: parseInt(totalRenewalsResult.rows[0].count),
      next_expiry: nextExpiryResult.rows[0].next_expiry || null
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.get('/documents', verifyStudent, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT doc_id, document_type, file_name, file_path, verification_status, upload_date FROM student_document WHERE student_id = $1 ORDER BY upload_date DESC',
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

router.post('/documents/address-proof', verifyStudent, upload.single('address_proof'), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Address proof file is required' });
  }

  try {
    const existing = await pool.query(
      "SELECT doc_id, file_path FROM student_document WHERE student_id = $1 AND document_type = 'address_proof' ORDER BY upload_date DESC LIMIT 1",
      [req.user.id]
    );

    if (existing.rows.length > 0) {
      await pool.query(
        'UPDATE student_document SET file_path = $1, file_name = $2, verification_status = $3, upload_date = NOW() WHERE doc_id = $4',
        [req.file.filename, req.file.originalname, 'pending', existing.rows[0].doc_id]
      );
    } else {
      await pool.query(
        'INSERT INTO student_document (student_id, document_type, file_path, file_name) VALUES ($1, $2, $3, $4)',
        [req.user.id, 'address_proof', req.file.filename, req.file.originalname]
      );
    }

    res.json({ message: 'Address proof updated successfully. It will be re-verified by the admin.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
