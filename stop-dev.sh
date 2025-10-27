#!/bin/bash

# Water Fountain Finder - Stop Development Servers

echo "🛑 Stopping Water Fountain Finder servers..."

# Read PIDs from file if it exists
if [ -f .dev-pids ]; then
    read -r BACKEND_PID FRONTEND_PID < .dev-pids
    
    if kill -0 $BACKEND_PID 2>/dev/null; then
        echo "Stopping backend server (PID: $BACKEND_PID)..."
        kill $BACKEND_PID
    fi
    
    if kill -0 $FRONTEND_PID 2>/dev/null; then
        echo "Stopping frontend server (PID: $FRONTEND_PID)..."
        kill $FRONTEND_PID
    fi
    
    rm .dev-pids
else
    # Fallback: kill by port
    echo "Stopping servers on ports 5000 and 8000..."
    lsof -ti:5000 | xargs kill -9 2>/dev/null
    lsof -ti:8000 | xargs kill -9 2>/dev/null
fi

echo "✅ Servers stopped"

