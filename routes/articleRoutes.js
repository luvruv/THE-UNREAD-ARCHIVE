// routes/articleRoutes.js
const express = require('express');
const router = express.Router();
const articleController = require('../controllers/articleController');
const { ensureAuthenticated, ensureRole } = require('../middleware/authMiddleware');
const Article = require('../models/Article');

router.get('/articles', articleController.getArticles);

// Optional: Keep API for specific client fetching if needed
router.get('/api/articles', async (req, res) => {
  const articles = await Article.find().populate('author', 'name').sort({ createdAt: -1 });
  res.json(articles);
});

// To write, user needs either writer or admin role
router.get('/write', ensureRole('writer', 'admin'), articleController.getWritePage);
router.post('/write', ensureRole('writer', 'admin'), articleController.createArticle);

// Bookmark a specific article (Any logged in user can bookmark)
router.post('/articles/:id/bookmark', ensureAuthenticated, articleController.toggleBookmark);

module.exports = router;
