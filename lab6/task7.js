// Task 7: Promise-Based Multi-Service Registration Engine

const studentsDB = {
  101: { id: 101, name: 'Ali', email: 'ali@au.edu.pk', phone: '03001234567', completed: ['CS201', 'CS301'] },
  102: { id: 102, name: 'Sara', email: 'sara@au.edu.pk', phone: '', completed: ['CS201'] }
};

const coursesDB = {
  CS401: { code: 'CS401', title: 'Web Engineering', prerequisite: 'CS301', capacity: 30, enrolled: [] },
  CS402: { code: 'CS402', title: 'Machine Learning', prerequisite: 'CS301', capacity: 0, enrolled: [] }
};

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// ---------- Promise-based services ----------
function getStudent(studentId) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const student = studentsDB[studentId];
      if (student) resolve(student);
      else reject(new Error(`Student ${studentId} not found`));
    }, 80);
  });
}

function getCourse(courseCode) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      const course = coursesDB[courseCode];
      if (course) resolve(course);
      else reject(new Error(`Course ${courseCode} not found`));
    }, 80);
  });
}

function checkPrerequisites(student, course) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      // a throw inside setTimeout would escape the promise, so bad input is rejected instead
      if (!student || !course) {
        reject(new TypeError(`checkPrerequisites received invalid data (student: ${student?.name}, course: ${course?.code})`));
        return;
      }
      if (student.completed.includes(course.prerequisite)) resolve({ student, course });
      else reject(new Error(`${student.name} is missing prerequisite ${course.prerequisite}`));
    }, 60);
  });
}

function checkSeats({ student, course }) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (course.enrolled.length < course.capacity) resolve({ student, course });
      else reject(new Error(`No seats available in ${course.code}`));
    }, 60);
  });
}

function registerStudent({ student, course }) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (course.enrolled.includes(student.id)) {
        reject(new Error(`${student.name} is already registered in ${course.code}`));
        return;
      }
      course.enrolled.push(student.id);
      resolve({ studentId: student.id, name: student.name, email: student.email, phone: student.phone, course: course.code, status: 'REGISTERED' });
    }, 60);
  });
}

function sendEmail(registration) {
  return delay(50).then(() => {
    if (!registration.email) throw new Error('No email address');
    return `Email sent to ${registration.email}`;
  });
}

function sendSMS(registration) {
  return delay(70).then(() => {
    if (!registration.phone) throw new Error('No phone number on record');
    return `SMS sent to ${registration.phone}`;
  });
}

function writeAuditLog(registration) {
  return delay(30).then(() => `Audit: ${registration.studentId} -> ${registration.course} at ${new Date().toISOString()}`);
}

// ---------- Part A: Registration chain ----------
function registrationWorkflow(studentId, courseCode) {
  // every .then() RETURNS the next promise, so its result reaches the next stage
  // and a rejection skips straight to .catch()
  return getStudent(studentId)
    .then(student => getCourse(courseCode).then(course => checkPrerequisites(student, course)))
    .then(context => checkSeats(context))
    .then(context => registerStudent(context));
}

// Demonstrates the bug the task warns about: no return in .then()
function brokenWorkflow(studentId, courseCode) {
  return getStudent(studentId)
    .then(student => {
      getCourse(courseCode); // missing return -> next stage receives undefined
    })
    .then(course => {
      console.log('  [broken] next stage received:', course);
      return checkPrerequisites({ name: 'unknown', completed: [] }, course);
    });
}

// ---------- Part B: Post-registration services ----------
function runPostRegistration(registration) {
  const services = [
    { service: 'Email', task: sendEmail(registration) },
    { service: 'SMS', task: sendSMS(registration) },
    { service: 'Audit', task: writeAuditLog(registration) }
  ];

  // allSettled waits for all three and never short-circuits on a failure
  return Promise.allSettled(services.map(s => s.task)).then(outcomes =>
    outcomes.map((outcome, i) => ({
      service: services[i].service,
      status: outcome.status,
      ...(outcome.status === 'fulfilled' ? { value: outcome.value } : { reason: outcome.reason.message })
    }))
  );
}

