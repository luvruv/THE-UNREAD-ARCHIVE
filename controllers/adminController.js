// controllers/adminController.js
const Book = require('../models/Book');

exports.getAdminBooks = async (req, res) => {
  try {
    const books = await Book.find().sort({ createdAt: -1 }).lean();
    res.render('partials/layout', {
      pageTitle: 'Manage Books',
      page: 'admin-books',
      books
    });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error loading admin page');
  }
};

exports.createBook = async (req, res) => {
  try {
    const { title, description, image } = req.body;
    await Book.create({ title, description, image });
    res.redirect('/admin/books');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error creating book');
  }
};

exports.updateBook = async (req, res) => {
  try {
    const { title, description, image } = req.body;
    await Book.findByIdAndUpdate(req.params.id, { title, description, image }, { runValidators: true });
    res.redirect('/admin/books');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error updating book');
  }
};

exports.deleteBook = async (req, res) => {
  try {
    await Book.findByIdAndDelete(req.params.id);
    res.redirect('/admin/books');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error deleting book');
  }
};
