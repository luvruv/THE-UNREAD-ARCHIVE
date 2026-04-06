// routes/indexRoutes.js
const express = require('express');
const router = express.Router();

const Article = require('../models/Article');
const Book = require('../models/Book');

router.get('/', (req, res) => res.redirect('/home'));
router.get('/home', (req, res) => res.render('partials/layout', { pageTitle: 'Home', page: 'home' }));
router.get('/about', (req, res) => res.render('partials/layout', { pageTitle: 'About', page: 'about' }));
router.get('/archive', (req, res) => res.render('partials/layout', { pageTitle: 'Archive', page: 'archive' }));

router.get('/api/archive', async (req, res) => {
  try {
    const articles = await Article.find().populate('author', 'name').lean();
    const books = await Book.find().lean();
    res.json({
      articles: articles.map(a => ({
        id: a._id.toString(),
        title: a.title,
        author: a.author ? a.author.name : 'Unknown',
        tag: a.tag || 'Community',
        excerpt: a.excerpt || (a.content ? a.content.substring(0, 100) : '')
      })),
      books: books.map(b => ({
        id: b._id.toString(),
        title: b.title,
        description: b.description,
        image: b.image
      }))
    });
  } catch (err) {
    res.status(500).json({ error: 'Server Error' });
  }
});

module.exports = router;
