import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { query } from '../database/connection.js';
import { logAudit } from './auditService.js';
import { logger } from '../utils/logger.js';

const JWT_SECRET = process.env.JWT_SECRET || 'shital-dental-jwt-secret-replace-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/**
 * Ensures an admin user exists. If table is empty, creates initial admin.
 */
export async function seedInitialAdminIfNeeded() {
  try {
    const res = await query('SELECT COUNT(*) as count FROM admin_users');
    const count = Number(res.rows[0]?.count || 0);

    if (count === 0) {
      const initialUser = (process.env.ADMIN_USERNAME || 'admin').trim();
      const initialPass = process.env.ADMIN_PASSWORD || 'Admin@ShitalDental2026!';
      const hash = await bcrypt.hash(initialPass, 10);
      const id = crypto.randomUUID();

      await query(
        `INSERT INTO admin_users (id, username, password_hash, role, created_at, updated_at)
         VALUES ($1, $2, $3, 'admin', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
        [id, initialUser, hash]
      );

      logger.info(`Initial admin account created: [${initialUser}]`);
    }
  } catch (err) {
    logger.warn('Initial admin check/seed encountered an issue:', err.message);
  }
}

/**
 * Authenticates admin credentials and returns JWT token
 */
export async function login(username, password) {
  // Ensure default admin exists if empty
  await seedInitialAdminIfNeeded();

  const res = await query(
    'SELECT * FROM admin_users WHERE LOWER(username) = LOWER($1)',
    [username.trim()]
  );

  const user = res.rows[0];
  if (!user) {
    // Perform fake bcrypt hash to prevent timing attacks
    await bcrypt.compare(password, '$2a$10$wK1F5n8oW.g5F5k5F5k5F.0000000000000000000000000000000');
    return null;
  }

  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) {
    return null;
  }

  // Update last_login
  await query('UPDATE admin_users SET last_login = CURRENT_TIMESTAMP WHERE id = $1', [user.id]);
  await logAudit('LOGIN_SUCCESS', 'admin_user', user.id, { username: user.username }, user.username);

  const tokenPayload = {
    id: user.id,
    username: user.username,
    role: user.role || 'admin',
  };

  const token = jwt.sign(tokenPayload, JWT_SECRET, {
    expiresIn: JWT_EXPIRES_IN,
  });

  return {
    token,
    user: tokenPayload,
  };
}

/**
 * Retrieves authenticated user details by id
 */
export async function getCurrentUser(userId) {
  const res = await query(
    'SELECT id, username, role, created_at, last_login FROM admin_users WHERE id = $1',
    [userId]
  );
  return res.rows[0] || null;
}

/**
 * Changes admin password
 */
export async function changePassword(userId, currentPassword, newPassword) {
  const res = await query('SELECT * FROM admin_users WHERE id = $1', [userId]);
  const user = res.rows[0];
  if (!user) {
    throw new Error('User not found');
  }

  const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
  if (!isMatch) {
    throw new Error('Incorrect current password');
  }

  const newHash = await bcrypt.hash(newPassword, 10);
  await query(
    'UPDATE admin_users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
    [newHash, userId]
  );

  await logAudit('PASSWORD_CHANGED', 'admin_user', userId, null, user.username);
  return true;
}

export function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}
