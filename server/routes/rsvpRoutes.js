const express = require('express');
const { getUserRSVPs } = require('../controllers/rsvpController');
const User = require('../models/User');

const router = express.Router();

// GET /api/users/demo-users — return all seeded demo users (for the user selector)
router.get('/demo-users', async (req, res) => {
  try {
    const users = await User.find({}).sort({ createdAt: 1 });
    res.json({ success: true, users });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Failed to fetch demo users' });
  }
});

// GET /api/users/:userId/rsvps — get all RSVPs for a user
router.get('/:userId/rsvps', getUserRSVPs);

module.exports = router;
