// Task 5: Modular Transcript Processing and Fault-Tolerant JSON
// Run with: node task5/main.js

import Student from './Student.js'; // default import
import { calculateGrade, calculateGPA as gpaOf } from './gradeUtils.js'; // named imports, one aliased
import { processTranscripts, TranscriptError } from './transcriptService.js';

const rawData = `
[
  {
    "id": 101,
    "name": "Ali",
    "courses": [
      { "code": "CS301", "marks": 81 },
      { "code": "CS302", "marks": 74 }
    ]
  },
  {
    "id": 102,
    "name": "Sara",
    "courses": [
      { "code": "CS301", "marks": 92 },
      { "code": "CS302", "marks": 88 },
      { "code": "CS303", "marks": 47 }
    ]
  }
]
`;

const testCases = [
  { label: 'Valid transcript', data: rawData },
  { label: 'Malformed JSON', data: '[{ "id": 101, "name": "Ali", ' },
  { label: 'Missing student ID', data: '[{ "name": "Ali", "courses": [] }]' },
  { label: 'Duplicate IDs', data: '[{ "id": 1, "name": "A", "courses": [] }, { "id": 1, "name": "B", "courses": [] }]' },
  { label: 'Marks above 100', data: '[{ "id": 1, "name": "A", "courses": [{ "code": "CS1", "marks": 105 }] }]' },
  { label: 'Marks below 0', data: '[{ "id": 1, "name": "A", "courses": [{ "code": "CS1", "marks": -3 }] }]' },
  { label: 'Missing course code', data: '[{ "id": 1, "name": "A", "courses": [{ "marks": 70 }] }]' },
  { label: 'Marks as string', data: '[{ "id": 1, "name": "A", "courses": [{ "code": "CS1", "marks": "70" }] }]' },
  { label: 'Not an array', data: '{ "id": 1 }' },
  { label: 'Not a string', data: 42 },
  { label: 'Boundary marks 0 and 100', data: '[{ "id": 7, "name": "Edge", "courses": [{ "code": "X1", "marks": 0 }, { "code": "X2", "marks": 100 }] }]' }
];

function errorKind(error) {
  if (error instanceof TranscriptError) return 'TranscriptError';
  if (error instanceof RangeError) return 'RangeError';
  if (error instanceof TypeError) return 'TypeError';
  return 'Error';
}

for (const { label, data } of testCases) {
  console.log(`\n=== ${label} ===`);
  try {
    const { report, json } = processTranscripts(data);
    console.log('Report object:', report.students.map(({ id, name, average, gpa }) => ({ id, name, average, gpa })));
    console.log('Class average:', report.classAverage);
    if (label === 'Valid transcript') console.log('Report as JSON:\n' + json);
  } catch (error) {
    console.log(`Rejected (${errorKind(error)}): ${error.message}`);
  } finally {
    console.log(`Finished processing "${label}"`);
  }
}

console.log('\n=== Using the modules directly ===');
const s = new Student(201, 'Hina', [{ code: 'AI101', marks: 79 }, { code: 'AI102', marks: 85 }]);
console.log(`${s.name}: average ${s.getAverage()}, GPA ${s.getGPA()}`);
console.log('calculateGrade(79):', calculateGrade(79));
console.log('gpaOf([90, 60]) (aliased calculateGPA):', gpaOf([90, 60]));
