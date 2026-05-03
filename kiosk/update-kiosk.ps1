# GLISSA Kiosk Updater
# Run on the EPOS as Administrator (logged in as your admin account, not KioskUser).
# Usage: powershell -ExecutionPolicy Bypass -File .\update-kiosk.ps1

# Self-elevate
if (-not ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Start-Process powershell -ArgumentList "-NoExit","-ExecutionPolicy Bypass","-File","`"$($MyInvocation.MyCommand.Path)`"" -Verb RunAs
    exit
}

$ErrorActionPreference = "Stop"
trap {
    Write-Host "ERROR: $($_.Exception.Message)" -ForegroundColor Red
    Read-Host "Press Enter to exit"; exit 1
}

$KioskUserName = "KioskUser"
$AppInstallDir = "C:\GLISSA"
$LauncherBat   = "$AppInstallDir\kiosk-launcher.bat"
$LauncherVbs   = "$AppInstallDir\kiosk-launcher.vbs"
$ShellLauncher = "wscript.exe `"$LauncherVbs`""

$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$appSource = Join-Path $scriptDir "GLISSA-app"

if (-not (Test-Path "$appSource\GLISSA.exe")) {
    Write-Host "ERROR: GLISSA-app\GLISSA.exe not found next to this script." -ForegroundColor Red
    Read-Host "Press Enter to exit"; exit 1
}

Write-Host "[1/4] Replacing C:\GLISSA contents..." -ForegroundColor Cyan
Get-Process | Where-Object { $_.Path -like "*GLISSA*" } | Stop-Process -Force -ErrorAction SilentlyContinue
Start-Sleep 2
if (Test-Path $AppInstallDir) {
    Get-ChildItem $AppInstallDir -Exclude "kiosk-launcher.*" | Remove-Item -Recurse -Force
}
Copy-Item "$appSource\*" -Destination $AppInstallDir -Recurse -Force
Write-Host "    OK" -ForegroundColor Green

Write-Host "[2/4] Writing hidden VBS launcher..." -ForegroundColor Cyan
@"
@echo off
:loop
start /wait "" "$AppInstallDir\GLISSA.exe"
timeout /t 3 /nobreak >nul
goto loop
"@ | Set-Content -Path $LauncherBat -Encoding ASCII

@"
Set WshShell = CreateObject("WScript.Shell")
WshShell.Run chr(34) & "$LauncherBat" & chr(34), 0, False
Set WshShell = Nothing
"@ | Set-Content -Path $LauncherVbs -Encoding ASCII
Write-Host "    OK" -ForegroundColor Green

Write-Host "[3/4] Updating KioskUser shell registry to use VBS..." -ForegroundColor Cyan
$kioskSid = (Get-LocalUser -Name $KioskUserName).SID.Value
$realProfile = (Get-ItemProperty "HKLM:\SOFTWARE\Microsoft\Windows NT\CurrentVersion\ProfileList\$kioskSid" -Name ProfileImagePath).ProfileImagePath

# If KioskUser is logged in, hive is already at HKU\<SID>. Otherwise load NTUSER.DAT.
$liveHive = "Registry::HKEY_USERS\$kioskSid"
if (Test-Path $liveHive) {
    Write-Host "    KioskUser hive is live - writing directly to HKU\$kioskSid" -ForegroundColor DarkCyan
    reg add "HKU\$kioskSid\Software\Microsoft\Windows NT\CurrentVersion\Winlogon" /v Shell /t REG_SZ /d "$ShellLauncher" /f | Out-Null
} else {
    reg load "HKU\KioskHive" "$realProfile\NTUSER.DAT" 2>&1 | Out-Null
    reg add "HKU\KioskHive\Software\Microsoft\Windows NT\CurrentVersion\Winlogon" /v Shell /t REG_SZ /d "$ShellLauncher" /f | Out-Null
    [gc]::Collect(); Start-Sleep 2
    reg unload "HKU\KioskHive" 2>&1 | Out-Null
}
Write-Host "    OK" -ForegroundColor Green

Write-Host "[4/4] All done." -ForegroundColor Green
Write-Host ""
$reboot = Read-Host "Reboot now to apply? (Y/N)"
if ($reboot -eq "Y" -or $reboot -eq "y") {
    Restart-Computer -Force
}
