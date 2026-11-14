import { query } from '../database/connection.js';
import { addDoctor } from './doctorService.js';
import { updateSettings } from './settingsService.js';
import { createInquiry } from './inquiryService.js';
import { logAudit } from './auditService.js';
import { logger } from '../utils/logger.js';

export async function importLocalData(data = {}, performedBy = 'admin') {
  let importedDoctors = 0;
  let importedInquiries = 0;
  let updatedSettings = false;

  // 1. Import Doctors
  if (Array.isArray(data.doctors)) {
    for (const doc of data.doctors) {
      const name = typeof doc === 'string' ? doc.trim() : (doc.doctor_name || doc.name || '').trim();
      if (!name) continue;

      try {
        const check = await query('SELECT id FROM doctors WHERE LOWER(doctor_name) = LOWER($1)', [name]);
        if (check.rows.length === 0) {
          await addDoctor(name, performedBy);
          importedDoctors += 1;
        }
      } catch (err) {
        logger.warn(`Could not import doctor "${name}":`, err.message);
      }
    }
  }

  // 2. Import Settings
  if (data.settings && typeof data.settings === 'object') {
    try {
      await updateSettings(data.settings, performedBy);
      updatedSettings = true;
    } catch (err) {
      logger.warn('Could not import settings:', err.message);
    }
  }

  // 3. Import Inquiries
  if (Array.isArray(data.inquiries)) {
    for (const inq of data.inquiries) {
      if (!inq.patient && !inq.patient_name) continue;

      try {
        const inqNum = inq.number || inq.inquiry_number;
        const inqId = inq.id;

        // Check if already in database
        let exists = false;
        if (inqId) {
          const idCheck = await query('SELECT id FROM inquiries WHERE id = $1', [inqId]);
          if (idCheck.rows.length > 0) exists = true;
        }
        if (!exists && inqNum) {
          const numCheck = await query('SELECT id FROM inquiries WHERE inquiry_number = $1', [Number(inqNum)]);
          if (numCheck.rows.length > 0) exists = true;
        }

        if (!exists) {
          await createInquiry(
            {
              id: inqId,
              number: inqNum,
              date: inq.date || inq.inquiry_date,
              doctor: inq.doctor || inq.doctor_name_snapshot,
              patient: inq.patient || inq.patient_name,
              shade: inq.shade || inq.tooth_shade,
              teeth: inq.teeth || [],
              upperTeeth: inq.upperTeeth || inq.upper_jaw_teeth || [],
              lowerTeeth: inq.lowerTeeth || inq.lower_jaw_teeth || [],
              instructions: inq.instructions || inq.lab_instructions || [],
              stages: inq.stages || inq.trial_requirements || [],
              note: inq.note,
              status: inq.status || 'Draft',
            },
            performedBy
          );
          importedInquiries += 1;
        }
      } catch (err) {
        logger.warn(`Could not import inquiry #${inq.number || inq.id}:`, err.message);
      }
    }
  }

  await logAudit('DATA_MIGRATED', 'migration', 'local_import', {
    importedDoctors,
    importedInquiries,
    updatedSettings,
  }, performedBy);

  return {
    importedDoctors,
    importedInquiries,
    updatedSettings,
    message: `Migration completed: ${importedDoctors} doctor(s) and ${importedInquiries} inquiry record(s) transferred successfully.`,
  };
}
