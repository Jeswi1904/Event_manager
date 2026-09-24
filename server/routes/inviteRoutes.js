const express = require('express');
const { getInvite } = require('../controllers/inviteController');

const router = express.Router();

// GET /api/invites/:inviteCode — open an invite link (increments click count)
router.get('/:inviteCode', getInvite);

module.exports = router;
