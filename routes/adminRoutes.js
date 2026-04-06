// routes/adminRoutes.js
const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

router.get('/books', adminController.getAdminBooks);
router.post('/books', adminController.createBook);
router.post('/books/:id/edit', adminController.updateBook);
router.post('/books/:id/delete', adminController.deleteBook);

module.exports = router;
