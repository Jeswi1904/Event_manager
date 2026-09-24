const mongoose = require('mongoose');

/**
 * RSVP Model
 *
 * shareToken is the invite/share token that led to this RSVP.
 * - null  => the user RSVPd directly (not through an invite)
 * - string => the user RSVPd through a shared invite link
 *
 * This is the key field that separates "invite clicks" from "friends attending".
 * Friends Attending = RSVPs where shareToken is not null AND user is not the inviter.
 */
const rsvpSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  eventId: {
    type: String,
    required: true,
  },
  eventTitle: {
    type: String,
    required: true,
  },
  venue: {
    type: String,
    default: 'Venue TBD',
  },
  eventDate: {
    type: String,
    default: '',
  },
  eventTime: {
    type: String,
    default: '',
  },
  // The share token that led to this RSVP (null if direct RSVP)
  shareToken: {
    type: String,
    default: null,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Prevent duplicate RSVP: one user can only RSVP to an event once
rsvpSchema.index({ userId: 1, eventId: 1 }, { unique: true });

module.exports = mongoose.model('RSVP', rsvpSchema);
