const express = require('express');
const router = express.Router();
const { signup, login, logout, googleAuth } = require('../controllers/Auth.js');
const { auth } = require('../middleware/auth.js');

router.post('/signup', signup);
router.post('/login', login);
router.post('/google', googleAuth); // New Google auth route
router.get('/logout', auth, logout); // Added auth middleware for logout

module.exports = router;