const express = require('express');
const { getEvents } = require('../controllers/eventController');
const { getFriendsCount } = require('../controllers/rsvpController');
const { createInvite } = require('../controllers/inviteController');
const { createRSVP } = require('../controllers/rsvpController');

const router = express.Router();

// GET /api/events — fetch events (supports ?city, ?keyword, ?date)
router.get('/', getEvents);

// POST /api/events/:eventId/rsvp — RSVP to an event
router.post('/:eventId/rsvp', createRSVP);

// POST /api/events/:eventId/invite — generate a share/invite link
router.post('/:eventId/invite', createInvite);

// GET /api/events/:eventId/friends-count — get friendsAttending + inviteClicks
router.get('/:eventId/friends-count', getFriendsCount);

module.exports = router;
