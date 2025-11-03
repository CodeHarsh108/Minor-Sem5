const User = require("../models/User.js");
const Doctor = require("../models/Doctor.js");
const Patient = require("../models/Patient.js");
const Disease = require("../models/Disease.js");
const Appointment = require("../models/Appointment.js");

exports.updateDoctorProfile = async (req, res) => {
  try {
    const userId = req.params.id;
    console.log(userId); // Assuming the doctorId is passed in the URL
    const { accountType } = req.body;

    console.log(accountType);

    if (accountType == "Doctor") {
      // Find the existing doctor profile

      // const {
      //   availableDays,
      //   timeSlot,
      //   consultantFee,
      //   specialization,
      //   experience,
      //   degrees,
      //   certification,
      // } = req.body;

      const Profile = await Doctor.findOneAndUpdate(
        { user: userId },
        req.body,
        { new: true }
      ).populate("user");
      //await Doctor.findById(userId).populate("user");
      if (!Profile) {
        return res.status(404).json({
          success: false,
          message: "Doctor profile not found.",
        });
      }

      console.log("--------> ", Profile);

      // Update the User details (firstName, lastName, email, contactNumber)
      const user = await User.findOneAndUpdate({ _id: userId }, req.body, {
        new: true,
      });
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User associated with this doctor profile not found.",
        });
      }

      // Update common user fields
      // if (dateOfBirth) user.dateOfBirth = dateOfBirth || user.dateOfBirth;
      // if (gender) user.gender = gender || user.gender;
      // if (bloodGroup) user.bloodGroup = bloodGroup || user.bloodGroup;
      // if (contactNumber)
      //   user.contactNumber = contactNumber || user.contactNumber;

      // Save the updated user
      // await user.save();

      // // Update doctor profile fields
      // if (consultantFee)
      //   Profile.consultantFee =
      //     consultantFee || Profile.consultantFee;
      // if (specialization)
      //   Profile.specialization =
      //     specialization || Profile.specialization;
      // // if (availableTimeSlot)
      // //   Profile.availableTimeSlot =
      // //     availableTimeSlot || Profile.availableTimeSlot;
      // if (certification)
      //   Profile.certification =
      //     certification || Profile.certification;
      // if (degrees) Profile.degrees = degrees || Profile.degrees;
      // if (experience)
      //   Profile.experience = experience || Profile.experience;
      // if (timeSlot) Profile.timeSlot = timeSlot || Profile.timeSlot;
      // if (availableDays)
      //   Profile.availableDays =
      //     availableDays || Profile.availableDays;
      // // Profile.images = images;

      // console.log("79===>", Profile.timeSlot);
      // console.log("850=>>", availableDays);

      // // Save the updated doctor profile
      // await Profile.save();

      // const updatedUser = Profile;

      res.status(200).json({
        success: true,
        message: "Doctor profile updated successfully.",
        Profile,
        user
      });
    } else if (accountType == "Patient") {
      const Profile = await Patient.findOneAndUpdate(
        { user: userId },
        req.body,
        { new: true }
      );
      //await Doctor.findById(userId).populate("user");
      if (!Profile) {
        return res.status(404).json({
          success: false,
          message: "Doctor profile not found.",
        });
      }

      console.log("--------> ", Profile);

      // Update the User details (firstName, lastName, email, contactNumber)
      const user = await User.findOneAndUpdate({ _id: userId }, req.body, {
        new: true,
      });
      if (!user) {
        return res.status(404).json({
          success: false,
          message: "User associated with this doctor profile not found.",
        });
      }
      console.log(user);

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
    // Fetch all doctors and populate related user data
    const doctors = await Doctor.find().populate("user");

    // Check if any doctors were found
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

// controllers/diseaseController.js

exports.getMedicines = async (req, res) => {
  try {
    const { diseaseName } = req.query; // Get the disease name from the query parameter

    if (!diseaseName) {
      return res.status(400).json({ message: "Disease name is required" });
    }

    // Search for the disease in the database (case-insensitive search)
    const disease = await Disease.findOne({
      disease: { $regex: diseaseName, $options: "i" },
    });

    if (!disease) {
      return res.status(404).json({ message: "Disease not found" });
    }

    // Send the disease's allopathic and ayurvedic medicines
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

    // Build query object to search doctors
    let doctorQuery = {};

    if (specialization) {
      // Add specialization to query if provided
      doctorQuery.specialization = { $regex: specialization, $options: "i" }; // Case-insensitive search
    }

    // Search for doctors based on firstName or lastName by referencing User schema
    const userQuery = {};
    if (firstName) {
      userQuery.firstName = { $regex: firstName, $options: "i" };
    }
    if (lastName) {
      userQuery.lastName = { $regex: lastName, $options: "i" };
    }

    // Find users matching firstName or lastName
    const matchedUsers = await User.find(userQuery).select("_id");

    // If no matching users found, return an empty list
    if (matchedUsers.length === 0) {
      return res
        .status(404)
        .json({ message: "No users found matching your name criteria" });
    }

    // Add condition to the doctor query to match doctors with the corresponding user IDs
    doctorQuery.user = { $in: matchedUsers.map((user) => user._id) };

    // Search for doctors based on the query object
    const doctors = await Doctor.find(doctorQuery)
      .populate(
        "user",
        "firstName lastName email contactNumber image accountType"
      ) // Populate user data
      .exec();

    // If no doctors found, return a 404 message
    if (doctors.length === 0) {
      return res
        .status(404)
        .json({ message: "No doctors found matching your criteria" });
    }

    // Return the found doctors
    res.status(200).json({ doctors });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};



exports.deleteDoctor = async (req, res) => {
  try {
    const { userId } = req.params;
    console.log("Deleting doctor with userId:", userId);

    // FIXED: Correct query syntax
    const deletedDoctor = await Doctor.findOneAndDelete({ user: userId });
    const deletedUser = await User.findByIdAndDelete(userId);

    if (!deletedDoctor || !deletedUser) {
      return res.status(404).json({ 
        success: false,
        message: "Doctor not found" 
      });
    }

    res.status(200).json({ 
      success: true,
      message: "Doctor deleted successfully" 
    });
  } catch (error) {
    console.error("Error deleting doctor:", error);
    res.status(500).json({ 
      success: false,
      message: "Server error", 
      error: error.message 
    });
  }
};

exports.deletePatient = async (req, res) => {
  try {
    const { userId } = req.params;
    console.log("Deleting patient with userId:", userId);

    // FIXED: Correct query syntax
    const deletedPatient = await Patient.findOneAndDelete({ user: userId });
    const deletedUser = await User.findByIdAndDelete(userId);

    if (!deletedPatient || !deletedUser) {
      return res.status(404).json({ 
        success: false,
        message: "Patient not found" 
      });
    }

    res.status(200).json({ 
      success: true,
      message: "Patient deleted successfully" 
    });
  } catch (error) {
    console.error("Error deleting patient:", error);
    res.status(500).json({ 
      success: false,
      message: "Server error", 
      error: error.message 
    });
  }
};

// FIXED: Add proper error handling to bookAppointment
exports.bookAppointment = async (req, res) => {
  try {
    const { user, doctor, date, timeSlot, description, paymentStatus } = req.body;

    // Validate required fields
    if (!user || !doctor || !date || !timeSlot) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: user, doctor, date, and timeSlot are required"
      });
    }

    // Convert date string to Date object if it's a string
    const appointmentDate = new Date(date);
    if (isNaN(appointmentDate.getTime())) {
      return res.status(400).json({
        success: false,
        message: "Invalid date format"
      });
    }

    // Fetch the doctor's available time slots from the Doctor schema
    const doctorDetails = await Doctor.findById(doctor);
    if (!doctorDetails) {
      return res.status(404).json({
        success: false,
        message: "Doctor not found.",
      });
    }

    const { availableTimeSlot } = doctorDetails;

    // Ensure the user's selected time slot is within the doctor's available time slot
    if (
      timeSlot.start < availableTimeSlot.start ||
      timeSlot.end > availableTimeSlot.end
    ) {
      return res.status(400).json({
        success: false,
        message: `The selected time slot is outside the doctor's available time range of ${availableTimeSlot.start} to ${availableTimeSlot.end}.`,
      });
    }

    // Validate the duration of the time slot (minimum 15 minutes, maximum 45 minutes)
    const startTime = new Date(`1970-01-01T${timeSlot.start}:00Z`);
    const endTime = new Date(`1970-01-01T${timeSlot.end}:00Z`);
    const duration = (endTime - startTime) / (1000 * 60); // Duration in minutes

    if (duration < 15 || duration > 45) {
      return res.status(400).json({
        success: false,
        message: "The time slot must be at least 15 minutes and at most 45 minutes long.",
      });
    }

    // Check if any existing appointment overlaps with the new time slot
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

    // Create and save a new appointment
    let appointment = new Appointment({
      patient: user,
      doctor,
      date: appointmentDate,
      timeSlot,
      description,
      paymentStatus: paymentStatus || false,
    });

    await appointment.save();

    // Populate the fields after saving
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

    // Find all appointments for the given doctor
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

    // Format the response to group by date
    const groupedTimeSlots = appointments.reduce((acc, appointment) => {
      const dateKey = appointment.date.toISOString().split("T")[0];
      
      if (!acc[dateKey]) {
        acc[dateKey] = {
          timeSlots: [],
        };
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


exports.getAppointmentsByDoctor = async (req, res) => { // Removed 'next' parameter
  try {
    const doctorId = req.params.doctorId;

    const appointments = await Appointment.find({ doctor: doctorId }).populate(
      "patient",
      "firstName lastName contactNumber accountType gender"
    );

    if (!appointments || appointments.length === 0) {
      return res.status(200).json({ // Changed to 200 for empty results
        success: true,
        message: "No appointments found for this doctor",
        data: []
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
      message: "Server error fetching appointments"
    });
  }
};

exports.getAppointmentsByPatient = async (req, res) => { // Removed 'next' parameter
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
      return res.status(200).json({ // Changed to 200 for empty results
        success: true,
        message: "No appointments found for this patient",
        data: []
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
      message: "Server error fetching appointments"
    });
  }
};

exports.deleteAppointment = async (req, res) => { // Removed 'next' parameter
  try {
    const { id } = req.params;
    
    const appointment = await Appointment.findById(id);
    if (!appointment) {
      return res.status(404).json({ 
        success: false,
        message: "Appointment not found" 
      });
    }

    await Appointment.findByIdAndDelete(id);

    res.status(200).json({ 
      success: true,
      message: "Appointment deleted successfully" 
    });
  } catch (error) {
    console.error("Error deleting appointment:", error);
    res.status(500).json({
      success: false,
      message: "Server error deleting appointment"
    });
  }
};