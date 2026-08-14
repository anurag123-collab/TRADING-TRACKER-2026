@echo off
title Update Trading Tracker Android APK
echo Updating Web Assets to www folder...
copy /y "index.html" "www\" >nul
copy /y "manifest.json" "www\" >nul
copy /y "profile.jpg" "www\" >nul
copy /y "profile-data.js" "www\" >nul
copy /y "version.json" "www\" >nul

set JAVA_HOME=C:\Users\Anurag patel\.jdks\jbr-21.0.11
set ANDROID_HOME=C:\Users\Anurag patel\AppData\Local\Android\Sdk
set PATH=%JAVA_HOME%\bin;%PATH%

echo Syncing files with Capacitor...
call npx.cmd cap sync android

echo Building Android APK via Gradle...
cd android
call gradlew.bat assembleDebug
cd ..

echo Copying compiled APK to root and www directory...
copy /y "android\app\build\outputs\apk\debug\app-debug.apk" "Trading_Tracker_2026.apk" >nul
copy /y "android\app\build\outputs\apk\debug\app-debug.apk" "www\Trading_Tracker_2026.apk" >nul

echo ====================================================
echo APK Update Successful!
echo New APK generated: Trading_Tracker_2026.apk
echo ====================================================
pause
