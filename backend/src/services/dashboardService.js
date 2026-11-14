import { query } from '../database/connection.js';
import { formatInquiryForClient } from '../utils/helpers.js';

export async function getDashboardStats() {
  const today = new Date().toISOString().slice(0, 10);

  const [totalRes, todayRes, patientsRes, sentRes, recentRes] = await Promise.all([
    query('SELECT COUNT(*) as total FROM inquiries'),
    query('SELECT COUNT(*) as today_count FROM inquiries WHERE inquiry_date = $1', [today]),
    query('SELECT COUNT(DISTINCT LOWER(patient_name)) as patient_count FROM inquiries'),
    query("SELECT COUNT(*) as sent_count FROM inquiries WHERE status = 'Sent'"),
    query('SELECT * FROM inquiries ORDER BY inquiry_number DESC LIMIT 5'),
  ]);

  return {
    totalInquiries: Number(totalRes.rows[0]?.total || 0),
    todayInquiries: Number(todayRes.rows[0]?.today_count || 0),
    totalPatients: Number(patientsRes.rows[0]?.patient_count || 0),
    sentToLab: Number(sentRes.rows[0]?.sent_count || 0),
    recentInquiries: recentRes.rows.map(formatInquiryForClient),
  };
}
