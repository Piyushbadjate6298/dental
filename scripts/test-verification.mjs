/**
 * Automated Verification Script for Anatomical Odontogram & Prescription Report
 */

import { teeth, RIGHT_INDICES, LEFT_INDICES, TOOTH_NAMES, TOOTH_PATHS, getToothInfo, getSelectedTeethSummary } from '../frontend/src/utils/toothData.js';
import { getJawTeeth, makeMessage, cleanPhone } from '../frontend/src/utils/dental.js';

let passed = 0;
let failed = 0;

function assert(condition, message) {
  if (condition) {
    console.log(`✓ PASS: ${message}`);
    passed++;
  } else {
    console.error(`✗ FAIL: ${message}`);
    failed++;
  }
}

console.log('=== 1. TOOTH NUMBERING & ORIENTATION VERIFICATION ===');
assert(teeth.length === 16, 'Array has 16 teeth per arch');
assert(
  JSON.stringify(teeth) === JSON.stringify([8, 7, 6, 5, 4, 3, 2, 1, 1, 2, 3, 4, 5, 6, 7, 8]),
  'Teeth array preserves exact Palmer notation: 8 7 6 5 4 3 2 1 | 1 2 3 4 5 6 7 8'
);

assert(RIGHT_INDICES.length === 8, 'Right quadrant has 8 teeth');
assert(LEFT_INDICES.length === 8, 'Left quadrant has 8 teeth');

// Verify Viewer's Left = Patient's Right (8 to 1)
const rightTeeth = RIGHT_INDICES.map(i => teeth[i]);
assert(
  JSON.stringify(rightTeeth) === JSON.stringify([8, 7, 6, 5, 4, 3, 2, 1]),
  "Patient's Right (Viewer's Left) correctly maps 8 down to 1 towards midline"
);

// Verify Viewer's Right = Patient's Left (1 to 8)
const leftTeeth = LEFT_INDICES.map(i => teeth[i]);
assert(
  JSON.stringify(leftTeeth) === JSON.stringify([1, 2, 3, 4, 5, 6, 7, 8]),
  "Patient's Left (Viewer's Right) correctly maps 1 up to 8 away from midline"
);

console.log('\n=== 2. ANATOMICAL TOOTH TYPES & VECTOR PATHS ===');
for (let num = 1; num <= 8; num++) {
  const typeName = TOOTH_NAMES[num];
  const paths = TOOTH_PATHS[num];
  assert(!!typeName, `Tooth #${num} has anatomical name: ${typeName}`);
  assert(!!paths && !!paths.crown, `Tooth #${num} has custom vector crown path`);
  assert(!!paths && !!paths.incisal, `Tooth #${num} has custom incisal/occlusal groove path`);
  assert(!!paths && !!paths.grooves, `Tooth #${num} has custom developmental groove paths`);
}

// Check that tooth types have distinctly different vector paths
assert(TOOTH_PATHS[1].crown !== TOOTH_PATHS[3].crown, 'Central Incisor and Canine have different crown paths');
assert(TOOTH_PATHS[3].crown !== TOOTH_PATHS[6].crown, 'Canine and First Molar have different crown paths');
assert(TOOTH_PATHS[4].crown !== TOOTH_PATHS[6].crown, 'Premolar and Molar have different crown paths');

console.log('\n=== 3. TOOTH METADATA RESOLUTION ===');
const upperRight1 = getToothInfo('U', 7);
assert(upperRight1.toothNumber === 1 && upperRight1.side === 'R' && upperRight1.jaw === 'U',
  'Tooth U-7 resolves to Upper Patient\'s Right Central Incisor (#1)');

const upperLeft1 = getToothInfo('U', 8);
assert(upperLeft1.toothNumber === 1 && upperLeft1.side === 'L' && upperLeft1.jaw === 'U',
  'Tooth U-8 resolves to Upper Patient\'s Left Central Incisor (#1)');

const lowerRight3 = getToothInfo('L', 5);
assert(lowerRight3.toothNumber === 3 && lowerRight3.side === 'R' && lowerRight3.jaw === 'L',
  'Tooth L-5 resolves to Lower Patient\'s Right Canine (#3)');

