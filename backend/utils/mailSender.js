const nodemailer = require("nodemailer");
require("dotenv").config();

// Create transporter for sending emails
const transporter = nodemailer.createTransporter({
  service: "gmail",
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS,
  },
});

/**
 * Send email utility function
 * @param {string} email - Recipient email
 * @param {string} subject - Email subject
 * @param {string} text - Email body
 */
exports.sendEmail = async (email, subject, text) => {
  try {
    const mailOptions = {
      from: process.env.MAIL_USER,
      to: email,
      subject: subject,
      text: text,
    };

    await transporter.sendMail(mailOptions);
    console.log("Email sent successfully");
    return { success: true };
  } catch (error) {
    console.error("Error sending email:", error);
    throw new Error("Could not send email");
  }
};

/**
 * Send OTP email
 * @param {string} email - Recipient email
 * @param {string} otp - OTP code
 */
exports.sendOTPEmail = async (email, otp) => {
  const subject = "Your OTP Code - Arogya Healthcare";
  const text = `Your OTP code is: ${otp}. It will expire in 5 minutes.`;
  
  return await this.sendEmail(email, subject, text);
};