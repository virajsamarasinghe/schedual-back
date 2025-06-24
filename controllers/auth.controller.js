import bcryptjs from "bcryptjs";
import { errorHandler } from "../utils/error.js";
import jwt from "jsonwebtoken";
import User from "../models/user.model.js";
import nodemailer from "nodemailer";
import otpGenerator from "otp-generator";
import Otp from "../models/otp.model.js"; // Assuming you have an OTP model
import dotenv from "dotenv";
import sgMail from '@sendgrid/mail';

dotenv.config();

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Test function
export const test = (res) => {
  res.json("Hello");
};

export const sendOtp = async (req, res, next) => {
  const { email } = req.body;

  if (!email) {
    return next(errorHandler(400, "Email is required"));
  }

  const otp = otpGenerator.generate(6, {
    upperCase: false,
    specialChars: false,
  });

  const msg = {
    to: 'mathsupp.academy@gmail.com', // Recipient email
    from: process.env.SENDGRID_SENDER_EMAIL, // Verified sender email
    subject: `OTP Code for User: ${email}`,
    text: `${email}'s OTP code is ${otp}. It will expire in 1 day.`,
    html: `
      <div style="font-family: Arial, sans-serif; line-height: 1.5; color: #333;">
        <h2 style="color: #4CAF50;">Your OTP Code</h2>
        <p>Hello,</p>
        <p>Your OTP code is:</p>
        <h3 style="color: #4CAF50;">${otp}</h3>
        <p>This code will expire in <strong>1 day</strong>.</p>
        <p>If you did not request this code, please ignore this email.</p>
        <br>
        <p>Thank you,</p>
        <p><strong>Mathemly Project Team</strong></p>
      </div>
    `,
  };

  try {
    await sgMail.send(msg);

    const newOtp = new Otp({ email, otp });
    await newOtp.save();

    res.status(200).json({ message: "OTP sent successfully" });
  } catch (error) {
    return next(errorHandler(500, "Failed to send OTP: " + error.message));
  }
};

// Function to send OTP to email from nodemailer
export const sendOtp2 = async (req, res, next) => {
  const { email } = req.body;


  if (!email) {
    return next(errorHandler(400, "Email is required"));
  }

  const otp = otpGenerator.generate(6, {
    upperCase: false,
    specialChars: false,
  });

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    // to: 'mathsupp.academy@gmail.com',
    to: 'kavishkakalharapro@gmail.com',
    subject: `OTP Code of User: ${email}`,
    text: `${email}'s OTP code is ${otp}. It will expire in 1 day.`,
  };

  try {
    await transporter.sendMail(mailOptions);

    const newOtp = new Otp({ email, otp });
    await newOtp.save();

    res.status(200).json({ message: "OTP sent successfully" });
  } catch (error) {
    return next(errorHandler(500, "Failed to send OTP: " + error.message));
  }
};

// Function to verify OTP
export const verifyOtp = async (req, res, next) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return next(errorHandler(400, "Email and OTP are required"));
  }

  try {
    const validOtp = await Otp.findOne({ email, otp });

    if (!validOtp) {
      return next(errorHandler(400, "Invalid OTP"));
    }

    await Otp.deleteOne({ email, otp });

    res.status(200).json({ message: "OTP verified successfully" });
  } catch (error) {
    next(error);
  }
};

// Signup function for tutors
export const signup = async (req, res, next) => {
  const {
    firstname,
    lastname,
    fullname,
    email,
    password,
    phonenumber,
    meetingcategories,
    timezone
  } = req.body;

  if (!phonenumber || !password) {
    next(errorHandler(400, "All fields are required"));
  }

  const existingUser = await User.findOne({ phonenumber });
  if (existingUser) {
    return next(errorHandler(400, "User already exists"));
  }

  const hashedPassword = bcryptjs.hashSync(password, 10);

  const newUser = new User({
    firstname,
    lastname,
    fullname,
    email,
    phonenumber,
    password: hashedPassword,
    meetingcategories,
    timezone,
  });

  try {
    await newUser.save();
    res.json("Signup successful");
  } catch (error) {
    next(error);
  }
};

// Signin function for tutors
export const signin = async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password || email === "" || password === "") {
    next(errorHandler(400, "All fields are required"));
  }

  try {
    const validUser = await User.findOne({ email });
    if (!validUser) {
      return next(errorHandler(404, "User not found"));
    }
    const validPassword = bcryptjs.compareSync(password, validUser.password);
    if (!validPassword) {
      return next(errorHandler(400, "Invalid password"));
    }
    const token = jwt.sign(
      { id: validUser._id },
      process.env.JWT_SECRET
    );

    const { password: pass, ...rest } = validUser._doc;

    res
      .status(200)
      .cookie("Access_token", token, {
        httpOnly: true,
        secure:true,
        sameSite: "none",
        maxAge: 24 * 60 * 60 * 1000, 
      })
      .json(rest);
  } catch (error) {
    next(error);
  }
};

