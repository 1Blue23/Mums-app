@echo off
chcp 65001 > nul
echo ========================================================
echo   MUMS App - Henter ugens nyeste tilbudsaviser...
echo ========================================================
echo.
python "%~dp0hent_tilbud.py"
echo.
echo ========================================================
echo   Færdig! Du kan nu åbne eller genindlæse MUMS App.
echo ========================================================
pause
