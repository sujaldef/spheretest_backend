const express = require('express');
const cors = require('cors');

const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const sphereRoutes = require('./routes/sphereRoutes');
const questionRoutes = require('./routes/questionRoutes');
const { notFound, errorHandler } = require('./utils/errorHandler');

const app = express();

// Core middleware
app.use(express.json());

// CORS configuration
const allowedOrigin = process.env.CLIENT_URL || 'http://localhost:5173';
app.use(
  cors({
    origin: allowedOrigin,
    credentials: true,
  })
);

// Health check
app.get('/', (req, res) => {
  res.send('SphereTest API Running');
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/spheres', sphereRoutes);
app.use('/api/questions', questionRoutes);

// 404 + global error handlers
app.use(notFound);
app.use(errorHandler);

module.exports = app;

