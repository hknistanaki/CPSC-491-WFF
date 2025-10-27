# Water Fountain Finder - Development Startup Script (PowerShell)
# This script starts both the backend and frontend servers

Write-Host "Starting Water Fountain Finder Development Servers..." -ForegroundColor Cyan
Write-Host ""

# Check if MongoDB is running
Write-Host "Checking MongoDB..." -NoNewline
$mongoProcess = Get-Process mongod -ErrorAction SilentlyContinue
if ($mongoProcess) {
    Write-Host " MongoDB is running" -ForegroundColor Green
} else {
    Write-Host " MongoDB is NOT running!" -ForegroundColor Red
    Write-Host ""
    Write-Host "Please start MongoDB first:" -ForegroundColor Yellow
    Write-Host "  Option 1: net start MongoDB"
    Write-Host "  Option 2: Run mongod.exe manually"
    Write-Host "  Option 3: Use MongoDB Atlas (cloud)"
    Write-Host ""
    Write-Host "See README.md for detailed instructions."
    Read-Host "Press Enter to exit"
    exit 1
}

# Check if backend dependencies are installed
if (-not (Test-Path "backend\node_modules")) {
    Write-Host "Backend dependencies not found. Installing..." -ForegroundColor Yellow
    Push-Location backend
    npm install
    Pop-Location
    Write-Host "Dependencies installed" -ForegroundColor Green
}

# Check if config.js exists
if (-not (Test-Path "config.js")) {
    Write-Host "config.js not found!" -ForegroundColor Yellow
    Write-Host "Please copy config.example.js to config.js and add your Google Maps API key"
    Write-Host "  Copy-Item config.example.js config.js"
    Write-Host "Then edit config.js with your API key"
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""
Write-Host "Starting servers..." -ForegroundColor Cyan
Write-Host ""

# Start backend server in new window
Write-Host "Starting backend server (http://localhost:5000)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\backend'; node server.js"

# Wait for backend to start
Start-Sleep -Seconds 3

# Check if backend started
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5000/api/health" -UseBasicParsing -ErrorAction Stop
    Write-Host "Backend server is running" -ForegroundColor Green
} catch {
    Write-Host "Backend server failed to start" -ForegroundColor Red
    Write-Host "Check the backend window for errors"
    Read-Host "Press Enter to exit"
    exit 1
}

# Start frontend server in new window
Write-Host "Starting frontend server (http://localhost:8000)..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD'; python -m http.server 8000"

# Wait for frontend to start
Start-Sleep -Seconds 2

# Check if frontend started
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8000" -UseBasicParsing -ErrorAction Stop
    Write-Host "Frontend server is running" -ForegroundColor Green
} catch {
    Write-Host "Frontend server failed to start" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "All servers are running!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Application: http://localhost:8000"
Write-Host "Backend API: http://localhost:5000/api"
Write-Host "API Health:  http://localhost:5000/api/health"
Write-Host ""
Write-Host "To stop servers: Close the server windows or run stop-dev.ps1"
Write-Host ""
Read-Host "Press Enter to exit (servers will continue running)"

