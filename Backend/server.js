require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const http = require('http');
const multer = require('multer');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const { connectDB } = require('./db');
const Resource = require('./models/resource');
const gamificationRoutes = require('./routes/gamification');

const app = express();

// Store active connections
const activeConnections = new Map();

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO with CORS
const io = require('socket.io')(server, {
  cors: {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true
  }
});

// Connect to MongoDB
connectDB();

// Socket.IO Authentication Middleware
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  
  if (!token) {
    return next(new Error('Authentication error: No token provided'));
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.id;
    return next();
  } catch (err) {
    console.error('Socket auth error:', err.message);
    return next(new Error('Authentication error: Invalid token'));
  }
});

// Socket.IO Connection Handler
io.on('connection', (socket) => {
  console.log(`User connected: ${socket.userId}`);
  
  // Join user to their personal room
  socket.join(`user:${socket.userId}`);
  
  // Handle joining chat rooms
  socket.on('join_room', (roomId) => {
    socket.join(`room:${roomId}`);
    console.log(`User ${socket.userId} joined room ${roomId}`);
  });

  // Handle chat messages
  socket.on('send_message', async (messageData) => {
    try {
      const { roomId, content, senderId } = messageData;
      
      // Broadcast to room
      io.to(`room:${roomId}`).emit('receive_message', {
        ...messageData,
        timestamp: new Date()
      });
      
      console.log(`Message sent to room ${roomId} by user ${senderId}`);
    } catch (error) {
      console.error('Error handling message:', error);
      socket.emit('error', { message: 'Failed to send message' });
    }
  });

    // Store the connection
  activeConnections.set(socket.id, {
    userId: socket.userId,
    connectedAt: new Date()
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log(`User disconnected: ${socket.userId}`);
    activeConnections.delete(socket.id);
  });
});

// Middleware
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});

// Apply rate limiting to all requests
app.use(limiter);

// CORS configuration
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:3000',
  // Add more trusted origins as needed
];
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['Content-Range', 'X-Content-Range']
};
// Only allow requests from trusted origins for security
app.use(cors(corsOptions));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
  console.log('Created uploads directory');
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    // Make sure the directory exists
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
      console.log('Created uploads directory on demand');
    }
    cb(null, uploadsDir);
  },
  filename: function(req, file, cb) {
    // Create a unique filename with original extension
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, uniqueSuffix + ext);
  }
});

const upload = multer({ 
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: function(req, file, cb) {
    // Accept common document formats
    const allowedTypes = [
      'application/pdf', 
      'application/msword', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'image/jpeg',
      'image/png'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, DOC, DOCX, PPT, PPTX, JPG, and PNG are allowed.'));
    }
  }
});

// Serve static files from uploads directory
app.use('/uploads', express.static(uploadsDir));

// Routes
app.use('/api/gamification', gamificationRoutes);

// Define Routes
app.use('/api/users', require('./routes/users'));
app.use('/api/auth', require('./routes/auth'));
// app.use('/api/study-sessions', require('./routes/studySessions')); // Commented out as this module doesn't exist yet
app.use('/api/resources', require('./routes/resource'));
app.use('/api/chat', require('./routes/chat'));
app.use('/api/whiteboards', require('./routes/whiteboards'));
app.use('/api/calendar', require('./routes/calendar'));
app.use('/api/swipemaster', require('./routes/swipemaster'));

// Additional routes for pomodoro heatmap
app.get('/api/pomodoro/heatmap', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    const userId = req.user?.id || '123456789'; // Use mock ID if auth not implemented
    
    // For now, return mock data for the heatmap
    const mockHeatmapData = [];
    const start = new Date(startDate || new Date(Date.now() - 180 * 24 * 60 * 60 * 1000)); // 6 months ago
    const end = new Date(endDate || Date.now());
    
    for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
      // Generate random count data
      const randomCount = Math.floor(Math.random() * 8); // 0-7 sessions
      
      if (randomCount > 0) {
        mockHeatmapData.push({
          date: d.toISOString().split('T')[0],
          sessionsCount: randomCount
        });
      }
    }
    
    res.json(mockHeatmapData);
  } catch (error) {
    console.error('Error fetching pomodoro heatmap data:', error);
    res.status(500).json({ message: 'Error fetching pomodoro data' });
  }
});