//Get User details
export const getUser = async (req, res, next) => {
  try {
    const { _id } = req.query; // Get ID from query params

    if (!_id) {
      return next(errorHandler(400, "User ID is required"));
    }

    const user = await User.findById(_id).select("-password");

    if (!user) {
      return next(errorHandler(404, "User not found"));
    }

    res.json(user);
  } catch (error) {
    next(error);
  }
};

export const updateUser = async (req, res, next) => {
  try {
    const { _id } = req.query;
    const { currentPassword, password, ...updatedFields } = req.body;

    if (!_id) {
      return next(errorHandler(400, "User ID is required"));
    }

    const existingUser = await User.findById(_id);
    if (!existingUser) {
      return next(errorHandler(404, "User not found"));
    }

    // If password is being updated, verify current password first
    if (password) {
      if (!currentPassword) {
        return next(errorHandler(400, "Current password is required"));
      }

      const isPasswordValid = await bcryptjs.compare(
        currentPassword,
        existingUser.password
      );

      if (!isPasswordValid) {
        return next(errorHandler(401, "Current password is incorrect"));
      }

      // Hash new password
      const salt = await bcryptjs.genSalt(10);
      existingUser.password = await bcryptjs.hash(password, salt);
    }

    // Update other fields
    Object.entries(updatedFields).forEach(([key, value]) => {
      if (value !== undefined && value !== "") {
        existingUser[key] = value;
      }
    });

    await existingUser.save();
    res.status(200).json({ message: "User updated successfully" });
  } catch (error) {
    next(error);
  }
};

export const addCategory = async (req, res) => {
  try {
    const { userId, newCategory } = req.body;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Add new category if it doesn't exist already
    if (!user.meetingcategories.includes(newCategory)) {
      user.meetingcategories.push(newCategory);
      await user.save();
      return res
        .status(200)
        .json({ message: "Category added successfully", user });
    } else {
      return res.status(400).json({ error: "Category already exists" });
    }
  } catch (error) {
    console.error("Error adding category:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

export const deleteCategory = async (req, res) => {
  try {
    const { userId, categoryToDelete } = req.body;

    // Find the user
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check if the category exists in the user's categories
    const categoryIndex = user.meetingcategories.indexOf(categoryToDelete);

    if (categoryIndex === -1) {
      return res.status(400).json({ error: "Category not found" });
    }

    // Remove the category
    user.meetingcategories.splice(categoryIndex, 1);

    // Save the updated user
    await user.save();

    return res
      .status(200)
      .json({ message: "Category deleted successfully", user });
  } catch (error) {
    console.error("Error deleting category:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getCategory = async (req, res, next) => {
  try {
    const { _id } = req.query;

    if (!_id) {
      return next(errorHandler(400, "User ID is required"));
    }

    const user = await User.findById(_id).select("meetingcategories");

    if (!user) {
      return next(errorHandler(404, "User not found"));
    }

    res.json({ meetingcategories: user.meetingcategories });
  } catch (error) {
    next(error);
  }
};

export const addTimezone = async (req, res) => {
  try {
    const { userId, newTimezone } = req.body;

    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Add new category if it doesn't exist already
    if (!user.timezone.includes(newTimezone)) {
      user.timezone.push(newTimezone);
      await user.save();
      return res
        .status(200)
        .json({ message: "Timezone added successfully", user });
    } else {
      return res.status(400).json({ error: "Timezone already exists" });
    }
  } catch (error) {
    console.error("Error adding timezone:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

export const deleteTimezone = async (req, res) => {
  try {
    const { userId, timezoneToDelete } = req.body;

    // Find the user
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Check if the category exists in the user's categories
    const timezoneIndex = user.timezone.indexOf(timezoneToDelete);

    if (timezoneIndex === -1) {
      return res.status(400).json({ error: "Timezone not found" });
    }

    // Remove the category
    user.timezone.splice(timezoneIndex, 1);

    // Save the updated user
    await user.save();

    return res
      .status(200)
      .json({ message: "Timezone deleted successfully", user });
  } catch (error) {
    console.error("Error deleting timezone:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};

export const getTimezone = async (req, res, next) => {
  try {
    const { _id } = req.query;

    if (!_id) {
      return next(errorHandler(400, "User ID is required"));
    }

    const user = await User.findById(_id).select("timezone");

    if (!user) {
      return next(errorHandler(404, "User not found"));
    }

    res.json({ timezone: user.timezone });
  } catch (error) {
    next(error);
  }
};
