const express = require('express');
const bcrypt = require('bcryptjs');
const rateLimit = require('express-rate-limit');
const { createOneTimeToken, hashToken } = require('../utils/authTokens');
const User = require('../models/User');
const emailService = require('../services/emailService');
const { requireAuth, setAuthCookie, clearAuthCookie } = require('../middleware/auth');

const router = express.Router();

const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 10, standardHeaders: true, legacyHeaders: false });
const genericResetMessage = 'If an account exists for that email, instructions have been sent.';
const sendVerification = async (user) => {
  const { token, hash } = createOneTimeToken();
  user.emailVerificationTokenHash = hash;
  user.emailVerificationExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
  await user.save({ validateBeforeSave: false });
  const url = `${process.env.CLIENT_URL || 'http://localhost:3000'}?verifyToken=${token}&verifyEmail=${encodeURIComponent(user.email)}`;
  await emailService.sendTransactionalEmail(user.email, 'Verify your Quick Mail account', `Verify your account: ${url}`);
};

router.post('/register', authLimiter, async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const normalizedEmail = String(email || '').trim().toLowerCase();
    if (!name?.trim() || !normalizedEmail || !password) {
      return res.status(400).json({ success: false, message: 'Name, email, and password are required' });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      return res.status(400).json({ success: false, message: 'Please provide a valid email address' });
    }
    if (password.length < 8) {
      return res.status(400).json({ success: false, message: 'Password must be at least 8 characters' });
    }
    if (await User.exists({ email: normalizedEmail })) {
      return res.status(409).json({ success: false, message: 'An account with that email already exists' });
    }

    const user = await User.create({ name: name.trim(), email: normalizedEmail, password });
    try { await sendVerification(user); } catch (mailError) { console.error('Verification email failed:', mailError.message); }
    setAuthCookie(res, user);
    return res.status(201).json({ success: true, user: user.toSafeJSON(), verificationRequired: true });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ success: false, message: 'Unable to create account' });
  }
});

router.post('/login', authLimiter, async (req, res) => {
  try {
    const normalizedEmail = String(req.body.email || '').trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail }).select('+password');
    if (!user || !(await bcrypt.compare(req.body.password || '', user.password))) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }
    setAuthCookie(res, user);
    return res.json({ success: true, user: user.toSafeJSON(), verificationRequired: !user.emailVerified });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ success: false, message: 'Unable to sign in' });
  }
});

router.post('/logout', (req, res) => {
  clearAuthCookie(res);
  res.json({ success: true });
});

router.post('/verify-email', authLimiter, async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const tokenHash = hashToken(req.body.token || '');
  const user = await User.findOne({ email }).select('+emailVerificationTokenHash +emailVerificationExpiresAt');
  if (!user || user.emailVerificationTokenHash !== tokenHash || !user.emailVerificationExpiresAt || user.emailVerificationExpiresAt < new Date()) {
    return res.status(400).json({ success: false, message: 'This verification link is invalid or expired' });
  }
  user.emailVerified = true;
  user.emailVerificationTokenHash = undefined;
  user.emailVerificationExpiresAt = undefined;
  await user.save({ validateBeforeSave: false });
  res.json({ success: true, user: user.toSafeJSON(), message: 'Email verified successfully' });
});

router.post('/resend-verification', authLimiter, async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const user = await User.findOne({ email });
  if (user && !user.emailVerified) {
    try { await sendVerification(user); } catch (error) { console.error('Verification email failed:', error.message); }
  }
  res.json({ success: true, message: genericResetMessage });
});

router.post('/forgot-password', authLimiter, async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const user = await User.findOne({ email });
  if (user) {
    const { token, hash } = createOneTimeToken();
    user.passwordResetTokenHash = hash;
    user.passwordResetExpiresAt = new Date(Date.now() + 60 * 60 * 1000);
    await user.save({ validateBeforeSave: false });
    const url = `${process.env.CLIENT_URL || 'http://localhost:3000'}?resetToken=${token}&resetEmail=${encodeURIComponent(user.email)}`;
    try { await emailService.sendTransactionalEmail(user.email, 'Reset your Quick Mail password', `Reset your password: ${url}`); } catch (error) { console.error('Reset email failed:', error.message); }
  }
  res.json({ success: true, message: genericResetMessage });
});

router.post('/reset-password', authLimiter, async (req, res) => {
  const email = String(req.body.email || '').trim().toLowerCase();
  const password = String(req.body.password || '');
  if (password.length < 8) return res.status(400).json({ success: false, message: 'Password must be at least 8 characters' });
  const user = await User.findOne({ email }).select('+passwordResetTokenHash +passwordResetExpiresAt');
  if (!user || user.passwordResetTokenHash !== hashToken(req.body.token || '') || !user.passwordResetExpiresAt || user.passwordResetExpiresAt < new Date()) {
    return res.status(400).json({ success: false, message: 'This reset link is invalid or expired' });
  }
  user.password = password;
  user.passwordResetTokenHash = undefined;
  user.passwordResetExpiresAt = undefined;
  user.passwordChangedAt = new Date();
  await user.save();
  clearAuthCookie(res);
  res.json({ success: true, message: 'Password reset successfully' });
});

router.post('/change-password', requireAuth, async (req, res) => {
  const { currentPassword, password } = req.body;
  if (!password || password.length < 8) return res.status(400).json({ success: false, message: 'New password must be at least 8 characters' });
  const user = await User.findById(req.user._id).select('+password');
  if (!user || !(await bcrypt.compare(currentPassword || '', user.password))) return res.status(401).json({ success: false, message: 'Current password is incorrect' });
  user.password = password;
  user.passwordChangedAt = new Date();
  await user.save();
  setAuthCookie(res, user);
  res.json({ success: true, message: 'Password changed successfully' });
});

router.get('/me', requireAuth, (req, res) => {
  res.json({ success: true, user: req.user.toSafeJSON() });
});

module.exports = router;
