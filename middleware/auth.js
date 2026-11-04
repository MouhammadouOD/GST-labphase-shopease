const jwt = require('jsonwebtoken');
const User = require('../models/User');

function requireAuth(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Missing authorization token' });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = payload.userId;
    req.isAdmin = !!payload.isAdmin;
    next();
  } catch (err) {
    res.status(401).json({ error: 'Invalid or expired token' });
  }
}

// Must run after requireAuth. Re-checks the role against the database
// rather than trusting only the token's embedded claim, so revoking admin
// access takes effect immediately instead of only after the token expires.
async function requireAdmin(req, res, next) {
  try {
    const user = await User.findById(req.userId);
    if (!user || !user.isAdmin) {
      return res.status(403).json({ error: 'Admin access required' });
    }
    next();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

module.exports = { requireAuth, requireAdmin };