// ---------- Part C: Service selection ----------
function fetchCourseFromServer(server, courseCode, ms, shouldFail) {
  return new Promise((resolve, reject) => {
    setTimeout(() => {
      if (shouldFail) reject(new Error(`${server} is down`));
      else resolve({ server, course: coursesDB[courseCode] });
    }, ms);
  });
}

function getCourseFromFastestHealthyServer(courseCode, primaryFails, backupFails) {
  // Promise.any resolves with the first FULFILLED promise and ignores earlier rejections.
  // Promise.race would settle with the first promise to finish - even if that is an error.
  return Promise.any([
    fetchCourseFromServer('Primary server', courseCode, 50, primaryFails),
    fetchCourseFromServer('Backup server', courseCode, 120, backupFails)
  ]);
}

// ---------- Demonstration ----------
function demoRegistration(label, studentId, courseCode) {
  console.log(`\n=== Part A: ${label} ===`);
  return registrationWorkflow(studentId, courseCode)
    .then(registration => {
      console.log('Registered:', { studentId: registration.studentId, course: registration.course, status: registration.status });
      console.log('--- Part B: post-registration services ---');
      return runPostRegistration(registration);
    })
    .then(report => {
      if (report) console.log(report);
    })
    .catch(error => console.log('Registration failed:', error.message))
    .finally(() => console.log(`Workflow "${label}" finished`));
}

demoRegistration('Ali -> CS401 (success, SMS ok)', 101, 'CS401')
  .then(() => {
    // Sara has the prerequisite missing, so make a student who passes but has no phone
    studentsDB[103] = { id: 103, name: 'Hina', email: 'hina@au.edu.pk', phone: '', completed: ['CS301'] };
    return demoRegistration('Hina -> CS401 (success, SMS rejected)', 103, 'CS401');
  })
  .then(() => demoRegistration('Sara -> CS401 (missing prerequisite)', 102, 'CS401'))
  .then(() => demoRegistration('Ali -> CS402 (course full)', 101, 'CS402'))
  .then(() => demoRegistration('Unknown student', 999, 'CS401'))
  .then(() => demoRegistration('Ali -> CS401 again (already registered)', 101, 'CS401'))
  .then(() => {
    console.log('\n=== Missing return in .then() ===');
    return brokenWorkflow(101, 'CS401').catch(error => console.log('  [broken] workflow failed:', error.message));
  })
  .then(() => {
    console.log('\n=== Part C: Service selection with Promise.any ===');
    return getCourseFromFastestHealthyServer('CS401', true, false);
  })
  .then(result => console.log('Primary failed, used:', result.server, '->', result.course.title))
  .then(() => getCourseFromFastestHealthyServer('CS401', false, false))
  .then(result => console.log('Both healthy, used:', result.server))
  .then(() => getCourseFromFastestHealthyServer('CS401', true, true))
  .catch(error => {
    // AggregateError when every server rejects
    console.log(`Both failed: ${error.constructor.name} - ${error.errors.map(e => e.message).join(', ')}`);
  })
  .then(() => {
    console.log('\nFor comparison, Promise.race with a failing primary:');
    return Promise.race([
      fetchCourseFromServer('Primary server', 'CS401', 50, true),
      fetchCourseFromServer('Backup server', 'CS401', 120, false)
    ]);
  })
  .then(result => console.log('race result:', result.server))
  .catch(error => console.log('race rejected:', error.message, '(even though the backup would have succeeded)'))
  .finally(() =>
    console.log(`
Combinator choices:
- Part A uses a plain chain because each stage depends on the previous result.
- Part B uses Promise.allSettled: the three services are independent and we need the
  status of every one, even if one fails. Promise.all would reject on the first
  failure and lose the other results.
- Part C uses Promise.any: we want the first SUCCESSFUL server response. Promise.race
  returns the first settled promise, so a fast failure would win and the healthy
  backup would be ignored. Promise.any only rejects (AggregateError) if all fail.`)
  );
