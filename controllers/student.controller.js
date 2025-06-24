import Student from "../models/student.model.js";
import { errorHandler } from "../utils/error.js";
import User from "../models/user.model.js";

// Generate Student ID
const generateStudentId = async () => {
  const lastStudent = await Student.findOne().sort({ createdAt: -1 });
  let nextId = 1;
  if (lastStudent && lastStudent.studentId) {
    const numPart = lastStudent.studentId.split("-")[1];
    nextId = parseInt(numPart, 10) + 1;
  }
  return `MSID-${String(nextId).padStart(5, "0")}`;
};

// Add New Student
export const addStudent = async (req, res, next) => {
  const {
    tutorid,
    studentphonenumber,
    studentfirstname,
    studentlastname,
    studentfullname,
    studentemail,
    studenttimezone,
    studentcategory,
    studentcountry,
  } = req.body;

  if (!tutorid || !studentfirstname || !studentlastname || !studenttimezone) {
    return next(errorHandler(400, "All fields are required"));
  }

  // const existingStudent = await Student.findOne({ studentemail });

  // if (existingStudent) {
  //   return next(errorHandler(400, "Student already exists"));
  // }

  const id = await generateStudentId();

  const newStudent = new Student({
    studentId: id,
    tutorid,
    studentphonenumber,
    studentfirstname,
    studentlastname,
    studentfullname,
    studentemail,
    studenttimezone,
    studentcategory,
    studentcountry,
  });

  try {
    await newStudent.save();
    res.status(201).json({ message: 'Student added successfully', student: newStudent });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'An error occurred while adding the student.' });
  }
};

// Get Students names and timezones list by Tutor ID
export const getStudentsNames = async (req, res, next) => {
  const { tutorid } = req.query;
  if (!tutorid) {
    return next(errorHandler(400, "Tutor ID is required"));
  }
  try {
    const students = await Student.find({ tutorid }, "studentfullname studenttimezone");
    res.json(students);
  } catch (error) {
    next(error);
  }
};

// Get Students by Tutor ID
export const getStudents = async (req, res, next) => {
  const { tutorid } = req.query;
  if (!tutorid) {
    return next(errorHandler(400, "Tutor ID is required"));
  }
  try {
    const students = await Student.find({ tutorid }).sort({ createdAt: -1 }).select('-__v');
    res.status(200).json(students);
  } catch (error) {
    console.error('Error fetching students by tutor ID:', error);
    res.status(500).json({ message: 'Error fetching students by tutor ID' });
  }
};

//Update student details
export const updateStudent = async (req, res, next) => {
  const { studentId } = req.body;
  if (!studentId) {
    return next(errorHandler(400, "Student ID is required"));
  }
  try {
    const student = await Student.findOne({ studentId });

    if (!student) {
      return next(errorHandler(404, "Student not found"));
    }

    Object.entries(req.body).forEach(([key, value]) => {
      if (key !== "studentId" && value !== undefined) {
        student[key] = value;
      }
    });

    await student.save();
    res.json("Student updated successfully");
  } catch (error) {
    next(error);
  }
};

// Delete student
export const deleteStudent = async (req, res, next) => {
  const { id } = req.query;
  if (!id) {
    return next(errorHandler(400, "Student ID is required"));
  }
  try {
    const student = await Student.findById(id);

    if (!student) {
      return next(errorHandler(404, "Student not found"));
    }

    await student.deleteOne();
    res.json("Student deleted successfully");
  } catch (error) {
    next(error);
  }
};



