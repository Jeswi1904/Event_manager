# VIVA NOTES — EventPulse

Concise answers to expected viva questions, matched to the actual implementation.

---

## 1. Overall Architecture

Three-tier architecture:

```
React SPA (Vite)  →  Express REST API  →  MongoDB
                  ↕
            Ticketmaster Discovery API
```

- Frontend renders UI, handles user interaction, and calls the backend API
- Backend is the single source of truth for all business logic
- MongoDB persists Users, RSVPs, and Invites
- Ticketmaster provides the event listings (backend-only — never exposed to browser)

---

## 2. Why React + Express + MongoDB?

- **React**: Component-based, great for dynamic UIs with state management needs (RSVP status, calendar filtering)
- **Express**: Lightweight, minimal boilerplate, easy to structure with controllers/routes/services
- **MongoDB**: Schema-flexible (events have varying fields), document model fits nested data well, Mongoose adds schema validation without full SQL overhead
- **Together**: All JavaScript — single language across the stack, faster development, easy to maintain

---

## 3. How Ticketmaster Integration Works

File: `server/services/ticketmasterService.js`

1. Backend calls `https://app.ticketmaster.com/discovery/v2/events.json` with `?apikey=`, `?city=`, `?keyword=`
2. Each event is **normalized** into a consistent shape: `{ id, title, venue, city, date, time, image, url }`
3. Missing fields are handled with defaults (`'Venue TBD'`, `''`, etc.)
4. If API key is missing or the call fails, **mock data is returned automatically** — the app stays demonstrable
5. Frontend never sees the raw Ticketmaster response or the API key

---

## 4. Why API Keys Are in .env

- Storing secrets in code is a critical security vulnerability
- `.env` is git-ignored — keys never reach version control
- `process.env.TICKETMASTER_API_KEY` reads the value at runtime only on the server
- If the key were in frontend code, any browser dev tools inspection would expose it

---

## 5. MongoDB Schemas

### User
```js
{ name, email, createdAt }
```
- `email` has a unique index
- `_id` is the `userId` used everywhere else — ready for real auth

### RSVP
```js
{ userId, eventId, eventTitle, venue, eventDate, eventTime, shareToken, createdAt }
```
- Compound unique index on `(userId, eventId)` prevents duplicate RSVPs
- `shareToken: null` = direct RSVP; `shareToken: "ABC"` = came via invite link
- **`shareToken` is the key field for Friends Attending calculation**

### Invite
```js
{ eventId, inviterId, inviteCode, clicks, createdAt }
```
- `inviteCode` has a unique index
- `clicks` = link open count (views) — NOT the same as friends attending
- `nanoid(10)` generates the unique token

---

## 6. RSVP Flow

```
POST /api/events/:eventId/rsvp
Body: { userId, eventTitle, venue, eventDate, eventTime, shareToken }

1. Validate required fields
2. Check RSVP.findOne({ userId, eventId }) → 409 if exists
3. RSVP.create({ ...fields, shareToken: body.shareToken || null })
4. Return 201 with the RSVP document
```

If the user came via an invite link, `shareToken` is the invite code.
If the user RSVPs directly, `shareToken` is `null`.

---

## 7. Invite Generation

```
POST /api/events/:eventId/invite
Body: { userId }

1. Check RSVP exists for this user+event (must have RSVP'd first)
2. Check if an invite already exists for this user+event (return it if so)
3. Generate inviteCode = nanoid(10)  // e.g. "aB3xQ7kLmN"
4. Save Invite { eventId, inviterId: userId, inviteCode, clicks: 0 }
5. Return { inviteCode, shareUrl: `${CLIENT_URL}/invite/${inviteCode}` }
```

The share URL points to the React frontend's `/invite/:inviteCode` route.

---

## 8. Invite Click Tracking

```
GET /api/invites/:inviteCode

1. Find Invite by inviteCode → 404 if not found
2. Increment: Invite.findByIdAndUpdate(id, { $inc: { clicks: 1 } })
3. Return { inviteCode, eventId, inviterName, event, inviteClicks }
```

