const { nanoid } = require('nanoid');
const Invite = require('../models/Invite');
const RSVP = require('../models/RSVP');
const User = require('../models/User');
const { fetchEvents } = require('../services/ticketmasterService');

/**
 * POST /api/events/:eventId/invite
 *
 * Creates a unique share link for an event. Only allowed if the user has RSVP'd.
 *
 * Returns: { inviteCode, shareUrl }
 */
const createInvite = async (req, res) => {
  try {
    const { eventId } = req.params;
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ success: false, message: 'userId is required' });
    }

    // Only allow invite creation if the user has RSVP'd to this event
    const rsvp = await RSVP.findOne({ userId, eventId });
    if (!rsvp) {
      return res.status(403).json({
        success: false,
        message: "You must RSVP to this event before sharing",
      });
    }

    // Re-use existing invite if one already exists for this user+event
    const existing = await Invite.findOne({ userId, eventId });
    if (existing) {
      const shareUrl = `${process.env.CLIENT_URL}/invite/${existing.inviteCode}`;
      return res.json({ success: true, inviteCode: existing.inviteCode, shareUrl });
    }

    // Generate a secure, short unique token
    const inviteCode = nanoid(10);

    const invite = await Invite.create({
      eventId,
      inviterId: userId,
      inviteCode,
      clicks: 0,
    });

    const shareUrl = `${process.env.CLIENT_URL}/invite/${inviteCode}`;

    res.status(201).json({ success: true, inviteCode, shareUrl });
  } catch (error) {
    console.error('[inviteController] createInvite error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to create invite' });
  }
};

/**
 * GET /api/invites/:inviteCode
 *
 * Called when a user opens a shared invite link.
 *
 * Behaviour:
 *   1. Find the invite by code.
 *   2. Increment click count  ← this is LINK VIEWS, not friends attending.
 *   3. Return event info + inviter name so the invited user can see context.
 *
 * Important: click count increment happens once per API call.
 * The frontend must call this endpoint only once (on page load), not on re-renders.
 */
const getInvite = async (req, res) => {
  try {
    const { inviteCode } = req.params;

    const invite = await Invite.findOne({ inviteCode });
    if (!invite) {
      return res.status(404).json({ success: false, message: 'Invite not found' });
    }

    // Increment click count (link view tracking — separate from RSVPs)
    await Invite.findByIdAndUpdate(invite._id, { $inc: { clicks: 1 } });

    // Fetch inviter name
    const inviter = await User.findById(invite.inviterId);

    // Fetch the event details from Ticketmaster/mock
    let event = null;
    try {
      const events = await fetchEvents({});
      event = events.find((e) => e.id === invite.eventId) || null;
    } catch (_) {
      // If event fetch fails, still return the invite info
    }

    res.json({
      success: true,
      inviteCode: invite.inviteCode,
      eventId: invite.eventId,
      inviterName: inviter?.name || 'Someone',
      inviteClicks: invite.clicks + 1, // reflect the current click
      event,
    });
  } catch (error) {
    console.error('[inviteController] getInvite error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to load invite' });
  }
};

module.exports = { createInvite, getInvite };
