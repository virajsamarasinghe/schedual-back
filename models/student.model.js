import mongoose from "mongoose";

const studentSchema = new mongoose.Schema(
  {
    studentId: {
      type: String,
    },
    studentphonenumber: {
      type: String,
    },
    studentfirstname: {
      type: String,
    },
    studentlastname: {
      type: String,
    },
    studentfullname: {
      type: String,
    },
    studentemail: {
      type: String,
    },
    studenttimezone: {
      type: String,
    },
    studentcategory: {
      type:String,
    },
    studentcountry: {
      type: String,
    },
    role: {
      type: String,
      default: "student",
    },
    studentmeetings: {
      type: [String],
    },
    tutorid:{
      type: String
    },

    trend1: {
      type: String,
    },
    trend2: {
      type: String,
    },
    trend3: {
      type: String,
    },
    trend4: {
      type: String,
    },
    trend5: {
      type: String,
    },
  },
  { timestamps: true }
);

const Student = mongoose.model("Students", studentSchema);

export default Student;
