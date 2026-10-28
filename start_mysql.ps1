# start_mysql.ps1
# Run this as Administrator to start MySQL before launching the backend
# Right-click PowerShell → "Run as Administrator" → paste this command:
#   Set-ExecutionPolicy -Scope Process -ExecutionPolicy Bypass; .\start_mysql.ps1

Write-Host "Starting MySQL 8.0 service..." -ForegroundColor Cyan
Start-Service MYSQL80
Start-Sleep -Seconds 2
$svc = Get-Service MYSQL80
Write-Host "MySQL status: $($svc.Status)" -ForegroundColor Green