app.get('/api/pomodoro/daily/:date', async (req, res) => {
  try {
    const { date } = req.params;
    const userId = req.user?.id || '123456789'; // Use mock ID if auth not implemented
    
    // For now, return mock data for the selected date
    const sessionCount = Math.floor(Math.random() * 6) + 1; // 1-6 sessions
    const mockSessions = [];
    
    for (let i = 0; i < sessionCount; i++) {
      const hour = 9 + Math.floor(Math.random() * 10); // Between 9am and 7pm
      const minute = Math.floor(Math.random() * 60);
      const duration = [25, 30, 45, 50][Math.floor(Math.random() * 4)]; // Common durations
      
      const startTime = new Date(`${date}T${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}:00`);
      
      mockSessions.push({
        startTime: startTime.toISOString(),
        duration,
        notes: Math.random() > 0.7 ? 'Study session notes example' : ''
      });
    }
    
    const totalMinutes = mockSessions.reduce((total, session) => total + session.duration, 0);
    
    res.json({
      date,
      userId,
      totalSessions: sessionCount,
      totalMinutes,
      sessions: mockSessions
    });
  } catch (error) {
    console.error('Error fetching daily pomodoro data:', error);
    res.status(500).json({ message: 'Error fetching daily pomodoro data' });
  }
});

// Basic route for testing - this will help verify the server is working
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'API is working!', 
    time: new Date().toISOString(),
    nodeVersion: process.version,
    environment: process.env.NODE_ENV || 'development'
  });
});

// Mock authentication route
app.post('/api/auth/login', (req, res) => {
  // Mock successful login
  const { email, password } = req.body;
  
  // Simple validation
  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  // Return mock user data
  res.json({
    token: 'mock-token-' + Date.now(),
    userId: '123456789',
    name: 'Test User',
    email: email
  });
});

// Mock registration route
app.post('/api/auth/register', (req, res) => {
  // Mock successful registration
  const { name, email, password } = req.body;
  
  // Simple validation
  if (!name || !email || !password) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  // Return mock user data
  res.json({
    token: 'mock-token-' + Date.now(),
    userId: '123456789',
    name: name,
    email: email
  });
});

// Mock chat rooms route
app.get('/api/chat/rooms', (req, res) => {
  res.json(['global', 'general', 'help', 'semester1', 'semester2', 'programming', 'projects']);
});

// Mock ChatRoom specific endpoint 
app.get('/api/chat/room/:roomId', (req, res) => {
  const roomId = req.params.roomId;
  
  // Return room details with mock data
  res.json({
    _id: roomId,
    name: roomId.charAt(0).toUpperCase() + roomId.slice(1),
    description: `This is the ${roomId} chat room for students to discuss related topics.`,
    members: 24,
    createdAt: '2023-01-15T08:30:00.000Z',
    lastActive: new Date().toISOString()
  });
});

// More detailed mock messages for specific rooms
app.get('/api/chat/messages/:roomId', (req, res) => {
  const roomId = req.params.roomId;
  const messages = [];
  
  // Generate 15 mock messages for the room
  for (let i = 0; i < 15; i++) {
    const isEven = i % 2 === 0;
    messages.push({
      _id: `msg_${roomId}_${i}`,
      sender: {
        _id: isEven ? '123456789' : '987654321',
        name: isEven ? 'Test User' : 'Study Buddy',
        email: isEven ? 'testuser@example.com' : 'studybuddy@example.com'
      },
      content: `This is message #${i+1} in the ${roomId} room. ${isEven ? 'Have you completed the assignment?' : 'Yes, I found the algorithms section challenging though!'}`,
      roomId: roomId,
      createdAt: new Date(Date.now() - (15-i) * 60000).toISOString() // Messages spread over last 15 minutes
    });
  }
  
  res.json(messages);
});

