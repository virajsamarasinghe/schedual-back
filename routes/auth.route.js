import express from "express";
import { signin, signup, test, updateUser, getUser, addCategory, deleteCategory, addTimezone, deleteTimezone, getTimezone, getCategory, sendOtp, verifyOtp } from '../controllers/auth.controller.js';
import { verifyToken } from '../utils/verifyUser.js';

const router = express.Router();

router.get("/test2",verifyToken, test)
router.post("/signup", signup)
router.post("/signin", signin)
router.get("/get-user",verifyToken, getUser)
router.put("/update-user",verifyToken, updateUser)

router.post("/add-category",verifyToken, addCategory)
router.put("/delete-category",verifyToken, deleteCategory)
router.get("/get-category",verifyToken, getCategory)

router.post("/add-timezone",verifyToken, addTimezone)
router.put("/delete-timezone",verifyToken, deleteTimezone)
router.get("/get-timezones",verifyToken, getTimezone)

router.post("/otp-generate", sendOtp )
router.post("/verify-otp", verifyOtp)

export default router;