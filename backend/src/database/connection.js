import pg from 'pg';
import { neon, neonConfig } from '@neondatabase/serverless';
import dotenv from 'dotenv';
import { logger } from '../utils/logger.js';

dotenv.config();

const { Pool } = pg;

let pool = null;
let sqlNeon = null;

// Configure Neon driver if running over HTTP
if (process.env.DATABASE_URL && process.env.DATABASE_URL.includes('neon.tech')) {
  try {
    neonConfig.fetchConnectionCache = true;
    sqlNeon = neon(process.env.DATABASE_URL);
  } catch (err) {
    logger.warn('Could not initialize Neon HTTP client, falling back to pg.Pool:', err.message);
  }
}

export function isDatabaseConfigured() {
  const url = process.env.DATABASE_URL;
  return !!(url && url.trim().length > 10 && !url.includes('YOUR_NEON_DATABASE_URL'));
}

export function getPool() {
  if (!isDatabaseConfigured()) {
    return null;
  }
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;
    const isNeon = connectionString.includes('neon.tech') || connectionString.includes('sslmode=require');
    
    pool = new Pool({
      connectionString,
      ssl: isNeon ? { rejectUnauthorized: false } : undefined,
      max: 10,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });

    pool.on('error', (err) => {
      logger.error('Unexpected database client error in pool:', err.message);
    });
  }
  return pool;
}

// In-memory fallback database for local development when DATABASE_URL is not yet provided
class InMemoryDb {
  constructor() {
    this.admin_users = [];
    this.doctors = [];
    this.inquiries = [];
    this.app_settings = [
      { id: 'set-whatsapp', setting_key: 'whatsapp', setting_value: '919423105611', updated_at: new Date() },
      { id: 'set-lab-name', setting_key: 'labName', setting_value: 'Shital Dental Services', updated_at: new Date() },
      { id: 'set-lab-addr', setting_key: 'labAddress', setting_value: 'Lasalgaon 422306, Tal. Niphad, Nashik', updated_at: new Date() },
      { id: 'set-lab-phone', setting_key: 'labPhone', setting_value: '9370045066', updated_at: new Date() },
    ];
    this.audit_logs = [];
    this.nextInquiryNo = 301;
  }
}

const memoryStore = new InMemoryDb();

/**
 * Execute parameterized SQL query
 * @param {string} text - SQL statement with $1, $2, etc.
 * @param {Array} params - Parameter array
 */
export async function query(text, params = []) {
  if (isDatabaseConfigured()) {
    // 1. Try Neon HTTP driver if available and query is simple SELECT/INSERT/UPDATE/DELETE
    if (sqlNeon && !text.includes('BEGIN') && !text.includes('COMMIT')) {
      try {
        const rows = await sqlNeon(text, params);
        return {
          rows: Array.isArray(rows) ? rows : [],
          rowCount: Array.isArray(rows) ? rows.length : 0,
        };
      } catch (err) {
        logger.warn('Neon HTTP query failed, trying standard pool:', err.message);
      }
    }

    // 2. Fall back to standard PostgreSQL Pool
    const p = getPool();
    if (p) {
      const client = await p.connect();
      try {
        const res = await client.query(text, params);
        return res;
      } finally {
        client.release();
      }
    }
  }

  // 3. Fallback InMemory Handler for local development before DATABASE_URL is set
  return executeInMemoryQuery(text, params);
}

/**
 * Runs a function within a database transaction
 */
