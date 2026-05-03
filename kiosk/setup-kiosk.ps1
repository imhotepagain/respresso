<#
GLISSA EPOS One-Shot Kiosk Setup
Run this on a fresh Windows install to convert the machine into a locked GLISSA kiosk.

Place this script on a USB next to:
  - GLISSA-app\          (the win-unpacked folder from the build)

Usage: right-click -> Run with PowerShell  (the script will self-elevate)
#>

# --- Self-elevate to Administrator if needed ---
if (-not ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)) {
    Write-Host "Re-launching as Administrator..." -ForegroundColor Yellow
    Start-Process powershell -ArgumentList "-NoExit","-ExecutionPolicy Bypass","-File","`"$($MyInvocation.MyCommand.Path)`"" -Verb RunAs
    exit
}

$ErrorActionPreference = "Stop"

# Wrap entire script in try/catch so errors are visible (don't auto-close window)
trap {
    Write-Host ""
    Write-Host "=== ERROR ===" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    Write-Host ""
    Write-Host "Stack trace:" -ForegroundColor DarkRed
    Write-Host $_.ScriptStackTrace -ForegroundColor DarkRed
    Write-Host ""
    Read-Host "Press Enter to exit"
    exit 1
}

# === CONFIGURATION ===
$KioskUserName = "KioskUser"
$KioskPassword = "Glissa#Kiosk2026"     # CHANGE THIS for production
$AppInstallDir = "C:\GLISSA"
$AppExeName    = "GLISSA.exe"           # final exe name in $AppInstallDir
$LauncherBat   = "$AppInstallDir\kiosk-launcher.bat"
$LauncherVbs   = "$AppInstallDir\kiosk-launcher.vbs"
$ShellLauncher = "wscript.exe `"$LauncherVbs`""    # what the shell registry will run

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host " GLISSA EPOS Kiosk Setup" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan

# --- 1. Locate the GLISSA-app folder on the USB (script's own folder) ---
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$appSource = Join-Path $scriptDir "GLISSA-app"
if (-not (Test-Path "$appSource\$AppExeName")) {
    Write-Host "ERROR: GLISSA-app\$AppExeName not found next to this script." -ForegroundColor Red
    Write-Host "Expected layout on USB:" -ForegroundColor Red
    Write-Host "  setup-kiosk.ps1" -ForegroundColor Red
    Write-Host "  GLISSA-app\GLISSA.exe   (and all the runtime files)" -ForegroundColor Red
    Pause; exit 1
}
Write-Host "[1/8] Found GLISSA-app folder" -ForegroundColor Green

# --- 2. Copy app folder to permanent location ---
if (Test-Path $AppInstallDir) { Remove-Item $AppInstallDir -Recurse -Force }
Copy-Item $appSource -Destination $AppInstallDir -Recurse -Force
Write-Host "[2/8] App copied to $AppInstallDir" -ForegroundColor Green

# --- 3. Create the looping launcher (auto-restart on crash) ---
# Bat does the actual loop. VBS launches it with WindowStyle=0 (hidden) so no cmd window appears.
@"
@echo off
:loop
start /wait "" "$AppInstallDir\$AppExeName"
timeout /t 3 /nobreak >nul
goto loop
"@ | Set-Content -Path $LauncherBat -Encoding ASCII

@"
Set WshShell = CreateObject("WScript.Shell")
WshShell.Run chr(34) & "$LauncherBat" & chr(34), 0, False
Set WshShell = Nothing
"@ | Set-Content -Path $LauncherVbs -Encoding ASCII

Write-Host "[3/8] Launchers written (hidden VBS wrapper -> looping bat)" -ForegroundColor Green

# --- 4. Create KioskUser ---
$existing = Get-LocalUser -Name $KioskUserName -ErrorAction SilentlyContinue
if (-not $existing) {
    $sec = ConvertTo-SecureString $KioskPassword -AsPlainText -Force
    New-LocalUser -Name $KioskUserName -Password $sec -FullName "GLISSA Kiosk" `
        -Description "GLISSA EPOS Kiosk Account" -PasswordNeverExpires:$true `
        -UserMayNotChangePassword:$true -AccountNeverExpires:$true | Out-Null
    Add-LocalGroupMember -Group "Users" -Member $KioskUserName
    Write-Host "[4/8] Created user: $KioskUserName" -ForegroundColor Green
} else {
    net user $KioskUserName $KioskPassword | Out-Null
    Write-Host "[4/8] User $KioskUserName already exists - password reset" -ForegroundColor Yellow
}

# --- 5. Force profile creation (so NTUSER.DAT exists for shell config) ---
Write-Host "[5/8] Generating user profile..." -ForegroundColor Green
$kioskCred = New-Object System.Management.Automation.PSCredential(
    $KioskUserName, (ConvertTo-SecureString $KioskPassword -AsPlainText -Force))
try {
    Start-Process -FilePath "cmd.exe" -ArgumentList "/c exit" -Credential $kioskCred -WindowStyle Hidden -Wait -LoadUserProfile
} catch {
    # Fallback: schtasks creates the profile too
    schtasks /create /tn "GlissaProfileInit" /tr "cmd.exe /c exit" /sc once /st 23:59 /ru $KioskUserName /rp $KioskPassword /f | Out-Null
    schtasks /run /tn "GlissaProfileInit" | Out-Null
    Start-Sleep -Seconds 4
    schtasks /delete /tn "GlissaProfileInit" /f | Out-Null
}

# --- 6. Get real profile path and load NTUSER.DAT ---
$kioskSid = (Get-LocalUser -Name $KioskUserName).SID.Value
$realProfile = (Get-ItemProperty "HKLM:\SOFTWARE\Microsoft\Windows NT\CurrentVersion\ProfileList\$kioskSid" -Name ProfileImagePath -ErrorAction Stop).ProfileImagePath
Write-Host "[6/8] Real profile: $realProfile" -ForegroundColor Green

# Wait for NTUSER.DAT
$tries = 0
while (-not (Test-Path "$realProfile\NTUSER.DAT") -and $tries -lt 10) {
    Start-Sleep -Seconds 1; $tries++
}
if (-not (Test-Path "$realProfile\NTUSER.DAT")) {
    Write-Host "ERROR: NTUSER.DAT never appeared. Manual reboot may be needed." -ForegroundColor Red
    Pause; exit 1
}

reg load "HKU\KioskHive" "$realProfile\NTUSER.DAT" | Out-Null

# Shell replacement (wscript launches the VBS hidden -> bat loop -> GLISSA.exe)
reg add "HKU\KioskHive\Software\Microsoft\Windows NT\CurrentVersion\Winlogon" /v Shell /t REG_SZ /d "$ShellLauncher" /f | Out-Null
# Lock down Task Manager
reg add "HKU\KioskHive\Software\Microsoft\Windows\CurrentVersion\Policies\System" /v DisableTaskMgr /t REG_DWORD /d 1 /f | Out-Null
# Hide everything desktop-y
reg add "HKU\KioskHive\Software\Microsoft\Windows\CurrentVersion\Policies\Explorer" /v NoDesktop /t REG_DWORD /d 1 /f | Out-Null
reg add "HKU\KioskHive\Software\Microsoft\Windows\CurrentVersion\Policies\Explorer" /v NoTrayContextMenu /t REG_DWORD /d 1 /f | Out-Null
reg add "HKU\KioskHive\Software\Microsoft\Windows\CurrentVersion\Policies\Explorer" /v NoRun /t REG_DWORD /d 1 /f | Out-Null
reg add "HKU\KioskHive\Software\Microsoft\Windows\CurrentVersion\Policies\Explorer" /v NoLogoff /t REG_DWORD /d 1 /f | Out-Null

[gc]::Collect(); Start-Sleep -Seconds 2
reg unload "HKU\KioskHive" | Out-Null
Write-Host "[6/8] Shell + lockdown applied to KioskUser hive" -ForegroundColor Green

# --- 7. Auto-login + power settings ---
$wl = "HKLM:\SOFTWARE\Microsoft\Windows NT\CurrentVersion\Winlogon"
Set-ItemProperty -Path $wl -Name "AutoAdminLogon"    -Value "1"
Set-ItemProperty -Path $wl -Name "DefaultUserName"   -Value $KioskUserName
Set-ItemProperty -Path $wl -Name "DefaultPassword"   -Value $KioskPassword
Set-ItemProperty -Path $wl -Name "DefaultDomainName" -Value $env:COMPUTERNAME
Remove-ItemProperty -Path $wl -Name "AutoLogonCount" -ErrorAction SilentlyContinue

# Never sleep, screen never off (POS is always on)
powercfg /change standby-timeout-ac 0
powercfg /change standby-timeout-dc 0
powercfg /change monitor-timeout-ac 0
powercfg /change monitor-timeout-dc 0
powercfg /change disk-timeout-ac 0
powercfg /change hibernate-timeout-ac 0
Write-Host "[7/8] Auto-login + always-on power configured" -ForegroundColor Green

# --- 8. App folder permissions for KioskUser ---
$acl = Get-Acl $AppInstallDir
$rule = New-Object System.Security.AccessControl.FileSystemAccessRule(
    $KioskUserName, "Modify", "ContainerInherit,ObjectInherit", "None", "Allow")
$acl.SetAccessRule($rule)
Set-Acl $AppInstallDir $acl
Write-Host "[8/8] Permissions granted on $AppInstallDir" -ForegroundColor Green

Write-Host ""
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host " SETUP COMPLETE" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host " KioskUser    : $KioskUserName" -ForegroundColor White
Write-Host " Password     : $KioskPassword" -ForegroundColor White
Write-Host " App location : $AppInstallDir\$AppExeName" -ForegroundColor White
Write-Host " Launcher     : $LauncherPath" -ForegroundColor White
Write-Host ""
Write-Host " Reboot now to enter kiosk mode." -ForegroundColor Yellow
Write-Host ""
$reboot = Read-Host "Reboot now? (Y/N)"
if ($reboot -eq "Y" -or $reboot -eq "y") {
    Restart-Computer -Force
}
