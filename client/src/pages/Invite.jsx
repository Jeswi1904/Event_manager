import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { openInvite, createRSVP } from '../services/api';
import { useUser } from '../context/UserContext';
import Loading from '../components/Loading';

/**
 * Invite Page — /invite/:inviteCode
 *
 * When this page mounts:
 *   1. Calls GET /api/invites/:inviteCode ONCE (tracked via ref to prevent double-calls)
 *   2. Backend increments the invite click count
 *   3. Displays inviter name, event details
 *   4. Invited user can RSVP — shareToken is sent so it counts toward Friends Attending
 */
const Invite = () => {
  const { inviteCode } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useUser();

  const [invite, setInvite] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [rsvpDone, setRsvpDone] = useState(false);
  const [rsvpLoading, setRsvpLoading] = useState(false);
  const [rsvpError, setRsvpError] = useState('');

  // Ref to ensure the invite-open API is called exactly once per mount
  const clickTracked = useRef(false);

  useEffect(() => {
    if (clickTracked.current) return;
    clickTracked.current = true;

    const loadInvite = async () => {
      try {
        const data = await openInvite(inviteCode);
        setInvite(data);
      } catch (err) {
        setError(err.response?.data?.message || 'This invite link is invalid or expired.');
      } finally {
        setLoading(false);
      }
    };

    loadInvite();
  }, [inviteCode]);

  const handleRSVP = async () => {
    if (!currentUser || !invite?.event || rsvpDone || rsvpLoading) return;

    setRsvpLoading(true);
    setRsvpError('');

    try {
      await createRSVP(invite.event.id, {
        userId: currentUser._id,
        eventTitle: invite.event.title,
        venue: invite.event.venue,
        eventDate: invite.event.date,
        eventTime: invite.event.time,
        // Send the shareToken — this is what marks the RSVP as invite-originated
        // and is used server-side to count Friends Attending
        shareToken: inviteCode,
      });
      setRsvpDone(true);
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to RSVP';
      if (msg.includes('already')) {
        setRsvpDone(true);
      } else {
        setRsvpError(msg);
      }
    } finally {
      setRsvpLoading(false);
    }
  };

  const formatDate = (date) => {
    if (!date) return 'Date TBD';
    try {
      return new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
      });
    } catch { return date; }
  };

  const formatTime = (time) => {
    if (!time) return 'Time TBD';
    try {
      const [h, m] = time.split(':');
      const d = new Date();
      d.setHours(+h, +m);
      return d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    } catch { return time; }
  };

  if (loading) {
    return (
      <div className="invite-page">
        <Loading text="Loading invite…" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="invite-page">
        <div className="invite-card">
          <div className="invite-card-header">
            <div className="invite-emoji">❌</div>
            <h1 className="invite-title">Invalid Invite</h1>
            <p className="invite-subtitle">{error}</p>
          </div>
          <button
            id="invite-home-btn"
            className="btn btn-primary"
            style={{ width: '100%' }}
            onClick={() => navigate('/')}
          >
            Browse Events
          </button>
        </div>
      </div>
    );
  }

  const { inviterName, event, inviteClicks } = invite;

  return (
    <div className="invite-page">
      <div className="invite-card">
        {/* Header */}
        <div className="invite-card-header">
          <div className="invite-emoji">🎉</div>
          <h1 className="invite-title">You're Invited!</h1>
          <p className="invite-subtitle">
            <strong>{inviterName}</strong> invited you to join them at this event
          </p>
        </div>

        {/* Event details */}
        {event ? (
          <div className="invite-event-details">
            {event.image && (
              <img
                src={event.image}
                alt={event.title}
                className="invite-event-image"
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            )}
            <div className="invite-event-title">{event.title}</div>
            <div className="invite-event-meta">
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
          </div>
        ) : (
          <div className="invite-event-details" style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
            Event details unavailable
          </div>
        )}

        {/* Invite stats */}
        <div className="invite-stats">
          <div className="invite-stat">
            <div className="invite-stat-value">{inviteClicks}</div>
            <div className="invite-stat-label">people viewed this invite</div>
          </div>
        </div>

        {/* RSVP section */}
        {rsvpDone ? (
          <div className="invite-success">
            <div className="invite-success-icon">🎟</div>
            <div style={{ fontWeight: 700, marginBottom: 4 }}>You're in!</div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              You've RSVP'd to this event. You're now counted as a friend attending!
            </p>
            <button
              id="invite-dashboard-btn"
              className="btn btn-outline btn-sm"
              style={{ marginTop: '12px' }}
              onClick={() => navigate('/dashboard')}
            >
              View My RSVPs →
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {!currentUser && (
              <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textAlign: 'center' }}>
                Select a user in the navbar to RSVP.
              </p>
            )}
            <button
              id="invite-rsvp-btn"
              className="btn btn-primary"
              style={{ width: '100%', justifyContent: 'center' }}
              onClick={handleRSVP}
              disabled={!currentUser || rsvpLoading}
            >
              {rsvpLoading ? '⏳ Saving…' : '🎟 RSVP — I\'m Attending!'}
            </button>
            {rsvpError && (
              <p style={{ color: 'var(--error)', fontSize: '0.8rem', textAlign: 'center' }}>
                {rsvpError}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Invite;
