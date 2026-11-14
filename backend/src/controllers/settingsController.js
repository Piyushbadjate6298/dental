import * as settingsService from '../services/settingsService.js';
import { sendSuccess, sendError } from '../utils/response.js';

export async function getSettings(req, res, next) {
  try {
    const settings = await settingsService.getSettings();
    return sendSuccess(res, settings);
  } catch (err) {
    next(err);
  }
}

export async function updateSettings(req, res, next) {
  try {
    const performedBy = req.user?.username || 'admin';
    const updated = await settingsService.updateSettings(req.body, performedBy);
    return sendSuccess(res, updated, 'Settings updated successfully');
  } catch (err) {
    return sendError(res, err.message, 400);
  }
}
