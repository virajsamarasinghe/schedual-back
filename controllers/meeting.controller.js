import Meeting from "../models/meeting.model.js";
import moment from "moment-timezone";
import { errorHandler } from "../utils/error.js";

// Convert meeting date and time to UTC
const convertToUTC = (date, time, timezone) => {
  return moment.tz(`${date} ${time}`, "YYYY-MM-DD HH:mm", timezone).utc();
};

//function to generate recurrence meeting id
let recurringMeetingCounter = 1;

const generateRecurringMeetingId = (tutorid) => {
  const id = String(recurringMeetingCounter).padStart(5, "0");
  recurringMeetingCounter++;
  return `${id}-recurring-${tutorid}`;
};

// Validate required fields
const validateMeetingFields = (req, next) => {
  const {
    meetingstudent,
    meetingstudentid,
    meetingstartdate,
    meetingstarttime,
    meetingenddate,
    meetingendtime,
    tutorid,
    meetingtype,
    meetingstudenttimezone,
    meetingscheduletimezone,
    meetingrecurring,
  } = req.body;

  if (
    !meetingstudent ||
    !meetingstudentid ||
    !meetingstartdate ||
    !meetingstarttime ||
    !meetingenddate ||
    !meetingendtime ||
    !tutorid ||
    !meetingtype ||
    !meetingstudenttimezone ||
    !meetingscheduletimezone ||
    !meetingrecurring
  ) {
    return next(errorHandler(400, "All required fields must be provided"));
  }
};

const checkMeetingConflict = async (tutorid, startDateTimeUTC, endDateTimeUTC) => {
  const startDate = startDateTimeUTC.format("YYYY-MM-DD");
  const startTime = startDateTimeUTC.format("HH:mm");
  const endDate = endDateTimeUTC.format("YYYY-MM-DD");
  const endTime = endDateTimeUTC.format("HH:mm");

  console.log(`Checking conflicts for new meeting: ${startDate} ${startTime} to ${endDate} ${endTime}`);

  // First find all meetings on the relevant dates
  const potentialConflicts = await Meeting.find({
    tutorid: tutorid,
    $or: [
      // Same day as start date
      { meetingstartdate: startDate },
      // Same day as end date
      { meetingenddate: endDate },
      // Meeting spans across our meeting dates
      {
        meetingstartdate: { $lt: startDate },
        meetingenddate: { $gt: startDate }
      }
    ]
  });

  console.log(`Found ${potentialConflicts.length} potential conflicts to check`);

  // Helper function to convert date and time strings to Date objects for comparison
  const toDateObj = (dateStr, timeStr) => {
    const [year, month, day] = dateStr.split('-').map(Number);
    const [hours, minutes] = timeStr.split(':').map(Number);
    return new Date(year, month - 1, day, hours, minutes); // month is 0-based in JS Date
  };

  // Convert new meeting times to Date objects
  const newMeetingStart = toDateObj(startDate, startTime);
  const newMeetingEnd = toDateObj(endDate, endTime);

  // Check each meeting individually with proper time comparison using Date objects
  for (const meeting of potentialConflicts) {
    console.log(`Checking meeting: ${meeting._id}`);
    console.log(`  Meeting period: ${meeting.meetingstartdate} ${meeting.meetingstarttime} to ${meeting.meetingenddate} ${meeting.meetingendtime}`);

    // Convert existing meeting times to Date objects
    const existingMeetingStart = toDateObj(meeting.meetingstartdate, meeting.meetingstarttime);
    const existingMeetingEnd = toDateObj(meeting.meetingenddate, meeting.meetingendtime);

    // Debug log the actual date objects being compared
    console.log(`  New meeting time range: ${newMeetingStart.toISOString()} to ${newMeetingEnd.toISOString()}`);
    console.log(`  Existing meeting time range: ${existingMeetingStart.toISOString()} to ${existingMeetingEnd.toISOString()}`);

    // Check for overlap using Date object comparison
    // Two time periods overlap if:
    // - One starts before the other ends AND
    // - One ends after the other starts
    const hasOverlap =
      newMeetingStart < existingMeetingEnd &&
      newMeetingEnd > existingMeetingStart;

    if (hasOverlap) {
      console.log('Conflict detected with meeting:');
      console.log(`  Meeting ID: ${meeting._id}`);
      console.log(`  Meeting start: ${meeting.meetingstartdate} ${meeting.meetingstarttime}`);
      console.log(`  Meeting end: ${meeting.meetingenddate} ${meeting.meetingendtime}`);
      return meeting;
    }
  }

  console.log('No conflicts found');
  return null;
};

