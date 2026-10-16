// Task 1: Biography
var name = "Muhammad Ahmed";
var age = 21;
var isStudent = true;
var university = "FAST NUCES";

console.log("Biography using var:");
console.log("My name is " + name + ", I am " + age + " years old.");
console.log("Student: " + isStudent + ", University: " + university);

const biography = {
  name: "Muhammad Ahmed",
  age: 21,
  isStudent: true,
  address: { city: "Lahore", country: "Pakistan" },
  degreeProgram: { name: "BS Computer Science", semester: 5, university: "FAST NUCES" },
};

console.log("\nBiography from object:");
console.log("Name: " + biography.name);
console.log("Age: " + biography.age);
console.log("Lives in: " + biography.address.city + ", " + biography.address.country);
console.log("Studying: " + biography.degreeProgram.name + " (semester " + biography.degreeProgram.semester + ") at " + biography.degreeProgram.university);