const lowerLeft6 = getToothInfo('L', 13);
assert(lowerLeft6.toothNumber === 6 && lowerLeft6.side === 'L' && lowerLeft6.jaw === 'L',
  'Tooth L-13 resolves to Lower Patient\'s Left First Molar (#6)');

console.log('\n=== 4. SELECTED TEETH SUMMARY GROUPING ===');
const sampleKeys = [
  'U-0', // Upper Right 8
  'U-1', // Upper Right 7
  'U-2', // Upper Right 6
  'U-9', // Upper Left 2
  'U-10', // Upper Left 3
  'L-4', // Lower Right 4
  'L-3', // Lower Right 5
  'L-8', // Lower Left 1
  'L-13', // Lower Left 6
];

const summary = getSelectedTeethSummary(sampleKeys);
assert(summary.totalCount === 9, 'Total count is 9');
assert(summary.upper.count === 5, 'Upper jaw count is 5');
assert(summary.lower.count === 4, 'Lower jaw count is 4');

// Upper: Right 6, 7, 8 | Left 2, 3
assert(
  JSON.stringify(summary.upper.right) === JSON.stringify([6, 7, 8]),
  "Upper Jaw Patient's Right correctly contains [6, 7, 8]"
);
assert(
  JSON.stringify(summary.upper.left) === JSON.stringify([2, 3]),
  "Upper Jaw Patient's Left correctly contains [2, 3]"
);

// Lower: Right 4, 5 | Left 1, 6
assert(
  JSON.stringify(summary.lower.right) === JSON.stringify([4, 5]),
  "Lower Jaw Patient's Right correctly contains [4, 5]"
);
assert(
  JSON.stringify(summary.lower.left) === JSON.stringify([1, 6]),
  "Lower Jaw Patient's Left correctly contains [1, 6]"
);

// Empty state test
const emptySummary = getSelectedTeethSummary([]);
assert(emptySummary.totalCount === 0, 'Empty selection has total count 0');
assert(emptySummary.upper.right.length === 0, 'Empty selection upper right is empty');

console.log('\n=== 5. BACKWARD COMPATIBILITY & WHATSAPP MESSAGE ===');
const backwardJaws = getJawTeeth(sampleKeys);
assert(backwardJaws.totalCount === 9, 'Backward compatible getJawTeeth returns totalCount 9');
assert(typeof backwardJaws.upper === 'string', 'getJawTeeth returns string upper summary');

const msg = makeMessage(
  {
    number: 301,
    date: '2026-11-14',
    doctor: 'Dr. Deshmukh',
    patient: 'Ramesh Patil',
    shade: 'A2',
    teeth: sampleKeys,
    instructions: ['Ceramic', 'Zircon'],
    stages: ['Metal Trial'],
    note: 'Ensure accurate margin fit on #6',
  },
  {
    labName: 'Sheetal Dental Art',
    labPhone: '9370045066',
    whatsapp: '919370045066',
  }
);

assert(msg.includes('SHEETAL DENTAL ART'), 'Message contains lab title');
assert(msg.includes('*Inquiry Ref:* Inquiry #301') || msg.includes('*Inquiry Ref:* #301'), 'Message contains inquiry ref');
assert(msg.includes("Patient's Right: 6, 7, 8"), 'Message contains upper right teeth');
assert(msg.includes("Patient's Left: 2, 3"), 'Message contains upper left teeth');
assert(msg.includes("Patient's Right: 4, 5"), 'Message contains lower right teeth');
assert(msg.includes("Patient's Left: 1, 6"), 'Message contains lower left teeth');
assert(msg.includes('Ceramic, Zircon'), 'Message contains instructions');
assert(msg.includes('Metal Trial'), 'Message contains stages');
assert(msg.includes('Ensure accurate margin fit on #6'), 'Message contains notes');

console.log(`\n========================================`);
console.log(`TOTAL TESTS: ${passed + failed}`);
console.log(`PASSED: ${passed}`);
console.log(`FAILED: ${failed}`);
console.log(`========================================`);

if (failed > 0) {
  process.exit(1);
}
