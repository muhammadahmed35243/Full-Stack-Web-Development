// Task 2: Academic Performance Intelligence Engine

const results = [
  { id: 1, name: 'Ali', department: 'CS', course: 'FSWD', marks: 82 },
  { id: 2, name: 'Sara', department: 'CS', course: 'FSWD', marks: 91 },
  { id: 3, name: 'Usman', department: 'SE', course: 'FSWD', marks: 47 },
  { id: 4, name: 'Hina', department: 'AI', course: 'FSWD', marks: 73 },
  { id: 5, name: 'Ahmed', department: 'SE', course: 'FSWD', marks: 64 },
  { id: 6, name: 'Zoya', department: 'AI', course: 'FSWD', marks: 91 }
];

const PASS_MARKS = 50;

const GRADING_POLICY = [
  { min: 85, grade: 'A', points: 4.0 },
  { min: 80, grade: 'A-', points: 3.67 },
  { min: 75, grade: 'B+', points: 3.33 },
  { min: 70, grade: 'B', points: 3.0 },
  { min: 65, grade: 'B-', points: 2.67 },
  { min: 60, grade: 'C+', points: 2.33 },
  { min: 50, grade: 'C', points: 2.0 },
  { min: 0, grade: 'F', points: 0.0 }
];

const isValidMarks = marks => typeof marks === 'number' && !Number.isNaN(marks) && marks >= 0 && marks <= 100;
const round2 = n => Math.round(n * 100) / 100;

// ---------- A. Result Processing ----------
function gradeFor(marks) {
  if (!isValidMarks(marks)) return { grade: 'INVALID', gradePoints: null };
  const band = GRADING_POLICY.find(rule => marks >= rule.min);
  return { grade: band.grade, gradePoints: band.points };
}

function processResults(list) {
  // map() returns new objects, the original records are not touched
  return list.map(student => {
    const { grade, gradePoints } = gradeFor(student.marks);
    const status = grade === 'INVALID' ? 'INVALID' : student.marks >= PASS_MARKS ? 'PASS' : 'FAIL';
    return { ...student, grade, gradePoints, status };
  });
}

// ---------- B. Ranked Merit List ----------
function rankStudents(list) {
  // sort() mutates, so sort a copy made with slice()
  return list
    .slice()
    .sort((a, b) => b.marks - a.marks || a.name.localeCompare(b.name))
    .map((student, index) => ({ rank: index + 1, ...student }));
}

// ---------- C. Department Statistics ----------
function departmentStatistics(list) {
  // reduce() builds groups dynamically, so any new department (e.g. DS) just works
  const groups = list.reduce((acc, { department, marks }) => {
    const current = acc[department] ?? { students: 0, total: 0, highest: -Infinity, passed: 0 };
    acc[department] = {
      students: current.students + 1,
      total: current.total + marks,
      highest: Math.max(current.highest, marks),
      passed: current.passed + (marks >= PASS_MARKS ? 1 : 0)
    };
    return acc;
  }, {});

  return Object.fromEntries(
    Object.entries(groups).map(([dept, { students, total, highest, passed }]) => [
      dept,
      { students, average: round2(total / students), highest, passed }
    ])
  );
}

// ---------- D. Academic Queries ----------
function academicQueries(list) {
  const overallAverage = list.length > 0 ? list.reduce((sum, s) => sum + s.marks, 0) / list.length : 0;

  return {
    firstAbove85: list.find(s => s.marks > 85) ?? null,
    firstFailedIndex: list.findIndex(s => s.marks < PASS_MARKS),
    anyFailed: list.some(s => s.marks < PASS_MARKS),
    allMarksValid: list.every(s => isValidMarks(s.marks)),
    overallAverage: round2(overallAverage),
    aboveAverage: list.filter(s => s.marks > overallAverage).map(s => s.name),
    topThree: rankStudents(list).slice(0, 3).map(s => s.name)
  };
}

// ---------- Demonstration ----------
const snapshot = JSON.stringify(results);

console.log('=== A. Processed Results ===');
processResults(results).forEach(s =>
  console.log(`${s.name.padEnd(6)} ${String(s.marks).padStart(3)}  ${s.grade.padEnd(2)}  ${s.gradePoints.toFixed(2)}  ${s.status}`)
);

console.log('\n=== B. Ranked Merit List ===');
rankStudents(results).forEach(s => console.log(`#${s.rank} ${s.name} (${s.marks})`));

console.log('\n=== C. Department Statistics ===');
console.log(departmentStatistics(results));

console.log('\n=== D. Academic Queries ===');
console.log(academicQueries(results));

console.log('\nOriginal results array unchanged?', JSON.stringify(results) === snapshot);
console.log('Original order still starts with:', results[0].name);

// New department appears later - nothing in the code needs to change
console.log('\n=== New department (DS) added ===');
const extended = [...results, { id: 7, name: 'Bilal', department: 'DS', course: 'FSWD', marks: 88 }];
console.log(departmentStatistics(extended));

// Boundary & invalid cases
console.log('\n=== Boundary and invalid marks ===');
[100, 85, 84, 50, 49, 0, -5, 120, NaN, '90'].forEach(m => console.log(String(m).padStart(4), '->', gradeFor(m)));
const withInvalid = [...results, { id: 8, name: 'Ghost', department: 'CS', course: 'FSWD', marks: 140 }];
console.log('Every mark valid (with 140 added)?', academicQueries(withInvalid).allMarksValid);
console.log('Queries on empty list:', academicQueries([]));
