export const teeth = [8, 7, 6, 5, 4, 3, 2, 1, 1, 2, 3, 4, 5, 6, 7, 8];

export function cleanPhone(s) {
  let digits = (s || '').replace(/\D/g, '');
  if (digits.length === 11 && digits.startsWith('0')) {
    digits = digits.slice(1);
  }
  if (digits.length === 10) {
    return '91' + digits;
  }
  return digits;
}

export function splitJawTeeth(keys = []) {
  const upper = [];
  const lower = [];
  (keys || []).forEach((k) => {
    if (typeof k === 'string') {
      const [jaw, i] = k.split('-');
      const num = teeth[Number(i)];
      if (jaw === 'U') upper.push(num !== undefined ? num : k);
      else if (jaw === 'L') lower.push(num !== undefined ? num : k);
      else upper.push(k);
    } else {
      upper.push(k);
    }
  });
  return {
    upper,
    lower,
  };
}

export function formatInquiryForClient(row) {
  if (!row) return null;

  const upperTeeth = Array.isArray(row.upper_jaw_teeth)
    ? row.upper_jaw_teeth
    : typeof row.upper_jaw_teeth === 'string'
    ? JSON.parse(row.upper_jaw_teeth || '[]')
    : [];

  const lowerTeeth = Array.isArray(row.lower_jaw_teeth)
    ? row.lower_jaw_teeth
    : typeof row.lower_jaw_teeth === 'string'
    ? JSON.parse(row.lower_jaw_teeth || '[]')
    : [];

  const instructions = Array.isArray(row.lab_instructions)
    ? row.lab_instructions
    : typeof row.lab_instructions === 'string'
    ? JSON.parse(row.lab_instructions || '[]')
    : [];

  const stages = Array.isArray(row.trial_requirements)
    ? row.trial_requirements
    : typeof row.trial_requirements === 'string'
    ? JSON.parse(row.trial_requirements || '[]')
    : [];

  // Combine upper & lower tooth keys for existing frontend ToothPicker compatibility
  const teethKeys = [];
  upperTeeth.forEach((t) => {
    if (typeof t === 'string' && t.startsWith('U-')) teethKeys.push(t);
  });
  lowerTeeth.forEach((t) => {
    if (typeof t === 'string' && t.startsWith('L-')) teethKeys.push(t);
  });

  return {
    id: row.id,
    number: row.inquiry_number,
    date: row.inquiry_date,
    doctorId: row.doctor_id,
    doctor: row.doctor_name_snapshot,
    patient: row.patient_name,
    shade: row.tooth_shade || '',
    teeth: teethKeys.length ? teethKeys : [...upperTeeth, ...lowerTeeth],
    upperTeeth,
    lowerTeeth,
    instructions,
    stages,
    note: row.note || '',
    customFields: row.custom_fields || {},
    status: row.status || 'Draft',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}