// Create and save a single meeting instance
const createMeetingInstance = async (data) => {
  const newMeeting = new Meeting(data);
  await newMeeting.save();
  return newMeeting;
};

// Handle recurring meetings
const handleRecurringMeetings = async (req, startDateTimeUTC, endDateTimeUTC) => {
  const {
    meetingname,
    meetingtype,
    meetingstartdate,
    meetingstarttime,
    meetingenddate,
    meetingendtime,
    tutorid,
    meetingstudent,
    meetingstudentid,
    meetingstudentphonenumber,
    meetinglink,
    meetingstudenttimezone,
    meetingscheduletimezone,
    meetingrecurring,
    meetingrecurringnumber,
  } = req.body;

  const baseDate = moment.tz(meetingstartdate, meetingscheduletimezone);
  const meetingId = generateRecurringMeetingId(tutorid);
  const newMeetingInstances = [];

  // First, check conflicts for ALL occurrences before creating any meetings
  for (let i = 0; i < meetingrecurringnumber; i++) {
    let newDate;
    switch (meetingrecurring) {
      case "daily":
        newDate = baseDate.clone().add(i, "days");
        break;
      case "weekly":
        newDate = baseDate.clone().add(i, "weeks");
        break;
      case "monthly":
        newDate = baseDate.clone().add(i, "months");
        break;
      case "annually":
        newDate = baseDate.clone().add(i, "years");
        break;
      default:
        throw errorHandler(400, "Invalid recurring type");
    }

    const newStartDateTimeUTC = convertToUTC(newDate.format("YYYY-MM-DD"), meetingstarttime, meetingscheduletimezone);
    const newEndDateTimeUTC = convertToUTC(newDate.format("YYYY-MM-DD"), meetingendtime, meetingscheduletimezone);

    // Check for conflicts
    const conflict = await checkMeetingConflict(tutorid, newStartDateTimeUTC, newEndDateTimeUTC);
    if (conflict) {
      throw errorHandler(400, `Recurring meeting conflicts with an existing meeting on ${newDate.format("YYYY-MM-DD")}`);
    }

    // Store valid meeting instances to create later
    newMeetingInstances.push({
      meetingname,
      meetingtype,
      meetingstartdate: newStartDateTimeUTC.format("YYYY-MM-DD"),
      meetingstarttime: newStartDateTimeUTC.format("HH:mm"),
      meetingenddate: newEndDateTimeUTC.format("YYYY-MM-DD"),
      meetingendtime: newEndDateTimeUTC.format("HH:mm"),
      tutorid,
      meetingstudent,
      meetingstudentid,
      meetingstudentphonenumber,
      meetinglink,
      meetingstudenttimezone,
      meetingscheduletimezone: "UTC",
      meetingrecurring,
      meetingrecurringid: meetingId,
    });
  }

  // If all checks pass, create the meetings
  const createdMeetings = await Meeting.insertMany(newMeetingInstances);

  return createdMeetings;
};


// Main function to add a meeting
export const addMeeting = async (req, res, next) => {
  try {
    // Validate input fields
    validateMeetingFields(req, next);

    console.log(req.body.meetingscheduletimezone)
    console.log(req.body.meetingstarttime)
    console.log(req.body.meetingstartdate)

    // Convert times to UTC
    const startDateTimeUTC = convertToUTC(
      req.body.meetingstartdate,
      req.body.meetingstarttime,
      req.body.meetingscheduletimezone
    );
    const endDateTimeUTC = convertToUTC(
      req.body.meetingenddate,
      req.body.meetingendtime,
      req.body.meetingscheduletimezone
    );

    // Check for meeting conflicts
    const conflict = await checkMeetingConflict(
      req.body.tutorid, // Add tutorid here
      startDateTimeUTC,
      endDateTimeUTC
    );
    if (conflict) return next(errorHandler(400, `Meeting slot not available for date:  ${startDateTimeUTC.format("YYYY-MM-DD")}`));

    // Handle recurring meetings
    if (req.body.meetingrecurring !== "none") {
      const recurringMeetings = await handleRecurringMeetings(
        req,
        startDateTimeUTC,
        endDateTimeUTC
      );
      return res
        .status(201)
        .json({
          message: "Recurring meetings created",
          meetings: recurringMeetings,
        });
    } 

    // Create a single meeting
    const newMeeting = await createMeetingInstance({
      ...req.body,
      meetingstartdate: startDateTimeUTC.format("YYYY-MM-DD"),
      meetingstarttime: startDateTimeUTC.format("HH:mm"),
      meetingenddate: endDateTimeUTC.format("YYYY-MM-DD"),
      meetingendtime: endDateTimeUTC.format("HH:mm"),
      meetingscheduletimezone: "UTC",
    });

    res
      .status(201)
      .json({ message: "Meeting created successfully", meeting: newMeeting });
  } catch (error) {
    next(error);
  }
};

