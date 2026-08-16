' Trading Tracker 2026 - Silent Server Starter
' This runs the Node.js server completely hidden (no terminal window)
Dim WshShell, serverPath
Set WshShell = CreateObject("WScript.Shell")

' Get the directory of this script
Dim fso
Set fso = CreateObject("Scripting.FileSystemObject")
serverPath = fso.GetParentFolderName(WScript.ScriptFullName) & "\server.js"

' Run node server.js with window hidden (0 = hidden, False = don't wait)
WshShell.Run "node """ & serverPath & """", 0, False

Set WshShell = Nothing
Set fso = Nothing
