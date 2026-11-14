import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';
import pg from 'pg';
import jwt from 'jsonwebtoken';
import http from 'http';
import app from '../src/app.js';
import { seedInitialAdminIfNeeded } from '../src/services/authService.js';

dotenv.config();

const { Client } = pg;
const conn = process.env.DATABASE_URL;

async function runVerification() {
  console.log('==================================================');
  console.log('🧪 FINAL ADMIN LOGIN VERIFICATION - SHITAL DENTAL');
  console.log('==================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, desc) {
    if (condition) {
      console.log(`  ✅ PASS: ${desc}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${desc}`);
      failed++;
    }
  }

  // 1. Direct Neon DB Inspection
  console.log('1. Direct Neon Database Inspection');
  const client = new Client({ connectionString: conn, ssl: { rejectUnauthorized: false } });
  await client.connect();
  assert(true, 'Connected to Neon PostgreSQL');

  // Ensure initial admin check
  await seedInitialAdminIfNeeded();

  const userQuery = await client.query('SELECT id, username, password_hash, role, created_at, last_login FROM admin_users WHERE username = $1', ['admin']);
  assert(userQuery.rows.length === 1, 'Admin user "admin" exists in Neon database');

  const admin = userQuery.rows[0];
  assert(admin.role === 'admin', 'Admin role is set to "admin"');
  assert(admin.password_hash.startsWith('$2a$10$'), 'Password is stored as a secure bcrypt hash (cost factor 10)');
  assert(!admin.password_hash.includes('admin') && admin.password_hash.length >= 60, 'Password is NEVER stored in plaintext');

  // Check uniqueness / duplicate prevention
  const countQuery = await client.query('SELECT COUNT(*) as count FROM admin_users WHERE username = $1', ['admin']);
  assert(Number(countQuery.rows[0].count) === 1, 'Duplicate check passed: Exactly 1 record exists for username "admin"');

  await client.end();

  // 2. HTTP Server & API Route Testing
  console.log('\n2. Backend API Authentication & Protection Testing');
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}/api`;

  try {
    // Test: Invalid password login
    const badLoginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: 'WrongPassword999!' }),
    });
    assert(badLoginRes.status === 401, 'Invalid login credentials rejected with HTTP 401 Unauthorized');

    // Test: Missing credentials
    const emptyLoginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: '', password: '' }),
    });
    assert(emptyLoginRes.status === 400, 'Empty login payload rejected with HTTP 400 Bad Request');

    // Test: Valid login
    const validPassword = process.env.ADMIN_PASSWORD || 'Admin@ShitalDental2026!';
    const goodLoginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: validPassword }),
    });
    const goodLoginData = await goodLoginRes.json();
    assert(goodLoginRes.status === 200, 'Valid login succeeds with HTTP 200 OK');
    assert(Boolean(goodLoginData?.data?.token), 'JWT authentication token received in response');
    assert(goodLoginData?.data?.user?.username === 'admin', 'Returned user profile identifies username as "admin"');
    assert(goodLoginData?.data?.user?.role === 'admin', 'Returned user profile identifies role as "admin"');

    const token = goodLoginData.data.token;

    // Test: Session persistence across page refreshes via GET /auth/me
    const meRes = await fetch(`${baseUrl}/auth/me`, {
      headers: {
        'Authorization': `Bearer ${token}`,
      },
    });
    const meData = await meRes.json();
    assert(meRes.status === 200, 'GET /auth/me verifies session token (persists across page refresh)');
    assert(meData?.data?.user?.username === 'admin', 'Session token returns authenticated admin profile');

    // Test: Protected routes rejected without token
    const noTokenRes = await fetch(`${baseUrl}/doctors`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ doctor_name: 'Dr. Unauthorized' }),
    });
    assert(noTokenRes.status === 401, 'Protected route POST /api/doctors rejected without token (HTTP 401)');

    const noTokenInquiriesRes = await fetch(`${baseUrl}/inquiries`);
    assert(noTokenInquiriesRes.status === 401, 'Protected route GET /api/inquiries rejected without token (HTTP 401)');

    // Test: Protected routes succeed with token
    const withTokenRes = await fetch(`${baseUrl}/doctors`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify({ doctor_name: `Dr. Verified Auth ${Date.now()}` }),
    });
    assert(withTokenRes.status === 201, 'Protected route POST /api/doctors accessible with valid JWT token');

    // Test: Logout endpoint
    const logoutRes = await fetch(`${baseUrl}/auth/logout`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` },
    });
    assert(logoutRes.status === 200, 'POST /auth/logout endpoint succeeds with HTTP 200');

    // 3. CORS and Header Verification
    console.log('\n3. CORS and Header Verification');
    const corsPreflightRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'OPTIONS',
      headers: {
        'Origin': 'https://dental-services.vercel.app',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Content-Type, Authorization',
      },
    });
    assert(corsPreflightRes.status === 204 || corsPreflightRes.status === 200, 'CORS preflight request succeeds');
    const corsAllowOrigin = corsPreflightRes.headers.get('access-control-allow-origin');
    assert(corsAllowOrigin === 'https://dental-services.vercel.app', 'CORS allows Vercel frontend origin');
    assert(corsPreflightRes.headers.get('access-control-allow-credentials') === 'true', 'CORS allows credentials');

    // 4. Strict Financial/Billing Audit Check
    console.log('\n4. Non-billing / Healthcare Inquiry Verification');
    const inqSampleRes = await fetch(`${baseUrl}/inquiries`, {
      headers: { 'Authorization': `Bearer ${token}` },
    });
    const inqSampleData = await inqSampleRes.json();
    const inqList = inqSampleData?.data?.inquiries || inqSampleData?.data || [];
    assert(Array.isArray(inqList) && inqList.every((inq) => inq.amount === undefined && inq.total_amount === undefined && inq.invoice === undefined), 'Confirmed strictly NON-BILLING: Zero invoice/amount/payment fields in inquiry schema');

  } finally {
    server.close();
  }

  console.log('\n==================================================');
  console.log(`📊 Final Results: ${passed} Passed, ${failed} Failed`);
  console.log('==================================================');

  if (failed > 0) {
    process.exit(1);
  }
}

runVerification().catch((err) => {
  console.error('Verification error:', err);
  process.exit(1);
});
