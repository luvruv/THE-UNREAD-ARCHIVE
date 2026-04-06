// controllers/authController.js
const bcrypt = require('bcryptjs');
const User = require('../models/User');

exports.getSignInPage = (req, res) => {
  res.render('partials/layout', {
    pageTitle: 'Sign In / Sign Up',
    page: 'signin'
  });
};

exports.signup = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!email || !password || !name) {
      console.log('Signup validation failed');
      return res.redirect('/signin');
    }

    const existing = await User.findOne({ email });
    if (existing) {
      console.log('User already exists');
      return res.redirect('/signin');
    }

    const passwordHash = await bcrypt.hash(password, 10);
    // 1st user might be admin, but let's default to reader
    const user = await User.create({ name, email, passwordHash, role: 'reader' });

    req.session.user = {
      id: user._id,
      email: user.email,
      name: user.name,
      role: user.role
    };

    res.redirect('/home');
  } catch (err) {
    console.error('Signup error:', err);
    res.redirect('/signin');
  }
};

exports.signin = async (req, res) => {
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

    req.session.user = {
      id: user._id,
      email: user.email,
      name: user.name,
      role: user.role
    };

    res.redirect('/home');
  } catch (err) {
    console.error('Signin error:', err);
    res.redirect('/signin');
  }
};

exports.logout = (req, res) => {
  req.session.destroy(() => {
    res.redirect('/home');
  });
};
