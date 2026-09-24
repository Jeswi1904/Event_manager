const RSVP = require('../models/RSVP');
const Invite = require('../models/Invite');

/**
 * POST /api/events/:eventId/rsvp
 *
 * Body: { userId, eventTitle, venue, eventDate, eventTime, shareToken }
 *
 * shareToken is optional — sent when the user arrived via an invite link.
 * This is stored on the RSVP so we can later count "Friends Attending" by
 * querying RSVPs that have a non-null shareToken (and are not the inviter).
 */
const createRSVP = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { userId, eventTitle, venue, eventDate, eventTime, shareToken } = req.body;

    if (!userId || !eventTitle) {
      return res.status(400).json({ success: false, message: 'userId and eventTitle are required' });
    }

    // Check for duplicate RSVP
    const existing = await RSVP.findOne({ userId, eventId });
    if (existing) {
      return res.status(409).json({ success: false, message: "User has already RSVP'd to this event" });
    }

    const rsvp = await RSVP.create({
      userId,
      eventId,
      eventTitle,
      venue: venue || 'Venue TBD',
      eventDate: eventDate || '',
      eventTime: eventTime || '',
      // Preserve the invite token that brought this user here (null = direct RSVP)
      shareToken: shareToken || null,
    });

    res.status(201).json({ success: true, rsvp });
  } catch (error) {
    // Handle the Mongoose duplicate key error gracefully
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: "User has already RSVP'd to this event" });
    }
    console.error('[rsvpController] createRSVP error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to save RSVP' });
  }
};

/**
 * GET /api/users/:userId/rsvps
 * Returns all RSVPs for a user.
 */
const getUserRSVPs = async (req, res) => {
  try {
    const { userId } = req.params;
    const rsvps = await RSVP.find({ userId }).sort({ createdAt: -1 });
    res.json({ success: true, rsvps });
  } catch (error) {
    console.error('[rsvpController] getUserRSVPs error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to fetch RSVPs' });
  }
};

/**
 * GET /api/events/:eventId/friends-count
 *
 * Returns two values:
 *   friendsAttending — RSVPs for this event where shareToken is not null
 *                      AND the user is NOT the original inviter for that token.
 *   inviteClicks     — total link-open clicks across all invites for this event.
 *
 * NOTE: These are TWO SEPARATE numbers. Do NOT confuse them.
 */
const getFriendsCount = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { userId } = req.query; // current user (to potentially scope to their invite)

    // ── Calculate Friends Attending ────────────────────────────────────────
    // Get all invites for this event so we know the inviter for each token
    const invites = await Invite.find({ eventId });
    const inviterByToken = {};
    invites.forEach((inv) => {
      inviterByToken[inv.inviteCode] = inv.inviterId.toString();
    });

    // Get all RSVPs for this event that came via an invite token
    const invitedRSVPs = await RSVP.find({ eventId, shareToken: { $ne: null } });

    // A "friend attending" RSVP must:
    //   1. have a shareToken
    //   2. NOT be the original inviter for that token
    const friendsAttending = invitedRSVPs.filter((rsvp) => {
      const tokenInviterId = inviterByToken[rsvp.shareToken];
      return tokenInviterId && rsvp.userId.toString() !== tokenInviterId;
    }).length;

    // ── Calculate total invite clicks for this event ───────────────────────
    const totalClicks = invites.reduce((sum, inv) => sum + inv.clicks, 0);

    res.json({ success: true, friendsAttending, inviteClicks: totalClicks });
  } catch (error) {
    console.error('[rsvpController] getFriendsCount error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to get friends count' });
  }
};

module.exports = { createRSVP, getUserRSVPs, getFriendsCount };
