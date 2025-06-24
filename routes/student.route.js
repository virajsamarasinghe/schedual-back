import express from "express";
import { addStudent, deleteStudent, getStudents, getStudentsNames, updateStudent} from "../controllers/student.controller.js";
import { verifyToken } from '../utils/verifyUser.js';

const router = express.Router();

router.post("/add-student",verifyToken, addStudent)
router.get("/get-students-names",verifyToken, getStudentsNames)
router.get("/get-students",verifyToken, getStudents)
router.put("/update-student",verifyToken, updateStudent)
router.delete("/delete-student",verifyToken, deleteStudent)

export default router;