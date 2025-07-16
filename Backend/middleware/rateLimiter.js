const rateLimit = require('express-rate-limit');

// API rate limiter configuration
const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // limit each IP to 100 requests per windowMs
    message: {
        success: false,
        error: 'Rate limit exceeded',
        message: 'Too many requests from this IP, please try again later.'
    },
    standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
    legacyHeaders: false, // Disable the `X-RateLimit-*` headers
    skipSuccessfulRequests: false, // Count successful requests towards the rate limit
    keyGenerator: function (req) {
        return req.ip;
    }
});

// Authenticated API rate limiter (more lenient for authenticated users)
const authenticatedApiLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 500, // limit each IP to 500 requests per windowMs
    message: {
        success: false,
        error: 'Rate limit exceeded',
        message: 'Too many requests from this IP, please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: false,
    keyGenerator: function (req) {
        // Use userId if available, otherwise fall back to IP
        return req.user ? req.user.id : req.ip;
    }
});

module.exports = {
    apiLimiter,
    authenticatedApiLimiter
};
