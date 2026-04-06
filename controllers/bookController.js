// controllers/bookController.js
const Book = require('../models/Book');

exports.getBooks = async (req, res) => {
  try {
    const books = await Book.find().sort({ createdAt: -1 }).lean();
    res.render('partials/layout', { pageTitle: 'Books', page: 'books', books });
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Error loading books');
  }
};
