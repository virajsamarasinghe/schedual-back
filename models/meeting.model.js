import mongoose from "mongoose";

const meetingSchema = new mongoose.Schema(
  {
    meetingname: {
      type: String
    },
    meetingtype: {
      type: String,
      required: true
    },
    meetingstartdate: {
      type: String,
      required: true
    },
    meetingstarttime: {
      type: String,
      required: true
    },
    meetingenddate: {
      type: String,
      required: true
    },
    meetingendtime: {
      type: String,
      required: true
    },
    tutorid: {
      type: String,
      required: true
    },
    meetingstudent: {
      type: String,
      required: true
    },
    meetingstudentid: {
      type: String,
      required: true
    },
    meetingstudentphonenumber: {
      type: String
    },
    meetinglink: {
      type: String
    },
    meetingstudenttimezone: {
      type: String,
      required: true
    },
    meetingnotes: {
      type: String
    },
    meetingscheduletimezone: {
      type: String
    },
    meetingrecurring: {
      type: String
    },
    meetingrecurringnumber: {
      type: Number,
      default:0
    },
    meetingrecurringid: {
      type: String
    }
  },
  { timestamps: true }
);

const Meeting = mongoose.model("Meetings", meetingSchema);

export default Meeting;