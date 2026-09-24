import { useState, useEffect, useMemo } from 'react';
import { fetchEvents } from '../services/api';
import { useUser } from '../context/UserContext';
import EventCard from '../components/EventCard';
import EventCalendar from '../components/EventCalendar';
import Loading from '../components/Loading';

const Home = () => {
  const { currentUser } = useUser();
  const [events, setEvents] = useState([]);
  const [rsvpdIds, setRsvpdIds] = useState(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [city, setCity] = useState('');
  const [keyword, setKeyword] = useState('');
  const [selectedDate, setSelectedDate] = useState(null);

  // Load events from backend (which calls Ticketmaster)
  const loadEvents = async (params = {}) => {
    setLoading(true);
    setError('');
    try {
      const data = await fetchEvents(params);
      setEvents(data.events || []);
    } catch (err) {
      setError('Failed to load events. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEvents();
  }, []);

  // Load current user's RSVPs to track which events they've RSVP'd to
  useEffect(() => {
    if (!currentUser) return;
    const loadRSVPs = async () => {
      try {
        const res = await fetch(`/api/users/${currentUser._id}/rsvps`);
        const data = await res.json();
        const ids = new Set((data.rsvps || []).map((r) => r.eventId));
        setRsvpdIds(ids);
      } catch (_) {}
    };
    loadRSVPs();
  }, [currentUser]);

  const handleSearch = (e) => {
    e.preventDefault();
    loadEvents({ city, keyword });
    setSelectedDate(null);
  };

  const handleReset = () => {
    setCity('');
    setKeyword('');
    setSelectedDate(null);
    loadEvents();
  };

  const handleRSVPd = (eventId) => {
    setRsvpdIds((prev) => new Set([...prev, eventId]));
  };

  // Filter events by selected calendar date (client-side for speed)
  const displayedEvents = useMemo(() => {
    if (!selectedDate) return events;
    return events.filter((e) => e.date === selectedDate);
  }, [events, selectedDate]);

  return (
    <div className="page-wrapper">
      <div className="container">
        {/* Hero banner */}
        <div className="hero-banner">
          <div className="hero-tag">✨ Live Events Near You</div>
          <h1 className="hero-title">
            Discover &amp; Track <span>Amazing Events</span>
          </h1>
          <p className="hero-desc">
            Find concerts, sports, festivals and more. RSVP, invite friends, and
            never miss out.
          </p>
        </div>

        {/* Search & Filter */}
        <section className="search-section">
          <h2 className="search-section-title">
            Find <span>Events</span>
          </h2>
          <form onSubmit={handleSearch} id="event-search-form">
            <div className="search-controls">
              <div className="form-group">
                <label className="form-label" htmlFor="city-input">City</label>
                <input
                  id="city-input"
                  className="form-input"
                  type="text"
                  placeholder="e.g. Los Angeles"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                />
              </div>
              <div className="form-group">
                <label className="form-label" htmlFor="keyword-input">Keyword</label>
                <input
                  id="keyword-input"
                  className="form-input"
                  type="text"
                  placeholder="e.g. Taylor Swift"
                  value={keyword}
                  onChange={(e) => setKeyword(e.target.value)}
                />
              </div>
              <button id="search-submit-btn" type="submit" className="btn btn-primary">
                🔍 Search
              </button>
              <button
                id="search-reset-btn"
                type="button"
                className="btn btn-outline"
                onClick={handleReset}
              >
                Reset
              </button>
            </div>
          </form>
        </section>

        {/* Calendar */}
        <EventCalendar
          events={events}
          selectedDate={selectedDate}
          onDateSelect={setSelectedDate}
        />

        {/* Events grid */}
        <section>
          <div className="events-section-header">
            <h2 className="section-title">
              {selectedDate ? '📅 Events on This Day' : '🔥 All Events'}
            </h2>
            {!loading && (
              <span className="section-count">
                {displayedEvents.length} event{displayedEvents.length !== 1 ? 's' : ''}
              </span>
            )}
          </div>

          {loading && <Loading text="Fetching events…" />}

          {!loading && error && (
            <div className="state-container">
              <div className="state-icon">⚠️</div>
              <div className="state-title">Something went wrong</div>
              <p className="state-description">{error}</p>
              <button
                id="retry-btn"
                className="btn btn-primary"
                onClick={() => loadEvents()}
              >
                Try Again
              </button>
            </div>
          )}

          {!loading && !error && displayedEvents.length === 0 && (
            <div className="state-container">
              <div className="state-icon">🔍</div>
              <div className="state-title">No events found</div>
              <p className="state-description">
                {selectedDate
                  ? 'No events on this date. Try another day or clear the filter.'
                  : 'Try adjusting your search or clearing filters.'}
              </p>
              <button
                id="clear-filter-btn"
                className="btn btn-outline"
                onClick={handleReset}
              >
                Clear Filters
              </button>
            </div>
          )}

          {!loading && !error && displayedEvents.length > 0 && (
            <div className="events-grid">
              {displayedEvents.map((event) => (
                <EventCard
                  key={event.id}
                  event={event}
                  isRSVPd={rsvpdIds.has(event.id)}
                  onRSVPd={handleRSVPd}
                />
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default Home;
