const express = require('express');
const router = express.Router();
const { signup, login, logout, googleAuth, doctorLogin } = require('../controllers/Auth.js');
const { auth } = require('../middleware/auth.js');

router.post('/signup', signup);
router.post('/login', login);
router.post('/doctor-login', doctorLogin); // Name-based doctor login
router.post('/google', googleAuth);
router.get('/logout', auth, logout);

module.exports = router;