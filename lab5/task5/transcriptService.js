// Transcript processing: parse, validate, build report, serialize
import Student from './Student.js';
import { isValidMarks, calculateAverage as average } from './gradeUtils.js';

export class TranscriptError extends Error {
  constructor(message, options) {
    super(message, options);
    this.name = 'TranscriptError';
  }
}

export function parseTranscriptJSON(rawData) {
  if (typeof rawData !== 'string') {
    throw new TypeError(`Transcript data must be a JSON string, received ${typeof rawData}`);
  }
  try {
    return JSON.parse(rawData);
  } catch (error) {
    // wrap the SyntaxError so the caller sees a meaningful message, keep the original as cause
    throw new TranscriptError(`Malformed JSON: ${error.message}`, { cause: error });
  }
}

function validateCourse(course, studentId, index) {
  if (!course || typeof course !== 'object') {
    throw new TypeError(`Student ${studentId}: course #${index + 1} is not an object`);
  }
  if (typeof course.code !== 'string' || course.code.trim() === '') {
    throw new TranscriptError(`Student ${studentId}: course #${index + 1} is missing a course code`);
  }
  if (typeof course.marks !== 'number' || Number.isNaN(course.marks)) {
    throw new TypeError(`Student ${studentId}: marks for ${course.code} must be a number`);
  }
  if (!isValidMarks(course.marks)) {
    throw new RangeError(`Student ${studentId}: marks ${course.marks} for ${course.code} must be between 0 and 100`);
  }
}

export function validateTranscripts(data) {
  if (!Array.isArray(data)) {
    throw new TypeError('Transcript JSON must be an array of students');
  }

  const seenIds = new Set();
  data.forEach((record, index) => {
    if (!record || typeof record !== 'object') {
      throw new TypeError(`Record #${index + 1} is not an object`);
    }
    const { id, name, courses } = record;
    if (id === undefined || id === null || id === '') {
      throw new TranscriptError(`Record #${index + 1} (${name ?? 'unnamed'}) is missing a student ID`);
    }
    if (seenIds.has(id)) {
      throw new TranscriptError(`Duplicate student ID: ${id}`);
    }
    seenIds.add(id);
    if (!Array.isArray(courses)) {
      throw new TypeError(`Student ${id}: courses must be an array`);
    }
    courses.forEach((course, i) => validateCourse(course, id, i));
  });

  return data;
}

export function buildReport(data) {
  const students = data.map(({ id, name, courses }) => new Student(id, name, courses).toReport());
  return {
    generatedAt: new Date().toISOString(),
    totalStudents: students.length,
    classAverage: average(students.map(s => s.average)),
    students
  };
}

export function processTranscripts(rawData) {
  const parsed = parseTranscriptJSON(rawData);
  validateTranscripts(parsed);
  const report = buildReport(parsed);
  return { report, json: JSON.stringify(report, null, 2) };
}