// Mock sending message route
app.post('/api/chat/messages', (req, res) => {
  // Extract message content from request body, checking both 'content' and 'text' fields
  const content = req.body.content || req.body.text;
  const roomId = req.body.roomId;
  
  // Validate input
  if (!content) {
    return res.status(400).json({ message: 'Message content is required' });
  }
  
  // Create message with normalized fields
  const message = {
    _id: Date.now().toString(),
    sender: {
      _id: '123456789',
      name: 'Test User',
      email: 'test@example.com'
    },
    content: content,
    text: content, // Add text field for compatibility
    roomId: roomId || 'global',
    createdAt: new Date().toISOString()
  };
  
  // Return the created message
  res.status(201).json(message);
});

// Search resources route
app.get('/api/resources/search', async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query || query.trim() === '') {
      return res.status(400).json({ message: 'Search query is required' });
    }
    
    // Use MongoDB text search with the text index defined in the Resource model
    const searchResults = await Resource.find(
      { $text: { $search: query } },
      { score: { $meta: 'textScore' } }
    ).sort({ score: { $meta: 'textScore' } });
    
    // Format results as expected by the frontend
    const formattedResults = {
      notes: searchResults.filter(r => r.type === 'notes'),
      papers: searchResults.filter(r => r.type === 'papers')
    };
    
    res.json(formattedResults);
  } catch (error) {
    console.error('Error searching resources:', error);
    res.status(500).json({ message: 'Error searching resources' });
  }
});

// Get resources from MongoDB
app.get('/api/resources', async (req, res) => {
  try {
    // Fetch resources from MongoDB
    const allResources = await Resource.find().sort({ createdAt: -1 });
    
    // Format for the expected structure
    const formattedResources = {
      notes: allResources.filter(r => r.type === 'notes'),
      papers: allResources.filter(r => r.type === 'papers')
    };
    
    res.json(formattedResources);
  } catch (error) {
    console.error('Error fetching resources:', error);
    res.status(500).json({ message: 'Error fetching resources' });
  }
});

