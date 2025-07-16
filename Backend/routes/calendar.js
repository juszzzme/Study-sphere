const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const mongoose = require('mongoose');
const CalendarEvent = require('../models/CalendarEvent');
const auth = require('../middleware/auth');

// Validation middleware for event creation/update
const validateEvent = [
  body('title')
    .trim()
    .notEmpty().withMessage('Title is required')
    .isLength({ max: 100 }).withMessage('Title cannot be longer than 100 characters'),
  body('description').optional().isLength({ max: 500 }),
  body('start').isISO8601().withMessage('Invalid start date'),
  body('end')
    .optional({ checkFalsy: true })
    .isISO8601().withMessage('Invalid end date')
    .custom((value, { req }) => {
      if (value && new Date(value) <= new Date(req.body.start)) {
        throw new Error('End date must be after start date');
      }
      return true;
    }),
  body('allDay').optional().isBoolean(),
  body('location').optional().trim().isLength({ max: 200 }),
  body('color').optional().matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).withMessage('Invalid color code'),
  body('recurring').optional().isBoolean(),
  body('recurrencePattern').optional().isIn(['none', 'daily', 'weekly', 'monthly', 'yearly']),
  body('recurrenceEndDate').optional().isISO8601(),
  body('reminders').optional().isArray(),
  body('reminders.*.type').optional().isIn(['email', 'notification', 'both']),
  body('reminders.*.minutesBefore').optional().isInt({ min: 0 }),
  body('status').optional().isIn(['scheduled', 'in-progress', 'completed', 'cancelled']),
  body('attendees').optional().isArray(),
  body('attendees.*.user').optional().isMongoId(),
  body('attendees.*.status').optional().isIn(['pending', 'accepted', 'declined', 'tentative']),
  body('isPrivate').optional().isBoolean(),
  body('timezone').optional().isString(),
  body('tags').optional().isArray(),
  body('tags.*').optional().isString().trim()
];

// Get all calendar events for the current user with optional date range filtering
router.get('/', auth, async (req, res) => {
  try {
    const { start, end, status } = req.query;
    const query = { user: req.user.id };
    
    // Add date range filter if provided
    if (start && end) {
      query.$or = [
        { start: { $gte: new Date(start), $lte: new Date(end) } },
        { end: { $gte: new Date(start), $lte: new Date(end) } },
        { 
          $and: [
            { start: { $lte: new Date(start) } },
            { end: { $gte: new Date(end) } }
          ]
        }
      ];
    }
    
    // Add status filter if provided
    if (status) {
      query.status = status;
    }
    
    const events = await CalendarEvent.find(query)
      .sort({ start: 1 })
      .populate('user', 'name email')
      .populate('attendees.user', 'name email');
      
    res.json(events);
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to fetch calendar events',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get events for a specific date range
router.get('/range', auth, async (req, res) => {
  try {
    const { start, end } = req.query;
    
    if (!start || !end) {
      return res.status(400).json({
        success: false,
        message: 'Start and end dates are required'
      });
    }
    
    const events = await CalendarEvent.findInDateRange(
      req.user.id,
      new Date(start),
      new Date(end)
    )
    .populate('user', 'name email')
    .populate('attendees.user', 'name email');
    
    res.json(events);
  } catch (error) {
    console.error('Error fetching events in date range:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch events in date range',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get a single event by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const event = await CalendarEvent.findOne({
      _id: req.params.id,
      $or: [
        { user: req.user.id },
        { 'attendees.user': req.user.id }
      ]
    })
    .populate('user', 'name email')
    .populate('attendees.user', 'name email');
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found or access denied'
      });
    }
    
    res.json(event);
  } catch (error) {
    console.error('Error fetching event:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch event',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Create a new calendar event
router.post('/', [auth, ...validateEvent], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }
    
    const eventData = {
      ...req.body,
      user: req.user.id,
      createdBy: req.user.id,
      updatedBy: req.user.id
    };
    
    // Handle date conversion
    if (eventData.start) eventData.start = new Date(eventData.start);
    if (eventData.end) eventData.end = new Date(eventData.end);
    if (eventData.recurrenceEndDate) {
      eventData.recurrenceEndDate = new Date(eventData.recurrenceEndDate);
    }
    
    const event = new CalendarEvent(eventData);
    await event.save();
    
    // Populate the user data before sending the response
    await event.populate('user', 'name email');
    
    res.status(201).json({
      success: true,
      message: 'Event created successfully',
      data: event
    });
  } catch (error) {
    console.error('Error creating calendar event:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create event',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Update a calendar event
router.put('/:id', [auth, ...validateEvent], async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }
    
    // Find event and check permissions
    let event = await CalendarEvent.findOne({
      _id: req.params.id,
      $or: [
        { user: req.user.id },
        { 'attendees.user': req.user.id }
      ]
    });
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found or access denied'
      });
    }
    
    // Update event fields if provided
    const updateFields = [
      'title', 'description', 'allDay', 'location', 'color', 
      'recurring', 'recurrencePattern', 'status', 'isPrivate',
      'timezone', 'tags', 'reminders', 'attendees'
    ];
    
    updateFields.forEach(field => {
      if (req.body[field] !== undefined) {
        event[field] = req.body[field];
      }
    });
    
    // Handle date fields
    if (req.body.start) event.start = new Date(req.body.start);
    if (req.body.end) event.end = req.body.end ? new Date(req.body.end) : null;
    if (req.body.recurrenceEndDate) {
      event.recurrenceEndDate = req.body.recurrenceEndDate ? new Date(req.body.recurrenceEndDate) : null;
    }
    
    // Set updatedBy
    event.updatedBy = req.user.id;
    
    const updatedEvent = await event.save();
    
    // Populate the user data before sending the response
    await updatedEvent.populate('user', 'name email');
    await updatedEvent.populate('attendees.user', 'name email');
    
    res.json({
      success: true,
      message: 'Event updated successfully',
      data: updatedEvent
    });
  } catch (error) {
    console.error('Error updating calendar event:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update event',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Delete a calendar event
router.delete('/:id', auth, async (req, res) => {
  try {
    const event = await CalendarEvent.findOne({
      _id: req.params.id,
      $or: [
        { user: req.user.id },
        { 'attendees.user': req.user.id }
      ]
    });
    
    if (!event) {
      return res.status(404).json({
        success: false,
        message: 'Event not found or access denied'
      });
    }
    
    // Only the event creator can delete the event
    if (event.user.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Only the event creator can delete this event'
      });
    }
    
    await event.deleteOne();
    
    res.json({
      success: true,
      message: 'Event deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting calendar event:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete event',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router; 