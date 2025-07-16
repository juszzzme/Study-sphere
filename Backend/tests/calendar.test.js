const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const CalendarEvent = require('../models/CalendarEvent');
const User = require('../models/User');

let authToken;
let testUser;
let testEvent;

// Test data
const testUserData = {
  name: 'Test User',
  email: 'test@example.com',
  password: 'test1234'
};

const testEventData = {
  title: 'Test Event',
  description: 'This is a test event',
  start: new Date(),
  end: new Date(Date.now() + 3600000), // 1 hour later
  color: '#4285F4',
  allDay: false
};

// Setup and teardown
beforeAll(async () => {
  // Connect to a test database
  await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/studysphere-test', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  // Create a test user
  testUser = new User(testUserData);
  await testUser.save();
  
  // Generate auth token
  const loginRes = await request(app)
    .post('/api/auth/login')
    .send({
      email: testUserData.email,
      password: testUserData.password
    });
  
  authToken = loginRes.body.token;
});

afterAll(async () => {
  // Clean up test data
  await User.deleteMany({});
  await CalendarEvent.deleteMany({});
  await mongoose.connection.close();
});

beforeEach(async () => {
  // Create a test event before each test
  testEvent = new CalendarEvent({
    ...testEventData,
    user: testUser._id
  });
  await testEvent.save();
});

afterEach(async () => {
  // Clean up test events after each test
  await CalendarEvent.deleteMany({});
});

describe('Calendar Events API', () => {
  // Test GET /api/calendar
  describe('GET /api/calendar', () => {
    it('should fetch all calendar events for the authenticated user', async () => {
      const res = await request(app)
        .get('/api/calendar')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(res.statusCode).toEqual(200);
      expect(Array.isArray(res.body)).toBeTruthy();
      expect(res.body.length).toBeGreaterThan(0);
      expect(res.body[0].title).toBe(testEventData.title);
    });
  });

  // Test GET /api/calendar/range
  describe('GET /api/calendar/range', () => {
    it('should fetch events within a date range', async () => {
      const start = new Date();
      const end = new Date(Date.now() + 86400000); // 1 day later
      
      const res = await request(app)
        .get(`/api/calendar/range?start=${start.toISOString()}&end=${end.toISOString()}`)
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(res.statusCode).toEqual(200);
      expect(Array.isArray(res.body)).toBeTruthy();
      expect(res.body.length).toBeGreaterThan(0);
    });

    it('should return 400 if start or end date is missing', async () => {
      const res = await request(app)
        .get('/api/calendar/range')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(res.statusCode).toEqual(400);
      expect(res.body.success).toBe(false);
    });
  });

  // Test GET /api/calendar/:id
  describe('GET /api/calendar/:id', () => {
    it('should fetch a single event by ID', async () => {
      const res = await request(app)
        .get(`/api/calendar/${testEvent._id}`)
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(res.statusCode).toEqual(200);
      expect(res.body.title).toBe(testEventData.title);
    });

    it('should return 404 if event not found', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .get(`/api/calendar/${nonExistentId}`)
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(res.statusCode).toEqual(404);
      expect(res.body.success).toBe(false);
    });
  });

  // Test POST /api/calendar
  describe('POST /api/calendar', () => {
    it('should create a new calendar event', async () => {
      const newEvent = {
        title: 'New Test Event',
        description: 'This is a new test event',
        start: new Date(),
        end: new Date(Date.now() + 3600000),
        color: '#34A853'
      };
      
      const res = await request(app)
        .post('/api/calendar')
        .set('Authorization', `Bearer ${authToken}`)
        .send(newEvent);
      
      expect(res.statusCode).toEqual(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe(newEvent.title);
      expect(res.body.data.user).toBe(testUser._id.toString());
    });

    it('should return 400 for invalid event data', async () => {
      const invalidEvent = {
        title: '', // Invalid: empty title
        start: 'invalid-date'
      };
      
      const res = await request(app)
        .post('/api/calendar')
        .set('Authorization', `Bearer ${authToken}`)
        .send(invalidEvent);
      
      expect(res.statusCode).toEqual(400);
      expect(res.body.success).toBe(false);
      expect(res.body.errors).toBeDefined();
    });
  });

  // Test PUT /api/calendar/:id
  describe('PUT /api/calendar/:id', () => {
    it('should update an existing event', async () => {
      const updates = {
        title: 'Updated Test Event',
        description: 'This event has been updated',
        color: '#EA4335'
      };
      
      const res = await request(app)
        .put(`/api/calendar/${testEvent._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updates);
      
      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.title).toBe(updates.title);
      expect(res.body.data.description).toBe(updates.description);
      expect(res.body.data.color).toBe(updates.color);
    });

    it('should return 404 if event not found', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .put(`/api/calendar/${nonExistentId}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({ title: 'Updated Title' });
      
      expect(res.statusCode).toEqual(404);
      expect(res.body.success).toBe(false);
    });
  });

  // Test DELETE /api/calendar/:id
  describe('DELETE /api/calendar/:id', () => {
    it('should delete an existing event', async () => {
      const res = await request(app)
        .delete(`/api/calendar/${testEvent._id}`)
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(res.statusCode).toEqual(200);
      expect(res.body.success).toBe(true);
      
      // Verify the event was deleted
      const deletedEvent = await CalendarEvent.findById(testEvent._id);
      expect(deletedEvent).toBeNull();
    });

    it('should return 404 if event not found', async () => {
      const nonExistentId = new mongoose.Types.ObjectId();
      const res = await request(app)
        .delete(`/api/calendar/${nonExistentId}`)
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(res.statusCode).toEqual(404);
      expect(res.body.success).toBe(false);
    });
  });
});