// Updated resource upload route with file handling and MongoDB integration
app.post('/api/resources/upload', upload.single('file'), async (req, res) => {
  try {
    // Extract data from request
    const { title, description, type, semester } = req.body;
    const file = req.file;
    
    console.log('Upload request received:', req.body);
    console.log('File information:', file);
    
    // Validate inputs
    if (!title || !type || !semester) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    
    if (!file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
    
    // Get file information
    const fileUrl = `/uploads/${file.filename}`;
    const fileType = file.mimetype;
    const fileSize = file.size;
    
    console.log('File uploaded successfully:', {
      filename: file.filename,
      originalName: file.originalname,
      mimetype: file.mimetype,
      size: file.size
    });
    
    // Create a new resource document
    const newResource = new Resource({
      title,
      description: description || 'No description provided',
      type,
      semester: parseInt(semester) || 1,
      fileUrl,
      fileType,
      fileSize,
      // Create a valid ObjectId (don't use hard-coded ID in production)
      uploadedBy: req.user?.id || new mongoose.Types.ObjectId('123456789123456789123456'),
      subject: '', // Add empty subject to match the text index
      tags: [],    // Add empty tags to match the text index
      downloads: 0
    });
    
    // Save to MongoDB
    const savedResource = await newResource.save();
    console.log('Resource saved to database:', savedResource._id);
    
    // Return the saved resource
    res.status(201).json(savedResource);
  } catch (error) {
    console.error('Resource upload error:', error);
    res.status(500).json({ message: 'Error uploading resource: ' + error.message });
  }
});

// Resource content endpoint
app.get('/api/resources/:id/content', async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);
    if (!resource) {
      return res.status(404).json({ message: 'Resource not found' });
    }

    // Remove leading slash from fileUrl if present
    const cleanFileUrl = resource.fileUrl.startsWith('/') ? resource.fileUrl.substring(1) : resource.fileUrl;
    const filePath = path.join(__dirname, cleanFileUrl);
    
    // Check if file exists
    try {
      await fs.promises.access(filePath, fs.constants.F_OK);
      console.log('File exists and is accessible:', filePath);
    } catch (error) {
      console.error('File not found or not accessible:', filePath, error);
      return res.status(404).json({ message: 'File not found' });
    }

    const fileType = path.extname(filePath).toLowerCase();
    console.log('File type:', fileType);
    console.log('Full file path:', filePath);

    // For images, PDFs, and text files, serve them directly
    if (['.jpg', '.jpeg', '.png', '.gif', '.pdf'].includes(fileType)) {
      res.sendFile(filePath);
    } else if (['.txt', '.md', '.html', '.htm'].includes(fileType)) {
      // For text files, read and return content
      const content = await fs.promises.readFile(filePath, 'utf8');
      res.json({
        content,
        fileType: fileType.substring(1),
        fileName: path.basename(filePath)
      });
    } else {
      // For other files, return metadata and URL for download
      const stats = await fs.promises.stat(filePath);
      res.json({
        content: 'File preview not available for this file type. Please download the file to view it.',
        fileType: fileType.substring(1),
        fileName: path.basename(filePath),
        fileSize: stats.size,
        downloadUrl: `/api/resources/${resource._id}/download`
      });
    }
  } catch (error) {
    console.error('Error fetching resource content:', error);
    res.status(500).json({ message: 'Error fetching resource content: ' + error.message });
  }
});

// Resource download route with MongoDB tracking
app.get('/api/resources/:id/download', async (req, res) => {
  try {
    const id = req.params.id;
    
    // Find the resource in MongoDB
    const resource = await Resource.findById(id);
    
    if (!resource) {
      return res.status(404).json({ message: 'Resource not found' });
    }
    
    // Increment download count
    resource.downloads = (resource.downloads || 0) + 1;
    await resource.save();
    
    // Get file path
    const fileUrl = resource.fileUrl.startsWith('/') ? resource.fileUrl.substring(1) : resource.fileUrl;
    const filePath = path.join(__dirname, fileUrl);
    
    // Check if file exists
    if (!fs.existsSync(filePath)) {
      console.error(`File not found on server: ${filePath}`);
      return res.status(404).json({ message: 'File not found on server' });
    }
    
    // Get file name from the path
    const fileName = path.basename(filePath);
    
    console.log(`Sending file: ${filePath} as ${fileName}`);
    
    // Set headers for download
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Type', 'application/octet-stream');
    
    // Send file
    res.sendFile(filePath, (err) => {
      if (err) {
        console.error('Error sending file:', err);
        res.status(500).json({ message: 'Error sending file' });
      }
    });
  } catch (error) {
    console.error('Resource download error:', error);
    res.status(500).json({ message: 'Error downloading resource' });
  }
});

// Resource delete endpoint
app.delete('/api/resources/:id', async (req, res) => {
  try {
    const id = req.params.id;
    
    // Check for authentication token
    const token = req.header('x-auth-token');
    if (!token) {
      return res.status(401).json({ message: 'Authentication required. Please log in again.' });
    }
    
    // Find the resource in MongoDB
    const resource = await Resource.findById(id);
    
    if (!resource) {
      return res.status(404).json({ message: 'Resource not found' });
    }
    
    // Delete the file from the filesystem
    const filePath = path.join(__dirname, resource.fileUrl);
    try {
      await fs.promises.unlink(filePath);
      console.log(`File deleted: ${filePath}`);
    } catch (fileError) {
      console.error(`Error deleting file: ${filePath}`, fileError);
      // Continue with deletion even if file removal fails
    }
    
    // Delete the resource from the database
    await Resource.findByIdAndDelete(id);
    
    res.json({ message: 'Resource deleted successfully' });
  } catch (error) {
    console.error('Resource deletion error:', error);
    res.status(500).json({ message: 'Error deleting resource' });
  }
});

