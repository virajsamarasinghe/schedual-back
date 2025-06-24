import express from "express";
import { addMeeting, deleteMeeting, getMeetings, updateMeeting, getUpcomingAndOngoingMeetings, getPastMeetings, deleteRecurringMeeting } from "../controllers/meeting.controller.js";
import { verifyToken } from '../utils/verifyUser.js';

const router = express.Router();

router.post("/add-meeting",verifyToken, addMeeting)
router.get("/get-meetings",verifyToken, getMeetings)
router.get("/get-uo-meetings",verifyToken, getUpcomingAndOngoingMeetings)
router.get("/get-p-meetings",verifyToken, getPastMeetings)
router.put("/update-meeting",verifyToken, updateMeeting)
router.delete("/delete-meeting",verifyToken, deleteMeeting)
router.delete("/delete-recurring-meetings",verifyToken, deleteRecurringMeeting)

export default router;