// Get all Meetings
export const getMeetings = async (req, res, next) => {
  const { tutorid } = req.query;

  if (!tutorid) {
    return next(errorHandler(400, "Tutor ID is required"));
  }

  try {
    const meetings = await Meeting.find({ tutorid });
    res.json(meetings);
  } catch (error) {
    next(error);
  }
};

//Get upcoming meetings
export const getUpcomingAndOngoingMeetings = async (req, res, next) => {
  const { tutorid } = req.query;

  if (!tutorid) {
    return next(errorHandler(400, "Tutor ID is required"));
  }

  try {
    const currentSLDateTime = moment().tz("Asia/Colombo"); // Get current time in Sri Lanka
    const meetings = await Meeting.find({ tutorid }).lean();

    const filteredMeetings = meetings.filter((meeting) => {
      const {
        meetingstartdate,
        meetingstarttime,
        meetingenddate,
        meetingendtime,
      } = meeting;

      // Convert UTC database times to SL time for comparison
      const meetingStartDateTime = moment
        .utc(`${meetingstartdate} ${meetingstarttime}`, "YYYY-MM-DD HH:mm")
        .tz("Asia/Colombo");

      const meetingEndDateTime = moment
        .utc(`${meetingenddate} ${meetingendtime}`, "YYYY-MM-DD HH:mm")
        .tz("Asia/Colombo");

      // Compare with current SL time
      return meetingEndDateTime.isSameOrAfter(currentSLDateTime);
    });

    // Sort by start time in ascending order
    filteredMeetings.sort((a, b) => {
      const startA = moment.utc(
        `${a.meetingstartdate} ${a.meetingstarttime}`,
        "YYYY-MM-DD HH:mm"
      );
      const startB = moment.utc(
        `${b.meetingstartdate} ${b.meetingstarttime}`,
        "YYYY-MM-DD HH:mm"
      );

      return startA - startB;
    });

    // No need to convert back to UTC since the database values are already in UTC
    res.json(filteredMeetings);
  } catch (error) {
    next(error);
  }
};

//get past meetings
export const getPastMeetings = async (req, res, next) => {
  const { tutorid } = req.query;

  if (!tutorid) {
    return next(errorHandler(400, "Tutor ID is required"));
  }

  try {
    const currentSLDateTime = moment().tz("Asia/Colombo"); // Get current time in Sri Lanka
    const meetings = await Meeting.find({ tutorid }).lean();

    const pastMeetings = meetings.filter((meeting) => {
      const {
        meetingstartdate,
        meetingstarttime,
        meetingenddate,
        meetingendtime,
      } = meeting;

      // Convert UTC database times to SL time for comparison
      const meetingEndDateTime = moment
        .utc(`${meetingenddate} ${meetingendtime}`, "YYYY-MM-DD HH:mm")
        .tz("Asia/Colombo");

      return meetingEndDateTime.isBefore(currentSLDateTime);
    });

    // Sort by start time in descending order (latest first)
    pastMeetings.sort((a, b) => {
      const startA = moment.utc(
        `${a.meetingstartdate} ${a.meetingstarttime}`,
        "YYYY-MM-DD HH:mm"
      );
      const startB = moment.utc(
        `${b.meetingstartdate} ${b.meetingstarttime}`,
        "YYYY-MM-DD HH:mm"
      );

      return startB - startA; // Descending order
    });

    // No need to convert back to UTC since the database values are already in UTC
    res.json(pastMeetings);
  } catch (error) {
    next(error);
  }
};