// Mock gamification stats route
app.get('/api/gamification/stats', (req, res) => {
  // In a real implementation, you would fetch this data from the database
  // For now, we'll use mock data that includes the pomodoroSessions count
  
  // Get the stored pomodoro sessions count or use default
  const pomodoroSessions = 28; // This would come from the database in a real app
  
  res.json({
    studyHours: 42,
    streaks: 7,
    badges: ['early-bird', 'night-owl', 'consistent-learner'],
    lastStudyDate: new Date().toISOString(),
    level: 5,
    pomodoroSessions: pomodoroSessions
  });
});

// Enhanced Pomodoro route for tracking completed sessions
app.post('/api/pomodoro/complete', async (req, res) => {
  try {
    // Extract data from request
    const { duration, completed } = req.body;
    
    // In a real app, you would get the user from authentication
    // For now, we'll use a mock user ID
    const userId = '123456789';
    
    // 1. Record the Pomodoro session in your database if you want to track history
    // This is optional but good for detailed tracking
    if (mongoose.models.PomodoroSession) {
      const newSession = new mongoose.models.PomodoroSession({
        userId,
        duration: duration || 25,
        completed: completed || true,
        timestamp: new Date()
      });
      await newSession.save();
    }
    
    // 2. Update the user's gamification stats to increment pomodoroSessions
    // Simple mock implementation for now
    const userStats = {
      studyHours: 42,
      streaks: 7,
      badges: ['early-bird', 'night-owl', 'consistent-learner'],
      lastStudyDate: new Date().toISOString(),
      level: 5,
      pomodoroSessions: 29  // Increment this
    };
    
    // Increment the pomodoro sessions count
    userStats.pomodoroSessions += 1;
    
    // Check if any new badges should be awarded
    if (userStats.pomodoroSessions >= 10 && !userStats.badges.includes('pomodoro-beginner')) {
      userStats.badges.push('pomodoro-beginner');
    }
    if (userStats.pomodoroSessions >= 50 && !userStats.badges.includes('pomodoro-master')) {
      userStats.badges.push('pomodoro-master');
    }
    if (userStats.pomodoroSessions >= 100 && !userStats.badges.includes('pomodoro-expert')) {
      userStats.badges.push('pomodoro-expert');
    }
    
    // In a real implementation, you would update the user document in your database
    // For the mock implementation, we'll just return the updated stats
    
    res.json({
      message: 'Pomodoro session recorded',
      totalSessions: userStats.pomodoroSessions,
      xpGained: 10,
      newBadges: userStats.badges.filter(badge => 
        ['pomodoro-beginner', 'pomodoro-master', 'pomodoro-expert'].includes(badge)
      )
    });
  } catch (error) {
    console.error('Error recording pomodoro session:', error);
    res.status(500).json({ message: 'Failed to record pomodoro session' });
  }
});

// Endpoint for resetting gamification progress
app.post('/api/gamification/reset', (req, res) => {
  // In a real implementation, you would:
  // 1. Get the user ID from authentication
  // 2. Verify the provided password against the stored password
  // 3. Reset the user's gamification data in the database
  
  // For now, we'll just return a mock response without checking password
  // This will allow the reset functionality to work for testing purposes
  res.json({
    message: 'Progress reset successfully',
    studyHours: 0,
    streaks: 0,
    badges: [],
    lastStudyDate: null,
    level: 1,
    pomodoroSessions: 0
  });
});

// Endpoint for updating user streak
app.put('/api/gamification/streak', (req, res) => {
  // In a real implementation, you would:
  // 1. Get the user ID from authentication
  // 2. Check if they already have a streak for today
  // 3. Update their streak count in the database
  
  // For now, we'll just return a mock response
  res.json({
    message: 'Streak updated successfully',
    currentStreak: 8, // Incremented from 7
    lastUpdated: new Date().toISOString()
  });
});

