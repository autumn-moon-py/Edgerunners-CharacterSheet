@echo off
setlocal EnableExtensions EnableDelayedExpansion

cd /d "%~dp0"

where pnpm >nul 2>nul
if errorlevel 1 (
  echo [ERROR] pnpm was not found in PATH.
  echo Install pnpm first, then run this script again.
  echo [INFO] Press any key to close this window.
  pause >nul
  exit /b 1
)

set "NEEDS_INSTALL="

if not exist "node_modules" (
  set "NEEDS_INSTALL=1"
) else (
  call pnpm exec node -e "require.resolve('next/dist/bin/next'); require.resolve('sharp')" >nul 2>nul
  if errorlevel 1 set "NEEDS_INSTALL=1"
)

if defined NEEDS_INSTALL (
  echo [INFO] Installing or repairing dependencies...
  call pnpm install --force
  if errorlevel 1 (
    echo [ERROR] Dependency installation failed.
    echo [INFO] Press any key to close this window.
    pause >nul
    exit /b 1
  )
)

echo [INFO] Running local static build...
call pnpm build:local
if errorlevel 1 (
  echo [ERROR] Local build failed.
  echo [INFO] Press any key to close this window.
  pause >nul
  exit /b 1
)

echo [INFO] Local build completed successfully.
set "OUTPUT_DIR=output"

echo [INFO] Output directory: !OUTPUT_DIR!

set "ENTRY_FILE="
if exist "!OUTPUT_DIR!\index.html" set "ENTRY_FILE=index.html"

if not defined ENTRY_FILE if exist "!OUTPUT_DIR!\*.html" (
  for %%F in ("!OUTPUT_DIR!\*.html") do (
    if not defined ENTRY_FILE set "ENTRY_FILE=%%~nxF"
  )
)

if defined ENTRY_FILE (
  echo [INFO] Entry file: !OUTPUT_DIR!\!ENTRY_FILE!
)

echo [INFO] Press any key to close this window.
pause >nul
exit /b 0
