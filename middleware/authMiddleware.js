// middleware/authMiddleware.js

exports.ensureAuthenticated = (req, res, next) => {
  if (req.session && req.session.user) {
    return next();
  }
  res.redirect('/signin');
};

exports.ensureRole = (...roles) => {
  return (req, res, next) => {
    if (!req.session || !req.session.user) {
      return res.redirect('/signin');
    }
    if (roles.includes(req.session.user.role)) {
      return next();
    }
    res.status(403).send('Forbidden: You lack the privileges to access this page.');
  };
};

exports.setLocalUser = (req, res, next) => {
  res.locals.currentUser = req.session.user || null;
  next();
};
