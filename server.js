// server.js
const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const session = require('express-session');
const bcrypt = require('bcryptjs');

const Book = require('./models/Book');
const Article = require('./models/Article');
const User = require('./models/User');

const app = express();

// ====== MongoDB connection ======
mongoose
  .connect('mongodb://127.0.0.1:27017/unreadArchive', {
    useNewUrlParser: true,
    useUnifiedTopology: true
  })
  .then(() => console.log('✅ MongoDB connected'))
  .catch(err => console.error('MongoDB error:', err));

// ====== Middleware ======
app.use(express.urlencoded({ extended: true })); // for form POSTs
app.use(express.json());                         // for JSON APIs

// Serve static files (bundle.js, images, JSON, CSS)
app.use(express.static(path.join(__dirname, 'public')));

// ================= SESSION SETUP =================
app.use(
  session({
    secret: 'unread-archive-secret', // you can change this to any random string
    resave: false,
    saveUninitialized: false
  })
);

// Make logged-in user available in all EJS views
app.use((req, res, next) => {
  res.locals.currentUser = req.session.user || null;
  next();
});

// Set EJS as view engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ====== Routes: pages (frontend-backend flow) ======
app.get('/', (req, res) => {
  res.redirect('/home');
});

// IMPORTANT: always render the layout and tell it which page to include
app.get('/home', (req, res) => {
  res.render('partials/layout', { pageTitle: 'Home', page: 'home' });
});

app.get('/about', (req, res) => {
  res.render('partials/layout', { pageTitle: 'About', page: 'about' });
});

app.get('/archive', (req, res) => {
  res.render('partials/layout', { pageTitle: 'Archive', page: 'archive' });
});

// Articles page (show JSON + community articles from MongoDB)
app.get('/articles', async (req, res) => {
  let communityArticles = [];
  try {
    communityArticles = await Article.find({}).sort({ createdAt: -1 });
  } catch (err) {
    console.error('Error fetching articles from MongoDB:', err.message);
  }

  res.render('partials/layout', {
    pageTitle: 'Articles',
    page: 'articles',
    communityArticles
  });
});

// Books page pulls from Mongo (R in CRUD)
app.get('/books', async (req, res) => {
  const books = await Book.find().sort({ createdAt: -1 });
  res.render('partials/layout', { pageTitle: 'Books', page: 'books', books });
});

// Show article writing form
app.get('/write', (req, res) => {
  res.render('partials/layout', {
    pageTitle: 'Write',
    page: 'write'
  });
});

// Handle article submission (Create community article)
app.post('/write', async (req, res) => {
  try {
    const { title, tag, author, readTime, excerpt, content, coverImage } = req.body;

    if (!title || !content) {
      // basic validation
      return res.status(400).send('Title and content are required.');
    }

    await Article.create({
      title,
      tag: tag || 'Article',
      author: author || 'Anonymous',
      readTime: readTime || '3 min read',
      excerpt: excerpt || content.slice(0, 120) + '...',
      content,
      coverImage
    });

    // After saving, redirect to Articles page
    res.redirect('/articles');
  } catch (err) {
    console.error('Error creating article:', err);
    res.status(500).send('Failed to publish article.');
  }
});

// ================= AUTH ROUTES (single /signin page) =================

// Show combined Sign In / Sign Up page
app.get('/signin', (req, res) => {
  res.render('partials/layout', {
    pageTitle: 'Sign In / Sign Up',
    page: 'signin'
  });
});

// If someone hits /signup directly, redirect to /signin
app.get('/signup', (req, res) => {
  res.redirect('/signin');
});

// Handle sign up (from Sign Up tab on signin page)
app.post('/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!email || !password) {
      console.log('Signup validation failed');
      return res.redirect('/signin');
    }

    const existing = await User.findOne({ email });
    if (existing) {
      console.log('User already exists');
      return res.redirect('/signin');
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, passwordHash });

    // Log the user in (set session)
    req.session.user = {
      id: user._id,
      email: user.email,
      name: user.name
    };

    res.redirect('/home');
  } catch (err) {
    console.error('Signup error:', err);
    res.redirect('/signin');
  }
});

// Handle sign in
app.post('/signin', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      console.log('No account found with that email.');
      return res.redirect('/signin');
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      console.log('Incorrect password.');
      return res.redirect('/signin');
    }

    // Store minimal user info in session
    req.session.user = {
      id: user._id,
      email: user.email,
      name: user.name
    };

    res.redirect('/home');
  } catch (err) {
    console.error('Signin error:', err);
    res.redirect('/signin');
  }
});

// Logout
app.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/home');
  });
});

// ====== Admin: full CRUD for Books (MongoDB rubric) ======
app.get('/admin/books', async (req, res) => {
  const books = await Book.find().sort({ createdAt: -1 });
  res.render('partials/layout', {
    pageTitle: 'Manage Books',
    page: 'admin-books',
    books
  });
});

// CREATE
app.post('/admin/books', async (req, res) => {
  try {
    const { title, description, image } = req.body;
    await Book.create({ title, description, image });
    res.redirect('/admin/books');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error creating book');
  }
});

// UPDATE
app.post('/admin/books/:id/edit', async (req, res) => {
  try {
    const { title, description, image } = req.body;
    await Book.findByIdAndUpdate(req.params.id, { title, description, image });
    res.redirect('/admin/books');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error updating book');
  }
});

// DELETE
app.post('/admin/books/:id/delete', async (req, res) => {
  try {
    await Book.findByIdAndDelete(req.params.id);
    res.redirect('/admin/books');
  } catch (err) {
    console.error(err);
    res.status(500).send('Error deleting book');
  }
});

// Articles JSON API (optional)
app.get('/api/articles', async (req, res) => {
  const articles = await Article.find().sort({ createdAt: -1 });
  res.json(articles);
});

// ====== Start server ======
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
