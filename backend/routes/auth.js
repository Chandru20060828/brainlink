const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');
const {
  parseUserAgent,
  isMobileLoginAllowed
} = require('../utils/helpers');

// REGISTER
router.post('/register', async (req, res) => {
  try {
    const { name, email, phone, password } = req.body;
    if (!name || !email || !password) return res.status(400).json({ message: 'Name, email, password required' });
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: 'Email already registered' });
    const hashed = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, phone, password: hashed });
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
    res.status(201).json({ token, user: { id: user._id, name: user.name, email: user.email, phone: user.phone, subscription: user.subscription, points: user.points, language: user.language } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// LOGIN
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const ua = req.headers['user-agent'] || '';
    const ip = req.ip || req.connection?.remoteAddress || 'unknown';
    const { browser, os, device } = parseUserAgent(ua);

    // Time restriction for mobile
    if (device === 'mobile' && !isMobileLoginAllowed()) {
      return res.status(403).json({ message: 'Mobile login is only allowed between 10:00 AM and 1:00 PM IST.' });
    }

    const user = await User.findOne({ email });
    if (!user) {
      console.log(`[LOGIN] No user found for email: ${email}`);
      return res.status(400).json({ message: 'No account found with this email. Please register first.' });
    }

    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      console.log(`[LOGIN] Wrong password for email: ${email}`);
      return res.status(400).json({ message: 'Incorrect password. Please try again.' });
    }
    console.log(`[LOGIN] Credentials valid for: ${email}, browser: ${browser}`);

    // Save login history
    user.loginHistory.unshift({ browser, os, device, ip, timestamp: new Date() });
    if (user.loginHistory.length > 20) user.loginHistory = user.loginHistory.slice(0, 20);

    await user.save();
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
    res.json({ token, user: { id: user._id, name: user.name, email: user.email, phone: user.phone, subscription: user.subscription, points: user.points, language: user.language, friends: user.friends } });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error during login. Please try again.' });
  }
});

// GET PROFILE
router.get('/profile', auth, async (req, res) => {
  const user = await User.findById(req.user._id).populate('friends', 'name email avatar').select('-password');
  res.json(user);
});

// UPDATE LANGUAGE
router.post('/update-language', auth, async (req, res) => {
  try {
    const { language } = req.body;
    const supported = ['en', 'es', 'hi', 'pt', 'zh', 'fr'];
    if (!supported.includes(language)) return res.status(400).json({ message: 'Unsupported language' });

    const user = await User.findByIdAndUpdate(req.user._id, { language }, { new: true });
    res.json({ message: 'Language updated successfully', language: user.language });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// LOGIN HISTORY
router.get('/login-history', auth, async (req, res) => {
  const user = await User.findById(req.user._id).select('loginHistory');
  res.json(user.loginHistory);
});

module.exports = router;
