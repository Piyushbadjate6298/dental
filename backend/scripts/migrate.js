import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import pg from 'pg';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const { Client } = pg;

async function runMigrations() {
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString || connectionString.includes('YOUR_NEON_DATABASE_URL')) {
    console.warn('⚠️ Warning: DATABASE_URL is not set in environment.');
    console.log('ℹ️ Skipping build-time database migration. Server will initialize at runtime when DATABASE_URL is present.');
    return;
  }

  console.log('🔄 Connecting to Neon PostgreSQL for database migrations...');
  const isNeon = connectionString.includes('neon.tech') || connectionString.includes('sslmode=require');

  const client = new Client({
    connectionString,
    ssl: isNeon ? { rejectUnauthorized: false } : undefined,
  });

  try {
    await client.connect();
    console.log('✅ Connected to PostgreSQL.');

    const migrationsDir = path.join(__dirname, '../migrations');
    const files = fs.readdirSync(migrationsDir).filter((f) => f.endsWith('.sql')).sort();

    for (const file of files) {
      console.log(`📄 Executing migration: ${file}...`);
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      await client.query(sql);
      console.log(`✅ ${file} executed successfully.`);
    }

    console.log('🎉 Database migrations completed successfully!');
    console.log('Tables created / verified:');
    console.log(' - admin_users');
    console.log(' - doctors');
    console.log(' - inquiries');
    console.log(' - app_settings');
    console.log(' - audit_logs');
  } catch (err) {
    console.error('❌ Migration failed:', err.message);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigrations();
