import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config();

const { Client } = pg;

async function setupAdmin() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString || connectionString.includes('YOUR_NEON_DATABASE_URL')) {
    console.error('❌ Error: DATABASE_URL is not set in environment.');
    console.log('ℹ️  Please set DATABASE_URL in your .env file.');
    process.exit(1);
  }

  const username = process.env.ADMIN_USERNAME || 'admin';
  const password = process.env.ADMIN_PASSWORD;

  if (!password) {
    console.error('❌ Error: ADMIN_PASSWORD must be specified in .env');
    process.exit(1);
  }

  console.log(`🔐 Setting up admin user [${username}]...`);
  const isNeon = connectionString.includes('neon.tech') || connectionString.includes('sslmode=require');

  const client = new Client({
    connectionString,
    ssl: isNeon ? { rejectUnauthorized: false } : undefined,
  });

  try {
    await client.connect();

    const hash = await bcrypt.hash(password, 10);
    const id = crypto.randomUUID();

    const res = await client.query(
      `INSERT INTO admin_users (id, username, password_hash, role, created_at, updated_at)
       VALUES ($1, $2, $3, 'admin', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
       ON CONFLICT (username)
       DO UPDATE SET password_hash = EXCLUDED.password_hash, updated_at = CURRENT_TIMESTAMP
       RETURNING id, username, role`,
      [id, username, hash]
    );

    console.log(`✅ Admin account configured successfully:`, res.rows[0]);
  } catch (err) {
    console.error('❌ Failed to setup admin:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

setupAdmin();
