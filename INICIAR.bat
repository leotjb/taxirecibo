@echo off
title TaxiRecibo - Iniciando...
color 0E
echo.
echo  ==========================================
echo    TAXIRECIBO - Iniciando o aplicativo...
echo  ==========================================
echo.

:: Verifica se Node.js está instalado
node --version >nul 2>&1
if errorlevel 1 (
    color 0C
    echo  ERRO: Node.js nao encontrado!
    echo.
    echo  Por favor, instale o Node.js em: https://nodejs.org
    echo  Baixe a versao "LTS" e instale com as opcoes padrao.
    echo.
    pause
    exit /b 1
)

:: Para qualquer instância anterior nas portas do app
echo  Encerrando instancias anteriores...
for /f "tokens=5" %%a in ('netstat -aon 2^>nul ^| findstr ":3001 "') do taskkill /PID %%a /F >nul 2>&1
for /f "tokens=5" %%a in ('netstat -aon 2^>nul ^| findstr ":5173 "') do taskkill /PID %%a /F >nul 2>&1
timeout /t 2 /nobreak >nul

:: Inicia o servidor backend
echo  [1/2] Iniciando servidor...
start "TaxiRecibo - Servidor" /min cmd /k "cd /d "%~dp0server" && npx ts-node-dev --respawn --transpile-only src/index.ts"

:: Aguarda o servidor backend responder (até 40 segundos)
echo  Aguardando servidor ficar pronto...
set /a tentativa=0
:aguarda_servidor
set /a tentativa+=1
curl -s http://localhost:3001/api/health >nul 2>&1
if errorlevel 1 (
    if %tentativa% lss 20 (
        timeout /t 2 /nobreak >nul
        goto aguarda_servidor
    ) else (
        color 0C
        echo.
        echo  ERRO: O servidor nao conseguiu iniciar.
        echo  Verifique se as dependencias estao instaladas
        echo  executando o arquivo INSTALAR_PRIMEIRA_VEZ.bat
        echo.
        pause
        exit /b 1
    )
)
echo  Servidor pronto!

:: Inicia o frontend
echo  [2/2] Iniciando interface...
start "TaxiRecibo - Interface" /min cmd /k "cd /d "%~dp0client" && npm run dev"

:: Aguarda a interface subir
echo  Aguardando interface...
set /a tentativa=0
:aguarda_interface
set /a tentativa+=1
curl -s -o nul -w "%%{http_code}" http://localhost:5173 2>nul | findstr "200" >nul
if errorlevel 1 (
    if %tentativa% lss 15 (
        timeout /t 2 /nobreak >nul
        goto aguarda_interface
    )
)

:: Abre o navegador
echo  Abrindo o navegador...
start http://localhost:5173

color 0A
echo.
echo  ==========================================
echo    TAXIRECIBO ESTA RODANDO!
echo.
echo    Acesse: http://localhost:5173
echo.
echo    Login de demonstracao:
echo    Email: taxista@demo.com
echo    Senha: senha123
echo.
echo    Para PARAR, execute PARAR.bat
echo    ou feche as janelas "Servidor" e "Interface"
echo  ==========================================
echo.
echo  Pode minimizar esta janela.
echo  NAO feche as janelas "Servidor" e "Interface"!
echo.
pause
