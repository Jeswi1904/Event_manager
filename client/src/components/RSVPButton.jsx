import { useState } from 'react';
import { createRSVP } from '../services/api';
import { useUser } from '../context/UserContext';

/**
 * RSVPButton
 *
 * Props:
 *   event        — event object { id, title, venue, date, time }
 *   isRSVPd      — boolean, whether the current user has already RSVP'd
 *   shareToken   — optional token if user arrived via invite link
 *   onRSVPd      — callback(eventId) after successful RSVP
 */
const RSVPButton = ({ event, isRSVPd, shareToken = null, onRSVPd }) => {
  const { currentUser } = useUser();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleRSVP = async () => {
    if (isRSVPd || loading || !currentUser) return;

    setLoading(true);
    setError('');

    try {
      await createRSVP(event.id, {
        userId: currentUser._id,
        eventTitle: event.title,
        venue: event.venue,
        eventDate: event.date,
        eventTime: event.time,
        // Pass the shareToken if the user arrived via an invite link
        // This is how "Friends Attending" tracks who came from invites
        shareToken: shareToken || null,
      });

      onRSVPd && onRSVPd(event.id);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to RSVP';
      // Already RSVP'd — treat as success
      if (msg.includes('already')) {
        onRSVPd && onRSVPd(event.id);
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  if (!currentUser) return null;

  let btnClass = 'rsvp-btn ';
  let label = '';

  if (isRSVPd) {
    btnClass += 'rsvp-btn-done';
    label = '✓ Interested';
  } else if (loading) {
    btnClass += 'rsvp-btn-loading rsvp-btn-idle';
    label = 'Saving…';
  } else {
    btnClass += 'rsvp-btn-idle';
    label = 'Interested';
  }

  return (
    <div>
      <button
        id={`rsvp-btn-${event.id}`}
        className={btnClass}
        onClick={handleRSVP}
        disabled={isRSVPd || loading}
        aria-label={isRSVPd ? `Already interested in ${event.title}` : `Mark interested in ${event.title}`}
      >
        {!isRSVPd && !loading && <span>🎟</span>}
        {label}
      </button>
      {error && (
        <p style={{ color: 'var(--error)', fontSize: '0.75rem', marginTop: '4px' }}>
          {error}
        </p>
      )}
    </div>
  );
};

export default RSVPButton;
