import { query } from '../database/connection.js';
import { logAudit } from './auditService.js';
import { cleanPhone } from '../utils/helpers.js';

const DEFAULT_SETTINGS = {
  whatsapp: '919423105611',
  labName: 'Shital Dental Services',
  labAddress: 'Lasalgaon 422306, Tal. Niphad, Nashik',
  labPhone: '9370045066',
};

export async function getSettings() {
  const res = await query('SELECT setting_key, setting_value FROM app_settings');
  const settings = { ...DEFAULT_SETTINGS };

  for (const row of res.rows) {
    if (row.setting_key in settings) {
      settings[row.setting_key] = row.setting_value;
    }
  }

  return settings;
}

export async function updateSettings(data, performedBy = 'admin') {
  const current = await getSettings();
  const updated = {
    whatsapp: data.whatsapp !== undefined ? cleanPhone(data.whatsapp) : current.whatsapp,
    labName: data.labName !== undefined ? data.labName.trim() : current.labName,
    labAddress: data.labAddress !== undefined ? data.labAddress.trim() : current.labAddress,
    labPhone: data.labPhone !== undefined ? data.labPhone.trim() : current.labPhone,
  };

  for (const [key, val] of Object.entries(updated)) {
    await query(
      `INSERT INTO app_settings (id, setting_key, setting_value, updated_at)
       VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
       ON CONFLICT (setting_key)
       DO UPDATE SET setting_value = EXCLUDED.setting_value, updated_at = CURRENT_TIMESTAMP`,
      [`set-${key}`, key, String(val)]
    );
  }

  await logAudit('SETTINGS_UPDATED', 'settings', 'app_settings', updated, performedBy);
  return updated;
}
