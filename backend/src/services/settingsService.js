import { query } from '../database/connection.js';
import { logAudit } from './auditService.js';
import { cleanPhone } from '../utils/helpers.js';

export const DEFAULT_INQUIRY_FORM_SETTINGS = {
  labInstructions: [
    { id: 'inst-1', name: 'White Metal', enabled: true },
    { id: 'inst-2', name: 'Ceramic', enabled: true },
    { id: 'inst-3', name: 'Zircon', enabled: true },
    { id: 'inst-4', name: 'Valplast', enabled: true },
    { id: 'inst-5', name: 'R.P.D.C.', enabled: true },
    { id: 'inst-6', name: 'Half Ceramic', enabled: true },
    { id: 'inst-7', name: 'Japanese Gold', enabled: true },
  ],
  trialOptions: [
    { id: 'trial-1', name: 'Metal Trial', enabled: true },
    { id: 'trial-2', name: 'Bisque Trial', enabled: true },
    { id: 'trial-3', name: 'Final', enabled: true },
  ],
  toothShades: [
    { id: 'shade-1', name: 'A1', enabled: true },
    { id: 'shade-2', name: 'A2', enabled: true },
    { id: 'shade-3', name: 'A3', enabled: true },
    { id: 'shade-4', name: 'A3.5', enabled: true },
    { id: 'shade-5', name: 'B1', enabled: true },
    { id: 'shade-6', name: 'B2', enabled: true },
    { id: 'shade-7', name: 'C1', enabled: true },
    { id: 'shade-8', name: 'C2', enabled: true },
    { id: 'shade-9', name: 'D2', enabled: true },
    { id: 'shade-10', name: 'Bleach', enabled: true },
  ],
  allowOtherLabInstruction: true,
  allowOtherTrialOption: true,
  allowOtherShade: true,
  customFields: [],
};

const DEFAULT_SETTINGS = {
  whatsapp: '919370045066',
  labName: 'Sheetal Dental Art',
  labAddress: 'Lasalgaon 422306, Tal. Niphad, Nashik',
  labPhone: '9370045066',
  inquiryFormSettings: DEFAULT_INQUIRY_FORM_SETTINGS,
};

export async function getSettings() {
  const res = await query('SELECT setting_key, setting_value FROM app_settings');
  const settings = {
    whatsapp: DEFAULT_SETTINGS.whatsapp,
    labName: DEFAULT_SETTINGS.labName,
    labAddress: DEFAULT_SETTINGS.labAddress,
    labPhone: DEFAULT_SETTINGS.labPhone,
    inquiryFormSettings: { ...DEFAULT_INQUIRY_FORM_SETTINGS },
  };

  for (const row of res.rows) {
    if (row.setting_key === 'inquiryFormSettings') {
      try {
        const parsed = typeof row.setting_value === 'string'
          ? JSON.parse(row.setting_value)
          : row.setting_value;
        settings.inquiryFormSettings = {
          ...DEFAULT_INQUIRY_FORM_SETTINGS,
          ...parsed,
          labInstructions: Array.isArray(parsed.labInstructions) ? parsed.labInstructions : DEFAULT_INQUIRY_FORM_SETTINGS.labInstructions,
          trialOptions: Array.isArray(parsed.trialOptions) ? parsed.trialOptions : DEFAULT_INQUIRY_FORM_SETTINGS.trialOptions,
          toothShades: Array.isArray(parsed.toothShades) ? parsed.toothShades : DEFAULT_INQUIRY_FORM_SETTINGS.toothShades,
          customFields: Array.isArray(parsed.customFields) ? parsed.customFields : [],
        };
      } catch (e) {
        settings.inquiryFormSettings = { ...DEFAULT_INQUIRY_FORM_SETTINGS };
      }
    } else if (row.setting_key in settings) {
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
    inquiryFormSettings: data.inquiryFormSettings !== undefined ? data.inquiryFormSettings : current.inquiryFormSettings,
  };

  // Save basic settings
  for (const [key, val] of Object.entries(updated)) {
    if (key === 'inquiryFormSettings') {
      await query(
        `INSERT INTO app_settings (id, setting_key, setting_value, updated_at)
         VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
         ON CONFLICT (setting_key)
         DO UPDATE SET setting_value = EXCLUDED.setting_value, updated_at = CURRENT_TIMESTAMP`,
        ['set-inquiry-form', 'inquiryFormSettings', JSON.stringify(val)]
      );
    } else {
      await query(
        `INSERT INTO app_settings (id, setting_key, setting_value, updated_at)
         VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
         ON CONFLICT (setting_key)
         DO UPDATE SET setting_value = EXCLUDED.setting_value, updated_at = CURRENT_TIMESTAMP`,
        [`set-${key}`, key, String(val)]
      );
    }
  }

  await logAudit('SETTINGS_UPDATED', 'settings', 'app_settings', updated, performedBy);
  return updated;
}

export async function getInquiryFormSettings() {
  const settings = await getSettings();
  return settings.inquiryFormSettings || DEFAULT_INQUIRY_FORM_SETTINGS;
}

export async function updateInquiryFormSettings(formSettings, performedBy = 'admin') {
  const current = await getSettings();
  const merged = {
    ...DEFAULT_INQUIRY_FORM_SETTINGS,
    ...formSettings,
    labInstructions: Array.isArray(formSettings.labInstructions) ? formSettings.labInstructions : DEFAULT_INQUIRY_FORM_SETTINGS.labInstructions,
    trialOptions: Array.isArray(formSettings.trialOptions) ? formSettings.trialOptions : DEFAULT_INQUIRY_FORM_SETTINGS.trialOptions,
    toothShades: Array.isArray(formSettings.toothShades) ? formSettings.toothShades : DEFAULT_INQUIRY_FORM_SETTINGS.toothShades,
    customFields: Array.isArray(formSettings.customFields) ? formSettings.customFields : [],
  };

  await query(
    `INSERT INTO app_settings (id, setting_key, setting_value, updated_at)
     VALUES ($1, $2, $3, CURRENT_TIMESTAMP)
     ON CONFLICT (setting_key)
     DO UPDATE SET setting_value = EXCLUDED.setting_value, updated_at = CURRENT_TIMESTAMP`,
    ['set-inquiry-form', 'inquiryFormSettings', JSON.stringify(merged)]
  );

  await logAudit('INQUIRY_FORM_SETTINGS_UPDATED', 'settings', 'inquiryFormSettings', merged, performedBy);
  return merged;
}
