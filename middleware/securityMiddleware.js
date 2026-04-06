// middleware/securityMiddleware.js
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per windowMs
  message: 'Too many requests from this IP, please try again after 15 minutes.'
});

const applySecurity = (app) => {
  // Set security HTTP headers
  app.use(helmet({
    contentSecurityPolicy: false // disable CSP temporarily for inline scripts in EJS
  }));
  
  // Apply rate limiter to all requests
  app.use(limiter);

  // Data sanitization against NoSQL query injection
  app.use(mongoSanitize());

  // Data sanitization against XSS
  app.use(xss());
};

module.exports = applySecurity;
