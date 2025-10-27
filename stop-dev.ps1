# Water Fountain Finder - Stop Development Servers (PowerShell)

Write-Host "Stopping Water Fountain Finder servers..." -ForegroundColor Cyan

# Stop backend server (port 5000)
Write-Host "Stopping backend server..." -NoNewline
$backendProcess = Get-NetTCPConnection -LocalPort 5000 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique
if ($backendProcess) {
    Stop-Process -Id $backendProcess -Force
    Write-Host " Stopped" -ForegroundColor Green
} else {
    Write-Host " Not running" -ForegroundColor Yellow
}

# Stop frontend server (port 8000)
Write-Host "Stopping frontend server..." -NoNewline
$frontendProcess = Get-NetTCPConnection -LocalPort 8000 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique
if ($frontendProcess) {
    Stop-Process -Id $frontendProcess -Force
    Write-Host " Stopped" -ForegroundColor Green
} else {
    Write-Host " Not running" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Servers stopped" -ForegroundColor Green
Read-Host "Press Enter to exit"

