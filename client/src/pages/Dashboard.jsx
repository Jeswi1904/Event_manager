import { useState, useEffect, useCallback } from 'react';
import { useUser } from '../context/UserContext';
import { getUserRSVPs, fetchFriendsCount, createInvite } from '../services/api';
import Loading from '../components/Loading';

const Dashboard = () => {
  const { currentUser } = useUser();
  const [rsvps, setRsvps] = useState([]);
  const [friendCounts, setFriendCounts] = useState({});
  const [shareUrls, setShareUrls] = useState({});
  const [copiedIds, setCopiedIds] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadDashboard = useCallback(async () => {
    if (!currentUser) return;
    setLoading(true);
    setError('');
    try {
      const data = await getUserRSVPs(currentUser._id);
      const userRsvps = data.rsvps || [];
      setRsvps(userRsvps);

      // Fetch friends count for each RSVP'd event (server-side calculation)
      const counts = {};
      await Promise.all(
        userRsvps.map(async (rsvp) => {
          try {
            const fc = await fetchFriendsCount(rsvp.eventId);
            counts[rsvp.eventId] = fc;
          } catch (_) {
            counts[rsvp.eventId] = { friendsAttending: 0, inviteClicks: 0 };
          }
        })
      );
      setFriendCounts(counts);
    } catch (err) {
      setError('Failed to load your RSVPs.');
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  const handleShare = async (eventId) => {
    if (!currentUser) return;
    try {
      const data = await createInvite(eventId, currentUser._id);
      const url = data.shareUrl;
      setShareUrls((prev) => ({ ...prev, [eventId]: url }));

      try {
        await navigator.clipboard.writeText(url);
        setCopiedIds((prev) => ({ ...prev, [eventId]: true }));
        setTimeout(() => {
          setCopiedIds((prev) => ({ ...prev, [eventId]: false }));
        }, 3000);
      } catch (_) {
        // Clipboard unavailable — URL shown as fallback
      }
    } catch (err) {
      console.error('Share failed:', err.message);
    }
  };

  const formatDate = (date) => {
    if (!date) return 'Date TBD';
    try {
      return new Date(date + 'T00:00:00').toLocaleDateString('en-US', {
        weekday: 'short', month: 'short', day: 'numeric', year: 'numeric',
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

  if (!currentUser) {
    return (
      <div className="page-wrapper">
        <div className="container">
          <div className="state-container">
            <div className="state-icon">👤</div>
            <div className="state-title">No user selected</div>
            <p className="state-description">Select a demo user in the top-right to view your dashboard.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      <div className="container">
        {/* Header */}
        <div className="dashboard-header">
          <h1 className="page-title">
            My <span>RSVPs</span>
          </h1>
          <p className="page-subtitle">
            Logged in as <strong>{currentUser.name}</strong> — {currentUser.email}
          </p>
        </div>

        {loading && <Loading text="Loading your RSVPs…" />}

        {!loading && error && (
          <div className="state-container">
            <div className="state-icon">⚠️</div>
            <div className="state-title">Couldn't load RSVPs</div>
            <p className="state-description">{error}</p>
            <button id="dashboard-retry-btn" className="btn btn-primary" onClick={loadDashboard}>
              Retry
            </button>
          </div>
        )}

        {!loading && !error && rsvps.length === 0 && (
          <div className="state-container">
            <div className="state-icon">🎟</div>
            <div className="state-title">No RSVPs yet</div>
            <p className="state-description">
              You haven't RSVP'd to any events yet. Head to the Discover page to find events!
            </p>
            <a href="/" className="btn btn-primary" id="discover-link">
              Discover Events
            </a>
          </div>
        )}

        {!loading && !error && rsvps.length > 0 && (
          <div className="rsvp-list">
            {rsvps.map((rsvp) => {
              const fc = friendCounts[rsvp.eventId] || { friendsAttending: 0, inviteClicks: 0 };
              const isCopied = copiedIds[rsvp.eventId];
              const sharedUrl = shareUrls[rsvp.eventId];

              return (
                <div key={rsvp._id} className="rsvp-card" id={`rsvp-card-${rsvp.eventId}`}>
                  {/* RSVP status icon */}
                  <div className="rsvp-card-status" aria-label="RSVP confirmed">
                    ✅
                  </div>

                  {/* Event info */}
                  <div className="rsvp-card-content">
                    <div className="rsvp-card-title">{rsvp.eventTitle}</div>

                    <div className="rsvp-card-meta">
                      <span className="rsvp-meta-chip">📍 {rsvp.venue}</span>
                      <span className="rsvp-meta-chip">📅 {formatDate(rsvp.eventDate)}</span>
                      <span className="rsvp-meta-chip">🕐 {formatTime(rsvp.eventTime)}</span>
                      <span className="rsvp-status-badge">✓ Attending</span>
                    </div>

                    {/* Friends attending & invite stats — server-side values */}
                    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '4px' }}>
                      <span className="friends-badge">
                        👥 Friends Attending: {fc.friendsAttending}
                      </span>
                      {fc.inviteClicks > 0 && (
                        <span className="friends-badge" style={{ opacity: 0.7 }}>
                          👁 {fc.inviteClicks} link view{fc.inviteClicks !== 1 ? 's' : ''}
                        </span>
                      )}
                    </div>

                    {/* Share URL fallback display */}
                    {sharedUrl && !isCopied && (
                      <div className="share-url-display" style={{ marginTop: '8px' }}>
                        {sharedUrl}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="rsvp-card-actions">
                    <button
                      id={`dashboard-share-btn-${rsvp.eventId}`}
                      className={`share-btn${isCopied ? ' share-btn-copied' : ''}`}
                      onClick={() => handleShare(rsvp.eventId)}
                      aria-label={`Share ${rsvp.eventTitle}`}
                    >
                      {isCopied ? '✓ Copied!' : '🔗 Share Link'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
