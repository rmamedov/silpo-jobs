require('dotenv').config();
const express = require('express');
const session = require('express-session');
const path = require('path');
const connectDB = require('./config/db');
const apiRoutes = require('./routes/api');
const authRoutes = require('./routes/auth');
const adminApiRoutes = require('./routes/admin-api');
const requireAuth = require('./middleware/requireAuth');

const app = express();
const PORT = process.env.PORT || 3001;

// Connect to MongoDB (non-blocking — site works without it using hardcoded data)
connectDB().catch(() => console.log('⚠️  MongoDB not available — running in static mode'));

// Body parsing
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Sessions — use MongoStore when MongoDB is available, memory store otherwise
const sessionConfig = {
  secret: process.env.SESSION_SECRET || 'fallback-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    maxAge: 24 * 60 * 60 * 1000,
    httpOnly: true,
    sameSite: 'lax'
  }
};
try {
  if (process.env.MONGO_URI) {
    const MongoStore = require('connect-mongo');
    sessionConfig.store = MongoStore.create({ mongoUrl: process.env.MONGO_URI });
  }
} catch (e) {
  console.log('⚠️  MongoStore not available, using memory sessions');
}
app.use(session(sessionConfig));

// Static files — public site
app.use(express.static(path.join(__dirname, 'public')));

// Static files — admin panel
app.use('/admin', express.static(path.join(__dirname, 'admin')));

// Static files — videos & fonts (served from project root for backward compatibility)
app.use('/videos', express.static(path.join(__dirname, 'public', 'videos')));
app.use('/fonts', express.static(path.join(__dirname, 'public', 'fonts')));

// Static files — uploaded story videos
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API routes
app.use('/api', apiRoutes);

// Auth routes
app.use('/admin/api', authRoutes);

// Protected admin API routes
app.use('/admin/api', requireAuth, adminApiRoutes);

// Admin SPA fallback
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin', 'index.html'));
});
app.get('/admin/*', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin', 'index.html'));
});

// Public SPA fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📋 Admin panel: http://localhost:${PORT}/admin`);
});
