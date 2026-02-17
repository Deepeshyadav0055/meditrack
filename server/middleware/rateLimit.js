const rateLimit = require('express-rate-limit');

/**
 * General API rate limiter - 100 requests per minute
 */
const apiLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 100,
    message: { error: 'Too many requests, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
});

/**
 * Strict rate limiter for AI endpoints - 10 requests per minute
 */
const aiLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 10,
    message: { error: 'Too many AI requests, please try again later.' },
    standardHeaders: true,
    legacyHeaders: false,
});

/**
 * Update rate limiter - 30 requests per minute
 */
const updateLimiter = rateLimit({
    windowMs: 60 * 1000, // 1 minute
    max: 30,
    message: { error: 'Too many update requests, please slow down.' },
    standardHeaders: true,
    legacyHeaders: false,
});

module.exports = {
    apiLimiter,
    aiLimiter,
    updateLimiter
};
