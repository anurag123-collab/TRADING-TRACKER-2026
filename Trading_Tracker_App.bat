@echo off
title Trading Tracker 2026
echo Launching Trading Tracker Desktop App...

start "" "chrome.exe" --app="file:///%~dp0index.html" --user-data-dir="%LOCALAPPDATA%\TradingTrackerProfile"

if %errorlevel% neq 0 (
    start "" "msedge.exe" --app="file:///%~dp0index.html"
)
exit
