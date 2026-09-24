# EventPulse — Event Discovery & Friend Invite Platform

A full-stack event discovery platform where users can find events via the Ticketmaster API, RSVP, generate invite links, and track friends attending — all with server-side business logic and MongoDB persistence.

---

## Features

- **Event Discovery** — Fetches live events from the Ticketmaster Discovery API (with mock fallback)
- **Event Calendar** — Monthly calendar view with highlighted event dates and date filtering
- **RSVP System** — Mark events as "Interested"; persisted to MongoDB, duplicate-safe
- **RSVP Dashboard** — View all your RSVPs with event details and status
- **Friend Invite System** — Generate unique share links; track clicks (views) vs actual RSVPs separately
- **Friends Attending** — Server-calculated count of friends who RSVP'd via an invite link
- **Demo User Selector** — Switch between two seeded users to demo the invite flow

---

## Tech Stack

| Layer     | Technology                        |
|-----------|-----------------------------------|
| Frontend  | React 18, Vite, React Router v6   |
| Styling   | Vanilla CSS (custom design system)|
| HTTP      | Axios                             |
| Backend   | Node.js, Express.js               |
| Database  | MongoDB, Mongoose                 |
| External  | Ticketmaster Discovery API        |

---

## Architecture

```
Browser (React SPA)
    │
    │ HTTP (proxied in dev via Vite)
    ▼
Express API Server (Node.js)
    │                    │
    ▼                    ▼
MongoDB             Ticketmaster API
(RSVPs, Users,      (Event listings)
 Invites)
```

**Key design principle:** All business logic lives on the backend. The frontend only renders, interacts, and calls APIs.

---

## Folder Structure

```
event-platform/
├── client/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Navbar.jsx
│   │   │   ├── EventCard.jsx
│   │   │   ├── EventCalendar.jsx
│   │   │   ├── RSVPButton.jsx
│   │   │   ├── ShareButton.jsx
│   │   │   └── Loading.jsx
│   │   ├── context/
│   │   │   └── UserContext.jsx     # Demo user management
│   │   ├── pages/
│   │   │   ├── Home.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   └── Invite.jsx
│   │   ├── services/
│   │   │   └── api.js              # All API calls centralized here
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── index.html
│   ├── vite.config.js
│   └── package.json
│
├── server/
│   ├── config/
│   │   └── db.js                   # MongoDB connection
│   ├── controllers/
│   │   ├── eventController.js
│   │   ├── rsvpController.js       # Friends Attending logic here
│   │   └── inviteController.js
│   ├── middleware/
│   │   └── errorHandler.js
│   ├── models/
│   │   ├── User.js
│   │   ├── RSVP.js                 # Has shareToken field (key for invite tracking)
│   │   └── Invite.js               # Tracks clicks (views), not RSVPs
│   ├── routes/
│   │   ├── eventRoutes.js
│   │   ├── rsvpRoutes.js
│   │   └── inviteRoutes.js
│   ├── services/
│   │   └── ticketmasterService.js  # Real API + mock fallback
│   ├── server.js
│   └── package.json
│
├── .env.example
├── .gitignore
├── README.md
└── VIVA_NOTES.md
```

---

## Environment Variables

Create `server/.env` (copy from `.env.example`):

```env
TICKETMASTER_API_KEY=your_ticketmaster_api_key_here
MONGODB_URI=mongodb://localhost:27017/event-platform
PORT=5000
CLIENT_URL=http://localhost:5173
```

> **Security note:** The `.env` file is in `.gitignore` and must never be committed. API keys are only accessed server-side — never exposed to the browser.

---

## Installation

```bash
# Clone or navigate to the project
cd event-platform

# Install server dependencies
cd server && npm install

# Install client dependencies
cd ../client && npm install
```

---

## Running the Application

### Backend (Terminal 1)
```bash
cd server
npm run dev
# Server starts at http://localhost:5000
# Two demo users are seeded automatically
```

### Frontend (Terminal 2)
```bash
cd client
npm run dev
# Vite starts at http://localhost:5173
# API calls are proxied to :5000 automatically
```

---

## API Endpoints

### Events
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/events` | Fetch events (optional: `?city=&keyword=&date=`) |
| POST | `/api/events/:eventId/rsvp` | RSVP to an event |
| POST | `/api/events/:eventId/invite` | Generate a share link |
| GET | `/api/events/:eventId/friends-count` | Get friends attending + invite click counts |

### Users
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users/demo-users` | Get seeded demo users |
| GET | `/api/users/:userId/rsvps` | Get all RSVPs for a user |

### Invites
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/invites/:inviteCode` | Open an invite (increments click count, returns event info) |

---

## MongoDB Setup

1. Install [MongoDB Community](https://www.mongodb.com/try/download/community) locally, **or** use [MongoDB Atlas](https://www.mongodb.com/atlas) (free tier)
2. Set `MONGODB_URI` in `server/.env`
3. The database and collections are created automatically by Mongoose on first run
4. Two demo users are seeded automatically on server startup

---

## Ticketmaster API Setup

1. Register at [Ticketmaster Developer Portal](https://developer.ticketmaster.com/)
2. Create an app to get your API key
3. Set `TICKETMASTER_API_KEY` in `server/.env`

> If no API key is configured, the application automatically falls back to **mock event data** so it remains fully demonstrable. The real Ticketmaster integration is preserved and activates as soon as a valid key is provided.

---

## Friend Invite Flow

```
User A RSVPs to Event X
    │
    ├─ User A clicks "Share"
    │     └─ Backend creates Invite { eventId: X, inviterId: A, inviteCode: ABC, clicks: 0 }
    │     └─ Returns shareUrl: http://localhost:5173/invite/ABC
    │
User B opens /invite/ABC
    │     └─ Backend: clicks = clicks + 1  (link view tracking)
    │     └─ Frontend shows: inviter name, event details, RSVP button
    │
User B clicks "RSVP — I'm Attending!"
    │     └─ POST /api/events/X/rsvp  { shareToken: "ABC" }
    │     └─ RSVP saved: { userId: B, eventId: X, shareToken: "ABC" }
    │
GET /api/events/X/friends-count
    │     └─ Query: RSVPs where shareToken != null AND userId != inviter A
    │     └─ Result: { friendsAttending: 1, inviteClicks: 1 }
```

**Critical distinction:**
- `inviteClicks` = how many times the link was **opened** (tracked on the Invite document)
- `friendsAttending` = how many users actually **RSVP'd** via an invite (tracked via `shareToken` on RSVP documents)
- These are **two separate values** — one person clicking a link 5 times = 5 clicks, 0 friends attending

---

## Example User Flow

1. Open `http://localhost:5173`
2. Select **Demo User 1** in the navbar
3. Click **Interested** on any event → RSVP saved to MongoDB
4. Click **Share** → unique invite URL copied to clipboard
5. Copy the URL, switch to **Demo User 2** in the navbar
6. Paste the URL in browser → Invite page loads, click count increments
7. Click **RSVP — I'm Attending!** → Friend's RSVP saved with `shareToken`
8. Navigate to Home → Event card shows **Friends Attending: 1**
9. Switch back to **Demo User 1** → Dashboard shows **Friends Attending: 1** and **1 link view**
