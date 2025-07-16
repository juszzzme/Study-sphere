const express = require('express');
const router = express.Router();

// Use the resource.js router for all /api/resources routes
router.use('/', require('./resource'));

module.exports = router; 