CREATE TABLE IF NOT EXISTS admin (
  admin_id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL DEFAULT 'verifier',
  created_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT admin_role_check CHECK (role IN ('superadmin', 'verifier'))
);
CREATE TABLE IF NOT EXISTS student (
  student_id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  enrolment_no VARCHAR(20) UNIQUE NOT NULL,
  course VARCHAR(50) NOT NULL,
  year SMALLINT NOT NULL,
  college_id VARCHAR(10) NOT NULL DEFAULT 'VJTI',
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(15),
  address TEXT,
  aadhaar_masked VARCHAR(20),
  password_hash VARCHAR(255) NOT NULL,
  status VARCHAR(10) NOT NULL DEFAULT 'active',
  created_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT student_year_check CHECK (year BETWEEN 1 AND 4),
  CONSTRAINT student_status_check CHECK (status IN ('active', 'inactive'))
);
CREATE TABLE IF NOT EXISTS route (
  route_id SERIAL PRIMARY KEY,
  source_station VARCHAR(100) NOT NULL,
  destination_station VARCHAR(100) NOT NULL,
  travel_class VARCHAR(10) NOT NULL,
  transport_type VARCHAR(10) NOT NULL,
  distance_km DECIMAL(6,2),
  CONSTRAINT route_travel_class_check CHECK (travel_class IN ('first', 'second', 'ac')),
  CONSTRAINT route_transport_type_check CHECK (transport_type IN ('railway', 'metro')),
  CONSTRAINT route_unique UNIQUE (source_station, destination_station, travel_class, transport_type)
);
CREATE TABLE IF NOT EXISTS concession (
  concession_id SERIAL PRIMARY KEY,
  student_id INTEGER NOT NULL,
  route_id INTEGER NOT NULL,
  concession_type VARCHAR(20) NOT NULL,
  duration VARCHAR(10) NOT NULL,
  issue_date DATE NOT NULL,
  expiry_date DATE NOT NULL,
  status VARCHAR(10) NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT concession_student_fk FOREIGN KEY (student_id) REFERENCES student(student_id) ON DELETE RESTRICT,
  CONSTRAINT concession_route_fk FOREIGN KEY (route_id) REFERENCES route(route_id) ON DELETE RESTRICT,
  CONSTRAINT concession_type_check CHECK (concession_type IN ('railway', 'metro')),
  CONSTRAINT concession_duration_check CHECK (duration IN ('1_month', '3_months')),
  CONSTRAINT concession_status_check CHECK (status IN ('pending', 'active', 'expired', 'rejected')),
  CONSTRAINT concession_date_check CHECK (expiry_date > issue_date)
);
CREATE TABLE IF NOT EXISTS document (
  document_id SERIAL PRIMARY KEY,
  concession_id INTEGER NOT NULL,
  document_type VARCHAR(30) NOT NULL,
  upload_date DATE NOT NULL DEFAULT CURRENT_DATE,
  verification_status VARCHAR(15) NOT NULL DEFAULT 'pending',
  verified_by INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT document_concession_fk FOREIGN KEY (concession_id) REFERENCES concession(concession_id) ON DELETE CASCADE,
  CONSTRAINT document_admin_fk FOREIGN KEY (verified_by) REFERENCES admin(admin_id) ON DELETE SET NULL,
  CONSTRAINT document_type_check CHECK (document_type IN ('aadhaar', 'address_proof', 'college_id')),
  CONSTRAINT document_verification_status_check CHECK (verification_status IN ('pending', 'verified', 'failed'))
);
CREATE TABLE IF NOT EXISTS approval (
  approval_id SERIAL PRIMARY KEY,
  concession_id INTEGER NOT NULL UNIQUE,
  approved_by INTEGER,
  approval_date TIMESTAMP DEFAULT NOW(),
  action VARCHAR(10) NOT NULL DEFAULT 'pending',
  remarks TEXT,
  CONSTRAINT approval_concession_fk FOREIGN KEY (concession_id) REFERENCES concession(concession_id) ON DELETE CASCADE,
  CONSTRAINT approval_admin_fk FOREIGN KEY (approved_by) REFERENCES admin(admin_id) ON DELETE SET NULL,
  CONSTRAINT approval_action_check CHECK (action IN ('approved', 'rejected', 'pending'))
);
CREATE INDEX IF NOT EXISTS idx_concession_student_id ON concession(student_id);
CREATE INDEX IF NOT EXISTS idx_concession_status ON concession(status);
CREATE INDEX IF NOT EXISTS idx_concession_expiry_date ON concession(expiry_date);
CREATE INDEX IF NOT EXISTS idx_document_concession_id ON document(concession_id);
CREATE INDEX IF NOT EXISTS idx_approval_concession_id ON approval(concession_id);