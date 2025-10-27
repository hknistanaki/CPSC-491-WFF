const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
    status: {
        type: String,
        enum: ['red', 'yellow', 'green'],
        required: true
    },
    text: {
        type: String,
        required: true,
        maxlength: 140
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

const fountainSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please provide a fountain name'],
        trim: true
    },
    address: {
        type: String,
        required: [true, 'Please provide an address']
    },
    lat: {
        type: Number,
        required: [true, 'Please provide latitude'],
        min: -90,
        max: 90
    },
    lng: {
        type: Number,
        required: [true, 'Please provide longitude'],
        min: -180,
        max: 180
    },
    reviews: [reviewSchema],
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    createdByUsername: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    reportCount: {
        type: Number,
        default: 0
    }
});

// index for geospatial queries
fountainSchema.index({ lat: 1, lng: 1 });

// virtual for calculating current status
fountainSchema.virtual('currentStatus').get(function() {
    if (this.reviews.length === 0) {
        return 'yellow';
    }
    
    const statusCounts = { red: 0, yellow: 0, green: 0 };
    this.reviews.forEach(review => {
        statusCounts[review.status]++;
    });
    
    let maxCount = 0;
    let majorityStatus = 'yellow';
    for (const [status, count] of Object.entries(statusCounts)) {
        if (count > maxCount) {
            maxCount = count;
            majorityStatus = status;
        }
    }
    
    return majorityStatus;
});

// ensure virtuals are included in json
fountainSchema.set('toJSON', { virtuals: true });
fountainSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Fountain', fountainSchema);

