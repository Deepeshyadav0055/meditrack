require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

// Import routes
const hospitalsRouter = require('./routes/hospitals');
const bedsRouter = require('./routes/beds');
const bloodRouter = require('./routes/blood');
const ambulanceRouter = require('./routes/ambulance');
const alertsRouter = require('./routes/alerts');
const aiRouter = require('./routes/ai');

// Import middleware
const { apiLimiter } = require('./middleware/rateLimit');

const app = express();
const server = http.createServer(app);

// Socket.io setup
const io = new Server(server, {
    cors: {
        origin: process.env.FRONTEND_URL || 'http://localhost:5173',
        methods: ['GET', 'POST', 'PATCH', 'PUT', 'DELETE']
    }
});

// Trust proxy for Render deployment (fixes rate limiting)
app.set('trust proxy', 1);

// Middleware
app.use(cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:5173',
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Make io available to routes
app.set('io', io);

// Apply rate limiting to all API routes
app.use('/api', apiLimiter);

// Routes
app.use('/api/hospitals', hospitalsRouter);
app.use('/api/beds', bedsRouter);
app.use('/api/blood', bloodRouter);
app.use('/api/ambulance', ambulanceRouter);
app.use('/api/alerts', alertsRouter);
app.use('/api/ai', aiRouter);

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        service: 'MediTrack API'
    });
});

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        service: 'MediTrack API',
        version: '1.0.0',
        endpoints: {
            hospitals: '/api/hospitals',
            beds: '/api/beds',
            blood: '/api/blood',
            ambulance: '/api/ambulance/nearest',
            alerts: '/api/alerts',
            ai: '/api/ai/recommend'
        }
    });
});

// Socket.io connection handling
io.on('connection', (socket) => {
    console.log('Client connected:', socket.id);

    // Join city room for location-based updates
    socket.on('join_city', (city) => {
        socket.join(city);
        console.log(`Socket ${socket.id} joined city: ${city}`);
        socket.emit('joined_city', { city, message: 'Successfully joined city room' });
    });

    // Leave city room
    socket.on('leave_city', (city) => {
        socket.leave(city);
        console.log(`Socket ${socket.id} left city: ${city}`);
    });

    socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
    });
});

// Error handling middleware
app.use((err, req, res, next) => {
    console.error('Error:', err);
    res.status(err.status || 500).json({
        error: err.message || 'Internal server error',
        ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    });
});

// 404 handler
app.use((req, res) => {
    res.status(404).json({ error: 'Route not found' });
});

// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`🏥 MediTrack API server running on port ${PORT}`);
    console.log(`📡 Socket.io enabled for real-time updates`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('SIGTERM received, closing server...');
    server.close(() => {
        console.log('Server closed');
        process.exit(0);
    });
});

module.exports = { app, server, io };
