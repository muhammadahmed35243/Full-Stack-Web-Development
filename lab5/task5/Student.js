// Student model (default export)
import { calculateAverage, calculateGPA, calculateGrade } from './gradeUtils.js';

export default class Student {
  constructor(id, name, courses = []) {
    this.id = id;
    this.name = name;
    this.courses = courses.map(({ code, marks }) => ({ code, marks }));
  }

  get marksList() {
    return this.courses.map(course => course.marks);
  }

  getAverage() {
    return calculateAverage(this.marksList);
  }

  getGPA() {
    return calculateGPA(this.marksList);
  }

  toReport() {
    return {
      id: this.id,
      name: this.name,
      courses: this.courses.map(({ code, marks }) => ({ code, marks, grade: calculateGrade(marks) })),
      average: this.getAverage(),
      gpa: this.getGPA()
    };
  }
}