const checkMeetingUpdateConflict = async (tutorid, startDateTimeUTC, endDateTimeUTC, currentMeetingId) => {
  const startDate = startDateTimeUTC.format("YYYY-MM-DD");
  const startTime = startDateTimeUTC.format("HH:mm");
  const endDate = endDateTimeUTC.format("YYYY-MM-DD");
  const endTime = endDateTimeUTC.format("HH:mm");

  console.log(`Checking conflicts for updated meeting: ${startDate} ${startTime} to ${endDate} ${endTime}`);

  // Helper function to convert date and time strings to Date objects for comparison
  const toDateObj = (dateStr, timeStr) => {
    const [year, month, day] = dateStr.split('-').map(Number);
    const [hours, minutes] = timeStr.split(':').map(Number);
    return new Date(year, month - 1, day, hours, minutes);
  };

  // Find potential conflicts, excluding the current meeting being updated
  const potentialConflicts = await Meeting.find({
    tutorid: tutorid,
    _id: { $ne: currentMeetingId }, // Exclude the current meeting
    $or: [
      // Scenario 1: Meeting starts on the same day as new meeting start
      { meetingstartdate: startDate },
      // Scenario 2: Meeting ends on the same day as new meeting end
      { meetingenddate: endDate },
      // Scenario 3: Meeting spans across the new meeting's start date
      {
        meetingstartdate: { $lt: startDate },
        meetingenddate: { $gt: startDate }
      }
    ]
  });

  console.log(`Found ${potentialConflicts.length} potential conflicts to check`);

  // Convert new meeting times to Date objects for precise comparison
  const newMeetingStart = toDateObj(startDate, startTime);
  const newMeetingEnd = toDateObj(endDate, endTime);

  // Detailed conflict checking for each potential conflict
  for (const meeting of potentialConflicts) {
    console.log(`Checking meeting: ${meeting._id}`);

    // Convert existing meeting times to Date objects
    const existingMeetingStart = toDateObj(meeting.meetingstartdate, meeting.meetingstarttime);
    const existingMeetingEnd = toDateObj(meeting.meetingenddate, meeting.meetingendtime);

    // Detailed time overlap scenarios:
    // Scenario 1: New meeting completely contains existing meeting
    // [New Start ... [Existing Start ... Existing End] ... New End]
    const scenario1 =
      newMeetingStart <= existingMeetingStart &&
      newMeetingEnd >= existingMeetingEnd;

    // Scenario 2: Existing meeting starts during new meeting
    // [New Start ... [Existing Start ... New End] ... Existing End]
    const scenario2 =
      newMeetingStart < existingMeetingEnd &&
      newMeetingStart > existingMeetingStart;

    // Scenario 3: Existing meeting ends during new meeting
    // [Existing Start ... [New Start ... Existing End] ... New End]
    const scenario3 =
      newMeetingEnd > existingMeetingStart &&
      newMeetingEnd < existingMeetingEnd;

    // Scenario 4: Existing meeting completely contains new meeting
    // [Existing Start ... [New Start ... New End] ... Existing End]
    const scenario4 =
      existingMeetingStart <= newMeetingStart &&
      existingMeetingEnd >= newMeetingEnd;

    // Check if any of the overlap scenarios are true
    const hasOverlap = scenario1 || scenario2 || scenario3 || scenario4;

    if (hasOverlap) {
      console.log('Conflict detected with meeting:');
      console.log(`  Scenario 1 (New contains Existing): ${scenario1}`);
      console.log(`  Scenario 2 (Existing starts during New): ${scenario2}`);
      console.log(`  Scenario 3 (Existing ends during New): ${scenario3}`);
      console.log(`  Scenario 4 (Existing contains New): ${scenario4}`);
      console.log(`  Meeting ID: ${meeting._id}`);
      console.log(`  Meeting start: ${meeting.meetingstartdate} ${meeting.meetingstarttime}`);
      console.log(`  Meeting end: ${meeting.meetingenddate} ${meeting.meetingendtime}`);
      return meeting;
    }
  }

  console.log('No conflicts found');
  return null;
};

