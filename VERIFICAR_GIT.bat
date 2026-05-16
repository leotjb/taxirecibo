@echo off
title Verificar Git
echo.
echo  Verificando instalacao do Git...
echo.
git --version >nul 2>&1
if errorlevel 1 (
    color 0C
    echo  Git NAO encontrado.
    echo.
    echo  Certifique-se de que:
    echo  1. Instalou o Git em git-scm.com/download/win
    echo  2. Reiniciou o computador apos a instalacao
    echo.
) else (
    color 0A
    echo  Git instalado com sucesso!
    git --version
    echo.
    echo  Pode prosseguir para o Passo 2.
)
echo.
pause
