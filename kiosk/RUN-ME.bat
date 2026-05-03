@echo off
REM Double-click to install GLISSA Kiosk. UAC will prompt for admin.
powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "Start-Process powershell -ArgumentList '-NoExit','-NoProfile','-ExecutionPolicy','Bypass','-File','%~dp0setup-kiosk.ps1' -Verb RunAs"
