require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const bcrypt=require('bcryptjs');
const pool=require('../config/db');
async function seed() {
  try {
    const passwordHash=await bcrypt.hash('Admin@123', 10);
    const result=await pool.query(
      `INSERT INTO admin (name, email, password_hash, role)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (email) DO NOTHING
       RETURNING admin_id`,
      ['Super Admin', 'admin@vjti.ac.in', passwordHash, 'superadmin']
    );
    if (result.rows.length > 0) {
      console.log('Seed successful. Admin created with id:', result.rows[0].admin_id);
    } else {
      console.log('Admin already exists, skipping.');
    }
    await pool.end();
  } catch (err) {
    console.error('Seed failed:', err.message);
    process.exit(1);
  }
}
seed();
