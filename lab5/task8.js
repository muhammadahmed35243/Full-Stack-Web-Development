// Task 8: Concurrent Academic API Aggregator with async/await

// ---------- Error types ----------
class HttpError extends Error {
  constructor(url, status, statusText) {
    super(`HTTP ${status} ${statusText} for ${url}`);
    this.name = 'HttpError';
    this.status = status;
  }
}

class NetworkError extends Error {
  constructor(url, cause) {
    super(`Network failure while requesting ${url}: ${cause.message}`, { cause });
    this.name = 'NetworkError';
  }
}

class InvalidJSONError extends Error {
  constructor(url, cause) {
    super(`Invalid JSON received from ${url}: ${cause.message}`, { cause });
    this.name = 'InvalidJSONError';
  }
}

class TimeoutError extends Error {
  constructor(url, ms) {
    super(`Request to ${url} timed out after ${ms} ms`);
    this.name = 'TimeoutError';
  }
}

// ---------- Fake API data ----------
const API_DATA = {
  '/users': [
    { id: 1, name: 'Ali', department: 'CS' },
    { id: 2, name: 'Sara', department: 'CS' },
    { id: 3, name: 'Usman', department: 'SE' },
    { id: 4, name: 'Hina', department: 'AI' },
    { id: 5, name: 'Ahmed', department: 'SE' }
  ],
  '/courses': [
    { code: 'CS301', title: 'Full Stack Web Development' },
    { code: 'CS302', title: 'Database Systems' },
    { code: 'CS303', title: 'Operating Systems' }
  ],
  '/results': [
    { studentId: 1, course: 'CS301', marks: 82 },
    { studentId: 1, course: 'CS302', marks: 76 },
    { studentId: 2, course: 'CS301', marks: 91 },
    { studentId: 2, course: 'CS303', marks: 88 },
    { studentId: 3, course: 'CS301', marks: 42 },
    { studentId: 3, course: 'CS302', marks: 39 },
    { studentId: 4, course: 'CS301', marks: 73 },
    { studentId: 5, course: 'CS302', marks: 64 },
    { studentId: 5, course: 'CS303', marks: 55 }
  ]
};

const STATUS_TEXT = { 200: 'OK', 404: 'Not Found', 500: 'Internal Server Error' };

function makeResponse(status, bodyText) {
  // shaped like a real fetch Response
  return {
    ok: status >= 200 && status < 300,
    status,
    statusText: STATUS_TEXT[status] ?? '',
    json: async () => JSON.parse(bodyText),
    text: async () => bodyText
  };
}

// Simulates: 200, 404, 500, network failure, invalid JSON, slow response.
// Honours an AbortSignal like the real fetch().
function fakeFetch(url, { signal } = {}) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(new DOMException('The operation was aborted.', 'AbortError'));
      return;
    }

    const latency = url === '/slow' ? 2000 : 100 + Math.floor(Math.random() * 100);

    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      if (url in API_DATA) resolve(makeResponse(200, JSON.stringify(API_DATA[url])));
      else if (url === '/slow') resolve(makeResponse(200, JSON.stringify({ message: 'finally here' })));
      else if (url === '/server-error') resolve(makeResponse(500, 'Internal error'));
      else if (url === '/invalid-json') resolve(makeResponse(200, '{ "users": [1, 2, '));
      else if (url === '/network-down') reject(new TypeError('fetch failed'));
      else resolve(makeResponse(404, 'Not found'));
    }, latency);

    function onAbort() {
      clearTimeout(timer);
      reject(new DOMException('The operation was aborted.', 'AbortError'));
    }
    signal?.addEventListener('abort', onAbort, { once: true });
  });
}

// ---------- getJSON ----------
async function getJSON(url, fetchImplementation = fakeFetch, options = {}) {
  let response;
  try {
    response = await fetchImplementation(url, options);
  } catch (error) {
    // aborts are re-thrown as-is so the caller can recognise a timeout
    if (error.name === 'AbortError') throw error;
    throw new NetworkError(url, error);
  }

  if (!response.ok) {
    throw new HttpError(url, response.status, response.statusText);
  }

  try {
    return await response.json();
  } catch (error) {
    throw new InvalidJSONError(url, error);
  }
}

// ---------- fetchWithTimeout ----------
async function fetchWithTimeout(url, milliseconds, fetchImplementation = fakeFetch) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), milliseconds);
  try {
    return await getJSON(url, fetchImplementation, { signal: controller.signal });
  } catch (error) {
    if (error.name === 'AbortError') throw new TimeoutError(url, milliseconds);
    throw error;
  } finally {
    // runs on success AND failure, so no timer is left behind
    clearTimeout(timer);
  }
}

