// Task 2: next prime after a given prime
function isPrime(n) {
  if (n < 2) return false;
  for (let i = 2; i * i <= n; i++) {
    if (n % i === 0) return false;
  }
  return true;
}

function nextPrime(p) {
  let n = p + 1;
  while (!isPrime(n)) n++;
  return n;
}

const given = 11;
console.log("Prime after " + given + " is " + nextPrime(given));
console.log("Prime after 13 is " + nextPrime(13));
