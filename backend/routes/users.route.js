const express = require("express");
const router = express.Router();
const {
  updateDoctorProfile,
  getAllDoctors,
  getMedicines,
  searchDoctors,
  deleteDoctor,
  deletePatient,
  getAppointmentsByPatient,
  getAppointmentsByDoctor,
  deleteAppointment,
  bookAppointment,
  getBookedTimeSlots,
} = require("../controllers/User.js");

// Profile routes
router.post("/update-profile/:id", updateDoctorProfile);
router.get("/doctors", getAllDoctors);

// Medicine routes
router.get("/medicines", getMedicines);

// Doctor search and management
router.get("/search-doctors", searchDoctors);
router.delete("/delete-doctor/:userId", deleteDoctor);
router.delete("/delete-patient/:userId", deletePatient);

// Appointment routes
router.post("/book-appointment", bookAppointment);
router.get("/available-appointment/:doctorId", getBookedTimeSlots);
router.get("/patients-bookings/:patientId", getAppointmentsByPatient);
router.get("/doctors-bookings/:doctorId", getAppointmentsByDoctor);
router.delete("/delete-appointment/:id", deleteAppointment);

module.exports = router;