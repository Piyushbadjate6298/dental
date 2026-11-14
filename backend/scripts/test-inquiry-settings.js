// backend/scripts/test-inquiry-settings.js
// Comprehensive automated test for Sequential Inquiry Numbering and Inquiry Form Settings
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import { query } from '../src/database/connection.js';
import * as inquiryService from '../src/services/inquiryService.js';
import * as settingsService from '../src/services/settingsService.js';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`  ✓ PASS: ${message}`);
    passed++;
  } else {
    console.error(`  ✗ FAIL: ${message}`);
    failed++;
  }
}

async function runTests() {
  console.log('====================================================');
  console.log('SHEETAL DENTAL ART — INQUIRY NUMBERING & SETTINGS TEST');
  console.log('====================================================\n');

  try {
    // 1. Verify Database Connection
    console.log('1. DATABASE INTEGRITY & SEQUENCE CHECK:');
    const seqRes = await query(`SELECT last_value FROM inquiry_number_seq;`);
    const currentSeqVal = parseInt(seqRes.rows[0].last_value, 10);
    assert(!isNaN(currentSeqVal), `inquiry_number_seq exists with value ${currentSeqVal}`);

    // Check existing inquiries
    const res = await inquiryService.getInquiries();
    const existingInquiries = res.inquiries;
    assert(Array.isArray(existingInquiries), `getInquiries returned array of count ${existingInquiries.length}`);
    
    // Check if existing inquiries are numbered 1..N
    const existingNums = existingInquiries.map(i => i.number).filter(n => typeof n === 'number').sort((a,b) => a - b);
    console.log(`  Existing assigned inquiry numbers: ${JSON.stringify(existingNums)}`);
    assert(existingNums.length === 0 || existingNums.includes(1), 'Historic inquiries have assigned 1, 2, 3.. numbers (or clean database)');

    // 2. Sequential Numbering Test (Creation)
    console.log('\n2. SEQUENTIAL ATOMIC NUMBER GENERATION:');
    const created1 = await inquiryService.createInquiry({
      doctor: 'Dr. Test Sequential 1',
      patient: 'Patient Alpha',
      teeth: ['U-7', 'U-8'],
      shade: 'A1',
      instructions: ['Ceramic', 'Valplast'],
      stages: ['Bite Registration'],
      note: 'Automated test inquiry 1',
      date: new Date().toISOString().slice(0, 10),
      customFields: { 'Crown Type': 'Full Zirconia', 'Urgent Delivery': true }
    });

    assert(created1 && created1.id, 'Created first test inquiry');
    const expectedNum1 = currentSeqVal + 1;
    assert(created1.number === expectedNum1, `First test inquiry got sequential number #${created1.number} (expected ${expectedNum1})`);
    assert(created1.customFields['Crown Type'] === 'Full Zirconia', 'Custom fields saved correctly');

    const created2 = await inquiryService.createInquiry({
      doctor: 'Dr. Test Sequential 2',
      patient: 'Patient Beta',
      teeth: ['L-5'],
      shade: 'B2',
      instructions: ['Zircon'],
      stages: ['Metal Trial'],
      note: 'Automated test inquiry 2',
      date: new Date().toISOString().slice(0, 10),
      customFields: { 'Crown Type': 'Emax' }
    });

    assert(created2 && created2.id, 'Created second test inquiry');
    assert(created2.number === expectedNum1 + 1, `Second test inquiry got consecutive sequential number #${created2.number} (expected ${expectedNum1 + 1})`);

    // 3. Immutability on Edit
    console.log('\n3. INQUIRY NUMBER IMMUTABILITY ON UPDATE:');
    const updated1 = await inquiryService.updateInquiry(created1.id, {
      doctor: 'Dr. Test Sequential 1 EDITED',
      patient: 'Patient Alpha EDITED',
      shade: 'A2',
      number: 999999 // Intentionally try to alter number
    });

    assert(updated1.number === created1.number, `Number did NOT change after edit (retained #${updated1.number})`);
    assert(updated1.doctor === 'Dr. Test Sequential 1 EDITED', 'Doctor name updated properly');

    // 4. Deleting Inquiry preserves Sequence
    console.log('\n4. DELETION DOES NOT BREAK SEQUENCE OR REUSE NUMBER:');
    const deleted = await inquiryService.deleteInquiry(created1.id);
    assert(deleted && deleted.deleted === true, 'Test inquiry 1 deleted successfully');

    const created3 = await inquiryService.createInquiry({
      doctor: 'Dr. Test Sequential 3',
      patient: 'Patient Gamma',
      teeth: ['U-6'],
      shade: 'A3',
      instructions: ['Half Ceramic'],
      stages: ['Finished'],
      note: 'Automated test inquiry 3',
      date: new Date().toISOString().slice(0, 10),
    });

    assert(created3.number === expectedNum1 + 2, `New inquiry after delete gets next sequential #${created3.number} (not reused #${created1.number})`);

    // Clean up created2 and created3
    await inquiryService.deleteInquiry(created2.id);
    await inquiryService.deleteInquiry(created3.id);
    await query("SELECT setval('inquiry_number_seq', GREATEST((SELECT COALESCE(MAX(inquiry_number), 1) FROM inquiries), 1), true);");
    console.log('  Cleaned up temporary test inquiries and reset sequence to actual MAX.');

    // 5. Inquiry Form Settings Service Test
    console.log('\n5. INQUIRY FORM SETTINGS CRUD:');
    const settings = await settingsService.getInquiryFormSettings();
    assert(settings && Array.isArray(settings.labInstructions), 'getInquiryFormSettings returns labInstructions array');
    assert(Array.isArray(settings.trialOptions), 'returns trialOptions array');
    assert(Array.isArray(settings.toothShades), 'returns toothShades array');
    assert(Array.isArray(settings.customFields), 'returns customFields array');

    // Test saving new settings
    const modifiedSettings = {
      labInstructions: [
        ...settings.labInstructions,
        { id: 'inst_test_1', label: 'Titanium Framework', enabled: true, isCustom: false }
      ],
      trialOptions: settings.trialOptions,
      toothShades: settings.toothShades,
      customFields: [
        ...settings.customFields,
        {
          id: 'field_test_1',
          name: 'Implant Brand',
          type: 'select',
          options: ['Straumann', 'Nobel Biocare', 'Osstem'],
          required: false,
          enabled: true
        }
      ]
    };

    const updatedSettings = await settingsService.updateInquiryFormSettings(modifiedSettings);
    assert(updatedSettings.labInstructions.some(i => i.label === 'Titanium Framework'), 'New lab instruction persisted in Neon');
    assert(updatedSettings.customFields.some(f => f.name === 'Implant Brand'), 'New custom field persisted in Neon');

    // Restore original settings
    await settingsService.updateInquiryFormSettings(settings);
    const restoredSettings = await settingsService.getInquiryFormSettings();
    assert(!restoredSettings.labInstructions.some(i => i.label === 'Titanium Framework'), 'Restored original form settings in Neon');

    console.log('\n====================================================');
    console.log(`TOTAL TESTS: ${passed + failed}`);
    console.log(`PASSED: ${passed}`);
    console.log(`FAILED: ${failed}`);
    console.log('====================================================');

    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error('Fatal error during test:', err);
    process.exit(1);
  }
}

runTests();
