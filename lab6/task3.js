// Task 3: Safe Student Profile Update Service

const student = {
  id: 101,
  name: 'Ali',
  marks: 0,
  scholarship: false,
  address: {
    city: 'Islamabad',
    sector: 'F-10'
  },
  contact: {
    email: 'ali@university.edu'
  }
};

const update = {
  name: 'Ali Khan',
  address: {
    city: 'Rawalpindi'
  },
  contact: {
    phone: '03001234567'
  }
};

// Returns a NEW student object. Top-level and nested objects are copied with spread,
// so the original student is never modified.
function updateProfile(original, changes = {}) {
  // object destructuring + object rest: pull nested parts out, keep the remaining fields in `otherChanges`
  const { address: addressChanges, contact: contactChanges, ...otherChanges } = changes ?? {};

  return {
    ...original,
    ...otherChanges,
    // optional chaining: works even if the original has no address / contact
    address: { ...original?.address, ...addressChanges },
    contact: { ...original?.contact, ...contactChanges }
  };
}

// Nested destructuring, renaming and default values
function describeStudent(profile) {
  const {
    name: fullName,
    marks = 'not recorded', // default only applies for undefined, not for 0
    scholarship = 'unknown',
    address: { city = 'Unknown city', sector = 'N/A' } = {},
    contact: { email, phone: mobile = 'no phone' } = {}
  } = profile;

  return `${fullName} | marks: ${marks} | scholarship: ${scholarship} | ${city}, ${sector} | ${email} | ${mobile}`;
}

// Rest parameters: apply any number of updates one after another
function applyUpdates(original, ...updates) {
  return updates.reduce((current, change) => updateProfile(current, change), original);
}

// Array destructuring
function splitName(profile) {
  const [firstName, lastName = '(none)', ...middle] = profile.name.split(' ');
  return { firstName, lastName, extraParts: middle };
}

// Nullish coalescing vs logical OR
function displayValue(value, fallback) {
  return { withOr: value || fallback, withNullish: value ?? fallback };
}

// Property shorthand
function makeSummary(profile) {
  const { id, name } = profile;
  const city = profile.address?.city ?? 'Unknown';
  const phone = profile.contact?.phone ?? 'Not provided';
  return { id, name, city, phone };
}

// ---------- Demonstration ----------
const before = JSON.stringify(student);
const updated = updateProfile(student, update);

console.log('=== Original student ===');
console.log(student);
console.log('\n=== Updated student ===');
console.log(updated);
console.log('\nOriginal unchanged?', JSON.stringify(student) === before);

console.log('\n=== Destructuring ===');
console.log('Original:', describeStudent(student));
console.log('Updated :', describeStudent(updated));
console.log('Split name:', splitName(updated));
console.log('Summary (shorthand):', makeSummary(updated));

console.log('\n=== Falsy values are kept (0, false, "") ===');
const falsyUpdate = updateProfile(student, { marks: 0, scholarship: false, contact: { email: '' } });
console.log('marks:', falsyUpdate.marks, '| scholarship:', falsyUpdate.scholarship, '| email:', JSON.stringify(falsyUpdate.contact.email));
console.log('marks 0 with ||  :', displayValue(student.marks, 'N/A').withOr, '(wrong, 0 was replaced)');
console.log('marks 0 with ??  :', displayValue(student.marks, 'N/A').withNullish, '(correct)');
console.log('missing value ?? :', displayValue(undefined, 'N/A').withNullish);

console.log('\n=== Multiple updates via rest parameters ===');
console.log(applyUpdates(student, { marks: 78 }, { scholarship: true }, { address: { sector: 'G-11' } }));

console.log('\n=== Edge cases ===');
console.log('Empty update  :', describeStudent(updateProfile(student, {})));
console.log('null update   :', describeStudent(updateProfile(student, null)));
console.log('No address    :', describeStudent(updateProfile({ id: 1, name: 'Sara', contact: { email: 's@u.edu' } }, { marks: 90 })));

// ---------- Reference Challenge ----------
console.log('\n=== Reference Challenge ===');
console.log('student === updated               :', student === updated);
console.log('student.address === updated.address:', student.address === updated.address);
console.log('student.contact === updated.contact:', student.contact === updated.contact);
console.log(`
Explanation:
- updateProfile() returns a new object literal { ...original }, so the top-level
  reference is different from the original object.
- address and contact are rebuilt with their own spread ({ ...original.address, ...changes }),
  so they are new objects too. Without this, a shallow copy would share the SAME
  nested objects and changing updated.address.city would also change the original.
`);

// Shallow copy comparison to show why nested copying matters
const shallow = { ...student };
console.log('Shallow copy shares address?', shallow.address === student.address);
