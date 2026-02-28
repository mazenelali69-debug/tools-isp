$ErrorActionPreference = "Stop"

$root = "C:\apps\tools-isp"
$backend = "$root\backend"
$frontend = "$root\frontend"

Write-Host "Starting tools-isp..." -ForegroundColor Cyan

# Start backend
Write-Host "▶ Backend (9090)" -ForegroundColor Yellow
$pb = Start-Process cmd.exe -WorkingDirectory $backend -PassThru -ArgumentList "/k", "npm run dev"

Start-Sleep -Seconds 2

# Start frontend
Write-Host "▶ Frontend (5173)" -ForegroundColor Yellow
$pf = Start-Process cmd.exe -WorkingDirectory $frontend -PassThru -ArgumentList "/k", "npm run dev -- --host"

Start-Sleep -Seconds 3

Write-Host ""
Write-Host "✅ tools-isp is running" -ForegroundColor Green
Write-Host "Backend: http://localhost:9090/health"
Write-Host "Frontend: http://localhost:5173"
Write-Host ""

# Save PIDs
"$($pb.Id)`r`n$($pf.Id)" | Set-Content "$root\.run-pids-tools-isp.txt"

