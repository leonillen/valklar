@echo off
chcp 65001 >nul
title Valkompass 2026

echo.
echo  Valkompass 2026
echo  ==============
echo.

cd /d "%~dp0"

set "BACKDIR=%~dp0backend"
set "FRONTDIR=%~dp0frontend"

:: Starta backend i nytt fonster
echo  Startar backend (port 5050)...
start "Valkompass Backend" cmd /k "chcp 65001 >nul && cd /d "%BACKDIR%" && set PYTHONIOENCODING=utf-8 && set FLASK_DEBUG=true && python server.py"

:: Vanta pa att servern ska starta
timeout /t 3 /nobreak >nul

:: Starta frontend med Python HTTP-server i nytt fonster
echo  Startar frontend (port 3000)...
start "Valkompass Frontend" cmd /k "chcp 65001 >nul && cd /d "%FRONTDIR%" && python -m http.server 3000"

:: Vanta och oppna webblesaren
timeout /t 2 /nobreak >nul
echo  Oppnar webblesare...
start http://localhost:3000/index.html?v=20260428-party-colors

echo.
echo  Backend:  http://localhost:5050
echo  Frontend: http://localhost:3000
echo.
echo  Stang de tva terminalfonstren for att stoppa.
echo.
pause
