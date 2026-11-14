import { query } from '../database/connection.js';
import { logger } from '../utils/logger.js';

export async function logAudit(action, entityType, entityId, details = null, performedBy = 'system') {
  try {
    const id = crypto.randomUUID();
    const detailsJson = details ? JSON.stringify(details) : null;
    await query(
      `INSERT INTO audit_logs (id, action, entity_type, entity_id, details, performed_by, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP)`,
      [id, action, entityType, entityId, detailsJson, performedBy]
    );
  } catch (err) {
    logger.warn('Failed to record audit log:', err.message);
  }
}
