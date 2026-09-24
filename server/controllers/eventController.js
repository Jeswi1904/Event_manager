const { fetchEvents } = require('../services/ticketmasterService');

/**
 * GET /api/events
 * Optional query params: city, keyword, date
 */
const getEvents = async (req, res) => {
  try {
    const { city, keyword, date } = req.query;
    const events = await fetchEvents({ city, keyword, date });

    res.json({ success: true, events });
  } catch (error) {
    console.error('[eventController] getEvents error:', error.message);
    res.status(500).json({ success: false, message: 'Failed to fetch events' });
  }
};

module.exports = { getEvents };
