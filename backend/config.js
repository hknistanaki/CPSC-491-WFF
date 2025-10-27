module.exports = {
    port: process.env.PORT || 5000,
    mongoURI: process.env.MONGODB_URI || 'mongodb://localhost:27017/water-fountain-finder',
    jwtSecret: process.env.JWT_SECRET || 'water_fountain_finder_secret_key_2025',
    jwtExpire: process.env.JWT_EXPIRE || '7d',
    corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:8000'
};

