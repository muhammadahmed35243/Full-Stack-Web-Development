// Tasks 4 & 5: roundMe, abs, ceil, floor working on 0..N arguments
function applyAll(fn, args) {
  if (args.length === 0) return 0;
  if (args.length === 1) return fn(args[0]);
  return args.map((x) => fn(x));
}

const roundMe = (...args) => applyAll(Math.round, args);
const abs = (...args) => applyAll(Math.abs, args);
const ceil = (...args) => applyAll(Math.ceil, args);
const floor = (...args) => applyAll(Math.floor, args);

console.log(roundMe());          // 0
console.log(roundMe(4.7));       // 5
console.log(roundMe(4.7, 4.4));  // [5, 4]
console.log(abs(-3.5, 2, -1));   // [3.5, 2, 1]
console.log(ceil(4.1));          // 5
console.log(ceil(4.1, -4.1));    // [5, -4]
console.log(floor(4.9, -4.1));   // [4, -5]
