// models/Article.js
const mongoose = require('mongoose');

const articleSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  tag: { type: String, default: 'Article', trim: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  readTime: { type: String, default: '3 min read' },
  excerpt: { type: String, default: '', trim: true },
  content: { type: String, required: true },
  coverImage: { type: String, default: '' },
  isCommunity: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Article', articleSchema);
