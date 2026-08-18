@echo off
echo Updating Trading Tracker 2026 Desktop Shortcut...

set SCRIPT="%TEMP%\create_shortcut_%RANDOM%.vbs"

echo Set oWS = WScript.CreateObject("WScript.Shell") > %SCRIPT%
echo sLinkFile = oWS.SpecialFolders("Desktop") ^& "\Trading Tracker 2026.lnk" >> %SCRIPT%
echo Set oLink = oWS.CreateShortcut(sLinkFile) >> %SCRIPT%
echo oLink.TargetPath = "wscript.exe" >> %SCRIPT%
echo oLink.Arguments = """" ^& "%~dp0Trading_Tracker_2026_OPEN.vbs" ^& """" >> %SCRIPT%
echo oLink.WorkingDirectory = "%~dp0" >> %SCRIPT%
echo oLink.IconLocation = "%~dp0profile.ico" >> %SCRIPT%
echo oLink.Description = "Trading Tracker 2026" >> %SCRIPT%
echo oLink.Save >> %SCRIPT%

cscript //nologo %SCRIPT%
del %SCRIPT%

echo.
echo ============================================================
echo [SUCCESS] Desktop shortcut updated successfully!
echo Now opening the shortcut will open the dashboard directly
echo with NO black terminal window!
echo ============================================================
timeout /t 2 >nul
