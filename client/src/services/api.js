import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: { 'Content-Type': 'application/json' },
});

// ── Events ─────────────────────────────────────────────────
export const fetchEvents = (params = {}) =>
  api.get('/events', { params }).then((r) => r.data);

export const fetchFriendsCount = (eventId) =>
  api.get(`/events/${eventId}/friends-count`).then((r) => r.data);

// ── RSVP ───────────────────────────────────────────────────
export const createRSVP = (eventId, data) =>
  api.post(`/events/${eventId}/rsvp`, data).then((r) => r.data);

export const getUserRSVPs = (userId) =>
  api.get(`/users/${userId}/rsvps`).then((r) => r.data);

// ── Invites ────────────────────────────────────────────────
export const createInvite = (eventId, userId) =>
  api.post(`/events/${eventId}/invite`, { userId }).then((r) => r.data);

// Called ONCE when the invite page loads — increments the click counter
export const openInvite = (inviteCode) =>
  api.get(`/invites/${inviteCode}`).then((r) => r.data);

export default api;
