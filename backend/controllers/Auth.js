const User = require("../models/User.js");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const Doctor = require("../models/Doctor.js");
const Patient = require("../models/Patient.js");

require("dotenv").config();

const JWT_SECRET = process.env.JWT_SECRET;

// Signup Controller
exports.signup = async (req, res) => {
  const { firstName, lastName, email, contactNumber, password, accountType } = req.body;

  // Email validation using regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ 
      success: false, 
      message: "Email address is not valid" 
    }); // FIXED: Correct response syntax
  }

  try {
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ 
        success: false,
        message: "User already exists" 
      });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create a new user
    const newUser = new User({
      firstName,
      lastName,
      email,
      contactNumber,
      password: hashedPassword,
      accountType,
    });

    // Save user first
    await newUser.save();

    if (!newUser._id) {
      return res.status(500).json({ 
        success: false,
        message: "Server error: User creation failed" 
      });
    }

    // Create profile based on account type
    if (accountType === "Doctor") {
      const newDoctor = new Doctor({ user: newUser._id });
      await newDoctor.save();
    } else if (accountType === "Patient") {
      const newPatient = new Patient({ user: newUser._id });
      await newPatient.save();
    }

    res.status(201).json({ 
      success: true,
      message: "User registered successfully" 
    });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ 
      success: false,
      message: "Server error during registration" 
    });
  }
};

exports.login = async (req, res) => {
  const { email, password } = req.body;

  // Email validation using regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return res.status(400).json({ 
      success: false, 
      message: "Email address is not valid" 
    });
  }

  try {
    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid credentials: User does not exist",
      });
    }

    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid credentials" 
      });
    }

    // Create a JWT token
    const token = jwt.sign(
      { id: user._id, email: user.email, accountType: user.accountType },
      JWT_SECRET,
      { expiresIn: "8h" }
    );

    // Find the user in the specific collection (Doctor or Patient)
    let profile;
    if (user.accountType === "Doctor") {
      profile = await Doctor.findOne({ user: user._id });
    } else if (user.accountType === "Patient") {
      profile = await Patient.findOne({ user: user._id });
    }

    res
      .cookie("access_token", token, { 
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 8 * 60 * 60 * 1000 // 8 hours
      })
      .status(200)
      .json({
        success: true,
        message: "Login successful",
        user: {
          id: user._id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          accountType: user.accountType,
          image: user.image,
          contactNumber: user.contactNumber,
          dateOfBirth: user.dateOfBirth,
          gender: user.gender,
          bloodGroup: user.bloodGroup,
        },
        profile: profile,
        token: token // Optional: also send token in response for mobile apps
      });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ 
      success: false,
      message: "Server error during login" 
    });
  }
};

exports.logout = async (req, res) => {
  try {
    res.clearCookie("access_token");
    res.status(200).json({ 
      success: true,
      message: "User has been logged out successfully!" 
    });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ 
      success: false,
      message: "Server error during logout" 
    });
  }
};