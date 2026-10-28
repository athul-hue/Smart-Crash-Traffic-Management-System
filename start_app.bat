@echo off
title Smart Crash & Traffic Management System (React + Tailwind)
cd /d "%~dp0"
echo ============================================================
echo   SMART CRASH & TRAFFIC MANAGEMENT SYSTEM (REACT + TAILWIND)
echo ============================================================
echo.
echo 1. Starting Backend API Server (Port 5000)...
start "Smart Traffic Backend" cmd /k "cd /d %~dp0backend && python app.py"

echo 2. Starting React + Vite Frontend Dev Server (Port 3000)...
start "Smart Traffic React Frontend" cmd /k "cd /d %~dp0 && npm run dev"

echo 3. Opening App in Browser...
timeout /t 3 /nobreak >nul
start http://localhost:3000/

echo.
echo Application is running!
echo Frontend: http://localhost:3000/
echo Backend API: http://127.0.0.1:5000/api/health
echo.
echo Press any key to exit this launcher window (servers will remain running).
pause >nul
