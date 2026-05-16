@echo off
title TaxiRecibo - Parando...
color 0C
echo.
echo  ==========================================
echo    TAXIRECIBO - Parando o aplicativo...
echo  ==========================================
echo.

:: Encerra processos Node.js nas portas do app
echo  Encerrando servidor (porta 3001)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":3001 " 2^>nul') do (
    taskkill /PID %%a /F >nul 2>&1
)

echo  Encerrando interface (porta 5173)...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5173 " 2^>nul') do (
    taskkill /PID %%a /F >nul 2>&1
)

:: Fecha as janelas do servidor e interface
taskkill /FI "WindowTitle eq TaxiRecibo - Servidor" /F >nul 2>&1
taskkill /FI "WindowTitle eq TaxiRecibo - Interface" /F >nul 2>&1

echo.
echo  ==========================================
echo    Aplicativo encerrado com sucesso!
echo  ==========================================
echo.
timeout /t 3 /nobreak >nul
