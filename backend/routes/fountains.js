const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Fountain = require('../models/Fountain');
const { protect, optionalAuth } = require('../middleware/auth');

router.get('/', async (req, res) => {
    try {
        const { lat, lng, radius } = req.query;
        
        let query = {};
        
        // wip- filter by location radius
        if (lat && lng && radius) {
            // bounding box filter
            const latRadius = parseFloat(radius) / 111; // conversion to degrees
            const lngRadius = parseFloat(radius) / (111 * Math.cos(parseFloat(lat) * Math.PI / 180));
            
            query.lat = {
                $gte: parseFloat(lat) - latRadius,
                $lte: parseFloat(lat) + latRadius
            };
            query.lng = {
                $gte: parseFloat(lng) - lngRadius,
                $lte: parseFloat(lng) + lngRadius
            };
        }
        
        const fountains = await Fountain.find(query).sort({ createdAt: -1 });
        
        res.json({
            success: true,
            count: fountains.length,
            fountains
        });
    } catch (error) {
        console.error('Get fountains error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching fountains'
        });
    }
});

router.get('/:id', async (req, res) => {
    try {
        const fountain = await Fountain.findById(req.params.id);
        
        if (!fountain) {
            return res.status(404).json({
                success: false,
                message: 'Fountain not found'
            });
        }
        
        res.json({
            success: true,
            fountain
        });
    } catch (error) {
        console.error('Get fountain error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error fetching fountain'
        });
    }
});

router.post('/', protect, [
    body('name').trim().notEmpty().withMessage('Fountain name is required'),
    body('address').notEmpty().withMessage('Address is required'),
    body('lat').isFloat({ min: -90, max: 90 }).withMessage('Valid latitude is required'),
    body('lng').isFloat({ min: -180, max: 180 }).withMessage('Valid longitude is required')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array()
        });
    }
    
    try {
        const { name, address, lat, lng } = req.body;
        
        // check if fountain already exists at this location
        const existingFountain = await Fountain.findOne({
            lat: { $gte: lat - 0.0001, $lte: lat + 0.0001 },
            lng: { $gte: lng - 0.0001, $lte: lng + 0.0001 }
        });
        
        if (existingFountain) {
            return res.status(400).json({
                success: false,
                message: 'A fountain already exists at this location'
            });
        }
        
        const fountain = await Fountain.create({
            name,
            address,
            lat,
            lng,
            createdBy: req.user._id,
            createdByUsername: req.user.username
        });
        
        res.status(201).json({
            success: true,
            fountain
        });
    } catch (error) {
        console.error('Create fountain error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error creating fountain'
        });
    }
});

router.post('/:id/reviews', protect, [
    body('status').isIn(['red', 'yellow', 'green']).withMessage('Status must be red, yellow, or green'),
    body('text').trim().isLength({ min: 1, max: 140 }).withMessage('Review must be 1-140 characters')
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({
            success: false,
            errors: errors.array()
        });
    }
    
    try {
        const { status, text } = req.body;
        
        const fountain = await Fountain.findById(req.params.id);
        
        if (!fountain) {
            return res.status(404).json({
                success: false,
                message: 'Fountain not found'
            });
        }
        
        fountain.reviews.push({
            status,
            text
        });
        
        await fountain.save();
        
        res.status(201).json({
            success: true,
            fountain
        });
    } catch (error) {
        console.error('Add review error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error adding review'
        });
    }
});

router.post('/:id/report', protect, async (req, res) => {
    try {
        const fountain = await Fountain.findById(req.params.id);
        
        if (!fountain) {
            return res.status(404).json({
                success: false,
                message: 'Fountain not found'
            });
        }
        
        fountain.reportCount += 1;
        await fountain.save();
        
        res.json({
            success: true,
            message: 'Fountain reported successfully'
        });
    } catch (error) {
        console.error('Report fountain error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error reporting fountain'
        });
    }
});

router.delete('/:id', protect, async (req, res) => {
    try {
        const fountain = await Fountain.findById(req.params.id);
        
        if (!fountain) {
            return res.status(404).json({
                success: false,
                message: 'Fountain not found'
            });
        }
        
        // check if user is the creator
        if (fountain.createdBy.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'Not authorized to delete this fountain'
            });
        }
        
        await fountain.deleteOne();
        
        res.json({
            success: true,
            message: 'Fountain deleted successfully'
        });
    } catch (error) {
        console.error('Delete fountain error:', error);
        res.status(500).json({
            success: false,
            message: 'Server error deleting fountain'
        });
    }
});

module.exports = router;

