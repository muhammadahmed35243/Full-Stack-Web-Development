// Task 1: Admission Decision and Data Sanitization Engine

const SUPPORTED_PROGRAMS = ['BSCS', 'BSSE', 'BSAI', 'BSDS'];
const NUMERIC_FIELDS = ['age', 'matricMarks', 'intermediateMarks', 'entryTest'];

// SELECTED needs a clear lead over the minimum eligibility, otherwise WAITING
const SELECTION_MERIT = 80;
const SELECTION_ENTRY_TEST = 70;

const applicants = [
  { id: 'A101', name: 'Sara Khan', age: '19', matricMarks: '91', intermediateMarks: '87', entryTest: '78', program: 'BSCS', feePaid: 'true' },
  { id: 'A102', name: 'Ahmed Ali', age: 'twenty', matricMarks: '88', intermediateMarks: '', entryTest: '72', program: 'BSSE', feePaid: 'false' },
  { id: 'A103', name: 'Hassan', age: '18', matricMarks: '76', intermediateMarks: '83', entryTest: '91', program: 'BSAI', feePaid: 'true' },
  // extra test cases: boundary, rejected, unsupported program, out of range, missing name
  { id: 'A104', name: 'Bilal', age: '17', matricMarks: '70', intermediateMarks: '60', entryTest: '76', program: 'BSCS', feePaid: 'true' },
  { id: 'A105', name: 'Hina', age: '30', matricMarks: '60', intermediateMarks: '55', entryTest: '65', program: 'BSSE', feePaid: 'true' },
  { id: 'A106', name: 'Usman', age: '20', matricMarks: '85', intermediateMarks: '80', entryTest: '90', program: 'BBA', feePaid: 'true' },
  { id: 'A107', name: 'Zoya', age: '16', matricMarks: '101', intermediateMarks: '90', entryTest: '88', program: 'BSAI', feePaid: 'true' },
  { id: 'A108', name: '', age: '21', matricMarks: '80', intermediateMarks: '80', entryTest: '80', program: 'BSDS', feePaid: 'yes' },
  { id: 'A109', name: 'Ayesha', age: '22', matricMarks: '95', intermediateMarks: '92', entryTest: '68', program: 'bscs', feePaid: 'false' }
];

// Explicit conversion: Number() instead of relying on implicit coercion.
// Empty / whitespace strings would become 0 with Number(), so they are treated as missing first.
function toNumber(value) {
  if (value === undefined || value === null) return { ok: false, reason: 'missing' };
  const text = String(value).trim();
  if (text === '') return { ok: false, reason: 'missing' };
  const num = Number(text);
  if (Number.isNaN(num)) return { ok: false, reason: 'not a number' };
  return { ok: true, value: num };
}

function toBoolean(value) {
  const text = String(value).trim().toLowerCase();
  if (text === 'true') return true;
  if (text === 'false') return false;
  return null; // unknown value, cannot be trusted
}

function isInRange(value, min, max) {
  return value >= min && value <= max;
}

function sanitizeApplicant(raw) {
  const errors = [];
  const clean = {};

  // guard clause: the record itself must be an object
  if (!raw || typeof raw !== 'object') {
    return { clean: null, errors: ['record is not an object'] };
  }

  clean.id = raw.id ? String(raw.id).trim() : '';
  clean.name = raw.name ? String(raw.name).trim() : '';
  if (!clean.id) errors.push('id is missing');
  if (!clean.name) errors.push('name is missing');

  for (const field of NUMERIC_FIELDS) {
    const result = toNumber(raw[field]);
    if (!result.ok) {
      errors.push(`${field} is ${result.reason} ("${raw[field] ?? ''}")`);
      clean[field] = null;
    } else {
      clean[field] = result.value;
    }
  }

  if (clean.age !== null && !isInRange(clean.age, 17, 30)) {
    errors.push(`age ${clean.age} is outside 17-30`);
  }
  for (const field of ['matricMarks', 'intermediateMarks', 'entryTest']) {
    if (clean[field] !== null && !isInRange(clean[field], 0, 100)) {
      errors.push(`${field} ${clean[field]} is outside 0-100`);
    }
  }

  clean.program = raw.program ? String(raw.program).trim().toUpperCase() : '';
  if (!SUPPORTED_PROGRAMS.includes(clean.program)) {
    errors.push(`program "${raw.program ?? ''}" is not supported`);
  }

  clean.feePaid = toBoolean(raw.feePaid);
  if (clean.feePaid === null) errors.push(`feePaid "${raw.feePaid}" is not true/false`);

  return { clean, errors };
}

