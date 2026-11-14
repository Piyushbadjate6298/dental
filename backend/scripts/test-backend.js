import app from '../src/app.js';
import http from 'http';

async function runTests() {
  console.log('🧪 Starting Shital Dental Services Backend Test Suite...\n');

  // Start test server on random port
  const server = http.createServer(app);
  await new Promise((resolve) => server.listen(0, resolve));
  const port = server.address().port;
  const baseUrl = `http://127.0.0.1:${port}/api`;

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAILED: ${message}`);
      failed++;
    }
  }

  let authToken = null;
  let cookieHeader = null;

  try {
    // Test 1: Healthcheck
    console.log('1. Health Check');
    const healthRes = await fetch(`${baseUrl}/health`);
    const healthData = await healthRes.json();
    assert(healthRes.status === 200, 'Health endpoint returns HTTP 200');
    assert(healthData.data?.status === 'healthy', 'Health status is "healthy"');
    assert(healthData.data?.database !== undefined, 'Database info is reported');

    // Test 2: Invalid Login
    console.log('\n2. Authentication - Invalid Credentials');
    const invalidLoginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'invalid_user', password: 'wrongpassword' }),
    });
    assert(invalidLoginRes.status === 401, 'Invalid login rejected with HTTP 401');

    // Test 3: Admin Login
    console.log('\n3. Authentication - Valid Login');
    const loginRes = await fetch(`${baseUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'admin', password: process.env.ADMIN_PASSWORD || 'Admin@ShitalDental2026!' }),
    });
    const loginData = await loginRes.json();
    assert(loginRes.status === 200, 'Admin login succeeds with HTTP 200');
    assert(loginData.data?.token !== undefined, 'Returns JWT token');
    assert(loginData.data?.user?.username?.toLowerCase() === 'admin', 'Returns user profile for admin');

    authToken = loginData.data.token;
    const rawCookies = loginRes.headers.get('set-cookie');
    if (rawCookies) {
      cookieHeader = rawCookies.split(';')[0];
    }

    const authHeaders = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${authToken}`,
      ...(cookieHeader ? { 'Cookie': cookieHeader } : {}),
    };

    // Test 4: Current User API (GET /api/auth/me)
    console.log('\n4. Authentication - Current User Profile');
    const meRes = await fetch(`${baseUrl}/auth/me`, { headers: authHeaders });
    const meData = await meRes.json();
    assert(meRes.status === 200, 'GET /auth/me returns HTTP 200');
    assert(meData.data?.user?.username?.toLowerCase() === 'admin', 'Current user identified as admin');

    // Test 5: Unauthorized Route Access Check
    console.log('\n5. Security - Protected Route Unauthorized Access');
    const unauthRes = await fetch(`${baseUrl}/dashboard/stats`);
    assert(unauthRes.status === 401, 'Accessing protected route without token returns HTTP 401');

    // Test 6: Doctor Management - Create Doctor
    console.log('\n6. Doctor Management - CRUD');
    const newDocRes = await fetch(`${baseUrl}/doctors`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ doctor_name: 'Dr. Suresh Joshi' }),
    });
    const newDocData = await newDocRes.json();
    assert(newDocRes.status === 201, 'POST /doctors creates doctor with HTTP 201');
    const createdDoctorId = newDocData.data?.id;
    assert(createdDoctorId !== undefined, 'Returns created doctor id');

    // Duplicate doctor check
    const dupDocRes = await fetch(`${baseUrl}/doctors`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ doctor_name: 'Dr. Suresh Joshi' }),
    });
    assert(dupDocRes.status === 400, 'Duplicate doctor rejected with HTTP 400');

    // List doctors
    const listDocRes = await fetch(`${baseUrl}/doctors`);
    const listDocData = await listDocRes.json();
    assert(listDocRes.status === 200, 'GET /doctors returns doctor list');
    assert(listDocData.data?.some((d) => (d.doctor_name || d) === 'Dr. Suresh Joshi'), 'Created doctor is in the list');

    // Update doctor
    const updateDocRes = await fetch(`${baseUrl}/doctors/${createdDoctorId}`, {
      method: 'PUT',
      headers: authHeaders,
      body: JSON.stringify({ doctor_name: 'Dr. Suresh S. Joshi' }),
    });
    const updateDocData = await updateDocRes.json();
    assert(updateDocRes.status === 200, 'PUT /doctors/:id updates doctor name');
    assert(updateDocData.data?.doctor_name === 'Dr. Suresh S. Joshi', 'Updated doctor name verified');

    // Test 7: Inquiry Management - Create Customer Inquiry
    console.log('\n7. Inquiry Management - CRUD');
    const newInquiryPayload = {
      date: '2026-11-13',
      doctor: 'Dr. Suresh S. Joshi',
      patient: 'Kavita Deshmukh',
      shade: 'A3',
      teeth: ['U-0', 'U-1', 'L-2', 'L-3'],
      instructions: ['Ceramic', 'Zircon'],
      stages: ['Metal Trial'],
      note: 'Rush delivery requested',
      status: 'Sent',
    };

    const newInqRes = await fetch(`${baseUrl}/inquiries`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newInquiryPayload),
    });
    const newInqData = await newInqRes.json();
    assert(newInqRes.status === 201, 'POST /inquiries creates inquiry with HTTP 201');
    const createdInq = newInqData.data;
    assert(createdInq?.number >= 301, 'Inquiry reference number auto-generated correctly');
    assert(createdInq?.patient === 'Kavita Deshmukh', 'Patient name saved correctly');
    assert(createdInq?.doctor === 'Dr. Suresh S. Joshi', 'Doctor snapshot captured');
    assert(createdInq?.total === undefined, 'Confirmed NO total amount field exists');
    assert(createdInq?.amount === undefined, 'Confirmed NO amount field exists');

    // List Inquiries with Auth
    const listInqRes = await fetch(`${baseUrl}/inquiries`, { headers: authHeaders });
    const listInqData = await listInqRes.json();
    assert(listInqRes.status === 200, 'GET /inquiries returns inquiries');
    assert(listInqData.data?.inquiries?.length > 0, 'Inquiry records found');

    // Search Inquiries
    const searchRes = await fetch(`${baseUrl}/inquiries?search=Kavita`, { headers: authHeaders });
    const searchData = await searchRes.json();
    assert(searchData.data?.inquiries?.length === 1, 'Search by patient name matches exact inquiry');

    // Update Inquiry
    const updateInqRes = await fetch(`${baseUrl}/inquiries/${createdInq.id}`, {
      method: 'PUT',
      headers: authHeaders,
      body: JSON.stringify({
        ...newInquiryPayload,
        shade: 'B2',
        patient: 'Kavita R. Deshmukh',
      }),
    });
    const updateInqData = await updateInqRes.json();
    assert(updateInqRes.status === 200, 'PUT /inquiries/:id updates record');
    assert(updateInqData.data?.shade === 'B2', 'Updated tooth shade saved');
    assert(updateInqData.data?.patient === 'Kavita R. Deshmukh', 'Updated patient name saved');

    // Test 8: Settings Management
    console.log('\n8. Admin Settings - GET & PUT');
    const getSettingsRes = await fetch(`${baseUrl}/settings`);
    const getSettingsData = await getSettingsRes.json();
    assert(getSettingsRes.status === 200, 'GET /settings returns settings');
    assert(getSettingsData.data?.whatsapp !== undefined, 'WhatsApp number is present');

    const updateSettingsRes = await fetch(`${baseUrl}/settings`, {
      method: 'PUT',
      headers: authHeaders,
      body: JSON.stringify({
        whatsapp: '919876543210',
        labName: 'Shital Dental Services Test',
        labAddress: 'Lasalgaon Main Road',
        labPhone: '9876543210',
      }),
    });
    const updateSettingsData = await updateSettingsRes.json();
    assert(updateSettingsRes.status === 200, 'PUT /settings updates settings');
    assert(updateSettingsData.data?.whatsapp === '919876543210', 'Updated WhatsApp number saved');

    // Test 9: Dashboard Statistics
    console.log('\n9. Dashboard - Statistics Aggregation');
    const statsRes = await fetch(`${baseUrl}/dashboard/stats`, { headers: authHeaders });
    const statsData = await statsRes.json();
    assert(statsRes.status === 200, 'GET /dashboard/stats returns HTTP 200');
    assert(statsData.data?.totalInquiries >= 1, 'Total inquiries count is accurate');
    assert(statsData.data?.totalBillValue === undefined, 'Confirmed NO billing stat exists');

    // Test 10: Migration API
    console.log('\n10. Data Migration - Import Local Storage');
    const legacyNumber = Math.floor(Date.now() / 1000) % 900000 + 100000;
    const migrateRes = await fetch(`${baseUrl}/migrate/import-local`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({
        doctors: ['Dr. Meena Patil'],
        inquiries: [
          {
            number: legacyNumber,
            date: '2026-11-12',
            doctor: 'Dr. Meena Patil',
            patient: 'Rahul Sharma',
            shade: 'A1',
            teeth: ['U-1', 'L-1'],
            instructions: ['Ceramic'],
            stages: ['Final'],
            status: 'Draft',
          },
        ],
        settings: {
          whatsapp: '919423105611',
          labName: 'Shital Dental Services',
        },
      }),
    });
    const migrateData = await migrateRes.json();
    assert(migrateRes.status === 200, 'POST /migrate/import-local imports legacy records');
    assert(migrateData.data?.importedInquiries >= 1, 'Legacy inquiry imported successfully');

    // Delete created inquiry
    console.log('\n11. Cleanup / Delete Operations');
    const delInqRes = await fetch(`${baseUrl}/inquiries/${createdInq.id}`, {
      method: 'DELETE',
      headers: authHeaders,
    });
    assert(delInqRes.status === 200, 'DELETE /inquiries/:id successfully deleted test inquiry');

    // Delete doctor
    const delDocRes = await fetch(`${baseUrl}/doctors/${createdDoctorId}`, {
      method: 'DELETE',
      headers: authHeaders,
    });
    assert(delDocRes.status === 200, 'DELETE /doctors/:id successfully deleted test doctor');
  } catch (err) {
    console.error('Test suite error:', err);
    failed++;
  } finally {
    server.close();
  }

  console.log('\n=============================================');
  console.log(`📊 Test Results: ${passed} Passed, ${failed} Failed`);
  console.log('=============================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runTests();