export async function withTransaction(callback) {
  if (isDatabaseConfigured()) {
    const p = getPool();
    const client = await p.connect();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  // In-memory simulation
  return await callback({ query });
}

/**
 * Test connectivity
 */
export async function testConnection() {
  if (!isDatabaseConfigured()) {
    return {
      connected: false,
      mode: 'in-memory-fallback',
      message: 'DATABASE_URL is not configured. Running in memory-safe developer fallback mode.',
    };
  }

  try {
    const res = await query('SELECT 1 as connected, NOW() as server_time');
    return {
      connected: true,
      mode: 'neon-postgresql',
      serverTime: res.rows[0]?.server_time,
      message: 'Connected to Neon PostgreSQL database.',
    };
  } catch (err) {
    logger.error('Database connection test failed:', err.message);
    return {
      connected: false,
      mode: 'error',
      error: err.message,
    };
  }
}

/**
 * Executes queries against memoryStore when DATABASE_URL is not yet set
 */
function executeInMemoryQuery(sql, params = []) {
  const normalized = sql.trim().toUpperCase();

  // Test / ping
  if (normalized.startsWith('SELECT 1')) {
    return { rows: [{ connected: 1, server_time: new Date() }], rowCount: 1 };
  }

  // Admin users query by ID
  if (normalized.includes('FROM ADMIN_USERS') && normalized.includes('WHERE ID =')) {
    const id = params[0];
    const user = memoryStore.admin_users.find((u) => u.id === id);
    return { rows: user ? [user] : [], rowCount: user ? 1 : 0 };
  }

  // Admin users query by username
  if (normalized.includes('FROM ADMIN_USERS') && (normalized.includes('WHERE LOWER(USERNAME)') || normalized.includes('WHERE USERNAME'))) {
    const username = (params[0] || '').toLowerCase();
    const user = memoryStore.admin_users.find((u) => u.username.toLowerCase() === username);
    return { rows: user ? [user] : [], rowCount: user ? 1 : 0 };
  }

  if (normalized.includes('INSERT INTO ADMIN_USERS')) {
    const [id, username, password_hash, role] = params;
    const existing = memoryStore.admin_users.find((u) => u.username.toLowerCase() === username.toLowerCase());
    if (existing) {
      existing.password_hash = password_hash;
      existing.updated_at = new Date();
      return { rows: [existing], rowCount: 1 };
    }
    const newUser = {
      id: id || crypto.randomUUID(),
      username,
      password_hash,
      role: role || 'admin',
      created_at: new Date(),
      updated_at: new Date(),
      last_login: null,
    };
    memoryStore.admin_users.push(newUser);
    return { rows: [newUser], rowCount: 1 };
  }

  if (normalized.includes('UPDATE ADMIN_USERS') && normalized.includes('LAST_LOGIN')) {
    const id = params[params.length - 1];
    const user = memoryStore.admin_users.find((u) => u.id === id);
    if (user) user.last_login = new Date();
    return { rows: user ? [user] : [], rowCount: user ? 1 : 0 };
  }

  if (normalized.includes('UPDATE ADMIN_USERS') && normalized.includes('PASSWORD_HASH')) {
    const [password_hash, id] = params;
    const user = memoryStore.admin_users.find((u) => u.id === id);
    if (user) {
      user.password_hash = password_hash;
      user.updated_at = new Date();
    }
    return { rows: user ? [user] : [], rowCount: user ? 1 : 0 };
  }

  // Count admin users
  if (normalized.includes('COUNT(*)') && normalized.includes('FROM ADMIN_USERS')) {
    return { rows: [{ count: String(memoryStore.admin_users.length) }], rowCount: 1 };
  }

  // Doctors
  if (normalized.includes('FROM DOCTORS')) {
    if (normalized.includes('DOCTOR_NAME') && normalized.includes('LOWER')) {
      const name = (params[0] || '').toLowerCase();
      const excludeId = params[1] || null;
      let matched = memoryStore.doctors.filter((d) => d.doctor_name.toLowerCase() === name);
      if (excludeId) {
        matched = matched.filter((d) => d.id !== excludeId);
      }
      return { rows: matched, rowCount: matched.length };
    }

    if (normalized.includes('WHERE ID =')) {
      const id = params[0];
      const doc = memoryStore.doctors.find((d) => d.id === id);
      return { rows: doc ? [doc] : [], rowCount: doc ? 1 : 0 };
    }

    let list = [...memoryStore.doctors];
    if (normalized.includes('IS_ACTIVE = TRUE')) {
      list = list.filter((d) => d.is_active);
    }
    list.sort((a, b) => a.doctor_name.localeCompare(b.doctor_name));
    return { rows: list, rowCount: list.length };
  }

  if (normalized.includes('INSERT INTO DOCTORS')) {
    const [id, doctor_name, is_active] = params;
    const existing = memoryStore.doctors.find((d) => d.doctor_name.toLowerCase() === doctor_name.toLowerCase());
    if (existing) {
      existing.is_active = true;
      existing.updated_at = new Date();
      return { rows: [existing], rowCount: 1 };
    }
    const newDoc = {
      id: id || crypto.randomUUID(),
      doctor_name,
      is_active: is_active !== false,
      created_at: new Date(),
      updated_at: new Date(),
    };
    memoryStore.doctors.push(newDoc);
    return { rows: [newDoc], rowCount: 1 };
  }

  if (normalized.includes('UPDATE DOCTORS')) {
    if (normalized.includes('IS_ACTIVE = FALSE') || normalized.includes('IS_ACTIVE = TRUE')) {
      const id = params[0];
      const doc = memoryStore.doctors.find((d) => d.id === id);
      if (doc) {
        doc.is_active = normalized.includes('IS_ACTIVE = TRUE');
        doc.updated_at = new Date();
      }
      return { rows: doc ? [doc] : [], rowCount: doc ? 1 : 0 };
    }
    const [doctor_name, is_active, id] = params;
    const doc = memoryStore.doctors.find((d) => d.id === id);
    if (doc) {
      if (doctor_name !== undefined) doc.doctor_name = doctor_name;
      if (is_active !== undefined) doc.is_active = is_active;
      doc.updated_at = new Date();
    }
    return { rows: doc ? [doc] : [], rowCount: doc ? 1 : 0 };
  }

  if (normalized.includes('DELETE FROM DOCTORS')) {
    const id = params[0];
    const initialLen = memoryStore.doctors.length;
    memoryStore.doctors = memoryStore.doctors.filter((d) => d.id !== id);
    return { rows: [], rowCount: initialLen - memoryStore.doctors.length };
  }

  // App Settings
  if (normalized.includes('FROM APP_SETTINGS')) {
    return { rows: [...memoryStore.app_settings], rowCount: memoryStore.app_settings.length };
  }

  if (normalized.includes('INSERT INTO APP_SETTINGS') || normalized.includes('UPDATE APP_SETTINGS')) {
    const [id, key, val] = params;
    let setting = memoryStore.app_settings.find((s) => s.setting_key === key);
    if (setting) {
      setting.setting_value = val;
      setting.updated_at = new Date();
    } else {
      setting = {
        id: id || crypto.randomUUID(),
        setting_key: key,
        setting_value: val,
        updated_at: new Date(),
      };
      memoryStore.app_settings.push(setting);
    }
    return { rows: [setting], rowCount: 1 };
  }

  // Inquiries - Dashboard counts
  if (normalized.includes('COUNT(*)') && normalized.includes('FROM INQUIRIES') && normalized.includes("STATUS = 'SENT'")) {
    const count = memoryStore.inquiries.filter((x) => x.status === 'Sent').length;
    return { rows: [{ sent_count: count }], rowCount: 1 };
  }

  if (normalized.includes('COUNT(*)') && normalized.includes('FROM INQUIRIES') && normalized.includes('INQUIRY_DATE =')) {
    const targetDate = params[0];
    const count = memoryStore.inquiries.filter((x) => x.inquiry_date === targetDate).length;
    return { rows: [{ today_count: count }], rowCount: 1 };
  }

  if (normalized.includes('COUNT(DISTINCT') && normalized.includes('PATIENT_NAME')) {
    const unique = new Set(memoryStore.inquiries.map((x) => (x.patient_name || '').trim().toLowerCase()).filter(Boolean));
    return { rows: [{ patient_count: unique.size }], rowCount: 1 };
  }

  if (normalized.includes('COUNT(*)') && normalized.includes('FROM INQUIRIES')) {
    let list = [...memoryStore.inquiries];
    if (params.length > 0 && typeof params[0] === 'string' && params[0].startsWith('%')) {
      const q = params[0].replace(/%/g, '').toLowerCase();
      list = list.filter((x) =>
        (x.patient_name || '').toLowerCase().includes(q) ||
        (x.doctor_name_snapshot || '').toLowerCase().includes(q) ||
        String(x.inquiry_number).includes(q)
      );
    }
    return { rows: [{ total: list.length }], rowCount: 1 };
  }

  if (normalized.includes('MAX(INQUIRY_NUMBER)')) {
    const max = memoryStore.inquiries.reduce((m, x) => Math.max(m, x.inquiry_number || 0), 300);
    return { rows: [{ max_no: max }], rowCount: 1 };
  }

  if (normalized.includes('FROM INQUIRIES')) {
    if (normalized.includes('WHERE ID =') || normalized.includes('WHERE DOCTOR_ID =')) {
      const id = params[0];
      const list = memoryStore.inquiries.filter((x) => x.id === id || x.doctor_id === id);
      return { rows: list, rowCount: list.length };
    }

    if (normalized.includes('WHERE INQUIRY_NUMBER =')) {
      const num = Number(params[0]);
      const list = memoryStore.inquiries.filter((x) => x.inquiry_number === num);
      return { rows: list, rowCount: list.length };
    }

    let list = [...memoryStore.inquiries];

    // Filter by search term if present
    if (params.length > 0 && typeof params[0] === 'string' && params[0].startsWith('%')) {
      const q = params[0].replace(/%/g, '').toLowerCase();
      list = list.filter((x) =>
        (x.patient_name || '').toLowerCase().includes(q) ||
        (x.doctor_name_snapshot || '').toLowerCase().includes(q) ||
        String(x.inquiry_number).includes(q) ||
        (x.tooth_shade || '').toLowerCase().includes(q) ||
        (x.note || '').toLowerCase().includes(q)
      );
    }

    list.sort((a, b) => (b.inquiry_number || 0) - (a.inquiry_number || 0));
    return { rows: list, rowCount: list.length };
  }

  if (normalized.includes('INSERT INTO INQUIRIES')) {
    const [
      id,
      inquiry_number,
      inquiry_date,
      doctor_id,
      doctor_name_snapshot,
      patient_name,
      tooth_shade,
      upper_jaw_teeth,
      lower_jaw_teeth,
      lab_instructions,
      trial_requirements,
      note,
      status,
    ] = params;

    const newInquiry = {
      id: id || crypto.randomUUID(),
      inquiry_number: Number(inquiry_number),
      inquiry_date,
      doctor_id,
      doctor_name_snapshot,
      patient_name,
      tooth_shade,
      upper_jaw_teeth: typeof upper_jaw_teeth === 'string' ? JSON.parse(upper_jaw_teeth) : upper_jaw_teeth,
      lower_jaw_teeth: typeof lower_jaw_teeth === 'string' ? JSON.parse(lower_jaw_teeth) : lower_jaw_teeth,
      lab_instructions: typeof lab_instructions === 'string' ? JSON.parse(lab_instructions) : lab_instructions,
      trial_requirements: typeof trial_requirements === 'string' ? JSON.parse(trial_requirements) : trial_requirements,
      note,
      status: status || 'Draft',
      created_at: new Date(),
      updated_at: new Date(),
    };

    memoryStore.inquiries = [newInquiry, ...memoryStore.inquiries.filter((x) => x.id !== newInquiry.id)];
    return { rows: [newInquiry], rowCount: 1 };
  }

  if (normalized.includes('UPDATE INQUIRIES')) {
    const id = params[params.length - 1];
    const item = memoryStore.inquiries.find((x) => x.id === id);
    if (item) {
      const [
        inquiry_date,
        doctor_id,
        doctor_name_snapshot,
        patient_name,
        tooth_shade,
        upper_jaw_teeth,
        lower_jaw_teeth,
        lab_instructions,
        trial_requirements,
        note,
        status,
      ] = params;
      if (inquiry_date !== undefined) item.inquiry_date = inquiry_date;
      if (doctor_id !== undefined) item.doctor_id = doctor_id;
      if (doctor_name_snapshot !== undefined) item.doctor_name_snapshot = doctor_name_snapshot;
      if (patient_name !== undefined) item.patient_name = patient_name;
      if (tooth_shade !== undefined) item.tooth_shade = tooth_shade;
      if (upper_jaw_teeth !== undefined) item.upper_jaw_teeth = typeof upper_jaw_teeth === 'string' ? JSON.parse(upper_jaw_teeth) : upper_jaw_teeth;
      if (lower_jaw_teeth !== undefined) item.lower_jaw_teeth = typeof lower_jaw_teeth === 'string' ? JSON.parse(lower_jaw_teeth) : lower_jaw_teeth;
      if (lab_instructions !== undefined) item.lab_instructions = typeof lab_instructions === 'string' ? JSON.parse(lab_instructions) : lab_instructions;
      if (trial_requirements !== undefined) item.trial_requirements = typeof trial_requirements === 'string' ? JSON.parse(trial_requirements) : trial_requirements;
      if (note !== undefined) item.note = note;
      if (status !== undefined) item.status = status;
      item.updated_at = new Date();
    }
    return { rows: item ? [item] : [], rowCount: item ? 1 : 0 };
  }

  if (normalized.includes('DELETE FROM INQUIRIES')) {
    const id = params[0];
    const initialLen = memoryStore.inquiries.length;
    memoryStore.inquiries = memoryStore.inquiries.filter((x) => x.id !== id);
    return { rows: [], rowCount: initialLen - memoryStore.inquiries.length };
  }

  // Audit Logs
  if (normalized.includes('INSERT INTO AUDIT_LOGS')) {
    const [id, action, entity_type, entity_id, details, performed_by] = params;
    const log = {
      id: id || crypto.randomUUID(),
      action,
      entity_type,
      entity_id,
      details: typeof details === 'string' ? JSON.parse(details) : details,
      performed_by,
      created_at: new Date(),
    };
    memoryStore.audit_logs.push(log);
    return { rows: [log], rowCount: 1 };
  }

  return { rows: [], rowCount: 0 };
}
