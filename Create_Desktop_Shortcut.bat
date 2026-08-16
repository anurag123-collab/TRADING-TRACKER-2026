@echo off
echo Updating Trading Tracker 2026 Desktop Shortcut...

set SCRIPT="%TEMP%\create_shortcut_%RANDOM%.vbs"

echo Set oWS = WScript.CreateObject("WScript.Shell") > %SCRIPT%
echo sLinkFile = oWS.SpecialFolders("Desktop") ^& "\Trading Tracker 2026.lnk" >> %SCRIPT%
echo Set oLink = oWS.CreateShortcut(sLinkFile) >> %SCRIPT%
echo strChrome = oWS.ExpandEnvironmentStrings("%%LOCALAPPDATA%%") ^& "\Google\Chrome\Application\chrome.exe" >> %SCRIPT%
echo Set fso = CreateObject("Scripting.FileSystemObject") >> %SCRIPT%
echo oLink.TargetPath = "%~dp0Trading_Tracker_App.bat" >> %SCRIPT%
echo oLink.WorkingDirectory = "%~dp0" >> %SCRIPT%
echo oLink.IconLocation = "%~dp0profile.ico" >> %SCRIPT%
echo oLink.Save >> %SCRIPT%

cscript //nologo %SCRIPT%
del %SCRIPT%

echo Desktop shortcut created successfully!
