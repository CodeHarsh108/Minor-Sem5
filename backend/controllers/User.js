const User = require("../models/User.js");
const Doctor = require("../models/Doctor.js");
const Patient = require("../models/Patient.js");
const Disease = require("../models/Disease.js");
const Appointment = require("../models/Appointment.js");

exports.updateDoctorProfile = async (req, res) => {
  try {
    const userId = req.params.id;
    const { accountType } = req.body;

    if (accountType == "Doctor") {
      const Profile = await Doctor.findOneAndUpdate(
        { user: userId },
        req.body,
        { new: true }
      ).populate("user");

      if (!Profile) {
        return res.status(404).json({
          success: false,
          message: "Doctor profile not found.",
        });
      }

      const user = await User.findOneAndUpdate({ _id: userId }, req.body, {
        new: true,
      });
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User associated with this doctor profile not found.",
        });
      }

      res.status(200).json({
        success: true,
        message: "Doctor profile updated successfully.",
        Profile,
        user,
      });
    } else if (accountType == "Patient") {
      const Profile = await Patient.findOneAndUpdate(
        { user: userId },
        req.body,
        { new: true }
      );

      if (!Profile) {
        return res.status(404).json({
          success: false,
          message: "Patient profile not found.",
        });
      }

      const user = await User.findOneAndUpdate({ _id: userId }, req.body, {
        new: true,
      });
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User associated with this patient profile not found.",
        });
      }

      res.status(200).json({
        success: true,
        message: "Patient profile updated successfully.",
        Profile,
        user,
      });
    }
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server error. Please try again later.",
    });
  }
};

exports.getAllDoctors = async (req, res) => {
  try {
    const allDoctors = await Doctor.find().populate("user");

    // Filter out doctors whose user was deleted (null after populate)
    const doctors = allDoctors.filter(d => d.user != null);

    if (!doctors || doctors.length === 0) {
      return res.status(404).json({
        success: false,
        message: "No doctors found.",
      });
    }

    res.status(200).json({
      success: true,
      message: "Doctors retrieved successfully.",
      doctors,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server error. Please try again later.",
    });
  }
};

// Get doctor by user ID
exports.getDoctorByUserId = async (req, res) => {
  try {
    const { userId } = req.params;

    const doctor = await Doctor.findOne({ user: userId }).populate(
      "user",
      "firstName lastName email contactNumber image accountType gender bloodGroup dateOfBirth"
    );

    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor profile not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Doctor profile retrieved successfully",
      doctor,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server error. Please try again later.",
    });
  }
};

// Get full patient details (for doctors to view)
exports.getPatientDetails = async (req, res) => {
  try {
    const { userId } = req.params;

    const user = await User.findById(userId).select(
      "firstName lastName email contactNumber gender bloodGroup dateOfBirth image accountType"
    );

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "Patient not found",
      });
    }

    const patientProfile = await Patient.findOne({ user: userId });

    res.status(200).json({
      success: true,
      message: "Patient details retrieved successfully",
      user,
      patientProfile: patientProfile || null,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server error. Please try again later.",
    });
  }
};

// Add a collaborating doctor to an appointment
exports.addCollaboratingDoctor = async (req, res) => {
  try {
    const { appointmentId } = req.params;
    const { doctorId } = req.body;

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    // Check if doctor is the primary doctor
    if (appointment.doctor.toString() === doctorId) {
      return res.status(400).json({
        success: false,
        message: "The primary doctor cannot be added as a collaborator",
      });
    }

    // Check if already collaborating
    if (
      appointment.collaboratingDoctors
        .map((id) => id.toString())
        .includes(doctorId)
    ) {
      return res.status(400).json({
        success: false,
        message: "This doctor is already collaborating on this appointment",
      });
    }

    appointment.collaboratingDoctors.push(doctorId);
    await appointment.save();

    const updatedAppointment = await Appointment.findById(appointmentId)
      .populate({
        path: "patient",
        select: "firstName lastName email contactNumber gender accountType image",
        model: "User",
      })
      .populate({
        path: "doctor",
        populate: {
          path: "user",
          model: "User",
          select: "firstName lastName email image",
        },
      })
      .populate({
        path: "collaboratingDoctors",
        populate: {
          path: "user",
          model: "User",
          select: "firstName lastName email image specialization",
        },
      });

    res.status(200).json({
      success: true,
      message: "Collaborating doctor added successfully",
      appointment: updatedAppointment,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server error. Please try again later.",
    });
  }
};

// Remove a collaborating doctor from an appointment
exports.removeCollaboratingDoctor = async (req, res) => {
  try {
    const { appointmentId, doctorId } = req.params;

    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    appointment.collaboratingDoctors = appointment.collaboratingDoctors.filter(
      (id) => id.toString() !== doctorId
    );
    await appointment.save();

    res.status(200).json({
      success: true,
      message: "Collaborating doctor removed successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server error. Please try again later.",
    });
  }
};

