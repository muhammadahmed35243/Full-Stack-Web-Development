// Task 6: Legacy Course Registration Service Using Callbacks
// No Promises and no async/await - only setTimeout() and error-first callbacks.

const DELAY = 100;

const studentsDB = {
  101: { id: 101, name: 'Ali', completed: ['CS201', 'CS301'] },
  102: { id: 102, name: 'Sara', completed: ['CS201'] },
  103: { id: 103, name: 'Usman', completed: ['CS201', 'CS301'] }
};

const coursesDB = {
  CS401: { code: 'CS401', title: 'Web Engineering', prerequisite: 'CS301', capacity: 3, enrolled: [103] },
  CS402: { code: 'CS402', title: 'Machine Learning', prerequisite: 'CS301', capacity: 1, enrolled: [103] }
};

// ---------- Asynchronous operations ----------
function loadStudent(studentId, callback) {
  setTimeout(() => {
    const student = studentsDB[studentId];
    if (!student) {
      callback(new Error(`Student ${studentId} does not exist`), null);
      return; // return so the callback cannot run a second time
    }
    callback(null, student);
  }, DELAY);
}

function checkPrerequisites(student, courseCode, callback) {
  setTimeout(() => {
    const course = coursesDB[courseCode];
    if (!course) {
      callback(new Error(`Course ${courseCode} does not exist`), null);
      return;
    }
    if (!student.completed.includes(course.prerequisite)) {
      callback(new Error(`${student.name} has not completed prerequisite ${course.prerequisite} for ${courseCode}`), null);
      return;
    }
    callback(null, course);
  }, DELAY);
}

function checkAvailableSeats(course, callback) {
  setTimeout(() => {
    const seatsLeft = course.capacity - course.enrolled.length;
    if (seatsLeft <= 0) {
      callback(new Error(`Course ${course.code} is full`), null);
      return;
    }
    callback(null, seatsLeft);
  }, DELAY);
}

function registerCourse(student, course, callback) {
  setTimeout(() => {
    if (course.enrolled.includes(student.id)) {
      callback(new Error(`${student.name} is already registered in ${course.code}`), null);
      return;
    }
    // registration is the one place where mutating the "database" is intended
    course.enrolled.push(student.id);
    callback(null, { studentId: student.id, course: course.code, status: 'REGISTERED' });
  }, DELAY);
}

// ---------- Dependent workflow ----------
function registerStudentForCourse(studentId, courseCode, callback) {
  loadStudent(studentId, (err, student) => {
    if (err) return callback(err, null);

    checkPrerequisites(student, courseCode, (err, course) => {
      if (err) return callback(err, null);

      checkAvailableSeats(course, (err, seatsLeft) => {
        if (err) return callback(err, null);

        registerCourse(student, course, (err, confirmation) => {
          if (err) return callback(err, null);
          callback(null, { ...confirmation, seatsLeftBefore: seatsLeft });
        });
      });
    });
  });
}

// ---------- Demonstration (scenarios run one after another) ----------
const scenarios = [
  { label: 'Successful registration', studentId: 101, course: 'CS401' },
  { label: 'Student does not exist', studentId: 999, course: 'CS401' },
  { label: 'Prerequisite not completed', studentId: 102, course: 'CS401' },
  { label: 'Course is full', studentId: 101, course: 'CS402' },
  { label: 'Already registered', studentId: 101, course: 'CS401' },
  { label: 'Unknown course', studentId: 101, course: 'CS999' }
];

function runScenario(index) {
  if (index >= scenarios.length) {
    printExplanation();
    return;
  }
  const { label, studentId, course } = scenarios[index];
  registerStudentForCourse(studentId, course, (err, result) => {
    console.log(`\n=== ${label} (student ${studentId}, ${course}) ===`);
    if (err) {
      console.log('FAILED:', err.message);
    } else {
      console.log('SUCCESS:', result);
    }
    runScenario(index + 1);
  });
}

function printExplanation() {
  console.log(`
Why callback workflows become hard to maintain:
- Each dependent step must be started inside the previous step's callback, so every
  new operation adds another level of indentation (the "pyramid of doom" /
  callback hell). Four steps already produce four nested levels; ten steps would
  be unreadable.
- Error handling is repeated manually at every level ("if (err) return callback(err)").
  Forgetting one check, or forgetting the "return", lets the workflow continue after
  a failure or calls the final callback twice.
- try/catch cannot catch errors thrown inside a setTimeout callback, because the
  original call stack has already finished - errors must be passed by hand.
- Adding, removing or reordering steps means restructuring the whole nested block,
  and running steps in parallel or retrying them needs extra manual bookkeeping.
Promises and async/await (Tasks 7 and 8) flatten the chain and give a single
place (.catch / try...catch) for errors.`);
}

console.log('Starting registrations...');
runScenario(0);
console.log('(this line prints first - the operations are asynchronous)');
