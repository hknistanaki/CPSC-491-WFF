@echo off
REM Water Fountain Finder - Development Startup Script (Windows)
REM This script starts both the backend and frontend servers

echo Starting Water Fountain Finder Development Servers...
echo.

REM Check if MongoDB is running
echo Checking MongoDB...
tasklist /FI "IMAGENAME eq mongod.exe" 2>NUL | find /I /N "mongod.exe">NUL
if "%ERRORLEVEL%"=="0" (
    echo [92mMongoDB is running[0m
) else (
    echo [91mMongoDB is not running![0m
    echo.
    echo Please start MongoDB first:
    echo   Option 1: net start MongoDB
    echo   Option 2: Run mongod.exe manually
    echo   Option 3: Use MongoDB Atlas (cloud)
    echo.
    echo See README.md for detailed instructions.
    pause
    exit /b 1
)

REM Check if backend dependencies are installed
if not exist "backend\node_modules\" (
    echo [93mBackend dependencies not found. Installing...[0m
    cd backend
    call npm install
    cd ..
    echo [92mDependencies installed[0m
)

REM Check if config.js exists
if not exist "config.js" (
    echo [93mconfig.js not found![0m
    echo Please copy config.example.js to config.js and add your Google Maps API key
    echo   copy config.example.js config.js
    echo Then edit config.js with your API key
    pause
    exit /b 1
)

echo.
echo Starting servers...
echo.

REM Start backend server in new window
echo Starting backend server (http://localhost:5000)...
start "Water Fountain Finder - Backend" cmd /k "cd backend && node server.js"

REM Wait for backend to start
timeout /t 3 /nobreak > NUL

REM Check if backend started
curl -s http://localhost:5000/api/health > NUL 2>&1
if "%ERRORLEVEL%"=="0" (
    echo [92mBackend server is running[0m
) else (
    echo [91mBackend server failed to start[0m
    echo Check the backend window for errors
    pause
    exit /b 1
)

REM Start frontend server in new window
echo Starting frontend server (http://localhost:8000)...
start "Water Fountain Finder - Frontend" cmd /k "python -m http.server 8000"

REM Wait for frontend to start
timeout /t 2 /nobreak > NUL

REM Check if frontend started
curl -s http://localhost:8000 > NUL 2>&1
if "%ERRORLEVEL%"=="0" (
    echo [92mFrontend server is running[0m
) else (
    echo [91mFrontend server failed to start[0m
    pause
    exit /b 1
)

echo.
echo ========================================
echo [92mAll servers are running![0m
echo ========================================
echo.
echo Application: http://localhost:8000
echo Backend API: http://localhost:5000/api
echo API Health:  http://localhost:5000/api/health
echo.
echo To stop servers: Close the server windows or run stop-dev.bat
echo.
pause

