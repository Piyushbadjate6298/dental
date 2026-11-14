import * as migrationService from '../services/migrationService.js';
import { sendSuccess, sendError } from '../utils/response.js';

export async function migrateLocalData(req, res, next) {
  try {
    const performedBy = req.user?.username || 'admin';
    const result = await migrationService.importLocalData(req.body, performedBy);
    return sendSuccess(res, result, result.message);
  } catch (err) {
    return sendError(res, err.message, 400);
  }
}
