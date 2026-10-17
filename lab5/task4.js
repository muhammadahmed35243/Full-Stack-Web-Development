// Task 4: University User Hierarchy and Dynamic this

class Person {
  // constructor runs when `new Person(...)` creates the object; `this` is that new object
  constructor(name, email) {
    if (!name || !email) throw new TypeError('Person requires name and email');
    this.name = name;
    this.email = email;
  }

  introduce() {
    return `Hello, I am ${this.name} (${this.email}).`;
  }
}

class Student extends Person {
  constructor(name, email, rollNo, marks) {
    super(name, email); // must call the parent constructor before using `this`
    if (typeof marks !== 'number' || marks < 0 || marks > 100) {
      throw new RangeError(`Invalid marks for ${name}: ${marks}`);
    }
    this.rollNo = rollNo;
    this.marks = marks;
  }

  getResult() {
    return this.marks >= 50 ? 'PASS' : 'FAIL';
  }

  // overrides Person.introduce but reuses it via super
  introduce() {
    return `${super.introduce()} I am a student, roll no ${this.rollNo}, marks ${this.marks} - ${this.getResult()}.`;
  }
}

class FacultyMember extends Person {
  constructor(name, email, employeeId, department) {
    super(name, email);
    this.employeeId = employeeId;
    this.department = department;
  }

  introduce() {
    return `${super.introduce()} I teach in the ${this.department} department (employee ${this.employeeId}).`;
  }
}

// ---------- Runtime polymorphism ----------
const users = [
  new Student('Ali', 'ali@au.edu.pk', 'BSCS-101', 82),
  new FacultyMember('Dr. Sana', 'sana@au.edu.pk', 'EMP-11', 'Computer Science'),
  new Student('Usman', 'usman@au.edu.pk', 'BSSE-204', 41),
  new FacultyMember('Mr. Bilal', 'bilal@au.edu.pk', 'EMP-27', 'Software Engineering'),
  new Person('Visitor', 'visitor@au.edu.pk')
];

console.log('=== users.forEach(user => console.log(user.introduce())) ===');
users.forEach(user => console.log(user.introduce()));

console.log('\n=== instanceof ===');
users.forEach(user => {
  console.log(
    `${user.name.padEnd(10)} Person: ${user instanceof Person}, Student: ${user instanceof Student}, FacultyMember: ${user instanceof FacultyMember}`
  );
});

// ---------- call() ----------
const guest = { name: 'Dr. Ahmed', email: 'ahmed@example.com' };

console.log('\n=== call() ===');
// guest is a plain object without introduce(); call() borrows the Person method and sets this = guest
console.log(Person.prototype.introduce.call(guest));

// ---------- Detached method ----------
const student = users[0];
const fn = student.introduce;

console.log('\n=== Detached method ===');
try {
  // class bodies run in strict mode, so `this` is undefined when fn() is called alone
  console.log(fn());
} catch (error) {
  console.log(`fn() failed: ${error.constructor.name} - ${error.message}`);
}

// ---------- bind() ----------
const boundIntroduce = student.introduce.bind(student);
console.log('\n=== bind() ===');
console.log(boundIntroduce());
// bind is permanent: even calling with another `this` keeps the student
console.log(boundIntroduce.call(guest));

// ---------- Invalid construction ----------
console.log('\n=== Invalid objects ===');
const badInputs = [
  () => new Student('Hina', 'hina@au.edu.pk', 'BSAI-1', 150),
  () => new FacultyMember('', 'x@au.edu.pk', 'EMP-1', 'AI'),
  () => Person('NoNew', 'no@au.edu.pk')
];
badInputs.forEach(create => {
  try {
    create();
  } catch (error) {
    console.log(`${error.constructor.name}: ${error.message}`);
  }
});

console.log(`
Explanation:
- constructor / new: \`new\` creates an empty object, links it to the class prototype,
  runs the constructor with \`this\` pointing to it, and returns it. Classes cannot be
  called without \`new\` (TypeError above).
- extends / super: Student and FacultyMember inherit from Person. super(name, email)
  runs the Person constructor; super.introduce() reuses the parent method.
- Overriding & runtime polymorphism: every subclass defines its own introduce().
  The same call user.introduce() in forEach picks the method from the actual
  object's prototype chain at runtime.
- instanceof checks whether the class prototype appears in the object's chain, so a
  Student is also an instance of Person, but not of FacultyMember.
- this is decided by HOW a function is called: obj.method() -> obj; fn() alone ->
  undefined in strict mode, so reading this.name throws a TypeError.
- call(thisArg) invokes a function immediately with a chosen this (guest).
- bind(thisArg) returns a new function whose this is fixed permanently, so it is
  safe to pass around as a detached method.
`);
