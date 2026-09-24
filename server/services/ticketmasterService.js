const axios = require('axios');

// ── Mock fallback data ─────────────────────────────────────────────────────
// Used when TICKETMASTER_API_KEY is missing or API call fails.
// Keep this separate so the real integration is always preserved.
const MOCK_EVENTS = [
  {
    id: 'mock-001',
    title: 'Taylor Swift | The Eras Tour',
    venue: 'SoFi Stadium',
    city: 'Los Angeles',
    date: '2025-10-15',
    time: '19:30',
    image: 'https://images.unsplash.com/photo-1540039155733-5bb30b53aa14?w=800&q=80',
    url: '#',
  },
  {
    id: 'mock-002',
    title: 'Coldplay: Music of the Spheres',
    venue: 'Wembley Stadium',
    city: 'London',
    date: '2025-10-18',
    time: '20:00',
    image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=800&q=80',
    url: '#',
  },
  {
    id: 'mock-003',
    title: 'NBA Finals Game 7',
    venue: 'Chase Center',
    city: 'San Francisco',
    date: '2025-10-22',
    time: '18:00',
    image: 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800&q=80',
    url: '#',
  },
  {
    id: 'mock-004',
    title: 'Ed Sheeran: Mathematics Tour',
    venue: 'Madison Square Garden',
    city: 'New York',
    date: '2025-10-25',
    time: '20:30',
    image: 'https://images.unsplash.com/photo-1501386761578-eac5c94b800a?w=800&q=80',
    url: '#',
  },
  {
    id: 'mock-005',
    title: 'Dua Lipa: Future Nostalgia Tour',
    venue: 'United Center',
    city: 'Chicago',
    date: '2025-10-28',
    time: '21:00',
    image: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&q=80',
    url: '#',
  },
  {
    id: 'mock-006',
    title: 'Coachella Valley Music & Arts Festival',
    venue: 'Empire Polo Club',
    city: 'Indio',
    date: '2025-10-15',
    time: '12:00',
    image: 'https://images.unsplash.com/photo-1506157786151-b8491531f063?w=800&q=80',
    url: '#',
  },
  {
    id: 'mock-007',
    title: 'The Weeknd: After Hours Tour',
    venue: 'Staples Center',
    city: 'Los Angeles',
    date: '2025-11-01',
    time: '20:00',
    image: 'https://images.unsplash.com/photo-1598387993441-a364f854c3e1?w=800&q=80',
    url: '#',
  },
  {
    id: 'mock-008',
    title: 'Bruno Mars Live',
    venue: 'Dolby Live',
    city: 'Las Vegas',
    date: '2025-11-05',
    time: '22:00',
    image: 'https://images.unsplash.com/photo-1429962714451-bb934ecdc4ec?w=800&q=80',
    url: '#',
  },
];

// ── Normalize a single Ticketmaster event object ───────────────────────────
const normalizeEvent = (event) => {
  const venue = event._embedded?.venues?.[0];
  const image = event.images?.find((img) => img.ratio === '16_9' && img.width > 500) || event.images?.[0];
  const dateInfo = event.dates?.start;

  return {
    id: event.id,
    title: event.name || 'Untitled Event',
    venue: venue?.name || 'Venue TBD',
    city: venue?.city?.name || '',
    date: dateInfo?.localDate || '',
    time: dateInfo?.localTime || '',
    image: image?.url || '',
    url: event.url || '',
  };
};

// ── Fetch events from Ticketmaster Discovery API ───────────────────────────
const fetchEvents = async ({ city, keyword, date } = {}) => {
  const apiKey = process.env.TICKETMASTER_API_KEY;

  // Fall back to mock data if no API key is configured
  if (!apiKey || apiKey === 'your_ticketmaster_api_key_here') {
    console.warn('[TicketmasterService] No API key found — using mock data.');
    return filterMockEvents({ city, keyword, date });
  }

  try {
    const params = {
      apikey: apiKey,
      size: 20,
      sort: 'date,asc',
    };

    if (city) params.city = city;
    if (keyword) params.keyword = keyword;
    if (date) params.startDateTime = `${date}T00:00:00Z`;

    const response = await axios.get(
      'https://app.ticketmaster.com/discovery/v2/events.json',
      { params }
    );

    const events = response.data?._embedded?.events || [];
    return events.map(normalizeEvent);
  } catch (error) {
    console.error('[TicketmasterService] API error — falling back to mock data:', error.message);
    // Always fall back to mock data so the app stays demonstrable
    return filterMockEvents({ city, keyword, date });
  }
};

// ── Filter mock events to simulate query params ────────────────────────────
const filterMockEvents = ({ city, keyword, date } = {}) => {
  let results = [...MOCK_EVENTS];

  if (city) {
    results = results.filter((e) =>
      e.city.toLowerCase().includes(city.toLowerCase())
    );
  }
  if (keyword) {
    results = results.filter(
      (e) =>
        e.title.toLowerCase().includes(keyword.toLowerCase()) ||
        e.venue.toLowerCase().includes(keyword.toLowerCase())
    );
  }
  if (date) {
    results = results.filter((e) => e.date === date);
  }

  return results;
};

module.exports = { fetchEvents };
