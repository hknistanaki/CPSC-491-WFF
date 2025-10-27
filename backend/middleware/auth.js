const jwt = require('jsonwebtoken');
const config = require('../config');
const User = require('../models/User');

// require authentication
exports.protect = async (req, res, next) => {
    let token;
    
    // check for token
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }
    
    // make sure token exists
    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Not authorized to access this route'
        });
    }
    
    try {
        // verify token
        const decoded = jwt.verify(token, config.jwtSecret);
        
        // get user from token
        req.user = await User.findById(decoded.id);
        
        if (!req.user) {
            return res.status(401).json({
                success: false,
                message: 'User not found'
            });
        }
        
        next();
    } catch (error) {
        return res.status(401).json({
            success: false,
            message: 'Not authorized to access this route'
        });
    }
};

// optional auth
exports.optionalAuth = async (req, res, next) => {
    let token;
    
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }
    
    if (token) {
        try {
            const decoded = jwt.verify(token, config.jwtSecret);
            req.user = await User.findById(decoded.id);
        } catch (error) {
            // token invalid
            req.user = null;
        }
    }
    
    next();
};

