import { query, withTransaction } from '../database/connection.js';
import { logAudit } from './auditService.js';
import { formatInquiryForClient, splitJawTeeth } from '../utils/helpers.js';

/**
 * Retrieves inquiries with optional search, filtering, and pagination
 */
export async function getInquiries({
  search = '',
  status = 'All',
  doctorId = null,
  startDate = null,
  endDate = null,
  page = 1,
  limit = 50,
} = {}) {
  const conditions = [];
  const params = [];

  if (search && search.trim()) {
    params.push(`%${search.trim().toLowerCase()}%`);
    const pIdx = params.length;
    conditions.push(`(
      LOWER(patient_name) LIKE $${pIdx} OR
      LOWER(doctor_name_snapshot) LIKE $${pIdx} OR
      CAST(inquiry_number AS TEXT) LIKE $${pIdx} OR
      LOWER(COALESCE(tooth_shade, '')) LIKE $${pIdx} OR
      LOWER(COALESCE(note, '')) LIKE $${pIdx}
    )`);
  }

  if (status && status !== 'All') {
    params.push(status);
    conditions.push(`status = $${params.length}`);
  }

  if (doctorId) {
    params.push(doctorId);
    conditions.push(`doctor_id = $${params.length}`);
  }

  if (startDate) {
    params.push(startDate);
    conditions.push(`inquiry_date >= $${params.length}`);
  }

  if (endDate) {
    params.push(endDate);
    conditions.push(`inquiry_date <= $${params.length}`);
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

  // Count total matching
  const countSql = `SELECT COUNT(*) as total FROM inquiries ${whereClause}`;
  const countRes = await query(countSql, params);
  const total = Number(countRes.rows[0]?.total || 0);

  // Paginated query
  let dataSql = `SELECT * FROM inquiries ${whereClause} ORDER BY inquiry_number DESC`;

  if (limit && Number(limit) > 0) {
    const pageNum = Math.max(1, Number(page));
    const limitNum = Number(limit);
    const offset = (pageNum - 1) * limitNum;
    params.push(limitNum, offset);
    dataSql += ` LIMIT $${params.length - 1} OFFSET $${params.length}`;
  }

  const dataRes = await query(dataSql, params);
  const formattedRows = dataRes.rows.map(formatInquiryForClient);

  const totalPages = limit && Number(limit) > 0 ? Math.ceil(total / Number(limit)) : 1;

  return {
    inquiries: formattedRows,
    total,
    page: Number(page),
    limit: Number(limit),
    totalPages,
  };
}

/**
 * Retrieves a single inquiry by ID
 */
export async function getInquiryById(id) {
  const res = await query('SELECT * FROM inquiries WHERE id = $1', [id]);
  return formatInquiryForClient(res.rows[0]);
}

/**
 * Creates a new customer inquiry
 */
export async function createInquiry(data, performedBy = 'admin') {
  return await withTransaction(async (client) => {
    // Generate next consecutive sequential inquiry number from database sequence
    let inquiryNumber;
    try {
      const seqRes = await client.query("SELECT nextval('inquiry_number_seq') as next_no");
      inquiryNumber = Number(seqRes.rows[0]?.next_no);
    } catch (seqErr) {
      const maxRes = await client.query('SELECT COALESCE(MAX(inquiry_number), 0) as max_no FROM inquiries');
      inquiryNumber = Number(maxRes.rows[0]?.max_no || 0) + 1;
    }

    const id = data.id || crypto.randomUUID();
    const inquiryDate = data.date || new Date().toISOString().slice(0, 10);
    const patient = (data.patient || '').trim();
    const doctorName = (data.doctor || '').trim();
    const shade = (data.shade || '').trim();
    const note = (data.note || '').trim();
    const status = data.status || 'Draft';
    const customFields = data.customFields && typeof data.customFields === 'object' ? data.customFields : {};

    // Separate upper & lower teeth
    const allTeeth = Array.isArray(data.teeth) ? data.teeth : [];
    const upperTeeth = Array.isArray(data.upperTeeth) && data.upperTeeth.length
      ? data.upperTeeth
      : allTeeth.filter((t) => typeof t === 'string' && t.startsWith('U-'));
    const lowerTeeth = Array.isArray(data.lowerTeeth) && data.lowerTeeth.length
      ? data.lowerTeeth
      : allTeeth.filter((t) => typeof t === 'string' && t.startsWith('L-'));

    const instructions = Array.isArray(data.instructions) ? data.instructions : [];
    const stages = Array.isArray(data.stages) ? data.stages : [];

    // Find doctor id if matching doctor name
    let doctorId = data.doctorId || null;
    if (!doctorId && doctorName) {
      const docRes = await client.query('SELECT id FROM doctors WHERE LOWER(doctor_name) = LOWER($1) LIMIT 1', [doctorName]);
      if (docRes.rows[0]) {
        doctorId = docRes.rows[0].id;
      }
    }

    const res = await client.query(
      `INSERT INTO inquiries (
        id, inquiry_number, inquiry_date, doctor_id, doctor_name_snapshot,
        patient_name, tooth_shade, upper_jaw_teeth, lower_jaw_teeth,
        lab_instructions, trial_requirements, note, status, custom_fields, created_at, updated_at
      ) VALUES (
        $1, $2, $3, $4, $5,
        $6, $7, $8, $9,
        $10, $11, $12, $13, $14, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      ) RETURNING *`,
      [
        id,
        inquiryNumber,
        inquiryDate,
        doctorId,
        doctorName,
        patient,
        shade,
        JSON.stringify(upperTeeth),
        JSON.stringify(lowerTeeth),
        JSON.stringify(instructions),
        JSON.stringify(stages),
        note,
        status,
        JSON.stringify(customFields),
      ]
    );

    await logAudit('INQUIRY_CREATED', 'inquiry', id, { inquiry_number: inquiryNumber, patient }, performedBy);
    return formatInquiryForClient(res.rows[0]);
  });
}

/**
 * Updates an existing inquiry
 */
export async function updateInquiry(id, data, performedBy = 'admin') {
  const existing = await getInquiryById(id);
  if (!existing) {
    throw new Error('Inquiry not found');
  }

  const inquiryDate = data.date || existing.date;
  const patient = data.patient !== undefined ? data.patient.trim() : existing.patient;
  const doctorName = data.doctor !== undefined ? data.doctor.trim() : existing.doctor;
  const shade = data.shade !== undefined ? data.shade.trim() : existing.shade;
  const note = data.note !== undefined ? data.note.trim() : existing.note;
  const status = data.status || existing.status;

  const allTeeth = Array.isArray(data.teeth) ? data.teeth : existing.teeth;
  const upperTeeth = Array.isArray(data.upperTeeth) && data.upperTeeth.length
    ? data.upperTeeth
    : allTeeth.filter((t) => typeof t === 'string' && t.startsWith('U-'));
  const lowerTeeth = Array.isArray(data.lowerTeeth) && data.lowerTeeth.length
    ? data.lowerTeeth
    : allTeeth.filter((t) => typeof t === 'string' && t.startsWith('L-'));

  const instructions = Array.isArray(data.instructions) ? data.instructions : existing.instructions;
  const stages = Array.isArray(data.stages) ? data.stages : existing.stages;
  const customFields = data.customFields !== undefined && typeof data.customFields === 'object' ? data.customFields : (existing.customFields || {});

  let doctorId = data.doctorId || existing.doctorId;
  if (doctorName && doctorName !== existing.doctor) {
    const docRes = await query('SELECT id FROM doctors WHERE LOWER(doctor_name) = LOWER($1) LIMIT 1', [doctorName]);
    if (docRes.rows[0]) {
      doctorId = docRes.rows[0].id;
    }
  }

  const res = await query(
    `UPDATE inquiries SET
      inquiry_date = $1,
      doctor_id = $2,
      doctor_name_snapshot = $3,
      patient_name = $4,
      tooth_shade = $5,
      upper_jaw_teeth = $6,
      lower_jaw_teeth = $7,
      lab_instructions = $8,
      trial_requirements = $9,
      note = $10,
      status = $11,
      custom_fields = $12,
      updated_at = CURRENT_TIMESTAMP
    WHERE id = $13
    RETURNING *`,
    [
      inquiryDate,
      doctorId,
      doctorName,
      patient,
      shade,
      JSON.stringify(upperTeeth),
      JSON.stringify(lowerTeeth),
      JSON.stringify(instructions),
      JSON.stringify(stages),
      note,
      status,
      JSON.stringify(customFields),
      id,
    ]
  );

  await logAudit('INQUIRY_UPDATED', 'inquiry', id, { inquiry_number: existing.number, patient }, performedBy);
  return formatInquiryForClient(res.rows[0]);
}

/**
 * Deletes an inquiry
 */
export async function deleteInquiry(id, performedBy = 'admin') {
  const existing = await getInquiryById(id);
  if (!existing) {
    throw new Error('Inquiry not found');
  }

  await query('DELETE FROM inquiries WHERE id = $1', [id]);
  await logAudit('INQUIRY_DELETED', 'inquiry', id, { inquiry_number: existing.number, patient: existing.patient }, performedBy);
  return { id, deleted: true };
}