// Get appointments where the doctor is a collaborator
exports.getCollaboratingAppointments = async (req, res) => {
  try {
    const { doctorId } = req.params;

    const appointments = await Appointment.find({
      collaboratingDoctors: doctorId,
    })
      .populate({
        path: "patient",
        select: "firstName lastName email contactNumber gender accountType image",
        model: "User",
      })
      .populate({
        path: "doctor",
        populate: {
          path: "user",
          model: "User",
          select: "firstName lastName email image",
        },
      })
      .populate({
        path: "collaboratingDoctors",
        populate: {
          path: "user",
          model: "User",
          select: "firstName lastName email image",
        },
      })
      .sort({ date: 1, "timeSlot.start": 1 });

    res.status(200).json({
      success: true,
      message: "Collaborating appointments retrieved successfully",
      data: appointments,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Server error. Please try again later.",
    });
  }
};

exports.getMedicines = async (req, res) => {
  try {
    const { diseaseName } = req.query;

    if (!diseaseName) {
      return res.status(400).json({ message: "Disease name is required" });
    }

    const disease = await Disease.findOne({
      disease: { $regex: diseaseName, $options: "i" },
    });

    if (!disease) {
      return res.status(404).json({ message: "Disease not found" });
    }

    return res.json({
      disease: disease.disease,
      Allopathic: disease.Allopathic,
      Ayurvedic: disease.Ayurvedic,
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Server error" });
  }
};

exports.searchDoctors = async (req, res) => {
  try {
    const { firstName, lastName, specialization } = req.query;

    let doctorQuery = {};

    if (specialization) {
      doctorQuery.specialization = { $regex: specialization, $options: "i" };
    }

    const userQuery = {};
    if (firstName) {
      userQuery.firstName = { $regex: firstName, $options: "i" };
    }
    if (lastName) {
      userQuery.lastName = { $regex: lastName, $options: "i" };
    }

    const matchedUsers = await User.find(userQuery).select("_id");

    if (matchedUsers.length === 0) {
      return res
        .status(404)
        .json({ message: "No users found matching your name criteria" });
    }

    doctorQuery.user = { $in: matchedUsers.map((user) => user._id) };

    const doctors = await Doctor.find(doctorQuery)
      .populate("user", "firstName lastName email contactNumber image accountType")
      .exec();

    if (doctors.length === 0) {
      return res
        .status(404)
        .json({ message: "No doctors found matching your criteria" });
    }

    res.status(200).json({ doctors });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

exports.deleteDoctor = async (req, res) => {
  try {
    const { userId } = req.params;

    const deletedDoctor = await Doctor.findOneAndDelete({ user: userId });
    const deletedUser = await User.findByIdAndDelete(userId);

    if (!deletedDoctor || !deletedUser) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Doctor deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting doctor:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

exports.deletePatient = async (req, res) => {
  try {
    const { userId } = req.params;

    const deletedPatient = await Patient.findOneAndDelete({ user: userId });
    const deletedUser = await User.findByIdAndDelete(userId);

    if (!deletedPatient || !deletedUser) {
      return res.status(404).json({
        success: false,
        message: "Patient not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Patient deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting patient:", error);
    res.status(500).json({
      success: false,
      message: "Server error",
      error: error.message,
    });
  }
};

exports.bookAppointment = async (req, res) => {
  try {
    const { user, doctor, date, timeSlot, description, paymentStatus, medicalHistory, medications, savedMedicines } = req.body;

    if (!user || !doctor || !date || !timeSlot) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: user, doctor, date, and timeSlot are required",
      });
    }

    const appointmentDate = new Date(date);
    if (isNaN(appointmentDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid date format",
      });
    }

    const doctorDetails = await Doctor.findById(doctor);
    if (!doctorDetails) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found.",
      });
    }

    const { availableTimeSlot } = doctorDetails;

    // Only validate time range if doctor has availableTimeSlot configured
    if (availableTimeSlot && availableTimeSlot.start && availableTimeSlot.end) {
      if (
        timeSlot.start < availableTimeSlot.start ||
        timeSlot.end > availableTimeSlot.end
      ) {
        return res.status(400).json({
          success: false,
          message: `The selected time slot is outside the doctor's available time range of ${availableTimeSlot.start} to ${availableTimeSlot.end}.`,
        });
      }
    }

    const startTime = new Date(`1970-01-01T${timeSlot.start}:00Z`);
    const endTime = new Date(`1970-01-01T${timeSlot.end}:00Z`);
    const duration = (endTime - startTime) / (1000 * 60);

    if (duration < 15 || duration > 45) {
      return res.status(400).json({
        success: false,
        message: "The time slot must be at least 15 minutes and at most 45 minutes long.",
      });
    }

    const overlappingAppointment = await Appointment.findOne({
      doctor,
      date: appointmentDate,
      $or: [
        {
          "timeSlot.start": { $lt: timeSlot.end },
          "timeSlot.end": { $gt: timeSlot.start },
        },
      ],
    });

    if (overlappingAppointment) {
      return res.status(409).json({
        success: false,
        message: "This time slot is already booked for the selected doctor.",
      });
    }

    let appointment = new Appointment({
      patient: user,
      doctor,
      date: appointmentDate,
      timeSlot,
      description,
      paymentStatus: paymentStatus || false,
    });

    await appointment.save();

    // Generate Jitsi meeting link using the appointment's _id
    appointment.meetingLink = `https://meet.jit.si/AyurSamhita-${appointment._id}`;
    await appointment.save();

    // Save patient medical data to Patient profile (upsert)
    if (medicalHistory || medications || savedMedicines) {
      const patientUpdate = {};
      if (medicalHistory) patientUpdate.medicalHistory = medicalHistory;
      if (medications) patientUpdate.medications = medications;
      if (savedMedicines && savedMedicines.length > 0) {
        // Build allergies/medicine list from saved medicines
        const medicineNames = savedMedicines.map(m => `${m.name} (${m.medicineType} - for ${m.disease})`).join(', ');
        patientUpdate.allergies = medicineNames;
      }

      if (Object.keys(patientUpdate).length > 0) {
        await Patient.findOneAndUpdate(
          { user: user },
          { $set: patientUpdate },
          { upsert: true, new: true }
        );
      }
    }

    appointment = await Appointment.findById(appointment._id)
      .populate("patient")
      .populate("doctor");

    res.status(201).json({
      success: true,
      message: "Appointment booked successfully.",
      appointment,
    });
  } catch (error) {
    console.error("Error booking appointment:", error);
    res.status(500).json({
      success: false,
      message: "Server error. Unable to book appointment.",
    });
  }
};

exports.getBookedTimeSlots = async (req, res) => {
  try {
    const { doctorId } = req.params;

    const appointments = await Appointment.find(
      { doctor: doctorId },
      "date timeSlot"
    )
      .sort({ date: 1, "timeSlot.start": 1 })
      .lean();

    if (!appointments.length) {
      return res.status(200).json({
        success: true,
        message: "No appointments found for the given doctor.",
        bookedTimeSlots: {},
      });
    }

    const groupedTimeSlots = appointments.reduce((acc, appointment) => {
      const dateKey = appointment.date.toISOString().split("T")[0];

      if (!acc[dateKey]) {
        acc[dateKey] = { timeSlots: [] };
      }

      acc[dateKey].timeSlots.push(appointment.timeSlot);
      return acc;
    }, {});

    res.status(200).json({
      success: true,
      message: "Booked time slots retrieved successfully.",
      bookedTimeSlots: groupedTimeSlots,
    });
  } catch (error) {
    console.error("Error fetching booked time slots:", error);
    res.status(500).json({
      success: false,
      message: "Server error. Unable to fetch booked time slots.",
    });
  }
};

exports.getAppointmentsByDoctor = async (req, res) => {
  try {
    const doctorId = req.params.doctorId;

    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found",
      });
    }

    const appointments = await Appointment.find({ doctor: doctorId })
      .populate({
        path: "patient",
        select: "firstName lastName email contactNumber gender accountType image bloodGroup dateOfBirth",
        model: "User",
      })
      .populate({
        path: "collaboratingDoctors",
        populate: {
          path: "user",
          model: "User",
          select: "firstName lastName email image",
        },
      })
      .sort({ date: 1, "timeSlot.start": 1 });

    if (!appointments || appointments.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No appointments found for this doctor",
        data: [],
      });
    }

    res.status(200).json({
      success: true,
      message: "Appointments retrieved successfully",
      results: appointments.length,
      data: appointments,
    });
  } catch (error) {
    console.error("Error fetching doctor appointments:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching appointments",
    });
  }
};