export const updateMeeting = async (req, res, next) => {
  try {
    const { id } = req.query;

    if (!id) {
      return next(errorHandler(400, "Meeting ID is required"));
    }

    const existingMeeting = await Meeting.findById(id);

    if (!existingMeeting) {
      return next(errorHandler(404, "Meeting not found"));
    }

    // Prepare update data
    const updateData = {};
    Object.entries(req.body).forEach(([key, value]) => {
      if (value !== undefined) {
        updateData[key] = value;
      }
    });

    // Check if time-related fields are being updated
    const isTimeUpdating =
      updateData.meetingstartdate ||
      updateData.meetingstarttime ||
      updateData.meetingenddate ||
      updateData.meetingendtime ||
      updateData.meetingscheduletimezone;

    if (isTimeUpdating) {
      // Ensure all required fields are present for UTC conversion
      const startDate = updateData.meetingstartdate || existingMeeting.meetingstartdate;
      const startTime = updateData.meetingstarttime || existingMeeting.meetingstarttime;
      const endDate = updateData.meetingenddate || existingMeeting.meetingenddate;
      const endTime = updateData.meetingendtime || existingMeeting.meetingendtime;
      const timezone = updateData.meetingscheduletimezone || existingMeeting.meetingscheduletimezone;

      // Convert times to UTC
      const startDateTimeUTC = convertToUTC(
        startDate,
        startTime,
        timezone
      );
      const endDateTimeUTC = convertToUTC(
        endDate,
        endTime,
        timezone
      );

      // Check for meeting conflicts
      const conflict = await checkMeetingUpdateConflict(
        existingMeeting.tutorid,
        startDateTimeUTC,
        endDateTimeUTC,
        id
      );

      if (conflict) {
        return next(errorHandler(400, `Meeting slot not available for date: ${startDateTimeUTC.format("YYYY-MM-DD")}`));
      }

      // Update with UTC converted times
      updateData.meetingstartdate = startDateTimeUTC.format("YYYY-MM-DD");
      updateData.meetingstarttime = startDateTimeUTC.format("HH:mm");
      updateData.meetingenddate = endDateTimeUTC.format("YYYY-MM-DD");
      updateData.meetingendtime = endDateTimeUTC.format("HH:mm");
      updateData.meetingscheduletimezone = "UTC";
    }

    // Update the meeting with processed data
    Object.entries(updateData).forEach(([key, value]) => {
      existingMeeting[key] = value;
    });

    await existingMeeting.save();

    res.json({
      message: "Meeting updated successfully",
      meeting: existingMeeting
    });
  } catch (error) {
    next(error);
  }
};

// Delete meeting
export const deleteMeeting = async (req, res, next) => {
  const { _id } = req.body;
  if (!_id) {
    return next(errorHandler(400, "Meeting ID is required"));
  }
  try {
    const meeting = await Meeting.findById(_id);
    if (!meeting) {
      return next(errorHandler(404, "Meeting not found"));
    }

    await Meeting.deleteOne({ _id }); // Corrected deletion method

    res.json({ message: "Meeting deleted successfully" }); // Improved response format
  } catch (error) {
    next(error);
  }
};

//Delete recurring meeting function
export const deleteRecurringMeeting = async (req, res, next) => {
  const { meetingrecurringid } = req.body;

  if (!meetingrecurringid) {
    return next(errorHandler(400, "Recurring Meeting ID is required"));
  }

  try {
    // Fetch all meetings with this recurring ID
    const allMeetings = await Meeting.find({ meetingrecurringid });
    if (!allMeetings || allMeetings.length === 0) {
      return next(errorHandler(404, "No recurring meetings found"));
    }

    const nowUTC = moment().utc();
    // Determine which meetings are upcoming
    const upcomingMeetingIds = [];
    for (const m of allMeetings) {
      const startDateTime = moment.utc(
        `${m.meetingstartdate} ${m.meetingstarttime}`,
        "YYYY-MM-DD HH:mm"
      );
      // If start time is in the future or same as current time, consider it upcoming
      if (startDateTime.isSameOrAfter(nowUTC)) {
        upcomingMeetingIds.push(m._id);
      }
    }

    if (upcomingMeetingIds.length === 0) {
      return res.json({ message: "No upcoming recurring meetings to delete" });
    }

    // Delete only the upcoming meetings
    await Meeting.deleteMany({ _id: { $in: upcomingMeetingIds } });

    res.json({ message: "Upcoming recurring meetings deleted successfully" });
  } catch (error) {
    next(error);
  }
};
