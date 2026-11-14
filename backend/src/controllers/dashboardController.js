import * as dashboardService from '../services/dashboardService.js';
import { sendSuccess } from '../utils/response.js';

export async function getDashboardStats(req, res, next) {
  try {
    const stats = await dashboardService.getDashboardStats();
    return sendSuccess(res, stats);
  } catch (err) {
    next(err);
  }
}
