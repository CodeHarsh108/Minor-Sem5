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
  getDoctorByUserId,
  getPatientDetails,
  addCollaboratingDoctor,
  removeCollaboratingDoctor,
  getCollaboratingAppointments,
} = require("../controllers/User.js");

// Profile routes
router.post("/update-profile/:id", updateDoctorProfile);
router.get("/doctors", getAllDoctors);
router.get("/doctor/:userId", getDoctorByUserId);

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

// Patient details (for doctors)
router.get("/patient-details/:userId", getPatientDetails);

// Doctor collaboration routes
router.post("/appointment/:appointmentId/collaborate", addCollaboratingDoctor);
router.delete("/appointment/:appointmentId/collaborate/:doctorId", removeCollaboratingDoctor);
router.get("/collaborating-appointments/:doctorId", getCollaboratingAppointments);

module.exports = router;