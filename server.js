require('dotenv').config();
const express = require('express');
const path = require('path');
const session = require('express-session');
const morgan = require('morgan');

const connectDB = require('./config/db');
const applySecurity = require('./middleware/securityMiddleware');
const { setLocalUser, ensureRole } = require('./middleware/authMiddleware');
const { notFound, errorHandler } = require('./middleware/errorMiddleware');

// Route Imports
const indexRoutes = require('./routes/indexRoutes');
const authRoutes = require('./routes/authRoutes');
const articleRoutes = require('./routes/articleRoutes');
const bookRoutes = require('./routes/bookRoutes');
const adminRoutes = require('./routes/adminRoutes');

const app = express();

// Database connection
connectDB();

// Apply Security Middleware
applySecurity(app);

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Global Body Parsers
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Static Files
app.use(express.static(path.join(__dirname, 'public')));

// Session Configuration
app.use(
  session({
    secret: process.env.SESSION_SECRET || 'unread-archive-secret-fallback',
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000 // 1 day
    }
  })
);

// View Engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Set Local User variable for views
app.use(setLocalUser);

// Mount Routes
app.use('/', indexRoutes);
app.use('/', authRoutes);
app.use('/', articleRoutes);
app.use('/', bookRoutes);
app.use('/admin', ensureRole('admin'), adminRoutes);

// Error Handling Middlewares
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
