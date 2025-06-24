import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    phonenumber: {
      type: String,
    },
    firstname: {
      type: String,
    },
    lastname: {
      type: String,
    },
    fullname: {
      type: String,
    },
    email: {
      type: String,
    },
    defaulttimezone: {
      type: String,
    },
    timezone: {
      type: [String],
    },
    meetingcategories: {
      type: [String],
    },
    country: {
      type: String,
    },
    role: {
      type: String,
      default: "admin",
    },
    password: {
      type: String,
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

const User = mongoose.model("Users", UserSchema);

export default User;
