@echo off
REM Water Fountain Finder - Stop Development Servers (Windows)

echo Stopping Water Fountain Finder servers...

REM Stop Node.js backend server
echo Stopping backend server...
for /f "tokens=5" %%a in ('netstat -aon ^| find ":5000" ^| find "LISTENING"') do taskkill /F /PID %%a 2>NUL

REM Stop Python frontend server
echo Stopping frontend server...
for /f "tokens=5" %%a in ('netstat -aon ^| find ":8000" ^| find "LISTENING"') do taskkill /F /PID %%a 2>NUL

echo Servers stopped
pause

