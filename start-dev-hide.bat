@echo off
setlocal EnableExtensions EnableDelayedExpansion

cd /d "%~dp0"

where pnpm >nul 2>nul
if errorlevel 1 (
  echo [ERROR] pnpm was not found in PATH.
  echo Install pnpm first, then run this script again.
  pause
  exit /b 1
)

if not exist "node_modules" (
  echo [INFO] node_modules not found, installing dependencies...
  call pnpm install
  if errorlevel 1 (
    echo [ERROR] Dependency installation failed.
    pause
    exit /b 1
  )
)

set "PORT_LIST=3000 3001 3002 3003 3004 3005 3006 3007 3008 3009 3010"
call :pick_port
if errorlevel 1 (
  pause
  exit /b 1
)

set "NEXT_PUBLIC_ENABLE_CARD_MANAGER=false"

echo [INFO] Starting Next.js dev server with card manager disabled, bound to 0.0.0.0:!DEV_PORT! in a new window...
echo [INFO] Browser will open at http://127.0.0.1:!DEV_PORT!
echo [INFO] NEXT_PUBLIC_ENABLE_CARD_MANAGER=!NEXT_PUBLIC_ENABLE_CARD_MANAGER!
start "DaggerHeart Dev Server (Hide Card Manager)" /d "%~dp0" cmd /k "pnpm exec next dev -H 0.0.0.0 -p !DEV_PORT!"

call :wait_for_port !DEV_PORT! 120
if errorlevel 1 goto wait_timeout

set "TARGET_URL=http://127.0.0.1:!DEV_PORT!"
goto open_browser

:wait_timeout
echo [WARN] Dev server did not respond on port !DEV_PORT! within 120 seconds.
echo [INFO] Check the dev server window for details.
pause
exit /b 1

:open_browser
echo [INFO] Dev server is ready: !TARGET_URL!
echo [INFO] Opening browser in 10 seconds...
timeout /t 10 /nobreak >nul
start "" "!TARGET_URL!"
exit /b 0

:pick_port
set "DEV_PORT="
for %%P in (%PORT_LIST%) do (
  call :check_port %%P
  if errorlevel 1 (
    set "DEV_PORT=%%P"
    exit /b 0
  )
)
echo [ERROR] No free port was found in: %PORT_LIST%
exit /b 1

:wait_for_port
set "WAIT_PORT=%~1"
set "WAIT_SECONDS=%~2"
for /l %%I in (1,1,%WAIT_SECONDS%) do (
  call :check_port %WAIT_PORT%
  if not errorlevel 1 exit /b 0
  timeout /t 1 /nobreak >nul
)
exit /b 1

:check_port
powershell -NoProfile -Command "$client = New-Object System.Net.Sockets.TcpClient; try { $client.Connect('127.0.0.1', %1); exit 0 } catch { exit 1 } finally { $client.Dispose() }" >nul 2>nul
exit /b %errorlevel%
