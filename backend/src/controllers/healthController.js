import { testConnection } from '../database/connection.js';
import { sendSuccess } from '../utils/response.js';

export async function getHealth(req, res) {
  const dbStatus = await testConnection();

  return sendSuccess(res, {
    status: 'healthy',
    application: 'Sheetal Dental Art API',
    version: '2.0.0',
    environment: process.env.NODE_ENV || 'development',
    database: dbStatus,
    timestamp: new Date().toISOString(),
  }, 'Service is operational');
}
