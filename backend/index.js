require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const { createClient } = require('@supabase/supabase-js');
const http = require('http');
const { Server } = require('socket.io');

// Import routes
const profileRoutes = require('./routes/profileRoutes');
const adminRoutes = require('./routes/adminRoutes');
const bookmarksRoutes = require('./routes/bookmarksRoutes');
const noticesRoutes = require('./routes/noticesRoutes');
const requestsRoutes = require('./routes/requestsRoutes');
const searchRoutes = require('./routes/searchRoutes');
const feedbackRoutes = require('./routes/feedbackRoutes');
const utilityRoutes = require('./routes/utilityRoutes');
const placementRoutes = require('./routes/placementRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const contentRoutes = require('./routes/contentRoutes');
const deleteRoutes = require('./routes/deleteRoutes');
const { rateLimit } = require('express-rate-limit');

const app = express();
const server = http.createServer(app);

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
// Rate Limiters
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 min
  max: 100,
  message: { error: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  message: { error: 'Upload limit reached. Max 10 uploads per hour.' },
});

const feedbackLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5,
  message: { error: 'Too many feedback submissions. Please wait before submitting again.' },
});

const submissionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Too many submissions. Please slow down.' },
});

app.use(express.json());

// Supabase Setup
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

// Socket.io Setup
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ['GET', 'POST']
  }
});

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
  });
});

// Attach supabase to req so routes can use it
app.use((req, res, next) => {
  req.supabase = supabase;
  next();
});

// Basic route
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'AFIN Backend is running' });
});

// API Routes
app.use('/api/profile', generalLimiter, profileRoutes);
app.use('/api/admin', generalLimiter, adminRoutes);
app.use('/api/bookmarks', generalLimiter, bookmarksRoutes);
app.use('/api/notices', submissionLimiter, noticesRoutes);
app.use('/api/requests', submissionLimiter, requestsRoutes);
app.use('/api/search', generalLimiter, searchRoutes);
app.use('/api/feedback', feedbackLimiter, feedbackRoutes);
app.use('/api/utility', submissionLimiter, utilityRoutes);
app.use('/api/placement', generalLimiter, placementRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/content', generalLimiter, contentRoutes);
app.use('/api/delete', generalLimiter, deleteRoutes);

// 404 Handler - Return JSON
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.originalUrl} not found.` });
});

// Global Error Handler - Return JSON
app.use((err, req, res, next) => {
  console.error('[SERVER ERROR]', err);
  res.status(err.status || 500).json({ 
    error: err.message || 'Internal server error',
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
  });
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
