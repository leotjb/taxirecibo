@echo off
title TaxiRecibo - Backup
color 0B
echo.
echo  Fazendo backup do banco de dados...
echo.

set BACKUP_DIR=%~dp0backups
set DATA=%date:~6,4%-%date:~3,2%-%date:~0,2%
set HORA=%time:~0,2%-%time:~3,2%
set HORA=%HORA: =0%
set NOME_BACKUP=taxirecibo_%DATA%_%HORA%.db

if not exist "%BACKUP_DIR%" mkdir "%BACKUP_DIR%"

if exist "%~dp0server\taxirecibo.db" (
    copy "%~dp0server\taxirecibo.db" "%BACKUP_DIR%\%NOME_BACKUP%" >nul
    color 0A
    echo  Backup salvo em:
    echo  backups\%NOME_BACKUP%
) else (
    color 0C
    echo  Banco de dados nao encontrado.
    echo  Certifique-se de que o app ja foi usado ao menos uma vez.
)

echo.
pause
