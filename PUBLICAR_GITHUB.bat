@echo off
title TaxiRecibo - Publicar no GitHub
color 0B
echo.
echo  ==========================================
echo    Publicando codigo no GitHub...
echo  ==========================================
echo.

:: Verifica se git está instalado
git --version >nul 2>&1
if errorlevel 1 (
    color 0C
    echo  ERRO: Git nao encontrado!
    echo.
    echo  Instale o Git em: https://git-scm.com/download/win
    echo  Instale com todas as opcoes padrao.
    echo  Depois reinicie o computador e execute este arquivo novamente.
    echo.
    pause
    exit /b 1
)

cd /d "%~dp0"

:: Inicializa repositório se necessário
if not exist ".git" (
    echo  Inicializando repositorio Git...
    git init
    git branch -M main
)

:: Solicita URL do repositório GitHub
echo.
echo  Cole abaixo o endereco do seu repositorio GitHub.
echo  Exemplo: https://github.com/seu-usuario/taxirecibo.git
echo.
set /p REPO_URL="URL do repositorio: "

if "%REPO_URL%"=="" (
    echo  URL nao informada. Encerrando.
    pause
    exit /b 1
)

:: Remove remote anterior se existir
git remote remove origin >nul 2>&1
git remote add origin %REPO_URL%

:: Adiciona e envia os arquivos
echo.
echo  Enviando arquivos...
git add .
git commit -m "TaxiRecibo - versao inicial" >nul 2>&1
git push -u origin main

if errorlevel 1 (
    color 0C
    echo.
    echo  ERRO ao enviar. Verifique:
    echo  1. Se a URL do repositorio esta correta
    echo  2. Se voce esta logado no GitHub
    echo  3. Se o repositorio existe e esta vazio
    echo.
) else (
    color 0A
    echo.
    echo  ==========================================
    echo    Codigo enviado com sucesso!
    echo    Agora va ao Railway e conecte este
    echo    repositorio para publicar o app.
    echo  ==========================================
)
echo.
pause
