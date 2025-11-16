// models/Article.js
const mongoose = require('mongoose');

const articleSchema = new mongoose.Schema({
  title: { type: String, required: true },
  tag: { type: String, default: 'Article' },          // e.g. Poem, Story, Essay
  author: { type: String, default: 'Anonymous' },
  readTime: { type: String, default: '3 min read' },
  excerpt: { type: String, default: '' },
  content: { type: String, required: true },          // full text
  coverImage: { type: String, default: '' },
  isCommunity: { type: Boolean, default: true },      // mark user-written ones
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Article', articleSchema);
