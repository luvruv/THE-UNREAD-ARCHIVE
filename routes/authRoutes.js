// routes/authRoutes.js
const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

router.get('/signin', authController.getSignInPage);
router.get('/signup', (req, res) => res.redirect('/signin')); // Redirect to merged page
router.post('/signup', authController.signup);
router.post('/signin', authController.signin);
router.post('/logout', authController.logout);

module.exports = router;
