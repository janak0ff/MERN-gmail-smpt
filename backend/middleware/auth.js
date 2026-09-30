const jwt = require('jsonwebtoken');
const User = require('../models/User');

const getJwtSecret = () => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not configured');
  }
  return process.env.JWT_SECRET;
};

const signUserToken = (user) => jwt.sign(
  { sub: user._id.toString(), email: user.email },
  getJwtSecret(),
  { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
);

const AUTH_COOKIE = 'auth_token';
const cookieOptions = () => ({
  httpOnly: true,
  sameSite: process.env.COOKIE_SAME_SITE || 'lax',
  secure: process.env.NODE_ENV === 'production',
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: '/'
});
const setAuthCookie = (res, user) => res.cookie(AUTH_COOKIE, signUserToken(user), cookieOptions());
const clearAuthCookie = (res) => res.clearCookie(AUTH_COOKIE, { ...cookieOptions(), maxAge: undefined });

const requireAuth = async (req, res, next) => {
  try {
    const header = req.headers.authorization || '';
    const token = req.cookies?.[AUTH_COOKIE] || (header.startsWith('Bearer ') ? header.slice(7) : null);
    if (!token) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const payload = jwt.verify(token, getJwtSecret());
    const user = await User.findById(payload.sub).select('+passwordChangedAt');
    if (!user) {
      return res.status(401).json({ success: false, message: 'User account not found' });
    }
    if (user.passwordChangedAt && payload.iat * 1000 < user.passwordChangedAt.getTime()) {
      return res.status(401).json({ success: false, message: 'Session expired' });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: error.name === 'TokenExpiredError' ? 'Session expired' : 'Invalid authentication token'
    });
  }
};

module.exports = { requireAuth, signUserToken, setAuthCookie, clearAuthCookie };
