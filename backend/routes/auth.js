const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const User = require('../models/User');
const config = require('../config');
const { protect } = require('../middleware/auth');

// generate jwt token
const generateToken = (id) => {
    return jwt.sign({ id }, config.jwtSecret, {
        expiresIn: config.jwtExpire
    });
};

router.post('/signup', [
    body('username').trim().isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
    body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array()
        });
    }
    
    try {
        const { username, email, password } = req.body;
        
        // check if user already exists
        const existingUser = await User.findOne({
            $or: [
                { email: email.toLowerCase() },
                { username: { $regex: new RegExp(`^${username}$`, 'i') } }
            ]
        });
        
        if (existingUser) {
            if (existingUser.email === email.toLowerCase()) {
                return res.status(400).json({
                    success: false,
                    message: 'Email already registered'
                });
            } else {
                return res.status(400).json({
                    success: false,
                    message: 'Username already exists'
                });
            }
        }
        
        // create user
        const user = await User.create({
            username,
            email: email.toLowerCase(),
            password
        });
        
        // generate token
        const token = generateToken(user._id);
        
        res.status(201).json({
            success: true,
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email
            }
        });
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during signup'
        });
    }
});

router.post('/login', [
    body('username').notEmpty().withMessage('Username or email is required'),
    body('password').notEmpty().withMessage('Password is required')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array()
        });
    }
    
    try {
        const { username, password } = req.body;
        
        // find user by username or email
        const user = await User.findOne({
            $or: [
                { email: username.toLowerCase() },
                { username: { $regex: new RegExp(`^${username}$`, 'i') } }
            ]
        }).select('+password');
        
        if (!user) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }
        
        // check password
        const isMatch = await user.comparePassword(password);
        
        if (!isMatch) {
            return res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
        }
        
        // generate token
        const token = generateToken(user._id);
        
        res.json({
            success: true,
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email
            }
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during login'
        });
    }
});

router.get('/me', protect, async (req, res) => {
    res.json({
        success: true,
        user: {
            id: req.user._id,
            username: req.user.username,
            email: req.user.email
        }
    });
});

router.put('/update', protect, [
    body('username').optional().trim().isLength({ min: 3 }).withMessage('Username must be at least 3 characters'),
    body('email').optional().isEmail().normalizeEmail().withMessage('Please provide a valid email')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array()
        });
    }
    
    try {
        const { username, email } = req.body;
        const updateFields = {};
        
        if (username) {
            // check if username is taken by another user
            const existingUser = await User.findOne({
                username: { $regex: new RegExp(`^${username}$`, 'i') },
                _id: { $ne: req.user._id }
            });
            
            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    message: 'Username already taken'
                });
            }
            
            updateFields.username = username;
        }
        
        if (email) {
            // check if email is taken by another user
            const existingUser = await User.findOne({
                email: email.toLowerCase(),
                _id: { $ne: req.user._id }
            });
            
            if (existingUser) {
                return res.status(400).json({
                    success: false,
                    message: 'Email already registered'
                });
            }
            
            updateFields.email = email.toLowerCase();
        }
        
        const user = await User.findByIdAndUpdate(
            req.user._id,
            updateFields,
            { new: true, runValidators: true }
        );
        
        res.json({
            success: true,
            user: {
                id: user._id,
                username: user.username,
                email: user.email
            }
        });
    } catch (error) {
        console.error('Update error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during update'
        });
    }
});

router.post('/reset-password', [
    body('email').isEmail().normalizeEmail().withMessage('Please provide a valid email'),
    body('newPassword').isLength({ min: 6 }).withMessage('Password must be at least 6 characters')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array()
        });
    }
    
    try {
        const { email, newPassword } = req.body;
        
        const user = await User.findOne({ email: email.toLowerCase() });
        
        if (!user) {
            return res.status(404).json({
                success: false,
                message: 'No account found with that email'
            });
        }
        
        user.password = newPassword;
        await user.save();
        
        res.json({
            success: true,
            message: 'Password reset successful'
        });
    } catch (error) {
        console.error('Reset password error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error during password reset'
        });
    }
});

module.exports = router;