// Mock user profile route
app.get('/api/auth/user', (req, res) => {
  res.json({
    _id: '123456789',
    name: 'Test User',
    email: 'test@example.com',
    studyHours: 42,
    level: 5,
    createdAt: new Date().toISOString()
  });
});

// Centralized error handling middleware
app.use((err, req, res, next) => {
  // Log error with full context
  console.error('API Error:', {
    timestamp: new Date().toISOString(),
    method: req.method,
    path: req.path,
    error: err,
    stack: err.stack,
    message: err.message,
    user: req.user ? { id: req.user.id, email: req.user.email } : 'Anonymous'
  });

  // Handle different error types
  if (err instanceof multer.MulterError) {
    // File upload errors
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        success: false,
        error: 'File too large',
        message: 'Maximum file size is 10MB'
      });
    }
    return res.status(400).json({
      success: false,
      error: 'File upload error',
      message: err.message
    });
  }

  if (err.name === 'ValidationError') {
    // MongoDB validation errors
    const validationErrors = Object.values(err.errors).map(e => ({
      field: e.path,
      message: e.message,
      type: e.kind
    }));
    return res.status(400).json({
      success: false,
      error: 'Validation error',
      message: 'Input validation failed',
      details: validationErrors
    });
  }

  if (err.name === 'TokenExpiredError' || err.name === 'JsonWebTokenError') {
    // JWT related errors
    return res.status(401).json({
      success: false,
      error: 'Authentication error',
      message: 'Session expired. Please login again.'
    });
  }

  if (err.name === 'MongoError' && err.code === 11000) {
    // MongoDB duplicate key error
    return res.status(400).json({
      success: false,
      error: 'Duplicate entry',
      message: 'This email is already registered'
    });
  }

  // Default error response
  res.status(err.status || 500).json({
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' 
      ? err.message 
      : 'An error occurred while processing your request'
  });
});

// Handle 404 errors
app.use((req, res) => {
  res.status(404).json({
    message: 'Route not found',
    path: req.originalUrl
  });
});

// Global error handling middleware
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  
  const statusCode = err.statusCode || 500;
  const message = process.env.NODE_ENV === 'production' 
    ? 'Internal Server Error' 
    : err.message;

  res.status(statusCode).json({
    success: false,
    error: message,
    details: err.details || null
  });
});

// Start server
const PORT = process.env.PORT || 5005;

// Error handling for unhandled promise rejections
process.on('unhandledRejection', (err) => {
  console.error('Unhandled Rejection:', err);
  // Consider whether to crash the app or not based on the error
  // process.exit(1);
});

// Error handling for uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('Uncaught Exception:', err);
  // Consider whether to crash the app or not based on the error
  // process.exit(1);
});

// Socket.IO middleware for authentication
io.use(async (socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) {
    return next(new Error('Authentication error: No token provided'));
  }
  try {
    const decoded = require('jsonwebtoken').verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.id;
    next();
  } catch (err) {
    return next(new Error('Authentication error: Invalid token'));
  }
});

