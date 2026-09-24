require('dotenv').config();
const express = require('express');
const cors = require('cors');

const connectDB = require('./config/db');
const eventRoutes = require('./routes/eventRoutes');
const rsvpRoutes = require('./routes/rsvpRoutes');
const inviteRoutes = require('./routes/inviteRoutes');
const errorHandler = require('./middleware/errorHandler');
const User = require('./models/User');

const app = express();
const PORT = process.env.PORT || 5000;

// ── Middleware ─────────────────────────────────────────────────────────────
app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(express.json());

// ── Routes ─────────────────────────────────────────────────────────────────
app.use('/api/events', eventRoutes);
app.use('/api/users', rsvpRoutes);
app.use('/api/invites', inviteRoutes);

// Health check — also reports MongoDB connection status
app.get('/api/health', (req, res) => {
  const mongoose = require('mongoose');
  const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
  res.json({ status: 'OK', database: dbStatus });
});

// ── Error handling ─────────────────────────────────────────────────────────
app.use(errorHandler);

// ── Seed demo users ────────────────────────────────────────────────────────
// Creates two demo users when the server first starts (if they don't exist).
// This replaces full authentication for the assessment.
// In production, replace this with a real auth system using these userId fields.
const seedDemoUsers = async () => {
  try {
    const demos = [
      { name: 'Demo User 1', email: 'demo1@eventplatform.dev' },
      { name: 'Demo User 2', email: 'demo2@eventplatform.dev' },
    ];

    for (const demo of demos) {
      const exists = await User.findOne({ email: demo.email });
      if (!exists) {
        const user = await User.create(demo);
        console.log(`[Seed] Created demo user: ${user.name} (${user._id})`);
      } else {
        console.log(`[Seed] Demo user exists: ${exists.name} (${exists._id})`);
      }
    }
  } catch (err) {
    console.error('[Seed] Failed to seed demo users:', err.message);
  }
};

// ── Start server ───────────────────────────────────────────────────────────
const start = async () => {
  const dbConnected = await connectDB();

  if (dbConnected) {
    await seedDemoUsers();
  } else {
    console.warn(
      '\n⚠️  Server starting WITHOUT database connection.\n' +
      '   RSVP, invite, and dashboard features will not work.\n' +
      '   Event browsing (from Ticketmaster/mock) will still work.\n'
    );
  }

  app.listen(PORT, () => {
    console.log(`\n🚀 Server running on http://localhost:${PORT}`);
    console.log(`   CLIENT_URL: ${process.env.CLIENT_URL || 'http://localhost:5173'}`);
    console.log(`   MONGODB_URI: ${process.env.MONGODB_URI}`);
    console.log(`   DB Status: ${dbConnected ? '✅ Connected' : '❌ Disconnected'}\n`);
  });
};

start();
