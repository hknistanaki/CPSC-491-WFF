#!/bin/bash

# Water Fountain Finder - Development Startup Script
# This script starts both the backend and frontend servers

echo "🚀 Starting Water Fountain Finder Development Servers..."
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if MongoDB is running
echo "Checking MongoDB..."
if systemctl is-active --quiet mongod; then
    echo -e "${GREEN}✅ MongoDB is running${NC}"
elif docker ps | grep -q mongodb; then
    echo -e "${GREEN}✅ MongoDB is running (Docker)${NC}"
elif pgrep -x mongod > /dev/null; then
    echo -e "${GREEN}✅ MongoDB is running${NC}"
else
    echo -e "${RED}❌ MongoDB is not running!${NC}"
    echo ""
    echo "Please start MongoDB first:"
    echo "  Option 1: sudo systemctl start mongod"
    echo "  Option 2: docker run -d -p 27017:27017 --name mongodb mongo"
    echo "  Option 3: Use MongoDB Atlas (cloud)"
    echo ""
    echo "See SETUP_GUIDE.md for detailed instructions."
    exit 1
fi

# Check if backend dependencies are installed
if [ ! -d "backend/node_modules" ]; then
    echo -e "${YELLOW}⚠️  Backend dependencies not found. Installing...${NC}"
    cd backend
    npm install
    cd ..
    echo -e "${GREEN}✅ Dependencies installed${NC}"
fi

# Check if ports are available
if lsof -Pi :5000 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo -e "${YELLOW}⚠️  Port 5000 is already in use. Killing existing process...${NC}"
    lsof -ti:5000 | xargs kill -9 2>/dev/null
    sleep 1
fi

if lsof -Pi :8000 -sTCP:LISTEN -t >/dev/null 2>&1 ; then
    echo -e "${YELLOW}⚠️  Port 8000 is already in use. Killing existing process...${NC}"
    lsof -ti:8000 | xargs kill -9 2>/dev/null
    sleep 1
fi

echo ""
echo "Starting servers..."
echo ""

# Start backend server in background
echo "📡 Starting backend server (http://localhost:5000)..."
cd backend
node server.js > ../backend.log 2>&1 &
BACKEND_PID=$!
cd ..

# Wait a moment for backend to start
sleep 2

# Check if backend started successfully
if curl -s http://localhost:5000/api/health > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Backend server is running (PID: $BACKEND_PID)${NC}"
else
    echo -e "${RED}❌ Backend server failed to start. Check backend.log${NC}"
    kill $BACKEND_PID 2>/dev/null
    exit 1
fi

# Start frontend server in background
echo "🌐 Starting frontend server (http://localhost:8000)..."
python -m http.server 8000 > frontend.log 2>&1 &
FRONTEND_PID=$!

# Wait a moment for frontend to start
sleep 1

# Check if frontend started successfully
if curl -s http://localhost:8000 > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Frontend server is running (PID: $FRONTEND_PID)${NC}"
else
    echo -e "${RED}❌ Frontend server failed to start. Check frontend.log${NC}"
    kill $BACKEND_PID 2>/dev/null
    kill $FRONTEND_PID 2>/dev/null
    exit 1
fi

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}🎉 All servers are running!${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
echo "📱 Application: http://localhost:8000"
echo "🔌 Backend API: http://localhost:5000/api"
echo "💾 API Health:  http://localhost:5000/api/health"
echo ""
echo "Backend PID:  $BACKEND_PID"
echo "Frontend PID: $FRONTEND_PID"
echo ""
echo "Logs:"
echo "  Backend:  tail -f backend.log"
echo "  Frontend: tail -f frontend.log"
echo ""
echo "To stop servers:"
echo "  kill $BACKEND_PID $FRONTEND_PID"
echo "  or run: ./stop-dev.sh"
echo ""
echo -e "${YELLOW}Press Ctrl+C to stop watching (servers will continue running)${NC}"
echo ""

# Save PIDs to file for stop script
echo "$BACKEND_PID $FRONTEND_PID" > .dev-pids

# Follow logs
tail -f backend.log frontend.log

