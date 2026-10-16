// Task 3: phone number from array of 10 digits
function createPhoneNumber(nums) {
  if (nums.length !== 10) throw new Error("Array must contain exactly 10 integers");
  const s = nums.join("");
  return "(" + s.slice(0, 3) + ") " + s.slice(3, 6) + "-" + s.slice(6);
}

console.log(createPhoneNumber([1, 2, 3, 4, 5, 6, 7, 8, 9, 0])); // (123) 456-7890