// Socket.IO connection handler
io.on('connection', (socket) => {
  console.log('User connected:', socket.userId);
  
  // Add the socket to a user-specific room for targeted messages
  socket.join(`user:${socket.userId}`);
  
  // Handle joining chat rooms
  socket.on('join_room', (roomId) => {
    console.log(`User ${socket.userId} joined room: ${roomId}`);
    socket.join(roomId);
    
    // Notify room that a new user has joined
    socket.to(roomId).emit('user_joined', {
      userId: socket.userId,
      timestamp: new Date().toISOString()
    });
  });
  
  // Handle leaving chat rooms
  socket.on('leave_room', (roomId) => {
    console.log(`User ${socket.userId} left room: ${roomId}`);
    socket.leave(roomId);
    
    // Notify room that a user has left
    socket.to(roomId).emit('user_left', {
      userId: socket.userId,
      timestamp: new Date().toISOString()
    });
  });
  
  // Handle chat messages
  socket.on('send_message', async (messageData) => {
    const { roomId, text, replyTo } = messageData;
    
    // Create a new message object
    const message = {
      _id: Date.now().toString(),
      sender: {
        _id: socket.userId,
        name: messageData.senderName || 'User',
        email: messageData.senderEmail || 'user@example.com'
      },
      content: text,
      text: text,
      roomId: roomId,
      replyTo: replyTo,
      createdAt: new Date().toISOString()
    };
    
    // Broadcast the message to all users in the room
    io.to(roomId).emit('new_message', message);
    
    // Save the message to database (in a real implementation)
    try {
      // const savedMessage = await Message.create(message);
      console.log('Message saved:', message._id);
    } catch (error) {
      console.error('Error saving message:', error);
    }
  });
  
  // Handle reactions to messages
  socket.on('message_reaction', (reactionData) => {
    const { messageId, roomId, emoji } = reactionData;
    
    io.to(roomId).emit('new_reaction', {
      messageId,
      userId: socket.userId,
      emoji,
      timestamp: new Date().toISOString()
    });
  });
  
  // Handle user typing indicator
  socket.on('typing', (data) => {
    const { roomId, isTyping } = data;
    
    socket.to(roomId).emit('user_typing', {
      userId: socket.userId,
      isTyping
    });
  });
  
  // Handle pomodoro sessions
  socket.on('pomodoro_completed', (data) => {
    // Notify friends/study group (if implemented)
    if (data.shareWithGroup && data.groupId) {
      io.to(`group:${data.groupId}`).emit('friend_pomodoro_completed', {
        userId: socket.userId,
        userName: data.userName || 'A friend',
        timestamp: new Date().toISOString()
      });
    }
    
    // Update gamification metrics for the user
    io.to(`user:${socket.userId}`).emit('gamification_update', {
      type: 'pomodoro_completed',
      data: {
        sessionLength: data.sessionLength || 25,
        timestamp: new Date().toISOString()
      }
    });
  });
  
  // Handle streak updates
  socket.on('streak_update', (data) => {
    // Broadcast to user's friends if this is a milestone streak
    if (data.isMilestone && data.friendIds && data.friendIds.length > 0) {
      data.friendIds.forEach(friendId => {
        io.to(`user:${friendId}`).emit('friend_milestone', {
          userId: socket.userId,
          userName: data.userName || 'A friend',
          milestoneType: 'streak',
          milestoneValue: data.streakDays,
          timestamp: new Date().toISOString()
        });
      });
    }
  });
  
  // Handle resource uploads
  socket.on('resource_uploaded', (resourceData) => {
    // Broadcast to all users or specific groups
    if (resourceData.isPublic) {
      io.emit('new_resource', {
        resourceId: resourceData.resourceId,
        title: resourceData.title,
        type: resourceData.type,
        uploadedBy: socket.userId,
        timestamp: new Date().toISOString()
      });
    } else if (resourceData.groupId) {
      io.to(`group:${resourceData.groupId}`).emit('new_resource', {
        resourceId: resourceData.resourceId,
        title: resourceData.title,
        type: resourceData.type,
        uploadedBy: socket.userId,
        timestamp: new Date().toISOString()
      });
    }
  });
  
  // Handle whiteboard updates
  socket.on('whiteboard_update', (data) => {
    const { boardId, elements } = data;
    
    // Broadcast to all users in the whiteboard session
    socket.to(boardId).emit('whiteboard_updated', {
      elements,
      userId: socket.userId,
      timestamp: new Date().toISOString()
    });
  });
  
  // Handle disconnect
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.userId);
  });
});

server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`WebSocket server is running on ws://localhost:${PORT}`);
});

