// Task 2: Use Promise.all to catch the promises returned by two asynchronous operations,
// then reject or accept the main promise (promise of Promise.all) based on whether
// the details fetched by both operations are valid or not.

const API_URL = 'https://jsonplaceholder.typicode.com';

async function getJson(url) {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`Request to ${url} failed with status ${response.status}`);
  }
  return response.json();
}

// Async operation 1: user details
function fetchUser(userId) {
  return getJson(`${API_URL}/users/${userId}`);
}

// Async operation 2: posts written by that user
function fetchPosts(userId) {
  return getJson(`${API_URL}/posts?userId=${userId}`);
}

function isValidUser(user) {
  return Boolean(user && Number.isInteger(user.id) && user.name && user.email?.includes('@'));
}

function isValidPosts(posts, userId) {
  return Array.isArray(posts) && posts.length > 0 && posts.every((p) => p.userId === userId && p.title);
}

// Main promise: wraps Promise.all and decides to resolve or reject after validating both results
function getUserProfile(userId) {
  return new Promise((resolve, reject) => {
    Promise.all([fetchUser(userId), fetchPosts(userId)])
      .then(([user, posts]) => {
        const errors = [];
        if (!isValidUser(user)) errors.push('user details are invalid');
        if (!isValidPosts(posts, userId)) errors.push('posts are invalid or empty');

        if (errors.length > 0) {
          reject(new Error(`Profile ${userId} rejected: ${errors.join(', ')}`));
        } else {
          resolve({ id: user.id, name: user.name, email: user.email, postCount: posts.length, firstPost: posts[0].title });
        }
      })
      // if either operation fails, Promise.all rejects immediately and so does the main promise
      .catch((err) => reject(new Error(`Profile ${userId} rejected: ${err.message}`)));
  });
}

async function main() {
  // 2 is valid, 9999 fails (404 user / no posts)
  for (const id of [2, 9999]) {
    try {
      const profile = await getUserProfile(id);
      console.log('[ACCEPTED]', profile);
    } catch (err) {
      console.log(`[REJECTED] ${err.message}`);
    }
  }
}

main();
