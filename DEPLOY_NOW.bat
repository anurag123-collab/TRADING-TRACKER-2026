@echo off
title Trading Tracker 2026 - Vercel Deploy
color 0A
echo.
echo ============================================
echo   TRADING TRACKER 2026 - VERCEL DEPLOYING
echo ============================================
echo.
echo Please wait... Deploying to Vercel...
echo.
cd /d "d:\TRADING TRAKER 2026"
call npx vercel --prod --yes
echo.
if %ERRORLEVEL% NEQ 0 (
    color 0C
    echo.
    echo ============================================
    echo   DEPLOY ENCOUNTERED AN ISSUE!
    echo   Please check the message above.
    echo ============================================
) else (
    echo.
    echo ============================================
    echo   SUCCESS! Website is Live!
    echo ============================================
)
echo.
pause