exports.getAppointmentsByPatient = async (req, res) => {
  try {
    const patientId = req.params.patientId;

    const appointments = await Appointment.find({ patient: patientId }).populate({
      path: "doctor",
      select: "consultantFee availableDays availableTimeSlot",
      populate: {
        path: "user",
        model: "User",
        select: "firstName lastName contactNumber gender accountType image",
      },
    });

    if (!appointments || appointments.length === 0) {
      return res.status(200).json({
        success: true,
        message: "No appointments found for this patient",
        data: [],
      });
    }

    res.status(200).json({
      success: true,
      message: "Appointments retrieved successfully",
      results: appointments.length,
      data: appointments,
    });
  } catch (error) {
    console.error("Error fetching patient appointments:", error);
    res.status(500).json({
      success: false,
      message: "Server error fetching appointments",
    });
  }
};

exports.deleteAppointment = async (req, res) => {
  try {
    const { id } = req.params;

    const appointment = await Appointment.findById(id);
    if (!appointment) {
      return res.status(404).json({
        success: false,
        message: "Appointment not found",
      });
    }

    await Appointment.findByIdAndDelete(id);

    res.status(200).json({
      success: true,
      message: "Appointment deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting appointment:", error);
    res.status(500).json({
      success: false,
      message: "Server error deleting appointment",
    });
  }
};