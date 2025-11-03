	const jwt = require("jsonwebtoken");
	const dotenv = require("dotenv");
	const User = require("../models/User");

	dotenv.config();

	exports.auth = async (req, res, next) => {
	try {
		const token =
		req.cookies.token ||
		req.cookies.access_token ||
		req.body.token ||
		(req.header("Authorization") && req.header("Authorization").replace("Bearer ", ""));

		if (!token) {
		return res.status(401).json({ success: false, message: "Token Missing" });
		}

		try {
		const decode = await jwt.verify(token, process.env.JWT_SECRET);
		req.user = decode;
		next();
		} catch (error) {
		return res.status(401).json({ success: false, message: "Token is invalid" });
		}
	} catch (error) {
		return res.status(401).json({
		success: false,
		message: "Something went wrong while validating the token",
		});
	}
	};

	exports.isPatient = async (req, res, next) => {
	try {
		const userDetails = await User.findById(req.user.id);
		
		if (userDetails.accountType !== "Patient") {
		return res.status(403).json({
			success: false,
			message: "This is a protected route for Patients",
		});
		}
		next();
	} catch (error) {
		return res.status(500).json({ 
		success: false, 
		message: "User role can't be verified" 
		});
	}
	};

	exports.isDoctor = async (req, res, next) => {
	try {
		const userDetails = await User.findById(req.user.id);

		if (userDetails.accountType !== "Doctor") {
		return res.status(403).json({
			success: false,
			message: "This is a protected route for Doctors",
		});
		}
		next();
	} catch (error) {
		return res.status(500).json({ 
		success: false, 
		message: "User role can't be verified" 
		});
	}
	};

	exports.isAdmin = async (req, res, next) => {
	try {
		const userDetails = await User.findById(req.user.id);

		if (userDetails.accountType !== "Admin") {
		return res.status(403).json({
			success: false,
			message: "This is a protected route for Admin",
		});
		}
		next();
	} catch (error) {
		return res.status(500).json({ 
		success: false, 
		message: "User role can't be verified" 
		});
	}
	};