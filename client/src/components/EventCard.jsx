import { useState, useEffect, useCallback } from 'react';
import RSVPButton from './RSVPButton';
import ShareButton from './ShareButton';
import { fetchFriendsCount } from '../services/api';
import { useUser } from '../context/UserContext';

/**
 * EventCard
 *
 * Props:
 *   event       — normalized event object
 *   isRSVPd     — boolean, is current user RSVP'd?
 *   onRSVPd     — callback after RSVP
 *   shareToken  — invite token if user arrived via link (passed to RSVPButton)
 */
const EventCard = ({ event, isRSVPd, onRSVPd, shareToken = null }) => {
  const { currentUser } = useUser();
  const [friendsCount, setFriendsCount] = useState({ friendsAttending: 0, inviteClicks: 0 });
  const [imgError, setImgError] = useState(false);

  // Fetch Friends Attending from the server (server-side calculation)
  const loadFriendsCount = useCallback(async () => {
    if (!event?.id) return;
    try {
      const data = await fetchFriendsCount(event.id);
      setFriendsCount({
        friendsAttending: data.friendsAttending ?? 0,
        inviteClicks: data.inviteClicks ?? 0,
      });
    } catch (_) {
      // Non-critical — fail silently
    }
  }, [event?.id]);

  useEffect(() => {
    loadFriendsCount();
  }, [loadFriendsCount, isRSVPd]); // Re-fetch when RSVP status changes

  const handleRSVPd = (eventId) => {
    onRSVPd && onRSVPd(eventId);
    // Refresh friends count after RSVP
    setTimeout(loadFriendsCount, 500);
  };

  const formatDate = (date) => {
    if (!date) return 'Date TBD';
    try {
      return new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
        weekday: 'short',
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      });
    } catch {
      return date;
    }
  };

  const formatTime = (time) => {
    if (!time) return 'Time TBD';
    try {
      const [h, m] = time.split(':');
      const d = new Date();
      d.setHours(+h, +m);
      return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    } catch {
      return time;
    }
  };

  return (
    <div className="card event-card" id={`event-card-${event.id}`}>
      {/* Event image */}
      {event.image && !imgError ? (
        <img
          className="event-card-image"
          src={event.image}
          alt={event.title}
          loading="lazy"
          onError={() => setImgError(true)}
        />
      ) : (
        <div className="event-card-image-placeholder" aria-hidden="true">
          🎪
        </div>
      )}

      {/* Card body */}
      <div className="event-card-body">
        <h3 className="event-card-title" title={event.title}>
          {event.title}
        </h3>

        <div className="event-card-meta">
          <div className="event-card-meta-item">
            <span className="event-card-meta-icon">📍</span>
            <span>{event.venue}{event.city ? `, ${event.city}` : ''}</span>
          </div>
          <div className="event-card-meta-item">
            <span className="event-card-meta-icon">📅</span>
            <span>{formatDate(event.date)}</span>
          </div>
          <div className="event-card-meta-item">
            <span className="event-card-meta-icon">🕐</span>
            <span>{formatTime(event.time)}</span>
          </div>
        </div>

        {/* Friends Attending badge — server-side count */}
        <div className="friends-badge" aria-label={`${friendsCount.friendsAttending} friends attending`}>
          <span>👥</span>
          <span>Friends Attending: {friendsCount.friendsAttending}</span>
        </div>
      </div>

      {/* Card footer with action buttons */}
      <div className="event-card-footer">
        <RSVPButton
          event={event}
          isRSVPd={isRSVPd}
          shareToken={shareToken}
          onRSVPd={handleRSVPd}
        />
        <ShareButton eventId={event.id} isRSVPd={isRSVPd} />
      </div>
    </div>
  );
};

export default EventCard;
