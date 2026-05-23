/**
 * Diagnostic + fix script
 * - Lists all User accounts with accountType=Doctor
 * - Checks if each has a Doctor document
 * - Creates missing Doctor documents
 * Run: node fix-doctor-profiles.js
 */
const mongoose = require("mongoose");
const dns = require("dns");
require("dotenv").config();

dns.setServers(["8.8.8.8", "8.8.4.4"]);

const User = require("./models/User.js");
const Doctor = require("./models/Doctor.js");

async function fixDoctorProfiles() {
  await mongoose.connect(process.env.DATA_BASE_URL);
  console.log("✅ Connected\n");

  const doctorUsers = await User.find({ accountType: "Doctor" });
  console.log(`Found ${doctorUsers.length} Doctor user accounts:\n`);

  for (const u of doctorUsers) {
    const doc = await Doctor.findOne({ user: u._id });
    const status = doc ? "✅ Doctor doc exists" : "❌ MISSING Doctor doc";
    console.log(`${status} | ${u.firstName} ${u.lastName} | userId: ${u._id} | doctorId: ${doc?._id || "—"}`);

    if (!doc) {
      const newDoc = new Doctor({
        user: u._id,
        approvalStatus: true,
      });
      await newDoc.save();
      console.log(`   → Created Doctor profile for ${u.firstName} ${u.lastName}`);
    }
  }

  console.log("\n✅ All doctor profiles fixed.");
  await mongoose.disconnect();
}

fixDoctorProfiles().catch(console.error);
