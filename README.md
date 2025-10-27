# Water Fountain Finder

A full stack web app for finding and reviewing public water fountains using Google Maps API.

## Features

**Interactive Map**
- Google Maps integration with location search
- Add water fountain locations with a click
- View all fountains as markers on the map

**Fountain Management**
- User generated fountain locations
- Automatic naming based on location
- View all fountain details

**Review System**
- Status indicators
- Anonymous reviews
- Community driven status updates

**User Accounts**
- Secure signup and login
- Password hashing
- Profile settings
- Password reset option
- Remember me option

## Technology Stack

**Frontend**
- HTML5, CSS3, JavaScript
- Google Maps JavaScript API

**Backend**
- Node.js + Express.js
- MongoDB + Mongoose ODM
- JWT authentication
- bcrypt password hashing

## Prerequisites

Have the following installed:

1. **Node.js** (v14 or higher)
2. **MongoDB**
3. **Google Maps API Key**

## Installation & Setup

### 1. Configure Google Maps API Key

```bash
# Copy the example config file
cp config.example.js config.js

# Edit config.js and replace with your API key
# Get a free API key at: https://developers.google.com/maps/documentation/javascript/get-api-key
```

Open `config.js` and replace `YOUR_GOOGLE_MAPS_API_KEY_HERE` with your actual API key.

**Required APIs to enable in Google Cloud Console:**
- Maps JavaScript API
- Places API
- Geocoding API

### 2. Install MongoDB

### 3. Start the Application

```bash
./start-dev.sh
```

The automated script will:
- Check if MongoDB is running
- Start the backend server (port 5000)
- Start the frontend server (port 8000)
- Display server status and logs

### 4. Open the Application

Navigate to:
**http://localhost:8000**

### To Stop the Servers

```bash
./stop-dev.sh
```

## Project Structure

```
CPSC-491-WFF/
├── backend/
│   ├── config.js                 # Configuration settings
│   ├── server.js                 # Main Express server
│   ├── package.json              # Backend dependencies
│   ├── models/
│   │   ├── User.js               # User model/schema
│   │   └── Fountain.js           # Fountain model/schema
│   ├── routes/
│   │   ├── auth.js               # Authentication routes
│   │   └── fountains.js          # Fountain routes
│   └── middleware/
│       └── auth.js               # JWT authentication middleware
├── index.html                    # Main page
├── login.html                    # Login page
├── signup.html                   # Sign up page
├── settings.html                 # User settings page
├── logout.html                   # Logout confirmation page
├── forgot-password.html          # Forgot password page
├── reset-password.html           # Reset password page
├── styles.css                    # All CSS styling
├── app.js                        # Frontend app logic (Google Maps)
├── auth.js                       # Frontend authentication logic
├── api-client.js                 # API communication layer
└── README.md                     # This file
```

## Security Notes

- Passwords are hashed with bcrypt before storage
- JWT tokens are used for authentication
- API endpoints are protected with middleware
- Input validation on all endpoints
- XSS protection with HTML escaping

## AI Disclosure

- AI was used to help generate README.md, start-dev.sh, stop-dev.sh, server.js
