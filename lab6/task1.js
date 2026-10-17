// Task 1: Async function that returns a valid user object on successful fetching
// from a dummy API and returns an error on unsuccessful fetching.

const API_URL = 'https://jsonplaceholder.typicode.com/users';

// A user is valid only if it has the fields we rely on, with the right types
function isValidUser(user) {
  return (
    user !== null &&
    typeof user === 'object' &&
    Number.isInteger(user.id) &&
    typeof user.name === 'string' && user.name.trim() !== '' &&
    typeof user.email === 'string' && user.email.includes('@')
  );
}

async function fetchUser(id) {
  try {
    const response = await fetch(`${API_URL}/${id}`);

    // fetch only rejects on network failure, so HTTP errors (404, 500) are checked here
    if (!response.ok) {
      throw new Error(`Request failed with status ${response.status}`);
    }

    const user = await response.json();
    if (!isValidUser(user)) {
      throw new Error('Invalid user data received');
    }

    return { id: user.id, name: user.name, email: user.email, city: user.address?.city };
  } catch (err) {
    return new Error(`Could not fetch user ${id}: ${err.message}`);
  }
}

async function main() {
  // 1 exists, 9999 does not exist (404), 'abc' is not a valid id
  for (const id of [1, 9999, 'abc']) {
    const result = await fetchUser(id);
    if (result instanceof Error) {
      console.log(`[ERROR] ${result.message}`);
    } else {
      console.log('[OK] User fetched:', result);
    }
  }
}

main();
