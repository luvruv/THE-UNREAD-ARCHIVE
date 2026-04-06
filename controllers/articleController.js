// controllers/articleController.js
const Article = require('../models/Article');
const User = require('../models/User');

exports.getArticles = async (req, res) => {
  let communityArticles = [];
  try {
    communityArticles = await Article.find({})
      .populate('author', 'name email')
      .sort({ createdAt: -1 })
      .lean();
  } catch (err) {
    console.error('Error fetching articles from MongoDB:', err.message);
  }

  // Pre-load user bookmarks if authenticated
  let userBookmarks = [];
  if (req.session && req.session.user) {
    const user = await User.findById(req.session.user.id).select('bookmarks').lean();
    if (user) {
      userBookmarks = user.bookmarks.map(id => id.toString());
    }
  }

  res.render('partials/layout', {
    pageTitle: 'Articles',
    page: 'articles',
    communityArticles,
    userBookmarks
  });
};

exports.getWritePage = (req, res) => {
  res.render('partials/layout', {
    pageTitle: 'Write',
    page: 'write'
  });
};

exports.createArticle = async (req, res) => {
  try {
    const { title, tag, readTime, excerpt, content, coverImage } = req.body;

    if (!title || !content) {
      return res.status(400).send('Title and content are required.');
    }

    await Article.create({
      title,
      tag: tag || 'Article',
      author: req.session.user.id, // Using authenticated user
      readTime: readTime || '3 min read',
      excerpt: excerpt || content.slice(0, 120) + '...',
      content,
      coverImage
    });

    res.redirect('/articles');
  } catch (err) {
    console.error('Error creating article:', err);
    res.status(500).send('Failed to publish article.');
  }
};

exports.toggleBookmark = async (req, res) => {
  try {
    const articleId = req.params.id;
    const userId = req.session.user.id;

    const user = await User.findById(userId);
    if (!user) return res.status(404).send('User not found');

    const index = user.bookmarks.indexOf(articleId);
    if (index === -1) {
      user.bookmarks.push(articleId); // add bookmark
    } else {
      user.bookmarks.splice(index, 1); // remove bookmark
    }
    
    await user.save();
    res.redirect('/articles'); // Or return JSON for AJAX
  } catch (err) {
    console.error('Error bookmarking:', err);
    res.status(500).send('Server Error');
  }
};