function calculateMerit(matric, intermediate, entryTest) {
  const merit = matric * 0.2 + intermediate * 0.3 + entryTest * 0.5;
  return Math.round(merit * 100) / 100;
}

function decideStatus(merit, entryTest, intermediate, feePaid) {
  const eligible = merit >= 70 && entryTest >= 60 && intermediate >= 60;
  if (!eligible) return 'REJECTED';

  // eligible: SELECTED only with a strong merit, strong entry test and paid fee
  const strong = merit >= SELECTION_MERIT && entryTest >= SELECTION_ENTRY_TEST;
  return strong && feePaid ? 'SELECTED' : 'WAITING';
}

function describeStatus(status) {
  switch (status) {
    case 'SELECTED':
      return 'Admission offered';
    case 'WAITING':
      return 'Eligible, placed on waiting list';
    case 'REJECTED':
      return 'Does not meet eligibility criteria';
    case 'INVALID DATA':
      return 'Application data could not be validated';
    default:
      return 'Unknown status';
  }
}

function processApplicant(raw) {
  const { clean, errors } = sanitizeApplicant(raw);

  // validity is decided before merit is calculated
  if (errors.length > 0) {
    return {
      id: clean?.id || 'UNKNOWN',
      name: clean?.name || 'UNKNOWN',
      program: clean?.program || 'UNKNOWN',
      merit: null,
      status: 'INVALID DATA',
      remarks: describeStatus('INVALID DATA'),
      errors
    };
  }

  const merit = calculateMerit(clean.matricMarks, clean.intermediateMarks, clean.entryTest);
  const status = decideStatus(merit, clean.entryTest, clean.intermediateMarks, clean.feePaid);

  return {
    id: clean.id,
    name: clean.name,
    program: clean.program,
    merit,
    status,
    remarks: describeStatus(status) + (status === 'WAITING' && !clean.feePaid ? ' (fee not paid)' : ''),
    errors: []
  };
}

function processAllApplicants(list) {
  if (!Array.isArray(list)) return [];
  const decisions = [];
  for (let i = 0; i < list.length; i++) {
    decisions.push(processApplicant(list[i]));
  }
  return decisions;
}

function buildSummary(decisions) {
  let validCount = 0;
  let invalidCount = 0;
  let totalMerit = 0;
  let highest = null;
  let lowestMerit = null;
  const programCounts = {};

  for (const decision of decisions) {
    // count every applicant per program, including invalid ones
    programCounts[decision.program] = (programCounts[decision.program] ?? 0) + 1;

    if (decision.status === 'INVALID DATA') {
      invalidCount++;
      continue;
    }

    validCount++;
    totalMerit += decision.merit;
    if (highest === null || decision.merit > highest.merit) highest = decision;
    if (lowestMerit === null || decision.merit < lowestMerit) lowestMerit = decision.merit;
  }

  return {
    validApplicants: validCount,
    invalidApplicants: invalidCount,
    highestMeritApplicant: highest ? { id: highest.id, name: highest.name, merit: highest.merit } : null,
    lowestMerit,
    averageMerit: validCount > 0 ? Math.round((totalMerit / validCount) * 100) / 100 : 0,
    applicantsPerProgram: programCounts
  };
}

// ---------- Demonstration ----------
const decisions = processAllApplicants(applicants);

console.log('=== Admission Decisions ===');
decisions.forEach(d => {
  const meritText = d.merit === null ? 'N/A' : d.merit.toFixed(2);
  console.log(`${d.id} | ${d.name.padEnd(10)} | ${d.program.padEnd(7)} | merit ${meritText.padStart(6)} | ${d.status} - ${d.remarks}`);
  if (d.errors.length > 0) console.log('       errors: ' + d.errors.join('; '));
});

console.log('\n=== Summary ===');
console.log(buildSummary(decisions));

console.log('\n=== Invalid input to the engine ===');
console.log('processAllApplicants(null):', processAllApplicants(null));
console.log('processApplicant(undefined):', processApplicant(undefined));
console.log('Empty list summary:', buildSummary(processAllApplicants([])));

// Truthy/falsy note: '' and '0' behave differently - '' is falsy, '0' is truthy,
// which is why toNumber() checks for empty strings explicitly instead of using `if (!value)`.
console.log('\nTruthy check -> Boolean(""):', Boolean(''), '| Boolean("0"):', Boolean('0'), '| Number(""):', Number(''));