**Important:** The Invite page uses a `useRef` flag (`clickTracked.current`) to ensure this API is called **exactly once per mount**, even in React StrictMode (which double-mounts in development).

`clicks` tracks **link views/opens**, not RSVPs.

---

## 9. Friends Attending Calculation

This is the most critical piece. Calculated in `rsvpController.js → getFriendsCount`.

```
GET /api/events/:eventId/friends-count

1. Get all Invites for this event → build map: { inviteCode → inviterId }
2. Get all RSVPs for this event where shareToken != null
3. For each such RSVP:
   - Look up who the inviter is for that shareToken
   - If RSVP's userId !== inviterId → count it as a "friend attending"
4. Sum invite clicks across all invites for this event
5. Return { friendsAttending: N, inviteClicks: M }
```

**Why inviteClicks ≠ friendsAttending:**
- User B opens link → clicks = 1, friendsAttending = 0
- User B RSVPs → clicks = 1, friendsAttending = 1
- User C opens link → clicks = 2, friendsAttending = 1
- User C does NOT RSVP → clicks = 2, friendsAttending = 1

---

## 10. How Duplicate RSVPs Are Prevented

Two layers of protection:

1. **Application level**: `RSVP.findOne({ userId, eventId })` → return 409 before inserting
2. **Database level**: Mongoose compound unique index `{ userId: 1, eventId: 1 }` → throws error code `11000` if the app check is bypassed

This means a user physically cannot RSVP twice to inflate the Friends Attending count.

---

## 11. Why Business Logic Is on the Backend

- **Security**: Frontend code is visible to anyone — calculations could be tampered with
- **Consistency**: All clients (web, mobile, future API consumers) get the same result
- **Data integrity**: Friends Attending involves cross-document queries (RSVPs + Invites) that require database access
- **Single source of truth**: The number shown everywhere always comes from the same calculation
- If Friends Attending were calculated on the frontend, a user could manipulate their browser to show false counts

---

## 12. How Real-Time Could Be Added

The backend is structured cleanly for Socket.IO integration:

```js
// server.js
const { Server } = require('socket.io');
const io = new Server(httpServer, { cors: { origin: CLIENT_URL } });

// In rsvpController.js, after RSVP is created:
io.to(`event:${eventId}`).emit('friendsCountUpdated', { eventId, friendsAttending });
```

Frontend subscribes:
```js
socket.on('connect', () => socket.join(`event:${eventId}`));
socket.on('friendsCountUpdated', ({ friendsAttending }) => setCount(friendsAttending));
```

Currently, the EventCard component **re-fetches** the count after RSVP as a pragmatic alternative. The backend endpoints are already in the right shape for real-time overlays.

---

## 13. How Authentication Could Be Added

The entire data model uses `userId` (MongoDB ObjectId) throughout. The demo user system is a drop-in placeholder:

**Step 1**: Add a `passwordHash` field to the User model and a `POST /api/auth/login` endpoint.
**Step 2**: Return a JWT containing `{ userId, name }`.
**Step 3**: Frontend stores JWT in `localStorage` and sends it as `Authorization: Bearer <token>`.
**Step 4**: Add an Express `authenticate` middleware that verifies the JWT and sets `req.user`.
**Step 5**: Replace `userId` from request body with `req.user.userId` in all controllers.

No schema changes needed — just remove the hardcoded demo user mechanism from `UserContext.jsx` and replace with JWT-based auth.

---

## 14. How the Application Could Scale

| Concern | Current | Scaled |
|---------|---------|--------|
| Database | Single MongoDB instance | MongoDB Atlas, replica sets, sharding |
| Events cache | None (Ticketmaster called per request) | Redis TTL cache (e.g. 5 min) |
| Auth | Demo users | JWT + refresh tokens, or Auth0 |
| Real-time | Polling / re-fetch | Socket.IO or Server-Sent Events |
| API | Single Express server | Horizontal scaling behind a load balancer |
| Frontend | Vite SPA | CDN-distributed, code splitting |
| Ticketmaster rate limits | Direct calls | Server-side cache + request queuing |

The current architecture follows clean separation of concerns (controller/service/model) — this pattern scales naturally to microservices if needed, without requiring a rewrite.
