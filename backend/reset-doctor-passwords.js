/**
 * Reset all doctor passwords to default@123
 * Run: node reset-doctor-passwords.js
 */
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const dns = require("dns");
require("dotenv").config();

dns.setServers(["8.8.8.8", "8.8.4.4"]);

const User = require("./models/User.js");
const Doctor = require("./models/Doctor.js");

async function resetDoctorPasswords() {
  try {
    await mongoose.connect(process.env.DATA_BASE_URL);
    console.log("✅ Connected to MongoDB\n");

    const doctors = await Doctor.find().populate("user");

    if (!doctors.length) {
      console.log("⚠️  No doctors found in database.");
      return;
    }

    const hashedPassword = await bcrypt.hash("default@123", 10);

    console.log(`Found ${doctors.length} doctor(s). Resetting passwords...\n`);
    console.log("═══════════════════════════════════════════════════════");
    console.log("  DOCTOR LOGIN CREDENTIALS");
    console.log("═══════════════════════════════════════════════════════");

    for (const doctor of doctors) {
      if (!doctor.user) continue;

      await User.findByIdAndUpdate(doctor.user._id, { password: hashedPassword });

      console.log(`  Name     : ${doctor.user.firstName} ${doctor.user.lastName}`);
      console.log(`  Password : default@123`);
      console.log(`  Email    : ${doctor.user.email}`);
      console.log(`  Spec     : ${doctor.specialization || "—"}`);
      console.log("───────────────────────────────────────────────────────");
    }

    console.log("\n✅ All doctor passwords reset to: default@123");
    console.log("\nLogin at http://localhost:3000/login → Doctor tab");
    console.log("Enter First Name + Last Name + password: default@123\n");

  } catch (err) {
    console.error("❌ Error:", err.message);
  } finally {
    await mongoose.disconnect();
  }
}

resetDoctorPasswords();
