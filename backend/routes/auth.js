const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const auth = require('../middleware/auth');
const { sendOTP, sendEmail } = require('../utils/email');
const {
  generateOTP,
  generatePassword,
  parseUserAgent,
  isMobileLoginAllowed
} = require('../utils/helpers');

// Helper: save OTP to user
const saveOTP = async (userId, otp, purpose) => {
  const expiry = new Date(Date.now() + 10 * 60 * 1000);
  await User.findByIdAndUpdate(userId, { otp, otpExpiry: expiry, otpPurpose: purpose });
};

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

    // If Chrome: require OTP
    if (browser === 'Chrome') {
      const otp = generateOTP();
      user.otp = otp;
      user.otpExpiry = new Date(Date.now() + 10 * 60 * 1000);
      user.otpPurpose = 'login';
      await user.save();

      // Try sending OTP email — don't crash login if email fails
      const emailResult = await sendOTP(user.email, otp, 'Login Verification');
      if (!emailResult.success) {
        console.error('OTP email failed:', emailResult.error);
        // Still return requireOTP so user can proceed; OTP is saved in DB
      }

      const devOtpHint = process.env.NODE_ENV !== 'production'
        ? ` (Dev mode: check your backend terminal for the OTP code)`
        : '';

      return res.json({
        requireOTP: true,
        userId: user._id,
        message: emailResult.success
          ? `OTP sent to ${user.email}. Please check your inbox.`
          : `OTP generated. Check your backend terminal for the code.${devOtpHint}`
      });
    }

    // Non-Chrome browser: no OTP needed
    await user.save();
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
    res.json({ token, user: { id: user._id, name: user.name, email: user.email, phone: user.phone, subscription: user.subscription, points: user.points, language: user.language, friends: user.friends } });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ message: 'Server error during login. Please try again.' });
  }
});

// VERIFY LOGIN OTP (Chrome)
router.post('/verify-login-otp', async (req, res) => {
  try {
    const { userId, otp } = req.body;
    if (!userId || !otp) return res.status(400).json({ message: 'userId and otp are required' });

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });
    if (user.otp !== otp || user.otpPurpose !== 'login') return res.status(400).json({ message: 'Invalid OTP' });
    if (new Date() > user.otpExpiry) return res.status(400).json({ message: 'OTP expired. Please login again.' });

    user.otp = undefined; user.otpExpiry = undefined; user.otpPurpose = undefined;
    await user.save();
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET || 'secret', { expiresIn: '7d' });
    res.json({ token, user: { id: user._id, name: user.name, email: user.email, phone: user.phone, subscription: user.subscription, points: user.points, language: user.language, friends: user.friends } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// FORGOT PASSWORD - Step 1: Request
router.post('/forgot-password', async (req, res) => {
  try {
    const { emailOrPhone } = req.body;
    const user = await User.findOne({ $or: [{ email: emailOrPhone }, { phone: emailOrPhone }] });
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Check once-per-day limit
    const today = new Date().toDateString();
    const lastDate = user.forgotPasswordLastDate ? new Date(user.forgotPasswordLastDate).toDateString() : null;
    if (lastDate === today && user.forgotPasswordUsedToday) {
      return res.status(429).json({ message: 'You can use this option only one time per day.' });
    }

    // Generate letter-only password
    const newPassword = generatePassword(10);
    const hashed = await bcrypt.hash(newPassword, 10);
    user.password = hashed;
    user.forgotPasswordUsedToday = true;
    user.forgotPasswordLastDate = new Date();
    await user.save();

    await sendEmail({
      to: user.email,
      subject: 'Your New Password',
      html: `
        <div style="font-family:Arial,sans-serif;max-width:480px;margin:auto;padding:32px;border:1px solid #e5e7eb;border-radius:8px;">
          <h2 style="color:#1e40af;">Password Reset</h2>
          <p>Hi <strong>${user.name}</strong>,</p>
          <p>Your new password is:</p>
          <div style="font-size:24px;font-weight:bold;letter-spacing:4px;color:#1e40af;background:#f0f4ff;padding:16px;border-radius:6px;margin:16px 0;">${newPassword}</div>
          <p style="color:#6b7280;font-size:13px;">Please login and change your password immediately.</p>
        </div>
      `
    });

    res.json({ message: 'A new password has been sent to your registered email.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET PROFILE
router.get('/profile', auth, async (req, res) => {
  const user = await User.findById(req.user._id).populate('friends', 'name email avatar').select('-password -otp -otpExpiry');
  res.json(user);
});

// UPDATE LANGUAGE - with OTP verification
router.post('/request-language-change', auth, async (req, res) => {
  try {
    const { language } = req.body;
    const supported = ['en', 'es', 'hi', 'pt', 'zh', 'fr'];
    if (!supported.includes(language)) return res.status(400).json({ message: 'Unsupported language' });

    const user = await User.findById(req.user._id);
    const otp = generateOTP();
    await saveOTP(user._id, otp, `lang-${language}`);

    if (language === 'fr') {
      await sendOTP(user.email, otp, 'Language Change Verification');
      return res.json({ message: 'OTP sent to your email for French language verification.' });
    } else {
      await sendOTP(user.email, otp, 'Language Change Verification (Mobile OTP)');
      return res.json({ message: 'OTP sent to your mobile number for language verification.' });
    }
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/verify-language-change', auth, async (req, res) => {
  try {
    const { otp, language } = req.body;
    const user = await User.findById(req.user._id);
    if (user.otp !== otp || user.otpPurpose !== `lang-${language}`) return res.status(400).json({ message: 'Invalid OTP' });
    if (new Date() > user.otpExpiry) return res.status(400).json({ message: 'OTP expired' });
    user.language = language;
    user.otp = undefined; user.otpExpiry = undefined; user.otpPurpose = undefined;
    await user.save();
    res.json({ message: 'Language updated successfully', language });
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
