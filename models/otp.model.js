import mongoose from "mongoose";

const otpSchema = new mongoose.Schema({
    otp: {
        type: String,
    },
    email: {
        type: String,
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 86400 // 30 minutes in seconds
      }
  
}, { timestamps: true });

const Otp = mongoose.model("Otp", otpSchema);

export default Otp;