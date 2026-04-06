// middleware/errorMiddleware.js

exports.notFound = (req, res, next) => {
  // Try to render error page, fallback to json if api
  if (req.originalUrl.startsWith('/api')) {
    return res.status(404).json({ error: 'Endpoint Not Found' });
  }
  res.status(404).send('404 - Page Not Found');
};

exports.errorHandler = (err, req, res, next) => {
  console.error(err.stack);
  
  if (req.originalUrl.startsWith('/api')) {
    return res.status(err.status || 500).json({ error: err.message || 'Internal Server Error' });
  }
  
  res.status(err.status || 500).send(`500 - Server Error: ${err.message}`);
};
