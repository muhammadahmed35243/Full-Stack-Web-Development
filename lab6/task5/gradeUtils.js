// Grade helpers (named exports)

export const GRADE_SCALE = [
  { min: 85, grade: 'A', points: 4.0 },
  { min: 80, grade: 'A-', points: 3.67 },
  { min: 75, grade: 'B+', points: 3.33 },
  { min: 70, grade: 'B', points: 3.0 },
  { min: 65, grade: 'B-', points: 2.67 },
  { min: 60, grade: 'C+', points: 2.33 },
  { min: 50, grade: 'C', points: 2.0 },
  { min: 0, grade: 'F', points: 0.0 }
];

export function isValidMarks(marks) {
  return typeof marks === 'number' && Number.isFinite(marks) && marks >= 0 && marks <= 100;
}

function findBand(marks) {
  if (typeof marks !== 'number' || Number.isNaN(marks)) {
    throw new TypeError(`Marks must be a number, received ${JSON.stringify(marks)}`);
  }
  if (!isValidMarks(marks)) {
    throw new RangeError(`Marks must be between 0 and 100, received ${marks}`);
  }
  return GRADE_SCALE.find(band => marks >= band.min);
}

export function calculateGrade(marks) {
  return findBand(marks).grade;
}

export function calculateGradePoints(marks) {
  return findBand(marks).points;
}

export function calculateAverage(marksList) {
  if (!Array.isArray(marksList) || marksList.length === 0) return 0;
  const total = marksList.reduce((sum, marks) => sum + marks, 0);
  return Math.round((total / marksList.length) * 100) / 100;
}

// GPA = average of grade points (all courses treated as equal credit)
export function calculateGPA(marksList) {
  if (!Array.isArray(marksList) || marksList.length === 0) return 0;
  const totalPoints = marksList.reduce((sum, marks) => sum + calculateGradePoints(marks), 0);
  return Math.round((totalPoints / marksList.length) * 100) / 100;
}
