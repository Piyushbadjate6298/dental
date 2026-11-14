-- Migration: 001_initial_schema.sql
-- Description: Creates schema for Shital Dental Services (Admin Users, Doctors, Inquiries, App Settings, Audit Logs)

-- 1. Admin Users
CREATE TABLE IF NOT EXISTS admin_users (
  id VARCHAR(36) PRIMARY KEY,
  username VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'admin' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
  last_login TIMESTAMPTZ
);

-- 2. Doctors
CREATE TABLE IF NOT EXISTS doctors (
  id VARCHAR(36) PRIMARY KEY,
  doctor_name VARCHAR(255) UNIQUE NOT NULL,
  is_active BOOLEAN DEFAULT TRUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 3. Inquiries (strictly dental lab customer inquiry and prescription details, NO billing/amounts)
CREATE TABLE IF NOT EXISTS inquiries (
  id VARCHAR(36) PRIMARY KEY,
  inquiry_number INTEGER UNIQUE NOT NULL,
  inquiry_date VARCHAR(10) NOT NULL,
  doctor_id VARCHAR(36) REFERENCES doctors(id) ON DELETE SET NULL,
  doctor_name_snapshot VARCHAR(255) NOT NULL,
  patient_name VARCHAR(255) NOT NULL,
  tooth_shade VARCHAR(50),
  upper_jaw_teeth JSONB DEFAULT '[]'::jsonb NOT NULL,
  lower_jaw_teeth JSONB DEFAULT '[]'::jsonb NOT NULL,
  lab_instructions JSONB DEFAULT '[]'::jsonb NOT NULL,
  trial_requirements JSONB DEFAULT '[]'::jsonb NOT NULL,
  note TEXT,
  status VARCHAR(50) DEFAULT 'Draft' NOT NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 4. App Settings
CREATE TABLE IF NOT EXISTS app_settings (
  id VARCHAR(36) PRIMARY KEY,
  setting_key VARCHAR(100) UNIQUE NOT NULL,
  setting_value TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 5. Audit Logs
CREATE TABLE IF NOT EXISTS audit_logs (
  id VARCHAR(36) PRIMARY KEY,
  action VARCHAR(100) NOT NULL,
  entity_type VARCHAR(50) NOT NULL,
  entity_id VARCHAR(255),
  details JSONB,
  performed_by VARCHAR(100) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- Indexes for optimal lookup and search performance
CREATE INDEX IF NOT EXISTS idx_inquiries_number ON inquiries(inquiry_number);
CREATE INDEX IF NOT EXISTS idx_inquiries_date ON inquiries(inquiry_date);
CREATE INDEX IF NOT EXISTS idx_inquiries_patient ON inquiries(patient_name);
CREATE INDEX IF NOT EXISTS idx_inquiries_doctor_id ON inquiries(doctor_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_status ON inquiries(status);
CREATE INDEX IF NOT EXISTS idx_doctors_active ON doctors(is_active);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at);

-- Initial default settings seed (if not existing)
INSERT INTO app_settings (id, setting_key, setting_value, updated_at)
VALUES
  ('set-whatsapp', 'whatsapp', '919370045066', CURRENT_TIMESTAMP),
  ('set-lab-name', 'labName', 'Shital Dental Services', CURRENT_TIMESTAMP),
  ('set-lab-addr', 'labAddress', 'Lasalgaon 422306, Tal. Niphad, Nashik', CURRENT_TIMESTAMP),
  ('set-lab-phone', 'labPhone', '9370045066', CURRENT_TIMESTAMP)
ON CONFLICT (setting_key) DO NOTHING;
