const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const { requireAuth, signUserToken } = require('../middleware/auth');

const router = express.Router();

const userResponse = (user) => ({
  user: user.toSafeJSON(),
  token: signUserToken(user)
});

router.post('/register', async (req, res) => {
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
    return res.status(201).json({ success: true, ...userResponse(user) });
  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ success: false, message: 'Unable to create account' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const normalizedEmail = String(req.body.email || '').trim().toLowerCase();
    const user = await User.findOne({ email: normalizedEmail }).select('+password');
    if (!user || !(await bcrypt.compare(req.body.password || '', user.password))) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }
    return res.json({ success: true, ...userResponse(user) });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ success: false, message: 'Unable to sign in' });
  }
});

router.get('/me', requireAuth, (req, res) => {
  res.json({ success: true, user: req.user.toSafeJSON() });
});

module.exports = router;
