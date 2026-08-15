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
npx vercel --prod --yes
echo.
echo ============================================
echo   DONE! Check trading-tracker2026.vercel.app
echo ============================================
echo.
pause
