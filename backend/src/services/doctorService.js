import { query } from '../database/connection.js';
import { logAudit } from './auditService.js';

export async function getDoctors({ activeOnly = false } = {}) {
  const sql = activeOnly
    ? 'SELECT id, doctor_name, is_active, created_at, updated_at FROM doctors WHERE is_active = TRUE ORDER BY doctor_name ASC'
    : 'SELECT id, doctor_name, is_active, created_at, updated_at FROM doctors ORDER BY doctor_name ASC';

  const res = await query(sql);
  return res.rows;
}

export async function getDoctorById(id) {
  const res = await query('SELECT * FROM doctors WHERE id = $1', [id]);
  return res.rows[0] || null;
}

export async function addDoctor(doctorName, performedBy = 'admin') {
  const name = doctorName.trim();
  const existing = await query(
    'SELECT * FROM doctors WHERE LOWER(doctor_name) = LOWER($1)',
    [name]
  );

  if (existing.rows.length > 0) {
    const doc = existing.rows[0];
    if (doc.is_active) {
      throw new Error('This doctor is already in your list');
    }
    // Reactivate previously deactivated doctor
    const updated = await query(
      'UPDATE doctors SET is_active = TRUE, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *',
      [doc.id]
    );
    await logAudit('DOCTOR_REACTIVATED', 'doctor', doc.id, { doctor_name: name }, performedBy);
    return updated.rows[0];
  }

  const id = crypto.randomUUID();
  const res = await query(
    `INSERT INTO doctors (id, doctor_name, is_active, created_at, updated_at)
     VALUES ($1, $2, TRUE, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
     RETURNING *`,
    [id, name]
  );

  await logAudit('DOCTOR_CREATED', 'doctor', id, { doctor_name: name }, performedBy);
  return res.rows[0];
}

export async function updateDoctor(id, newName, isActive = true, performedBy = 'admin') {
  const existing = await getDoctorById(id);
  if (!existing) {
    throw new Error('Doctor not found');
  }

  const name = newName.trim();

  // Check duplicate
  const dupCheck = await query(
    'SELECT * FROM doctors WHERE LOWER(doctor_name) = LOWER($1) AND id != $2',
    [name, id]
  );
  if (dupCheck.rows.length > 0) {
    throw new Error('Another doctor with this name already exists');
  }

  const res = await query(
    `UPDATE doctors
     SET doctor_name = $1, is_active = $2, updated_at = CURRENT_TIMESTAMP
     WHERE id = $3
     RETURNING *`,
    [name, isActive, id]
  );

  await logAudit('DOCTOR_UPDATED', 'doctor', id, { old_name: existing.doctor_name, new_name: name, is_active: isActive }, performedBy);
  return res.rows[0];
}

export async function deleteDoctor(id, performedBy = 'admin') {
  const existing = await getDoctorById(id);
  if (!existing) {
    throw new Error('Doctor not found');
  }

  // Check if inquiries exist for this doctor
  const inqCheck = await query('SELECT id FROM inquiries WHERE doctor_id = $1 LIMIT 1', [id]);

  if (inqCheck.rows.length > 0) {
    // Soft delete / deactivate so inquiry records and history remain 100% intact
    const res = await query(
      'UPDATE doctors SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP WHERE id = $1 RETURNING *',
      [id]
    );
    await logAudit('DOCTOR_DEACTIVATED', 'doctor', id, { doctor_name: existing.doctor_name }, performedBy);
    return { ...res.rows[0], deactivated: true };
  }

  // Hard delete if no inquiries linked
  await query('DELETE FROM doctors WHERE id = $1', [id]);
  await logAudit('DOCTOR_DELETED', 'doctor', id, { doctor_name: existing.doctor_name }, performedBy);
  return { id, deleted: true };
}
