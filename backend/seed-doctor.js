/**
 * Seed Script — Creates a test doctor account
 * Run: node seed-doctor.js
 *
 * Test Doctor Credentials:
 *   Email:    doctor@ayursamhita.com
 *   Password: Doctor@123
 */

const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const dns = require("dns");
require("dotenv").config();

// Force Google DNS so Atlas SRV records resolve (local router blocks SRV)
dns.setServers(["8.8.8.8", "8.8.4.4"]);


const User = require("./models/User.js");
const Doctor = require("./models/Doctor.js");

async function seedDoctor() {
  try {
    await mongoose.connect(process.env.DATA_BASE_URL);
    console.log("✅ Connected to MongoDB");

    const email = "doctor@ayursamhita.com";

    // Remove existing test doctor if any
    const existing = await User.findOne({ email });
    if (existing) {
      await Doctor.findOneAndDelete({ user: existing._id });
      await User.findByIdAndDelete(existing._id);
      console.log("🗑  Removed existing test doctor");
    }

    const hashedPassword = await bcrypt.hash("Doctor@123", 10);

    const user = new User({
      firstName: "Ayur",
      lastName: "Vaidya",
      email,
      contactNumber: "9876543210",
      password: hashedPassword,
      accountType: "Doctor",
    });
    await user.save();

    const doctor = new Doctor({
      user: user._id,
      medicalLicenseNumber: "MH-2024-DOC-001",
      specialization: "Ayurvedic Medicine",
      consultantFee: 500,
      experience: 8,
      degrees: "BAMS, MD (Ayurveda)",
      certification: "Registered Ayurvedic Practitioner",
      availableDays: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
      availableTimeSlot: { start: "09:00", end: "17:00" },
      approvalStatus: true,
    });
    await doctor.save();

    console.log("\n✅ Test doctor created successfully!");
    console.log("─────────────────────────────────────");
    console.log("  Email:    doctor@ayursamhita.com");
    console.log("  Password: Doctor@123");
    console.log("  Name:     Dr. Ayur Vaidya");
    console.log("  Spec:     Ayurvedic Medicine");
    console.log("─────────────────────────────────────");
    console.log("\nLogin at http://localhost:3000/login → select 'Doctor' tab");

  } catch (err) {
    console.error("❌ Error:", err.message);
  } finally {
    await mongoose.disconnect();
    console.log("Disconnected.");
  }
}

seedDoctor();
