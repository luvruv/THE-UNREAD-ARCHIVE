// routes/bookRoutes.js
const express = require('express');
const router = express.Router();
const bookController = require('../controllers/bookController');

router.get('/books', bookController.getBooks);

module.exports = router;
