@echo off
echo Starting Email Server in background...
cd /d "%~dp0"
start "Event Manager Email Server" /MIN node index.js
echo Server started! Check the minimized window or use Task Manager to see it running.
echo.
echo To stop the server, close the minimized window or use Task Manager.
pause