function classifyError(error) {
  if (error instanceof TimeoutError) return 'TIMEOUT / ABORT';
  if (error instanceof HttpError) return `HTTP FAILURE (${error.status})`;
  if (error instanceof NetworkError) return 'NETWORK FAILURE';
  if (error instanceof InvalidJSONError) return 'INVALID JSON';
  return 'UNKNOWN';
}

// ---------- Dashboard ----------
function buildDashboard(users, courses, results) {
  const round2 = n => Math.round(n * 100) / 100;

  const studentStats = users.map(user => {
    const marks = results.filter(r => r.studentId === user.id).map(r => r.marks);
    const average = marks.length > 0 ? marks.reduce((a, b) => a + b, 0) / marks.length : 0;
    return { ...user, courses: marks.length, average: round2(average) };
  });

  const overallAverage = results.length > 0 ? results.reduce((sum, r) => sum + r.marks, 0) / results.length : 0;
  const topStudent = studentStats.reduce((best, s) => (best === null || s.average > best.average ? s : best), null);

  const departments = studentStats.reduce((acc, { department, average }) => {
    const current = acc[department] ?? { students: 0, total: 0, highest: 0, failed: 0 };
    acc[department] = {
      students: current.students + 1,
      total: current.total + average,
      highest: Math.max(current.highest, average),
      failed: current.failed + (average < 50 ? 1 : 0)
    };
    return acc;
  }, {});

  const departmentStats = Object.fromEntries(
    Object.entries(departments).map(([dept, { students, total, highest, failed }]) => [
      dept,
      { students, averageMarks: round2(total / students), highest, failed }
    ])
  );

  return {
    totalStudents: users.length,
    totalCourses: courses.length,
    overallAverageMarks: round2(overallAverage),
    highestPerformingStudent: topStudent ? { name: topStudent.name, average: topStudent.average } : null,
    failedStudents: studentStats.filter(s => s.average < 50).length,
    departmentStats
  };
}

async function loadDashboard(fetchImplementation = fakeFetch, urls = ['/users', '/courses', '/results']) {
  // all three requests are started before anything is awaited
  const [users, courses, results] = await Promise.all(urls.map(url => getJSON(url, fetchImplementation)));
  return buildDashboard(users, courses, results);
}

async function sequentialLoad() {
  // for comparison only - each await waits for the previous request
  const users = await getJSON('/users');
  const courses = await getJSON('/courses');
  const results = await getJSON('/results');
  return buildDashboard(users, courses, results);
}

// ---------- Demonstration ----------
async function main() {
  console.log('=== Concurrent dashboard loading ===');
  let start = Date.now();
  try {
    const dashboard = await loadDashboard();
    console.log(JSON.stringify(dashboard, null, 2));
    console.log(`Concurrent load took ~${Date.now() - start} ms`);
  } catch (error) {
    console.log('Dashboard failed:', classifyError(error), '-', error.message);
  }

  start = Date.now();
  await sequentialLoad();
  console.log(`Sequential load (for comparison) took ~${Date.now() - start} ms`);

  console.log('\n=== Dashboard when one service fails ===');
  try {
    await loadDashboard(fakeFetch, ['/users', '/server-error', '/results']);
  } catch (error) {
    console.log('Dashboard failed:', classifyError(error), '-', error.message);
  }

  console.log('\n=== getJSON scenarios ===');
  const scenarios = ['/users', '/missing', '/server-error', '/network-down', '/invalid-json'];
  for (const url of scenarios) {
    try {
      const data = await getJSON(url);
      console.log(`${url.padEnd(14)} -> 200 OK, ${data.length} records`);
    } catch (error) {
      console.log(`${url.padEnd(14)} -> ${classifyError(error)}: ${error.message}`);
    }
  }

  console.log('\n=== fetchWithTimeout ===');
  const timeoutCases = [
    { url: '/courses', ms: 1000 },
    { url: '/slow', ms: 500 },
    { url: '/slow', ms: 3000 },
    { url: '/missing', ms: 1000 },
    { url: '/network-down', ms: 1000 },
    { url: '/invalid-json', ms: 1000 }
  ];
  for (const { url, ms } of timeoutCases) {
    const t0 = Date.now();
    try {
      const data = await fetchWithTimeout(url, ms);
      console.log(`${url.padEnd(14)} (${ms} ms limit) -> success in ${Date.now() - t0} ms:`, Array.isArray(data) ? `${data.length} records` : data);
    } catch (error) {
      console.log(`${url.padEnd(14)} (${ms} ms limit) -> ${classifyError(error)} after ${Date.now() - t0} ms: ${error.message}`);
    }
  }
}

main().finally(() => console.log('\nAll Task 8 demonstrations finished.'));
