@echo off
chcp 65001 >nul
title Valkompass 2026

echo.
echo  Valkompass 2026
echo  ==============
echo.

cd /d "%~dp0"

:: Starta backend i nytt fönster
echo  Startar backend (port 5050)...
start "Valkompass Backend" cmd /k "chcp 65001 >nul && cd /d "%~dp0backend" && set PYTHONIOENCODING=utf-8 && python server.py"

:: Vänta på att servern ska starta
timeout /t 3 /nobreak >nul

:: Starta frontend med Python HTTP-server i nytt fönster
echo  Startar frontend (port 3000)...
start "Valkompass Frontend" cmd /k "chcp 65001 >nul && cd /d "%~dp0frontend" && python -m http.server 3000"

:: Vänta och öppna webbläsaren
timeout /t 2 /nobreak >nul
echo  Öppnar webbläsare...
start http://localhost:3000

echo.
echo  Backend:  http://localhost:5050
echo  Frontend: http://localhost:3000
echo.
echo  Stäng de två terminalfönstren för att stoppa.
echo.
pause
