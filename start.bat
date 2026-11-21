@echo off
setlocal
cd /d "%~dp0"
title Caption Tool

where node >nul 2>nul
if errorlevel 1 goto nonode
where ffmpeg >nul 2>nul
if errorlevel 1 goto noffmpeg

if not exist "backend\.env" goto makeenv
findstr /c:"paste-your-own-groq-key-here" "backend\.env" >nul
if not errorlevel 1 goto editenv

if not exist "node_modules" goto install
if not exist "backend\node_modules" goto install
if not exist "frontend\node_modules" goto install
goto run

:install
echo Installing dependencies. This only happens the first time and can take a few minutes...
call npm run setup
if errorlevel 1 goto installfail
goto run

:run
echo Starting Caption Tool. Keep this window open while you use the app.
start "" cmd /c "timeout /t 8 /nobreak >nul & start http://localhost:5173"
call npm run dev
goto end

:makeenv
copy "backend\.env.example" "backend\.env" >nul
goto editenv

:editenv
echo.
echo Your settings file is backend\.env
echo Notepad will open now. Paste your own Groq API key, save the file, close Notepad, then run start.bat again.
notepad "backend\.env"
pause
goto end

:nonode
echo Node.js is not installed. Download the LTS version from https://nodejs.org and run this file again.
pause
goto end

:noffmpeg
echo FFmpeg is not installed or is not on PATH. Install it, restart your computer, then run this file again.
pause
goto end

:installfail
echo Installing dependencies failed. Read the messages above.
pause
goto end

:end
endlocal