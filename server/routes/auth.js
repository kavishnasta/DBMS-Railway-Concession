const express=require('express');
const router=express.Router();
const bcrypt=require('bcryptjs');
const jwt=require('jsonwebtoken');
const multer=require('multer');
const path=require('path');
const fs=require('fs');
const pool=require('../config/db');
const storage=multer.diskStorage({
  destination: (req, file, cb)=>{
    const uploadDir=path.join(__dirname, '..', 'uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb)=>{
    const uniqueSuffix=Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const fileFilter=(req, file, cb)=>{
  const allowed=['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
  if (allowed.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Only JPEG, PNG, and PDF files are allowed'), false);
  }
};
const upload=multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter
});
const signupUpload=upload.fields([
  { name: 'aadhaar_doc', maxCount: 1 },
  { name: 'address_proof', maxCount: 1 },
  { name: 'college_id_doc', maxCount: 1 }
]);
router.post('/student/signup', signupUpload, async (req, res)=>{
  const { name, enrolment_no, course, year, email, password, phone, address, aadhaar }=req.body;
  if (!name||!enrolment_no||!course||!year||!email||!password) {
    return res.status(400).json({ error: 'Name, enrolment number, course, year, email and password are required' });
  }
  if (parseInt(year) < 1||parseInt(year) > 4) {
    return res.status(400).json({ error: 'Year must be between 1 and 4' });
  }
  const client=await pool.connect();
  try {
    await client.query('BEGIN');
    const existing=await client.query(
      'SELECT student_id FROM student WHERE enrolment_no=$1 OR email=$2',
      [enrolment_no, email]
    );
    if (existing.rows.length > 0) {
      await client.query('ROLLBACK');
      return res.status(409).json({ error: 'Student with this enrolment number or email already exists' });
    }
    const passwordHash=await bcrypt.hash(password, 10);
    const aadhaarMasked=aadhaar ? `XXXX-XXXX-${aadhaar.slice(-4)}` : null;
    const result=await client.query(
      `INSERT INTO student (name, enrolment_no, course, year, email, phone, address, aadhaar_masked, password_hash)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING student_id, name, enrolment_no, email, course, year`,
      [name, enrolment_no, course, parseInt(year), email, phone||null, address||null, aadhaarMasked, passwordHash]
    );
    const student=result.rows[0];
    const files=req.files||{};
    const docTypes=[
      { field: 'aadhaar_doc', type: 'aadhaar' },
      { field: 'address_proof', type: 'address_proof' },
      { field: 'college_id_doc', type: 'college_id' }
    ];
    for (const doc of docTypes) {
      if (files[doc.field]&&files[doc.field][0]) {
        const file=files[doc.field][0];
        await client.query(
          `INSERT INTO student_document (student_id, document_type, file_path, file_name)
           VALUES ($1, $2, $3, $4)`,
          [student.student_id, doc.type, file.filename, file.originalname]
        );
      }
    }
    await client.query('COMMIT');
    const token=jwt.sign(
      { id: student.student_id, role: 'student', name: student.name },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    res.status(201).json({
      token,
      user: {
        id: student.student_id,
        name: student.name,
        enrolment_no: student.enrolment_no,
        email: student.email,
        course: student.course,
        year: student.year,
        role: 'student'
      }
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Server error during signup' });
  } finally {
    client.release();
  }
});
router.post('/student/login', async (req, res)=>{
  const { enrolment_no, password }=req.body;
  if (!enrolment_no||!password) {
    return res.status(400).json({ error: 'Enrolment number and password are required' });
  }
  try {
    const result=await pool.query(
      'SELECT * FROM student WHERE enrolment_no=$1',
      [enrolment_no]
    );
    if (result.rows.length===0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const student=result.rows[0];
    if (student.status==='inactive') {
      return res.status(403).json({ error: 'Account is inactive. Contact administrator.' });
    }
    const valid=await bcrypt.compare(password, student.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token=jwt.sign(
      { id: student.student_id, role: 'student', name: student.name },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    res.json({
      token,
      user: {
        id: student.student_id,
        name: student.name,
        enrolment_no: student.enrolment_no,
        email: student.email,
        course: student.course,
        year: student.year,
        role: 'student'
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error during login' });
  }
});
router.post('/admin/login', async (req, res)=>{
  const { email, password }=req.body;
  if (!email||!password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }
  try {
    const result=await pool.query(
      'SELECT * FROM admin WHERE email=$1',
      [email]
    );
    if (result.rows.length===0) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const admin=result.rows[0];
    const valid=await bcrypt.compare(password, admin.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }
    const token=jwt.sign(
      { id: admin.admin_id, role: 'admin', name: admin.name },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    res.json({
      token,
      user: {
        id: admin.admin_id,
        name: admin.name,
        email: admin.email,
        role: 'admin',
        admin_role: admin.role
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error during admin login' });
  }
});
router.post('/admin/signup', async (req, res)=>{
  const { name, email, password }=req.body;
  if (!name||!email||!password) {
    return res.status(400).json({ error: 'Name, email and password are required' });
  }
  try {
    const existing=await pool.query('SELECT admin_id FROM admin WHERE email=$1', [email]);
    if (existing.rows.length>0) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }
    const passwordHash=await bcrypt.hash(password, 10);
    const result=await pool.query(
      `INSERT INTO admin (name, email, password_hash, role) VALUES ($1, $2, $3, 'admin') RETURNING admin_id, name, email, role`,
      [name, email, passwordHash]
    );
    const admin=result.rows[0];
    const token=jwt.sign(
      { id: admin.admin_id, role: 'admin', name: admin.name },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );
    res.status(201).json({
      token,
      user: { id: admin.admin_id, name: admin.name, email: admin.email, role: 'admin', admin_role: admin.role }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error during admin signup' });
  }
});
module.exports=router;
