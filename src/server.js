const http = require('http');
const dotenv = require('dotenv');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

const connectDB = require('./config/db');
const app = require('./app');
const registerSocketHandlers = require('./sockets/socketHandler');

// Load environment variables
dotenv.config();

if (!process.env.JWT_SECRET) {
  console.error('JWT_SECRET is required but not set in environment variables.');
  process.exit(1);
}

// Connect to MongoDB
connectDB();

const PORT = process.env.PORT || 5000;
const CLIENT_URL = process.env.CLIENT_URL || 'http://localhost:5173';

// Create HTTP server
const server = http.createServer(app);

// Attach Socket.io with CORS
const io = new Server(server, {
  cors: {
    origin: CLIENT_URL,
    methods: ['GET', 'POST'],
  },
});

/**
 * Socket.io authentication middleware
 * Verifies JWT token on connection and attaches user to socket
 */
io.use((socket, next) => {
  try {
    // Get token from auth object (sent by client in handshake)
    const token =
      socket.handshake.auth.token ||
      socket.handshake.headers.authorization?.split(' ')[1];

    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }

    // Verify JWT token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.id;
    socket.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return next(new Error('Authentication error: Token expired'));
    } else if (error.name === 'JsonWebTokenError') {
      return next(new Error('Authentication error: Invalid token'));
    }
    return next(new Error('Authentication error: ' + error.message));
  }
});

// Register socket handlers
registerSocketHandlers(io);

// Start server
server.listen(PORT, () => {
  console.log(`🚀 SphereTest server running on port ${PORT}`);
});
